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

        var empresa = await _context.Empresas.FirstOrDefaultAsync(e => e.Id == venda.EmpresaId)
            ?? await _context.Empresas.FirstOrDefaultAsync();

        var emitenteCnpj = !string.IsNullOrWhiteSpace(empresa?.Cnpj) ? empresa.Cnpj : "00.000.000/0001-00";
        var emitenteNome = !string.IsNullOrWhiteSpace(empresa?.RazaoSocial) ? empresa.RazaoSocial : (empresa?.NomeFantasia ?? "Concessionária");

        var totalNotas = await _context.NotasFiscais.CountAsync();
        var proximoNumero = (totalNotas + 1).ToString("D6");

        var valorBaseCalc = venda.ValorLiquido;
        // Tributação padrão de revenda de veículos
        var valorIcms = valorBaseCalc * 0.05m; 
        var valorPis = valorBaseCalc * 0.0065m;
        var valorCofins = valorBaseCalc * 0.03m;

        var nota = new NotaFiscal
        {
            Id = Guid.NewGuid(),
            ChaveAcesso = GerarChaveAcessoSefaz(emitenteCnpj, proximoNumero, 55, 1),
            Numero = proximoNumero,
            Serie = "1",
            Tipo = 1, // 1 = Saída
            DataEmissao = DateTime.UtcNow,
            EmitenteCnpj = emitenteCnpj,
            EmitenteNome = emitenteNome,
            DestinatarioCnpj = venda.Cliente?.CpfCnpj ?? "",
            DestinatarioNome = venda.Cliente?.NomeRazaoSocial ?? "",
            ValorTotal = venda.ValorLiquido,
            NaturezaOperacao = !string.IsNullOrWhiteSpace(dto.NaturezaOperacao) ? dto.NaturezaOperacao : "Venda de Veículo Automotor Usado",
            Cfop = "5102", // Venda de mercadoria adquirida de terceiros
            ValorIcms = valorIcms,
            ValorPis = valorPis,
            ValorCofins = valorCofins,
            Status = 1, // Autorizada
            DataImportacao = DateTime.UtcNow
        };

        foreach (var vv in venda.Veiculos)
        {
            if (vv.Veiculo != null)
            {
                nota.Itens.Add(new NotaFiscalItem
                {
                    Id = Guid.NewGuid(),
                    Descricao = $"Veículo {vv.Veiculo.Marca} {vv.Veiculo.Modelo} {vv.Veiculo.Versao} - Ano {vv.Veiculo.AnoFabricacao}/{vv.Veiculo.AnoModelo} - Placa: {vv.Veiculo.Placa} - Chassi: {vv.Veiculo.Chassi}",
                    Quantidade = 1,
                    ValorUnitario = vv.Veiculo.ValorVenda ?? 0,
                    ValorTotal = vv.Veiculo.ValorVenda ?? 0
                });
            }
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

        var empresa = await _context.Empresas.FirstOrDefaultAsync(e => e.Id == cliente.EmpresaId)
            ?? await _context.Empresas.FirstOrDefaultAsync();

        var destCnpj = !string.IsNullOrWhiteSpace(empresa?.Cnpj) ? empresa.Cnpj : "00.000.000/0001-00";
        var destNome = !string.IsNullOrWhiteSpace(empresa?.RazaoSocial) ? empresa.RazaoSocial : (empresa?.NomeFantasia ?? "Concessionária");

        var totalNotas = await _context.NotasFiscais.CountAsync();
        var proximoNumero = (totalNotas + 1).ToString("D6");

        var nota = new NotaFiscal
        {
            Id = Guid.NewGuid(),
            ChaveAcesso = GerarChaveAcessoSefaz(destCnpj, proximoNumero, 55, 0),
            Numero = proximoNumero,
            Serie = "1",
            Tipo = 0, // 0 = Entrada
            DataEmissao = DateTime.UtcNow,
            EmitenteCnpj = cliente.CpfCnpj,
            EmitenteNome = cliente.NomeRazaoSocial,
            DestinatarioCnpj = destCnpj,
            DestinatarioNome = destNome,
            ValorTotal = dto.ValorCompra,
            NaturezaOperacao = !string.IsNullOrWhiteSpace(dto.NaturezaOperacao) ? dto.NaturezaOperacao : "Entrada de Veículo por Compra / Troca",
            Cfop = "1102", // Compra para comercialização
            ValorIcms = 0,
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
                Descricao = $"Veículo {veiculo.Marca} {veiculo.Modelo} {veiculo.Versao} - Ano {veiculo.AnoFabricacao}/{veiculo.AnoModelo} - Placa: {veiculo.Placa} - Chassi: {veiculo.Chassi}",
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

    private string GerarChaveAcessoSefaz(string cnpj, string numeroNota, int modelo = 55, int serie = 1)
    {
        var cnpjNumeros = new string((cnpj ?? "").Where(char.IsDigit).ToArray()).PadLeft(14, '0');
        var now = DateTime.UtcNow;
        var cUf = "31"; // Minas Gerais (MG = 31)
        var aamm = now.ToString("yyMM");
        var mod = modelo.ToString("D2");
        var ser = serie.ToString("D3");
        var nNF = int.TryParse(numeroNota, out var n) ? n.ToString("D9") : numeroNota.PadLeft(9, '0');
        var tpEmis = "1"; // Emissão normal
        var cNF = Math.Abs(numeroNota.GetHashCode() % 100000000).ToString("D8");
        
        var chaveSemDv = $"{cUf}{aamm}{cnpjNumeros}{mod}{ser}{nNF}{tpEmis}{cNF}";
        if (chaveSemDv.Length > 43) chaveSemDv = chaveSemDv.Substring(0, 43);
        
        // Cálculo do Dígito Verificador (Módulo 11 Padrão SEFAZ)
        var pesos = new[] { 2, 3, 4, 5, 6, 7, 8, 9 };
        var soma = 0;
        var pIdx = 0;
        for (int i = chaveSemDv.Length - 1; i >= 0; i--)
        {
            soma += (chaveSemDv[i] - '0') * pesos[pIdx % pesos.Length];
            pIdx++;
        }
        var resto = soma % 11;
        var dv = (resto == 0 || resto == 1) ? 0 : 11 - resto;

        return $"{chaveSemDv}{dv}";
    }
}
