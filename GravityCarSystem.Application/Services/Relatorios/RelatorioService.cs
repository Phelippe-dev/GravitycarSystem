using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using GravityCarSystem.Application.DTOs.Relatorios;
using GravityCarSystem.Application.Interfaces;
using GravityCarSystem.Application.Interfaces.Relatorios;
using GravityCarSystem.Domain.Enums;

namespace GravityCarSystem.Application.Services.Relatorios;

public class RelatorioService : IRelatorioService
{
    private readonly IAppDbContext _context;

    public RelatorioService(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<RentabilidadeVeiculoDto>> ObterRentabilidadeVeiculosAsync(DateTime? dataInicio, DateTime? dataFim)
    {
        var query = _context.Vendas
            .Include(v => v.Cliente)
            .Include(v => v.Usuario)
            .Include(v => v.Pagamentos)
            .Include(v => v.Trocas)
            .Include(v => v.Veiculos)
                .ThenInclude(vv => vv.Veiculo)
                    .ThenInclude(veiculo => veiculo.Custos)
            .Where(v => v.Status == StatusVenda.Concluida);

        if (dataInicio.HasValue)
            query = query.Where(v => v.DataVenda >= dataInicio.Value);
        
        if (dataFim.HasValue)
            query = query.Where(v => v.DataVenda <= dataFim.Value);

        var vendas = await query.AsNoTracking().ToListAsync();

        var relatorio = new List<RentabilidadeVeiculoDto>();

        foreach (var venda in vendas)
        {
            int numVeiculos = venda.Veiculos.Count == 0 ? 1 : venda.Veiculos.Count;
            decimal descontoPorVeiculo = venda.Desconto / numVeiculos;

            var vendedorNome = !string.IsNullOrWhiteSpace(venda.Usuario?.Nome) ? venda.Usuario.Nome : "Equipe Comercial";
            var clienteNome = !string.IsNullOrWhiteSpace(venda.Cliente?.NomeRazaoSocial) ? venda.Cliente.NomeRazaoSocial : "Cliente Balcão";

            // Agrupamento detalhado das formas de pagamento com contagem de cheques
            var formasList = new List<string>();
            var cheques = venda.Pagamentos.Where(p => p.TipoPagamento == TipoPagamento.Cheque).ToList();
            if (cheques.Any())
            {
                int qtd = cheques.Count;
                formasList.Add(qtd == 1 ? "Cheque (1x)" : $"Cheque ({qtd}x)");
            }

            var outros = venda.Pagamentos
                .Where(p => p.TipoPagamento != TipoPagamento.Cheque)
                .Select(p => ObterNomeFormaPagamento(p.TipoPagamento))
                .Distinct();
            formasList.AddRange(outros);

            if (venda.Trocas.Any() && !formasList.Contains("Veículo na Troca"))
            {
                formasList.Add("Veículo na Troca");
            }

            var formaPagamento = formasList.Any() ? string.Join(", ", formasList) : "À Vista";

            foreach (var vendaVeiculo in venda.Veiculos)
            {
                var veiculo = vendaVeiculo.Veiculo;
                if (veiculo == null) continue;

                var totalCustos = veiculo.Custos.Sum(c => c.Valor);
                var valorCompra = veiculo.ValorCompra ?? 0;
                var valorVenda = veiculo.ValorVenda ?? 0;
                var desconto = descontoPorVeiculo;
                
                var margemLiquida = valorVenda - desconto - valorCompra - totalCustos;
                var baseCalculoPerc = (valorVenda - desconto) == 0 ? 1 : (valorVenda - desconto);
                var percentual = (margemLiquida / baseCalculoPerc) * 100;

                relatorio.Add(new RentabilidadeVeiculoDto
                {
                    VeiculoId = veiculo.Id,
                    VeiculoDescricao = $"{veiculo.Marca} {veiculo.Modelo} {veiculo.Placa}".Trim(),
                    ValorCompra = valorCompra,
                    ValorVenda = valorVenda,
                    TotalCustosAdicionais = totalCustos,
                    DescontoNaVenda = desconto,
                    MargemLucroLiquido = margemLiquida,
                    PercentualMargem = percentual,
                    DataVenda = venda.DataVenda,
                    VendedorNome = vendedorNome,
                    ClienteNome = clienteNome,
                    FormaPagamento = formaPagamento,
                    VendaId = venda.Id
                });
            }
        }

        return relatorio.OrderByDescending(r => r.DataVenda);
    }

    private static string ObterNomeFormaPagamento(TipoPagamento tipo) => tipo switch
    {
        TipoPagamento.Dinheiro => "Dinheiro",
        TipoPagamento.Pix => "Pix",
        TipoPagamento.CartaoCredito => "Cartão de Crédito",
        TipoPagamento.CartaoDebito => "Cartão de Débito",
        TipoPagamento.Cheque => "Cheque",
        TipoPagamento.Financiamento => "Financiamento Bancário",
        TipoPagamento.Boleto => "Boleto",
        TipoPagamento.Transferencia => "Transferência",
        TipoPagamento.Troca => "Veículo na Troca",
        _ => "Outro"
    };

    public async Task<ResumoFinanceiroDto> ObterResumoFinanceiroAsync(DateTime? dataInicio, DateTime? dataFim)
    {
        var resumo = new ResumoFinanceiroDto();

        var queryPagar = _context.ContasPagar.Where(c => c.Status == StatusConta.Pago);
        var queryVendas = _context.Vendas.Where(v => v.Status == StatusVenda.Concluida);

        if (dataInicio.HasValue)
        {
            queryPagar = queryPagar.Where(c => c.DataPagamento >= dataInicio.Value);
            queryVendas = queryVendas.Where(v => v.DataVenda >= dataInicio.Value);
        }

        if (dataFim.HasValue)
        {
            queryPagar = queryPagar.Where(c => c.DataPagamento <= dataFim.Value);
            queryVendas = queryVendas.Where(v => v.DataVenda <= dataFim.Value);
        }

        var vendasLiquidas = await queryVendas.Select(v => v.ValorLiquido).ToListAsync();
        resumo.TotalEntradasVendas = vendasLiquidas.Sum();
        
        var contasPagas = await queryPagar.ToListAsync();
        
        resumo.TotalSaidasComprasVeiculos = contasPagas
            .Where(c => c.Descricao.Contains("Compra de Veículo") || c.Descricao.Contains("Aquisição"))
            .Sum(c => c.ValorPago);
            
        resumo.TotalSaidasContasPagar = contasPagas
            .Where(c => !c.Descricao.Contains("Compra de Veículo") && !c.Descricao.Contains("Aquisição"))
            .Sum(c => c.ValorPago);

        resumo.SaldoLiquido = resumo.TotalEntradasVendas - (resumo.TotalSaidasContasPagar + resumo.TotalSaidasComprasVeiculos);

        return resumo;
    }
}
