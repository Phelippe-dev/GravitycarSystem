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
            .Include(v => v.Veiculos)
                .ThenInclude(vv => vv.Veiculo)
                    .ThenInclude(veiculo => veiculo.CustosAdicionais)
            .Where(v => v.Status == (byte)GravityCarSystem.Domain.Enums.StatusVenda.Concluida);

        if (dataInicio.HasValue)
            query = query.Where(v => v.DataVenda >= dataInicio.Value);
        
        if (dataFim.HasValue)
            query = query.Where(v => v.DataVenda <= dataFim.Value);

        var vendas = await query.AsNoTracking().ToListAsync();

        var relatorio = new List<RentabilidadeVeiculoDto>();

        foreach (var venda in vendas)
        {
            // Para simplificar a demonstração, se houver mais de um veículo na mesma venda, 
            // ratearemos o desconto da venda proporcionalmente, ou dividiremos igualmente.
            // Aqui vamos apenas mostrar o 1 para 1 para facilitar o exemplo:
            int numVeiculos = venda.Veiculos.Count == 0 ? 1 : venda.Veiculos.Count;
            decimal descontoPorVeiculo = venda.Desconto / numVeiculos;

            foreach (var vendaVeiculo in venda.Veiculos)
            {
                var veiculo = vendaVeiculo.Veiculo;
                if (veiculo == null) continue;

                var totalCustos = veiculo.CustosAdicionais.Sum(c => c.Valor);
                var valorCompra = veiculo.ValorCompra ?? 0;
                var valorVenda = veiculo.ValorVenda ?? 0; // Ou o valor real rateado da venda se houver lógica específica
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
                    DataVenda = venda.DataVenda
                });
            }
        }

        return relatorio.OrderByDescending(r => r.DataVenda);
    }

    public async Task<ResumoFinanceiroDto> ObterResumoFinanceiroAsync(DateTime? dataInicio, DateTime? dataFim)
    {
        var resumo = new ResumoFinanceiroDto();

        var queryPagar = _context.ContasPagar.Where(c => c.Status == (byte)GravityCarSystem.Domain.Enums.StatusConta.Pago);
        var queryVendas = _context.Vendas.Where(v => v.Status == (byte)GravityCarSystem.Domain.Enums.StatusVenda.Concluida);

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

        resumo.TotalEntradasVendas = await queryVendas.SumAsync(v => v.ValorLiquido);
        
        // Vamos considerar como compra de veículos as contas a pagar que tenham "Veículo" na descrição (simplificação)
        // ou criar um agrupamento. Aqui faremos o total de saídas:
        var contasPagas = await queryPagar.ToListAsync();
        
        resumo.TotalSaidasComprasVeiculos = contasPagas
            .Where(c => c.Descricao.Contains("Compra de Veículo") || c.Descricao.Contains("Aquisição"))
            .Sum(c => c.ValorPago ?? 0);
            
        resumo.TotalSaidasContasPagar = contasPagas
            .Where(c => !c.Descricao.Contains("Compra de Veículo") && !c.Descricao.Contains("Aquisição"))
            .Sum(c => c.ValorPago ?? 0);

        resumo.SaldoLiquido = resumo.TotalEntradasVendas - (resumo.TotalSaidasContasPagar + resumo.TotalSaidasComprasVeiculos);

        return resumo;
    }
}
