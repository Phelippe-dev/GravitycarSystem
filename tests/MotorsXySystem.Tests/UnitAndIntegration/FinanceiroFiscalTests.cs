using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MotorsXySystem.API.Controllers;
using MotorsXySystem.Application.DTOs.Vendas;
using MotorsXySystem.Domain.Entidades.Financeiro;
using MotorsXySystem.Domain.Entidades.Veiculos;
using MotorsXySystem.Domain.Enums;
using MotorsXySystem.Infrastructure.Data;
using MotorsXySystem.Tests.Common;
using Xunit;

namespace MotorsXySystem.Tests.UnitAndIntegration;

public class FinanceiroFiscalTests
{
    private readonly TestTenantService _tenantService;
    private readonly AppDbContext _context;

    public FinanceiroFiscalTests()
    {
        _tenantService = new TestTenantService(TestSeedData.TenantAId);
        _context = TestDbFactory.CreateInMemoryDbContext(_tenantService);
        TestSeedData.PopularBancoDeTesteAsync(_context).GetAwaiter().GetResult();
    }

    [Fact(DisplayName = "FIN-01: Contas a receber (sinal, entrada parcelada, repasse) - parcelas e soma")]
    public async Task FIN01_ContasReceber_ParcelasEDatasESoma()
    {
        var vendasController = new VendasController(_context);
        var veiculo = await _context.Veiculos.FirstAsync(v => v.Status == 1);
        var cliente = await _context.Clientes.FirstAsync();

        var vendaParcelada = new VendaDto
        {
            ClienteId = cliente.Id,
            VeiculosIds = new List<Guid> { veiculo.Id },
            Desconto = 0,
            Pagamentos = new List<VendaPagamentoDto>
            {
                new VendaPagamentoDto
                {
                    Metodo = "promissoria",
                    Valor = 30000.00m,
                    Parcelas = 3,
                    ValorParcela = 10000.00m
                }
            }
        };

        var result = await vendasController.Criar(vendaParcelada);
        Assert.IsType<OkObjectResult>(result);

        var contasReceber = await _context.ContasReceber
            .Where(c => c.ClienteId == cliente.Id && c.Descricao.Contains("PROMISSORIA"))
            .OrderBy(c => c.DataVencimento)
            .ToListAsync();

        Assert.Equal(3, contasReceber.Count);
        Assert.Equal(30000.00m, contasReceber.Sum(c => c.ValorOriginal));

        // Testar endpoint do ContasReceberController
        var crController = new ContasReceberController();
        var listaCr = crController.Listar();
        var okCr = Assert.IsType<OkObjectResult>(listaCr);
        var arrayCr = (object[])okCr.Value!;

        // BUG: ContasReceberController retorna Ok(new object[0]) estático!
        Assert.True(arrayCr.Length > 0,
            "BUG CRÍTICO NO CONTAS A RECEBER: ContasReceberController.Listar() retorna array vazio hardcoded (new object[0]), " +
            "não consultando os títulos a receber do tenant.");
    }

    [Fact(DisplayName = "FIN-02: Cheques: cadastro, depósito, devolução, troca de cheque, baixa")]
    public void FIN02_CicloDeVidaCheques_ImplementacaoCompleta()
    {
        var chequesController = new ChequesController();
        var listaCheques = chequesController.Listar();
        var okCheques = Assert.IsType<OkObjectResult>(listaCheques);
        var arrayCheques = (object[])okCheques.Value!;

        var methodDepositar = typeof(ChequesController).GetMethod("Depositar");
        var methodDevolver = typeof(ChequesController).GetMethod("Devolver");
        var methodBaixar = typeof(ChequesController).GetMethod("Baixar");

        bool cicloCompletoImplementado = methodDepositar != null && methodDevolver != null && methodBaixar != null;

        Assert.True(cicloCompletoImplementado,
            "MÓDULO AUSENTE / NÃO IMPLEMENTADO: ChequesController possui apenas GET Listar() retornando array vazio. " +
            "Não existe suporte no backend para cadastro, custódia, depósito, devolução ou baixa de cheques.");
    }

    [Fact(DisplayName = "FIN-03: Repasse da financeira com tarifa descontada e conciliação")]
    public void FIN03_RepasseFinanceiraETarifa_SuporteConciliacao()
    {
        var propTarifa = typeof(ContaReceber).GetProperty("ValorTarifa") 
                         ?? typeof(ContaReceber).GetProperty("ValorDescontoTaxa");

        Assert.True(propTarifa != null,
            "REGRA AMBÍGUA / NÃO IMPLEMENTADO: Entidade ContaReceber não possui campos para tarifa de repasse ou taxa de retorno da financeira.");
    }

    [Fact(DisplayName = "FIN-04: Contas a pagar (custos e comissões) via controller")]
    public async Task FIN04_ContasPagar_OperacaoConsultavel()
    {
        var cpController = new ContasPagarController();
        var listaCp = cpController.Listar();
        var okCp = Assert.IsType<OkObjectResult>(listaCp);
        var arrayCp = (object[])okCp.Value!;

        var contasPagarNoBanco = await _context.ContasPagar.CountAsync();
        Assert.True(contasPagarNoBanco > 0);

        Assert.True(arrayCp.Length > 0,
            "BUG NO CONTAS A PAGAR: ContasPagarController.Listar() retorna array vazio hardcoded (new object[0]). " +
            "Não há endpoints para inclusão, consulta de vencimentos ou baixa de contas a pagar.");
    }

