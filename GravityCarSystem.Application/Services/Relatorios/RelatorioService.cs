using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using GravityCarSystem.Application.DTOs.Relatorios;
using GravityCarSystem.Application.Interfaces;
using GravityCarSystem.Application.Interfaces.Relatorios;

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
            .Where(v => v.Status == GravityCarSystem.Domain.Enums.StatusVenda.Concluida);

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

            var vendedorNome = venda.Usuario?.Nome ?? "Vendedor Padrão";
            var clienteNome = venda.Cliente?.Nome ?? "Cliente Não Informado";

            var formasList = venda.Pagamentos.Select(p => ObterNomeFormaPagamento(p.TipoPagamento)).Distinct().ToList();
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
                    VeiculoDescricao = $"{veiculo.Marca} {veiculo.Modelo} {veiculo.Placa}",
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

    private static string ObterNomeFormaPagamento(GravityCarSystem.Domain.Enums.TipoPagamento tipo) => tipo switch
    {
        GravityCarSystem.Domain.Enums.TipoPagamento.Dinheiro => "Dinheiro",
        GravityCarSystem.Domain.Enums.TipoPagamento.Pix => "Pix",
        GravityCarSystem.Domain.Enums.TipoPagamento.CartaoCredito => "Cartão de Crédito",
        GravityCarSystem.Domain.Enums.TipoPagamento.CartaoDebito => "Cartão de Débito",
        GravityCarSystem.Domain.Enums.TipoPagamento.Cheque => "Cheque",
        GravityCarSystem.Domain.Enums.TipoPagamento.Financiamento => "Financiamento Bancário",
        GravityCarSystem.Domain.Enums.TipoPagamento.Boleto => "Boleto",
        GravityCarSystem.Domain.Enums.TipoPagamento.Transferencia => "Transferência",
        GravityCarSystem.Domain.Enums.TipoPagamento.Troca => "Veículo na Troca",
        _ => "Outro"
    };

    public async Task<ResumoFinanceiroDto> ObterResumoFinanceiroAsync(DateTime? dataInicio, DateTime? dataFim)
    {
        var resumo = new ResumoFinanceiroDto();

        var queryPagar = _context.ContasPagar.Where(c => c.Status == GravityCarSystem.Domain.Enums.StatusConta.Pago);
        var queryVendas = _context.Vendas.Where(v => v.Status == GravityCarSystem.Domain.Enums.StatusVenda.Concluida);

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
        
        // Vamos considerar como compra de veículos as contas a pagar que tenham "Veículo" na descrição (simplificação)
        // ou criar um agrupamento. Aqui faremos o total de saídas:
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
