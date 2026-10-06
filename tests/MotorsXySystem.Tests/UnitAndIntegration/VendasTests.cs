using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MotorsXySystem.API.Controllers;
using MotorsXySystem.Application.DTOs.Vendas;
using MotorsXySystem.Domain.Entidades.Veiculos;
using MotorsXySystem.Domain.Enums;
using MotorsXySystem.Infrastructure.Data;
using MotorsXySystem.Tests.Common;
using Xunit;

namespace MotorsXySystem.Tests.UnitAndIntegration;

public class VendasTests
{
    private readonly TestTenantService _tenantService;
    private readonly AppDbContext _context;
    private readonly VendasController _controller;

    public VendasTests()
    {
        _tenantService = new TestTenantService(TestSeedData.TenantAId);
        _context = TestDbFactory.CreateInMemoryDbContext(_tenantService);
        TestSeedData.PopularBancoDeTesteAsync(_context).GetAwaiter().GetResult();
        _controller = new VendasController(_context);
    }

    [Fact(DisplayName = "VEN-01: Venda à vista sem troca, fluxo completo")]
    public async Task VEN01_VendaAVistaSemTroca_FluxoCompleto()
    {
        var veiculoDisponivel = await _context.Veiculos.FirstAsync(v => v.Status == 1 && v.ValorVenda.HasValue);
        var cliente = await _context.Clientes.FirstAsync();
        var vendedor = await _context.Usuarios.FirstAsync();

        var vendaDto = new VendaDto
        {
            ClienteId = cliente.Id,
            UsuarioId = vendedor.Id,
            VeiculosIds = new List<Guid> { veiculoDisponivel.Id },
            Desconto = 0,
            Observacoes = "Venda à vista no PIX",
            Pagamentos = new List<VendaPagamentoDto>
            {
                new VendaPagamentoDto
                {
                    Metodo = "pix",
                    Valor = veiculoDisponivel.ValorVenda!.Value
                }
            }
        };

        var result = await _controller.Criar(vendaDto);
        var okResult = Assert.IsType<OkObjectResult>(result);
        var vendaCriada = Assert.IsType<VendaDto>(okResult.Value);

        // Veículo deve ter baixado imediatamente para status Vendido (6)
        var veiculoAtualizado = await _context.Veiculos.FindAsync(veiculoDisponivel.Id);
        Assert.NotNull(veiculoAtualizado);
        Assert.Equal(6, veiculoAtualizado.Status);

        // Deve existir ContaReceber gerada com status Paga
        var contaReceber = await _context.ContasReceber.FirstOrDefaultAsync(c => c.VendaId == vendaCriada.Id);
        Assert.NotNull(contaReceber);
        Assert.Equal(StatusConta.Paga, contaReceber.Status);
        Assert.Equal(veiculoDisponivel.ValorVenda.Value, contaReceber.ValorOriginal);
        Assert.Equal(veiculoDisponivel.ValorVenda.Value, contaReceber.ValorPago);

        // Conferir se gerou MovimentoFinanceiro (Caixa)
        var movimentoCaixa = await _context.MovimentosFinanceiros.FirstOrDefaultAsync(m => m.ContaReceberId == contaReceber.Id);
        Assert.True(movimentoCaixa != null,
            "BUG FINANCEIRO DETECTADO: Venda à vista gerou ContaReceber como Paga mas NÃO gerou MovimentoFinanceiro de entrada no Caixa.");
    }

    [Fact(DisplayName = "VEN-02: Troca + financiamento + entrada em cheque → total = entrada + troca + financiado + cheques")]
    public async Task VEN02_ValidacaoMatematica_TotalPagamentosDeveIgualarTotalVenda()
    {
        var veiculo = await _context.Veiculos.FirstAsync(v => v.Status == 1);
        var cliente = await _context.Clientes.FirstAsync();

        // Cenário com pagamento insuficiente: Carro custa 100.000, mas o payload soma apenas 50.000!
        var vendaInconsistente = new VendaDto
        {
            ClienteId = cliente.Id,
            UsuarioId = Guid.NewGuid(),
            VeiculosIds = new List<Guid> { veiculo.Id },
            Desconto = 0,
            Trocas = new List<VendaTrocaDto>
            {
                new VendaTrocaDto { Marca = "Fiat", Modelo = "Uno", ValorAvaliacao = 20000.00m }
            },
            Pagamentos = new List<VendaPagamentoDto>
            {
                new VendaPagamentoDto { Metodo = "financeira", Valor = 20000.00m, Parcelas = 24 },
                new VendaPagamentoDto { Metodo = "cheque", Valor = 10000.00m }
            }
            // Soma: 20k troca + 20k financiado + 10k cheque = 50k (faltando 50k!)
        };

        var result = await _controller.Criar(vendaInconsistente);

        // Regra de Integridade Financeira: A API DEVE REJEITAR (400 Bad Request) se soma != total da venda!
        bool bloqueouDivergencia = result is BadRequestObjectResult;

        Assert.True(bloqueouDivergencia,
            $"BUG CRÍTICO DE INTEGRIDADE FINANCEIRA: VendasController aceitou concluir venda onde a soma dos pagamentos " +
            $"diverge do valor do veículo! Status retornado: {result.GetType().Name}. Falha de validação matemática.");
    }

