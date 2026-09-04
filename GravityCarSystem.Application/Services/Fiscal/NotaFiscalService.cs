using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using GravityCarSystem.Application.DTOs.Fiscal;
using GravityCarSystem.Application.Interfaces;
using GravityCarSystem.Application.Interfaces.Fiscal;
using GravityCarSystem.Domain.Entities.Fiscal;

namespace GravityCarSystem.Application.Services.Fiscal;

public class NotaFiscalService : INotaFiscalService
{
    private readonly IAppDbContext _context;

    public NotaFiscalService(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<NotaFiscalDto>> ObterTodasAsync(NotaFiscalFiltroDto filtro = null)
    {
        var query = _context.NotasFiscais.AsNoTracking().AsQueryable();

        if (filtro != null)
        {
            if (filtro.DataInicio.HasValue)
                query = query.Where(n => n.DataEmissao >= filtro.DataInicio.Value);
            
            if (filtro.DataFim.HasValue)
                query = query.Where(n => n.DataEmissao <= filtro.DataFim.Value.AddDays(1).AddTicks(-1));
            
            if (filtro.Tipo.HasValue)
                query = query.Where(n => n.Tipo == filtro.Tipo.Value);
            
            if (filtro.Status.HasValue)
                query = query.Where(n => n.Status == filtro.Status.Value);
            
            if (!string.IsNullOrEmpty(filtro.Busca))
            {
                var lowerBusca = filtro.Busca.ToLower();
                query = query.Where(n => 
                    (n.ChaveAcesso != null && n.ChaveAcesso.ToLower().Contains(lowerBusca)) ||
                    (n.Numero != null && n.Numero.ToLower().Contains(lowerBusca)) ||
                    (n.DestinatarioNome != null && n.DestinatarioNome.ToLower().Contains(lowerBusca)) ||
                    (n.EmitenteNome != null && n.EmitenteNome.ToLower().Contains(lowerBusca))
                );
            }
        }

        var notas = await query.OrderByDescending(n => n.DataEmissao).ToListAsync();

        return notas.Select(n => new NotaFiscalDto
        {
            Id = n.Id,
            ChaveAcesso = n.ChaveAcesso,
            Numero = n.Numero,
            Serie = n.Serie,
            Tipo = n.Tipo,
            DataEmissao = n.DataEmissao,
            EmitenteCnpj = n.EmitenteCnpj,
            EmitenteNome = n.EmitenteNome,
            DestinatarioCnpj = n.DestinatarioCnpj,
            DestinatarioNome = n.DestinatarioNome,
            ValorTotal = n.ValorTotal,
            NaturezaOperacao = n.NaturezaOperacao,
            Cfop = n.Cfop,
            ValorIcms = n.ValorIcms,
            ValorPis = n.ValorPis,
            ValorCofins = n.ValorCofins,
            Status = n.Status
        });
    }

    public async Task<NotaFiscalDto> EmitirParaVendaAsync(EmitirNotaFiscalDto dto)
    {
        var venda = await _context.Vendas
            .Include(v => v.Cliente)
            .Include(v => v.Veiculos)
                .ThenInclude(vv => vv.Veiculo)
            .FirstOrDefaultAsync(v => v.Id == dto.VendaId);

        if (venda == null)
            throw new Exception("Venda não encontrada.");

        var valorBaseCalc = venda.ValorLiquido;
        // Mock ICMS c/ Redução (Convênio 51/00 para carros usados, ex: 90% de redução na base, alíquota de 18% ou simulação de 5% efetivo)
        var valorIcmsSimulado = valorBaseCalc * 0.05m; 
        var valorPisSimulado = valorBaseCalc * 0.0065m;
        var valorCofinsSimulado = valorBaseCalc * 0.03m;

        var nota = new NotaFiscal
        {
            Id = Guid.NewGuid(),
            ChaveAcesso = GerarChaveAcessoFake(),
            Numero = new Random().Next(1000, 9999).ToString(),
            Serie = "1",
            Tipo = 1, // 1 = Saída
            DataEmissao = DateTime.UtcNow,
            EmitenteCnpj = "12.345.678/0001-90",
            EmitenteNome = "Gravity Car System Auto",
            DestinatarioCnpj = venda.Cliente?.CpfCnpj,
            DestinatarioNome = venda.Cliente?.NomeRazaoSocial,
            ValorTotal = venda.ValorLiquido,
            NaturezaOperacao = dto.NaturezaOperacao,
            Cfop = "5102", // Venda de mercadoria adquirida de terceiros
            ValorIcms = valorIcmsSimulado,
            ValorPis = valorPisSimulado,
            ValorCofins = valorCofinsSimulado,
            Status = 1, // Autorizada
            DataImportacao = DateTime.UtcNow
        };

        foreach (var vv in venda.Veiculos)
        {
            nota.Itens.Add(new NotaFiscalItem
            {
                Id = Guid.NewGuid(),
                Descricao = $"Veículo {vv.Veiculo?.Marca} {vv.Veiculo?.Modelo} Placa: {vv.Veiculo?.Placa}",
                Quantidade = 1,
                ValorUnitario = (vv.Veiculo?.ValorVenda ?? 0),
                ValorTotal = (vv.Veiculo?.ValorVenda ?? 0)
            });
        }

        _context.NotasFiscais.Add(nota);
        await _context.SaveChangesAsync(default);

        return await MapToDto(nota);
    }

    public async Task<NotaFiscalDto> EmitirNotaEntradaAsync(EmitirNotaFiscalEntradaDto dto)
    {
        var cliente = await _context.Clientes.FindAsync(dto.ClienteId);
        var veiculo = await _context.Veiculos.FindAsync(dto.VeiculoId);

        if (cliente == null) throw new Exception("Cliente não encontrado.");
        
        // Mock NFe de Entrada
        var nota = new NotaFiscal
        {
            Id = Guid.NewGuid(),
            ChaveAcesso = GerarChaveAcessoFake(),
            Numero = new Random().Next(1000, 9999).ToString(),
            Serie = "1",
            Tipo = 0, // 0 = Entrada
            DataEmissao = DateTime.UtcNow,
            EmitenteCnpj = cliente.CpfCnpj, // Na NFe de entrada, o emitente de fato é a concessionária, mas para registro simula-se a origem
            EmitenteNome = cliente.NomeRazaoSocial,
            DestinatarioCnpj = "12.345.678/0001-90", // Loja
            DestinatarioNome = "Gravity Car System Auto",
            ValorTotal = dto.ValorCompra,
            NaturezaOperacao = dto.NaturezaOperacao,
            Cfop = "1102", // Compra para comercialização
            ValorIcms = 0, // Pessoa física geralmente não destaca ICMS
            ValorPis = 0,
            ValorCofins = 0,
            Status = 1, 
            DataImportacao = DateTime.UtcNow
        };

        if (veiculo != null)
        {
            nota.Itens.Add(new NotaFiscalItem
            {
                Id = Guid.NewGuid(),
                Descricao = $"Veículo {veiculo.Marca} {veiculo.Modelo} Placa: {veiculo.Placa}",
                Quantidade = 1,
                ValorUnitario = dto.ValorCompra,
                ValorTotal = dto.ValorCompra
            });
        }

        _context.NotasFiscais.Add(nota);
        await _context.SaveChangesAsync(default);

        return await MapToDto(nota);
    }

    private Task<NotaFiscalDto> MapToDto(NotaFiscal n)
    {
        return Task.FromResult(new NotaFiscalDto
        {
            Id = n.Id,
            ChaveAcesso = n.ChaveAcesso,
            Numero = n.Numero,
            Serie = n.Serie,
            Tipo = n.Tipo,
            DataEmissao = n.DataEmissao,
            EmitenteCnpj = n.EmitenteCnpj,
            EmitenteNome = n.EmitenteNome,
            DestinatarioCnpj = n.DestinatarioCnpj,
            DestinatarioNome = n.DestinatarioNome,
            ValorTotal = n.ValorTotal,
            NaturezaOperacao = n.NaturezaOperacao,
            Cfop = n.Cfop,
            ValorIcms = n.ValorIcms,
            ValorPis = n.ValorPis,
            ValorCofins = n.ValorCofins,
            Status = n.Status
        });
    }

    private string GerarChaveAcessoFake()
    {
        var random = new Random();
        var num = new char[44];
        for (int i = 0; i < 44; i++)
        {
            num[i] = (char)('0' + random.Next(0, 10));
        }
        return new string(num);
    }
}
