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

public class ContaPagarService : IContaPagarService
{
    private readonly IAppDbContext _context;

    public ContaPagarService(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<ContaPagarDto> AdicionarAsync(ContaPagarDto dto)
    {
        var contaPagar = new ContaPagar
        {
            FornecedorId = dto.FornecedorId,
            CategoriaId = dto.CategoriaId,
            Descricao = dto.Descricao,
            ValorOriginal = dto.ValorOriginal,
            ValorPago = dto.ValorPago,
            Saldo = dto.ValorOriginal - dto.ValorPago,
            DataEmissao = dto.DataEmissao == default ? DateTime.Now : dto.DataEmissao,
            DataVencimento = dto.DataVencimento,
            Status = StatusConta.Aberto
        };

        if (contaPagar.Saldo <= 0)
        {
            contaPagar.Status = StatusConta.Pago;
            contaPagar.DataPagamento = DateTime.Now;
        }

        _context.ContasPagar.Add(contaPagar);
        await _context.SaveChangesAsync();

        dto.Id = contaPagar.Id;
        dto.Status = contaPagar.Status;
        dto.Saldo = contaPagar.Saldo;
        return dto;
    }

    public async Task<ContaPagarDto?> ObterPorIdAsync(Guid id)
    {
        var cp = await _context.ContasPagar
            .Include(c => c.Fornecedor)
            .Include(c => c.Categoria)
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == id);

        if (cp == null) return null;

        return MapearParaDto(cp);
    }

    public async Task<IEnumerable<ContaPagarDto>> ObterTodasAsync()
    {
        return await _context.ContasPagar
            .Include(c => c.Fornecedor)
            .Include(c => c.Categoria)
            .AsNoTracking()
            .Select(c => MapearParaDto(c))
            .ToListAsync();
    }

    public async Task<IEnumerable<ContaPagarDto>> ObterPorStatusAsync(StatusConta status)
    {
        return await _context.ContasPagar
            .Include(c => c.Fornecedor)
            .Include(c => c.Categoria)
            .AsNoTracking()
            .Where(c => c.Status == status)
            .Select(c => MapearParaDto(c))
            .ToListAsync();
    }

    public async Task EfetuarPagamentoAsync(Guid id, decimal valorPago)
    {
        var cp = await _context.ContasPagar.FindAsync(id);
        if (cp == null) throw new KeyNotFoundException("Conta a pagar não encontrada.");
        if (cp.Status == StatusConta.Cancelado) throw new InvalidOperationException("Não é possível pagar uma conta cancelada.");
        if (cp.Status == StatusConta.Pago) throw new InvalidOperationException("Esta conta já está paga.");

        cp.ValorPago += valorPago;
        cp.Saldo = cp.ValorOriginal - cp.ValorPago;

        if (cp.Saldo <= 0)
        {
            cp.Status = StatusConta.Pago;
            cp.DataPagamento = DateTime.Now;
            cp.Saldo = 0; // Evitar saldo negativo visível
        }

        await _context.SaveChangesAsync();
    }

    public async Task CancelarAsync(Guid id)
    {
        var cp = await _context.ContasPagar.FindAsync(id);
        if (cp == null) throw new KeyNotFoundException("Conta a pagar não encontrada.");
        if (cp.Status == StatusConta.Pago) throw new InvalidOperationException("Não é possível cancelar uma conta já paga.");

        cp.Status = StatusConta.Cancelado;
        await _context.SaveChangesAsync();
    }

    private static ContaPagarDto MapearParaDto(ContaPagar cp)
    {
        return new ContaPagarDto
        {
            Id = cp.Id,
            FornecedorId = cp.FornecedorId,
            FornecedorNome = cp.Fornecedor?.NomeRazaoSocial ?? string.Empty,
            CategoriaId = cp.CategoriaId,
            CategoriaNome = cp.Categoria?.Nome ?? string.Empty,
            Descricao = cp.Descricao,
            ValorOriginal = cp.ValorOriginal,
            ValorPago = cp.ValorPago,
            Saldo = cp.Saldo,
            DataEmissao = cp.DataEmissao,
            DataVencimento = cp.DataVencimento,
            DataPagamento = cp.DataPagamento,
            Status = cp.Status
        };
    }
}