    [Fact(DisplayName = "VEN-03: Troca avaliada diferente da FIPE → margem e custo nos dois veículos")]
    public async Task VEN03_TrocaAvaliadaDiferenteFipe_CustoEMargem()
    {
        var veiculoVenda = await _context.Veiculos.FirstAsync(v => v.Status == 1);
        var cliente = await _context.Clientes.FirstAsync();

        var vendaDto = new VendaDto
        {
            ClienteId = cliente.Id,
            UsuarioId = Guid.NewGuid(),
            VeiculosIds = new List<Guid> { veiculoVenda.Id },
            Desconto = 0,
            Trocas = new List<VendaTrocaDto>
            {
                new VendaTrocaDto
                {
                    Marca = "VW",
                    Modelo = "Fox",
                    Placa = "FOX1X11",
                    ValorAvaliacao = 30000.00m
                }
            },
            Pagamentos = new List<VendaPagamentoDto>
            {
                new VendaPagamentoDto { Metodo = "pix", Valor = (veiculoVenda.ValorVenda ?? 100000m) - 30000m }
            }
        };

        var result = await _controller.Criar(vendaDto);
        Assert.IsType<OkObjectResult>(result);

        var carroTroca = await _context.Veiculos.FirstOrDefaultAsync(v => v.Placa == "FOX1X11");
        Assert.NotNull(carroTroca);
        Assert.Equal(30000.00m, carroTroca.ValorCompra);
    }

    [Fact(DisplayName = "VEN-04: Desconto dentro e acima da alçada → acima exige aprovação gerencial")]
    public async Task VEN04_DescontoAcimaDaAlcada_DeveBloquearOuExigirAprovacao()
    {
        var veiculo = await _context.Veiculos.FirstAsync(v => v.Status == 1);
        var cliente = await _context.Clientes.FirstAsync();
        var vendedor = await _context.Usuarios.FirstAsync(u => u.Perfil.Nome == "Vendedor");

        // Vendedor concedendo desconto abusivo de R$ 50.000,00
        var vendaComDescontoAbusivo = new VendaDto
        {
            ClienteId = cliente.Id,
            UsuarioId = vendedor.Id,
            VeiculosIds = new List<Guid> { veiculo.Id },
            Desconto = 50000.00m,
            Pagamentos = new List<VendaPagamentoDto>
            {
                new VendaPagamentoDto { Metodo = "pix", Valor = (veiculo.ValorVenda ?? 100000m) - 50000m }
            }
        };

        var result = await _controller.Criar(vendaComDescontoAbusivo);

        bool bloqueouOuExigiuAprovacao = false;
        if (result is BadRequestObjectResult)
        {
            bloqueouOuExigiuAprovacao = true;
        }
        else if (result is OkObjectResult ok)
        {
            var vendaCriada = (VendaDto)ok.Value!;
            if (vendaCriada.Status != (int)StatusVenda.Concluida)
            {
                bloqueouOuExigiuAprovacao = true;
            }
        }

        Assert.True(bloqueouOuExigiuAprovacao,
            $"BUG CRÍTICO DE ALÇADA: VendasController concluiu imediatamente venda com desconto descontrolado de R$ 50.000 concedido por Vendedor, " +
            $"sem nenhuma validação de limite de desconto nem fluxo de aprovação gerencial.");
    }

    [Fact(DisplayName = "VEN-05: Vendedor aprova o próprio desconto → bloqueado")]
    public void VEN05_VendedorAprovaProprioDesconto_Bloqueado()
    {
        var methodAprovarDesconto = typeof(VendasController).GetMethod("AprovarDesconto");

        Assert.True(methodAprovarDesconto != null,
            "REGRA AMBÍGUA / MÓDULO AUSENTE: Não existe fluxo de aprovação de desconto na API (VendasController.AprovarDesconto inexistente). " +
            "Todas as vendas são concluídas sumariamente sem controle de permissão de desconto.");
    }

