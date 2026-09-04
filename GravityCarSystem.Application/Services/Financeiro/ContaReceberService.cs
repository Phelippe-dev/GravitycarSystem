using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using GravityCarSystem.Application.DTOs.Financeiro;
using GravityCarSystem.Application.Interfaces;
using GravityCarSystem.Application.Interfaces.Financeiro;
using GravityCarSystem.Domain.Entities.Financeiro;
using GravityCarSystem.Domain.Enums;

namespace GravityCarSystem.Application.Services.Financeiro;

public class ContaReceberService : IContaReceberService
{
    private readonly IAppDbContext _context;

    public ContaReceberService(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<ContaReceberDto> AdicionarAsync(ContaReceberDto dto)
    {
        var contaReceber = new ContaReceber
        {
            ClienteId = dto.ClienteId,
            VendaId = dto.VendaId,
            Descricao = dto.Descricao,
            ValorOriginal = dto.ValorOriginal,
            ValorPago = dto.ValorPago,
            Saldo = dto.ValorOriginal - dto.ValorPago,
            DataEmissao = dto.DataEmissao == default ? DateTime.Now : dto.DataEmissao,
            DataVencimento = dto.DataVencimento,
            Status = StatusConta.Aberto
        };

        if (contaReceber.Saldo <= 0)
        {
            contaReceber.Status = StatusConta.Pago;
            contaReceber.DataPagamento = DateTime.Now;
        }

        _context.ContasReceber.Add(contaReceber);
        await _context.SaveChangesAsync();

        dto.Id = contaReceber.Id;
        dto.Status = contaReceber.Status;
        dto.Saldo = contaReceber.Saldo;
        return dto;
    }

    public async Task<ContaReceberDto?> ObterPorIdAsync(Guid id)
    {
        var cr = await _context.ContasReceber
            .Include(c => c.Cliente)
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == id);

        if (cr == null) return null;

        return MapearParaDto(cr);
    }

    public async Task<IEnumerable<ContaReceberDto>> ObterTodasAsync()
    {
        return await _context.ContasReceber
            .Include(c => c.Cliente)
            .AsNoTracking()
            .Select(c => MapearParaDto(c))
            .ToListAsync();
    }

    public async Task<IEnumerable<ContaReceberDto>> ObterPorStatusAsync(StatusConta status)
    {
        return await _context.ContasReceber
            .Include(c => c.Cliente)
            .AsNoTracking()
            .Where(c => c.Status == status)
            .Select(c => MapearParaDto(c))
            .ToListAsync();
    }

    public async Task EfetuarRecebimentoAsync(Guid id, decimal valorRecebido)
    {
        var cr = await _context.ContasReceber.FindAsync(id);
        if (cr == null) throw new KeyNotFoundException("Conta a receber não encontrada.");
        if (cr.Status == StatusConta.Cancelado) throw new InvalidOperationException("Não é possível receber uma conta cancelada.");
        if (cr.Status == StatusConta.Pago) throw new InvalidOperationException("Esta conta já está paga.");

        cr.ValorPago += valorRecebido;
        cr.Saldo = cr.ValorOriginal - cr.ValorPago;

        if (cr.Saldo <= 0)
        {
            cr.Status = StatusConta.Pago;
            cr.DataPagamento = DateTime.Now;
            cr.Saldo = 0; // Evitar saldo negativo visível
        }

        await _context.SaveChangesAsync();
    }

    public async Task CancelarAsync(Guid id)
    {
        var cr = await _context.ContasReceber.FindAsync(id);
        if (cr == null) throw new KeyNotFoundException("Conta a receber não encontrada.");
        if (cr.Status == StatusConta.Pago) throw new InvalidOperationException("Não é possível cancelar uma conta já recebida.");

        cr.Status = StatusConta.Cancelado;
        await _context.SaveChangesAsync();
    }

    private static ContaReceberDto MapearParaDto(ContaReceber cr)
    {
        return new ContaReceberDto
        {
            Id = cr.Id,
            ClienteId = cr.ClienteId,
            ClienteNome = cr.Cliente?.NomeRazaoSocial ?? string.Empty,
            VendaId = cr.VendaId,
            Descricao = cr.Descricao,
            ValorOriginal = cr.ValorOriginal,
            ValorPago = cr.ValorPago,
            Saldo = cr.Saldo,
            DataEmissao = cr.DataEmissao,
            DataVencimento = cr.DataVencimento,
            DataPagamento = cr.DataPagamento,
            Status = cr.Status
        };
    }
}
