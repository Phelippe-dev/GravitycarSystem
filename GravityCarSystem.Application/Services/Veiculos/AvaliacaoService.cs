using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using GravityCarSystem.Application.DTOs.Veiculos;
using GravityCarSystem.Application.Interfaces;
using GravityCarSystem.Domain.Entities.Veiculos;
using GravityCarSystem.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace GravityCarSystem.Application.Services.Veiculos;

public class AvaliacaoService : IAvaliacaoService
{
    private readonly IAppDbContext _context;
    private readonly ICurrentTenantService _tenantService;

    public AvaliacaoService(IAppDbContext context, ICurrentTenantService tenantService)
    {
        _context = context;
        _tenantService = tenantService;
    }

    public async Task<AvaliacaoDto> CriarAvaliacaoAsync(AvaliacaoDto dto)
    {
        var empresaId = _tenantService.GetEmpresaId();
        var avaliacao = new Avaliacao
        {
            Id = Guid.NewGuid(),
            EmpresaId = empresaId ?? Guid.Empty,
            ClienteId = dto.ClienteId,
            VeiculoId = dto.VeiculoId,
            ValorMercado = dto.ValorMercado,
            ValorAvaliacao = dto.ValorAvaliacao,
            Observacoes = dto.Observacoes,
            DataAvaliacao = DateTime.UtcNow,
            Status = StatusAvaliacao.Pendente
        };

        foreach (var item in dto.Itens)
        {
            avaliacao.Itens.Add(new AvaliacaoItem
            {
                Id = Guid.NewGuid(),
                Categoria = item.Categoria,
                Item = item.Item,
                Status = (StatusChecklist)item.Status,
                Observacao = item.Observacao,
                CustoEstimado = item.CustoEstimado
            });
        }

        _context.Avaliacoes.Add(avaliacao);
        await _context.SaveChangesAsync();

        dto.Id = avaliacao.Id;
        return dto;
    }

    public async Task<AvaliacaoDto?> ObterAvaliacaoAsync(Guid id)
    {
        var avaliacao = await _context.Avaliacoes
            .Include(a => a.Itens)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (avaliacao == null) return null;

        return new AvaliacaoDto
        {
            Id = avaliacao.Id,
            ClienteId = avaliacao.ClienteId,
            VeiculoId = avaliacao.VeiculoId,
            ValorMercado = avaliacao.ValorMercado,
            ValorAvaliacao = avaliacao.ValorAvaliacao,
            ValorAprovado = avaliacao.ValorAprovado,
            Observacoes = avaliacao.Observacoes,
            Status = (int)avaliacao.Status,
            DataAvaliacao = avaliacao.DataAvaliacao,
            DataAprovacao = avaliacao.DataAprovacao,
            Itens = avaliacao.Itens.Select(i => new AvaliacaoItemDto
            {
                Id = i.Id,
                Categoria = i.Categoria,
                Item = i.Item,
                Status = (int)i.Status,
                Observacao = i.Observacao,
                CustoEstimado = i.CustoEstimado
            }).ToList()
        };
    }

    public async Task<IEnumerable<AvaliacaoDto>> ObterTodasAvaliacoesAsync()
    {
        var empresaId = _tenantService.GetEmpresaId();
        var query = _context.Avaliacoes.AsQueryable();

        if (empresaId.HasValue && empresaId.Value != Guid.Empty)
        {
            query = query.Where(a => a.EmpresaId == empresaId.Value);
        }

        var avaliacoes = await query
            .OrderByDescending(a => a.DataAvaliacao)
            .ToListAsync();

        return avaliacoes.Select(a => new AvaliacaoDto
        {
            Id = a.Id,
            ClienteId = a.ClienteId,
            VeiculoId = a.VeiculoId,
            ValorMercado = a.ValorMercado,
            ValorAvaliacao = a.ValorAvaliacao,
            ValorAprovado = a.ValorAprovado,
            Status = (int)a.Status,
            DataAvaliacao = a.DataAvaliacao
        });
    }

    public async Task<AvaliacaoDto> AprovarAvaliacaoAsync(Guid id, decimal valorAprovado, Guid usuarioAprovadorId)
    {
        var avaliacao = await _context.Avaliacoes
            .FirstOrDefaultAsync(a => a.Id == id);

        if (avaliacao == null) throw new Exception("Avaliação não encontrada");

        avaliacao.ValorAprovado = valorAprovado;
        avaliacao.Status = StatusAvaliacao.Aprovada;
        avaliacao.DataAprovacao = DateTime.UtcNow;
        avaliacao.UsuarioId = usuarioAprovadorId;

        await _context.SaveChangesAsync();

        return await ObterAvaliacaoAsync(id) ?? throw new Exception("Erro ao recarregar avaliação");
    }
}