    [Fact(DisplayName = "VEN-06: Vender veículo reservado por outro ou já vendido → bloqueado")]
    public async Task VEN06_VenderVeiculoJaVendidoOuReservado_DeveBloquear()
    {
        var veiculoJaVendido = await _context.Veiculos.FirstAsync(v => v.Status == 6);
        var cliente = await _context.Clientes.FirstAsync();

        var vendaTentativaDuplicada = new VendaDto
        {
            ClienteId = cliente.Id,
            UsuarioId = Guid.NewGuid(),
            VeiculosIds = new List<Guid> { veiculoJaVendido.Id },
            Desconto = 0,
            Pagamentos = new List<VendaPagamentoDto>
            {
                new VendaPagamentoDto { Metodo = "pix", Valor = veiculoJaVendido.ValorVenda ?? 100000m }
            }
        };

        var result = await _controller.Criar(vendaTentativaDuplicada);
        bool bloqueouVeiculoVendido = result is BadRequestObjectResult;

        Assert.True(bloqueouVeiculoVendido,
            $"BUG CRÍTICO DE ESTOQUE: VendasController:88-90 permitiu vender novamente um veículo que já consta como Vendido (Status 6)! " +
            $"Não há filtro de validação de status disponível antes de efetivar a venda.");
    }

    [Fact(DisplayName = "VEN-07: Concluir sem forma de pagamento ou sem cliente → bloqueado")]
    public async Task VEN07_ConcluirSemPagamentoOuSemCliente_DeveBloquear()
    {
        var veiculo = await _context.Veiculos.FirstAsync(v => v.Status == 1);

        var vendaSemPagamento = new VendaDto
        {
            ClienteId = Guid.Parse("30000000-0000-0000-0000-000000000001"),
            VeiculosIds = new List<Guid> { veiculo.Id },
            Pagamentos = new List<VendaPagamentoDto>()
        };

        var vendaSemCliente = new VendaDto
        {
            ClienteId = Guid.Empty,
            VeiculosIds = new List<Guid> { veiculo.Id },
            Pagamentos = new List<VendaPagamentoDto>
            {
                new VendaPagamentoDto { Metodo = "dinheiro", Valor = 10000m }
            }
        };

        var resSemPag = await _controller.Criar(vendaSemPagamento);
        var resSemCli = await _controller.Criar(vendaSemCliente);

        bool bloqueouSemPag = resSemPag is BadRequestObjectResult;
        bool bloqueouSemCli = resSemCli is BadRequestObjectResult;

        Assert.True(bloqueouSemPag && bloqueouSemCli,
            $"BUG CRÍTICO DETECTADO: API permitiu venda sem pagamentos (Status: {resSemPag.GetType().Name}) " +
            $"ou sem cliente válido (Status: {resSemCli.GetType().Name}).");
    }

    [Fact(DisplayName = "VEN-08: Cancelar/estornar venda concluída → veículo volta ao estoque, financeiro e fiscal revertidos e auditados")]
    public async Task VEN08_CancelarVenda_EstornoEConsequencias()
    {
        var vendaId = Guid.Parse("50000000-0000-0000-0000-000000000001");
        var vendaOriginal = await _context.Vendas
            .Include(v => v.Veiculos)
            .FirstOrDefaultAsync(v => v.Id == vendaId);
        Assert.NotNull(vendaOriginal);

        var result = await _controller.Cancelar(vendaId);
        Assert.IsType<OkResult>(result);

        var veiculoVendido = await _context.Veiculos.FindAsync(vendaOriginal.Veiculos.First().VeiculoId);
        Assert.NotNull(veiculoVendido);
        Assert.True(veiculoVendido.Status == 1 || veiculoVendido.Status == 4);

        var contas = await _context.ContasReceber.Where(c => c.VendaId == vendaId).ToListAsync();
        Assert.All(contas, c => Assert.Equal(StatusConta.Cancelada, c.Status));
    }

    [Fact(DisplayName = "VEN-09: Venda concluída → baixa imediata do estoque, status Vendido")]
    public async Task VEN09_BaixaImediataEstoque_StatusVendido()
    {
        var veiculo = await _context.Veiculos.FirstAsync(v => v.Status == 1);
        var cliente = await _context.Clientes.FirstAsync();

        var venda = new VendaDto
        {
            ClienteId = cliente.Id,
            VeiculosIds = new List<Guid> { veiculo.Id },
            Pagamentos = new List<VendaPagamentoDto>
            {
                new VendaPagamentoDto { Metodo = "dinheiro", Valor = veiculo.ValorVenda ?? 50000m }
            }
        };

        await _controller.Criar(venda);

        var veiculoAtualizado = await _context.Veiculos.FindAsync(veiculo.Id);
        Assert.NotNull(veiculoAtualizado);
        Assert.Equal(6, veiculoAtualizado.Status);
    }
}