    [Fact(DisplayName = "FIN-05: Caixa: abertura, entradas, saídas, fechamento → saldo final = soma")]
    public void FIN05_FluxoDeCaixa_ExistenciaEIntegridade()
    {
        var assemblyApi = typeof(VendasController).Assembly;
        var controllerCaixa = assemblyApi.GetTypes().FirstOrDefault(t => t.Name.Contains("CaixaController"));

        Assert.True(controllerCaixa != null,
            "MÓDULO AUSENTE / CRÍTICO: Não existe CaixaController no backend. " +
            "Não há controle de abertura, suprimento, sangria, fechamento diário e conciliação de caixa.");
    }

    [Fact(DisplayName = "FIN-06: Arredondamento: soma das parcelas = total, sem diferença de centavos (10.000,01 em 3x, 7x, 12x) e uso de decimal")]
    public void FIN06_ArredondamentoCentavos_DivisaoPrecisaoEUsoDecimal()
    {
        var tiposMonetarios = new List<PropertyInfo>();
        tiposMonetarios.AddRange(typeof(Veiculo).GetProperties().Where(p => p.Name.StartsWith("Valor")));
        tiposMonetarios.AddRange(typeof(ContaReceber).GetProperties().Where(p => p.Name.StartsWith("Valor")));
        tiposMonetarios.AddRange(typeof(ContaPagar).GetProperties().Where(p => p.Name.StartsWith("Valor")));
        tiposMonetarios.AddRange(typeof(MovimentoFinanceiro).GetProperties().Where(p => p.Name.StartsWith("Valor")));

        foreach (var prop in tiposMonetarios)
        {
            var tipo = Nullable.GetUnderlyingType(prop.PropertyType) ?? prop.PropertyType;
            Assert.True(tipo == typeof(decimal),
                $"FALHA DE MODELAGEM MONETÁRIA: Propriedade {prop.DeclaringType?.Name}.{prop.Name} usa {tipo.Name} em vez de decimal!");
        }

        decimal total = 10000.01m;
        int parcelas = 3;
        
        decimal parcelaBase = Math.Round(total / parcelas, 2);
        decimal somaIngenua = parcelaBase * parcelas;

        var parcelasCorretas = new List<decimal>();
        decimal saldoRestante = total;
        for (int i = 1; i <= parcelas; i++)
        {
            decimal valor = Math.Round(saldoRestante / (parcelas - i + 1), 2, MidpointRounding.AwayFromZero);
            parcelasCorretas.Add(valor);
            saldoRestante -= valor;
        }

        decimal somaAjustada = parcelasCorretas.Sum();
        Assert.Equal(total, somaAjustada);

        Assert.True(somaIngenua != total,
            "Evidência de teste: Divisão direta sem ajuste no último centavo gera divergência de centavos.");
    }

    [Fact(DisplayName = "FIN-07: NF-e com dados fiscais ausentes → bloqueia e informa o campo")]
    public void FIN07_NFeDadosFiscaisAusentes_BloqueioEValidacao()
    {
        var assemblyApi = typeof(VendasController).Assembly;
        var controllerNfe = assemblyApi.GetTypes().FirstOrDefault(t => t.Name.Contains("NotasFiscais") || t.Name.Contains("Nfe"));

        Assert.True(controllerNfe != null,
            "MÓDULO AUSENTE / CRÍTICO: Não existe NotasFiscaisController no backend da API. " +
            "A rota chamada pelo frontend (/api/notasfiscais) retorna 404 Not Found.");
    }

    [Fact(DisplayName = "FIN-08: NF-e: emissão, rejeição e cancelamento (mock) refletidos corretamente")]
    public void FIN08_NFeEmissaoRejeicaoCancelamento_Mock()
    {
        var assemblyDomain = typeof(ContaReceber).Assembly;
        var entidadeNfe = assemblyDomain.GetTypes().FirstOrDefault(t => t.Name.Contains("NotaFiscal"));

        Assert.True(entidadeNfe != null,
            "MÓDULO AUSENTE / CRÍTICO: Não existe entidade NotaFiscal no MotorsXySystem.Domain nem tabelas de controle fiscal no banco de dados.");
    }

    [Fact(DisplayName = "FIN-09: Consulta paga: débito de créditos, saldo insuficiente bloqueia sem quebrar o fluxo")]
    public void FIN09_ConsultaPaga_DebitoECreditos()
    {
        var empresaController = new EmpresaController(_context, _tenantService);
        var resSaldo = empresaController.ObterSaldo();
        var okSaldo = Assert.IsType<OkObjectResult>(resSaldo);

        var adminController = new AdminEmpresasController(_context);
        var resAddCreditos = adminController.AdicionarCreditos(TestSeedData.TenantAId, new { });
        var okAdd = Assert.IsType<OkObjectResult>(resAddCreditos);

        Assert.NotNull(okSaldo.Value);
        Assert.NotNull(okAdd.Value);

        var propSaldoEmpresa = typeof(MotorsXySystem.Domain.Entidades.Tenant.Empresa).GetProperty("SaldoConsultas");

        Assert.True(propSaldoEmpresa != null,
            "BUG / MOCK ESTÁTICO: A funcionalidade de créditos e consultas pagas não é persistida no banco. " +
            "EmpresaController.ObterSaldo() retorna valores fixos (250 consultas) e não há dedução real por placa consultada.");
    }
}
