using System;
using System.Linq;
using System.Reflection;
using System.Security.Claims;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Moq;
using MotorsXySystem.API.Controllers;
using MotorsXySystem.Application.DTOs;
using MotorsXySystem.Application.DTOs.Vendas;
using MotorsXySystem.Domain.Entidades.Veiculos;
using MotorsXySystem.Infrastructure.Data;
using MotorsXySystem.Tests.Common;
using Xunit;

namespace MotorsXySystem.Tests.UnitAndIntegration;

public class PermissoesMultitenantTests
{
    private readonly TestTenantService _tenantService;
    private readonly AppDbContext _context;

    public PermissoesMultitenantTests()
    {
        _tenantService = new TestTenantService(TestSeedData.TenantAId);
        _context = TestDbFactory.CreateInMemoryDbContext(_tenantService);
        TestSeedData.PopularBancoDeTesteAsync(_context).GetAwaiter().GetResult();
    }

    [Fact(DisplayName = "PER-01: Matriz de permissões por perfil em todos os endpoints")]
    public void PER01_MatrizPermissoesPorPerfil_VerificacaoAtributosAuthorize()
    {
        var controllersCriticos = new[]
        {
            typeof(VeiculosController),
            typeof(FuncionariosController),
            typeof(EmpresaController),
            typeof(VendasController)
        };

        var falhasPermissao = new System.Collections.Generic.List<string>();

        foreach (var controller in controllersCriticos)
        {
            var authAttribute = controller.GetCustomAttribute<AuthorizeAttribute>();
            if (authAttribute == null || string.IsNullOrWhiteSpace(authAttribute.Roles))
            {
                var actionsSemRole = controller.GetMethods(BindingFlags.Instance | BindingFlags.Public | BindingFlags.DeclaredOnly)
                    .Where(m => !m.IsSpecialName && m.GetCustomAttribute<AuthorizeAttribute>()?.Roles == null && !m.GetCustomAttribute<AllowAnonymousAttribute>()?.Equals(null) == true)
                    .ToList();

                if (actionsSemRole.Any())
                {
                    falhasPermissao.Add($"{controller.Name} possui {actionsSemRole.Count} métodos públicos sem restrição de Role/Perfil.");
                }
            }
        }

        Assert.True(falhasPermissao.Count == 0,
            $"BUG CRÍTICO DE CONTROLE DE ACESSO (BFLA): Controllers críticos não implementam controle por perfil (Role-Based Access Control). " +
            $"Qualquer usuário autenticado (mesmo Vendedor) tem acesso irrestrito a operações administrativas: {string.Join("; ", falhasPermissao)}");
    }

