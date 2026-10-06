using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Moq;
using MotorsXySystem.API.Controllers;
using MotorsXySystem.Application.DTOs;
using MotorsXySystem.Domain.Entidades.Veiculos;
using MotorsXySystem.Domain.Enums;
using MotorsXySystem.Infrastructure.Data;
using MotorsXySystem.Tests.Common;
using Xunit;

namespace MotorsXySystem.Tests.UnitAndIntegration;

public class NaoFuncionaisTests
{
    private readonly TestTenantService _tenantService;
    private readonly AppDbContext _context;

    public NaoFuncionaisTests()
    {
        _tenantService = new TestTenantService(TestSeedData.TenantAId);
        _context = TestDbFactory.CreateInMemoryDbContext(_tenantService);
        TestSeedData.PopularBancoDeTesteAsync(_context).GetAwaiter().GetResult();
    }

    [Fact(DisplayName = "SEC-01: Backdoor em DebugController expõe hashes de senhas e e-mails de todos os tenants")]
    public async Task SEC01_DebugController_VazamentoGeralDeCredenciais()
    {
        var debugController = new DebugController(_context);
        
        // Verificar atributos de autorização da classe DebugController
        var authAttribute = typeof(DebugController).GetCustomAttribute<AuthorizeAttribute>();
        
        // Act: chamar GetUsuarios()
        var result = await debugController.GetUsuarios();
        var okResult = Assert.IsType<OkObjectResult>(result);
        var usuarios = (System.Collections.IEnumerable)okResult.Value!;

        int count = 0;
        foreach (var _ in usuarios) count++;

        // AVALIAÇÃO: DebugController não possui [Authorize] e expõe todos os usuários de todas as lojas!
        bool isVulneravel = authAttribute == null && count > 0;

        Assert.False(isVulneravel,
            $"VULNERABILIDADE CRÍTICA DE SEGURANÇA (CWE-200 / CWE-306): DebugController.GetUsuarios() é público, " +
            $"ignora filtros multitenant (.IgnoreQueryFilters()) e vazou {count} credenciais (e-mails e hashes BCrypt) de todos os tenants!");
    }

    [Fact(DisplayName = "SEC-02: TenantSetupController público permite criação arbitrária de lojas e admins")]
    public void SEC02_TenantSetupController_AcessoPublicoIndevido()
    {
        var authAttribute = typeof(TenantSetupController).GetCustomAttribute<AuthorizeAttribute>();

        Assert.True(authAttribute != null,
            "VULNERABILIDADE CRÍTICA DE SEGURANÇA: TenantSetupController não possui atributo [Authorize]. " +
            "Qualquer ator não autenticado na rede local pode disparar POST /api/tenantsetup para criar novas lojas e usuários administradores.");
    }

    [Fact(DisplayName = "SEC-03: Segredos e chaves criptográficas hardcoded no repositório")]
    public void SEC03_SegredosHardcoded_AuditoriaDeCodigo()
    {
        // Verificar se Program.cs possui fallback de chave JWT hardcoded
        string programPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "..", "..", "..", "..", "..", "src", "MotorsXySystem.API", "Program.cs");
        string programContent = File.Exists(programPath) ? File.ReadAllText(programPath) : "";

        bool chaveHardcodedNoProgram = programContent.Contains("MotorsXySystemSuperSecretKey2026");

        Assert.False(chaveHardcodedNoProgram,
            "VULNERABILIDADE DE SEGURANÇA: Chave secreta de assinatura JWT hardcoded encontrada no código-fonte (Program.cs). " +
            "Permite que atacantes forjem tokens JWT assinados arbitrariamente.");
    }

    [Fact(DisplayName = "SEC-04: Ausência de Rate Limiting e bloqueio contra Brute Force no Login")]
    public void SEC04_BruteForceLogin_SemProtecao()
    {
        // Verificar se AuthController possui controle de tentativas falhas
        var propTentativas = typeof(MotorsXySystem.Domain.Entidades.Acesso.Usuario).GetProperty("TentativasLoginFalhas")
                             ?? typeof(MotorsXySystem.Domain.Entidades.Acesso.Usuario).GetProperty("BloqueadoAte");

        Assert.True(propTentativas != null,
            "RISCO DE SEGURANÇA (CWE-307): Não há controle de bloqueio de conta ou rate limiting no AuthController. " +
            "A API permite tentativas ilimitadas de login por força bruta na rede local.");
    }

    [Fact(DisplayName = "PERF-01: Listagem com 1.000 veículos sem paginação causa lentidão e alto tráfego")]
    public async Task PERF01_Listagem1000Veiculos_SemPaginacao()
    {
        // Inserir 1.000 veículos adicionais no banco de teste
        var loteVeiculos = new List<Veiculo>();
        for (int i = 1; i <= 1000; i++)
        {
            loteVeiculos.Add(new Veiculo
            {
                Id = Guid.NewGuid(),
                EmpresaId = TestSeedData.TenantAId,
                Marca = "MarcaTeste",
                Modelo = $"Modelo {i}",
                Versao = "1.0",
                AnoFabricacao = 2024,
                AnoModelo = 2024,
                Placa = $"TST{i:D4}",
                ValorCompra = 50000m,
                ValorVenda = 65000m,
                Status = 1,
                Ativo = true,
                DataCriacao = DateTime.UtcNow
            });
        }
        await _context.Veiculos.AddRangeAsync(loteVeiculos);
        await _context.SaveChangesAsync();

        var envMock = new Mock<IWebHostEnvironment>();
        var veiculosController = new VeiculosController(_context, _tenantService, envMock.Object);

        // Medir tempo de resposta sem paginação
        var sw = Stopwatch.StartNew();
        var result = await veiculosController.Listar(null, null, null);
        sw.Stop();

        var okResult = Assert.IsType<OkObjectResult>(result);
        var lista = Assert.IsAssignableFrom<IEnumerable<VeiculoDto>>(okResult.Value);
        int totalRetornado = lista.Count();

        // Evidência de desempenho: endpoint retorna todos os 1.000+ veículos de uma vez
        bool possuiPaginacao = totalRetornado <= 50;

        Assert.True(possuiPaginacao,
            $"GARGALO DE DESEMPENHO IDENTIFICADO: GET /api/veiculos retornou {totalRetornado} registros em {sw.ElapsedMilliseconds}ms em um único array JSON. " +
            $"Ausência de paginação (Take/Skip, Page/PageSize) causará exaustão de memória e gargalo na rede local à medida que o estoque crescer.");
    }

    [Fact(DisplayName = "VAL-01: Cadastro de clientes sem validação de algoritmo de CPF e CNPJ")]
    public async Task VAL01_CadastroCliente_CpfInvalido_DeveBloquear()
    {
        var clientesController = new ClientesController(_context, _tenantService);

        var clienteInvalido = new ClienteDto
        {
            Nome = "Cliente Com CPF Falso",
            CpfCnpj = "111.111.111-11", // Dígitos repetidos / inválido pela Receita Federal
            Email = "falso@teste.com",
            Telefone = "11999999999"
        };

        var result = await clientesController.Criar(clienteInvalido);

        // ClientesController.cs:67-84 simplesmente salva o cliente sem validação de dígito verificador
        bool bloqueouCpfInvalido = result is BadRequestObjectResult;

        Assert.True(bloqueouCpfInvalido,
            $"FALHA DE VALIDAÇÃO DE DADOS (VAL-01): ClientesController aceitou cadastro com CPF sabidamente inválido (111.111.111-11). " +
            $"Falta validador de algoritmo Mod11 de CPF e CNPJ.");
    }
}