    [Fact(DisplayName = "PER-02: Vendedor não vê custo de aquisição, margem ou lucro na resposta da API (inspecione o JSON)")]
    public async Task PER02_VendedorNaoVeCustoDeAquisicao_InspecaoJson()
    {
        var envMock = new Mock<IWebHostEnvironment>();
        var veiculosController = new VeiculosController(_context, _tenantService, envMock.Object);

        var userClaims = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, "10000000-0000-0000-0000-000000000001"),
            new Claim(ClaimTypes.Role, "Vendedor"),
            new Claim("EmpresaId", TestSeedData.TenantAId.ToString())
        }, "TestAuth"));

        veiculosController.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = userClaims }
        };

        // 1. Inspecionar resposta do GET /api/veiculos (Listar)
        var resultListar = await veiculosController.Listar(null, null, null);
        var okListar = Assert.IsType<OkObjectResult>(resultListar);
        var veiculosJson = JsonSerializer.Serialize(okListar.Value);

        // 2. Inspecionar resposta do GET /api/veiculos/{id} (ObterPorId)
        var veiculoId = Guid.Parse("40000000-0000-0000-0000-000000000001"); // Corolla (ValorCompra = 150.000)
        var resultDetalhes = await veiculosController.ObterPorId(veiculoId);
        var okDetalhes = Assert.IsType<OkObjectResult>(resultDetalhes);
        var detalhesJson = JsonSerializer.Serialize(okDetalhes.Value);

        bool vazouValorCompraNaListagem = veiculosJson.Contains("150000") || veiculosJson.Contains("\"ValorCompra\":150000");
        bool vazouValorCompraNosDetalhes = detalhesJson.Contains("150000") || detalhesJson.Contains("\"ValorCompra\":150000");

        Assert.False(vazouValorCompraNaListagem || vazouValorCompraNosDetalhes,
            $"BUG CRÍTICO DE VAZAMENTO DE DADOS SENSÍVEIS (PER-02): O endpoint VeiculosController expôs o custo de aquisição " +
            $"(ValorCompra = R$ 150.000,00) diretamente no payload JSON retornado ao Vendedor! " +
            $"Trecho JSON: {detalhesJson[..Math.Min(250, detalhesJson.Length)]}");
    }

    [Fact(DisplayName = "PER-03: Acesso direto a rotas/endpoints sem permissão → 403 Forbidden")]
    public async Task PER03_AcessoDiretoSemPermissao_DeveRetornar403()
    {
        var envMock = new Mock<IWebHostEnvironment>();
        var veiculosController = new VeiculosController(_context, _tenantService, envMock.Object);

        var vendedorClaims = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, "10000000-0000-0000-0000-000000000001"),
            new Claim(ClaimTypes.Role, "Vendedor"),
            new Claim("EmpresaId", TestSeedData.TenantAId.ToString())
        }, "TestAuth"));

        veiculosController.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = vendedorClaims }
        };

        var veiculoId = Guid.Parse("40000000-0000-0000-0000-000000000008"); // Onix
        var resultExclusao = await veiculosController.Excluir(veiculoId);

        bool foiBloqueadoCom403 = resultExclusao is ForbidResult || resultExclusao is ObjectResult { StatusCode: 403 };

        Assert.True(foiBloqueadoCom403,
            $"BUG CRÍTICO DE AUTORIZAÇÃO (PER-03): Vendedor executou com sucesso a exclusão do veículo ({resultExclusao.GetType().Name}). " +
            $"Não retornou 403 Forbidden.");
    }

    [Fact(DisplayName = "PER-04: Isolamento entre lojas (Tenant A vs Tenant B): usuário do Tenant A tenta ler/alterar dados do Tenant B (IDOR)")]
    public async Task PER04_IsolamentoEntreLojas_IDOR_NaoDeveRetornarDado()
    {
        _tenantService.DefinirEmpresaId(TestSeedData.TenantAId);

        var envMock = new Mock<IWebHostEnvironment>();
        var veiculosController = new VeiculosController(_context, _tenantService, envMock.Object);

        var veiculoTenantBId = Guid.Parse("40000000-0000-0000-0000-000000000011");

        // 1. Tentativa de Leitura IDOR: Tenant A tenta obter o veículo do Tenant B
        var resultObter = await veiculosController.ObterPorId(veiculoTenantBId);
        Assert.IsType<NotFoundObjectResult>(resultObter);

        // 2. Tentativa de Alteração IDOR: Tenant A tenta atualizar dados do veículo do Tenant B
        var resultAtualizar = await veiculosController.Atualizar(veiculoTenantBId, new VeiculoDto
        {
            Marca = "HACKEADO",
            Modelo = "INVASÃO LOJA B"
        });

        Assert.IsType<NotFoundObjectResult>(resultAtualizar);

        _tenantService.DefinirEmpresaId(TestSeedData.TenantBId);
        var veiculoLojaB = await _context.Veiculos.FindAsync(veiculoTenantBId);
        Assert.NotNull(veiculoLojaB);
        Assert.Equal("Audi", veiculoLojaB.Marca);
    }

    [Fact(DisplayName = "PER-05: Usuário desativado / senha trocada → sessão invalidada")]
    public void PER05_SessaoInvalidada_AposTrocaDeSenhaOuDesativacao()
    {
        var tokenServiceType = typeof(MotorsXySystem.Infrastructure.Servicos.TokenService);
        var methodValidarRevogacao = tokenServiceType.GetMethod("ValidarRevogacao") 
                                     ?? tokenServiceType.GetMethod("EstaRevogado");

        Assert.True(methodValidarRevogacao != null,
            "BUG DE SEGURANÇA (PER-05): O sistema emite JWT stateless com 8 horas de expiração sem checagem de revogação. " +
            "Se o usuário for desativado ou sua senha for alterada em AuthController.ChangePassword, o token antigo permanece válido por até 8 horas.");
    }

    [Fact(DisplayName = "PER-06: Auditoria das ações críticas (desconto, estorno, edição de custo, exclusão)")]
    public void PER06_AuditoriaAcoesCriticas_ExistenciaTabelaERegistro()
    {
        var assemblyDomain = typeof(Veiculo).Assembly;
        var tiposAuditoria = assemblyDomain.GetTypes().Where(t => t.Name.Contains("Auditoria") || t.Name.Contains("Log")).ToList();

        bool possuiAuditoriaImplementada = tiposAuditoria.Any(t => t.IsClass && t.Name != "EntidadeAuditavel");

        Assert.True(possuiAuditoriaImplementada,
            "MÓDULO AUSENTE (PER-06): A pasta Entidades/Auditoria do domínio está vazia. " +
            "Não existe tabela nem serviço de auditoria para registrar ações críticas como cancelamento de venda, descontos ou exclusões.");
    }
}
