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
        var defaultTenantId = Guid.Parse("00000000-0000-0000-0000-000000000001");
        var empresaId = _tenantService.GetEmpresaId() ?? defaultTenantId;
        if (empresaId == Guid.Empty) empresaId = defaultTenantId;

        // Se clienteId não for informado, busca o primeiro cliente ou cria/usa default
        if (dto.ClienteId == Guid.Empty)
        {
            var firstCliente = await _context.Clientes.FirstOrDefaultAsync();
            if (firstCliente != null)
            {
                dto.ClienteId = firstCliente.Id;
            }
        }

        // Localizar veículo existente ou criar novo no estoque
        Veiculo? veiculo = null;
        if (dto.VeiculoId.HasValue && dto.VeiculoId.Value != Guid.Empty)
        {
            veiculo = await _context.Veiculos.FindAsync(dto.VeiculoId.Value);
        }
        else if (!string.IsNullOrWhiteSpace(dto.Placa))
        {
            veiculo = await _context.Veiculos.FirstOrDefaultAsync(v => v.Placa == dto.Placa);
        }

        if (veiculo != null)
        {
            veiculo.Status = dto.ValorAprovado.HasValue ? StatusVeiculo.EmPreparacao : StatusVeiculo.EmAvaliacao;
            veiculo.ValorCompra = dto.ValorAprovado ?? dto.ValorAvaliacao ?? veiculo.ValorCompra;
            if (dto.ValorMercado.HasValue) veiculo.ValorVenda = dto.ValorMercado;
            if (!string.IsNullOrWhiteSpace(dto.Marca)) veiculo.Marca = dto.Marca;
            if (!string.IsNullOrWhiteSpace(dto.Modelo)) veiculo.Modelo = dto.Modelo;
            if (!string.IsNullOrWhiteSpace(dto.Versao)) veiculo.Versao = dto.Versao;
            if (dto.AnoFabricacao.HasValue) veiculo.AnoFabricacao = (short)dto.AnoFabricacao.Value;
            if (dto.AnoModelo.HasValue) veiculo.AnoModelo = (short)dto.AnoModelo.Value;
            if (dto.Quilometragem.HasValue) veiculo.Quilometragem = dto.Quilometragem;
            if (!string.IsNullOrWhiteSpace(dto.Cor)) veiculo.Cor = dto.Cor;
            if (!string.IsNullOrWhiteSpace(dto.Combustivel)) veiculo.Combustivel = dto.Combustivel;
            if (!string.IsNullOrWhiteSpace(dto.Cambio)) veiculo.Cambio = dto.Cambio;
        }
        else
        {
            veiculo = new Veiculo
            {
                Id = Guid.NewGuid(),
                EmpresaId = empresaId,
                Marca = !string.IsNullOrWhiteSpace(dto.Marca) ? dto.Marca : "Não informada",
                Modelo = !string.IsNullOrWhiteSpace(dto.Modelo) ? dto.Modelo : "Não informado",
                Versao = dto.Versao ?? string.Empty,
                Placa = dto.Placa,
                AnoFabricacao = dto.AnoFabricacao.HasValue ? (short)dto.AnoFabricacao.Value : (short)DateTime.UtcNow.Year,
                AnoModelo = dto.AnoModelo.HasValue ? (short)dto.AnoModelo.Value : (short)DateTime.UtcNow.Year,
                Cor = dto.Cor,
                Combustivel = dto.Combustivel,
                Cambio = dto.Cambio,
                Quilometragem = dto.Quilometragem,
                ValorCompra = dto.ValorAprovado ?? dto.ValorAvaliacao,
                ValorVenda = dto.ValorMercado,
                Status = dto.ValorAprovado.HasValue ? StatusVeiculo.EmPreparacao : StatusVeiculo.EmAvaliacao,
                DataEntrada = DateTime.UtcNow,
                Observacoes = $"Entrada via Avaliação de Veículo. {dto.Observacoes}".Trim()
            };
            _context.Veiculos.Add(veiculo);
        }

        var usuarioId = _tenantService.GetUsuarioId();
        if (!usuarioId.HasValue || usuarioId.Value == Guid.Empty)
        {
            var fallbackUser = await _context.Usuarios.IgnoreQueryFilters().FirstOrDefaultAsync(u => u.Ativo);
            usuarioId = fallbackUser?.Id;
        }

        var avaliacao = new Avaliacao
        {
            Id = Guid.NewGuid(),
            EmpresaId = empresaId,
            ClienteId = dto.ClienteId,
            VeiculoId = veiculo.Id,
            UsuarioId = usuarioId,
            ValorMercado = dto.ValorMercado,
            ValorAvaliacao = dto.ValorAvaliacao,
            ValorAprovado = dto.ValorAprovado,
            Observacoes = dto.Observacoes,
            DataAvaliacao = DateTime.UtcNow,
            Status = dto.ValorAprovado.HasValue ? StatusAvaliacao.Aprovada : StatusAvaliacao.Pendente
        };

        foreach (var item in dto.Itens)
        {
            avaliacao.Itens.Add(new AvaliacaoItem
            {
                Id = Guid.NewGuid(),
                AvaliacaoId = avaliacao.Id,
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
        dto.VeiculoId = veiculo.Id;
        return dto;
    }

    public async Task<AvaliacaoDto?> ObterAvaliacaoAsync(Guid id)
    {
        var avaliacao = await _context.Avaliacoes
            .Include(a => a.Itens)
            .Include(a => a.Veiculo)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (avaliacao == null) return null;

        return new AvaliacaoDto
        {
            Id = avaliacao.Id,
            ClienteId = avaliacao.ClienteId,
            VeiculoId = avaliacao.VeiculoId,
            Marca = avaliacao.Veiculo?.Marca,
            Modelo = avaliacao.Veiculo?.Modelo,
            Versao = avaliacao.Veiculo?.Versao,
            Placa = avaliacao.Veiculo?.Placa,
            AnoFabricacao = avaliacao.Veiculo?.AnoFabricacao,
            AnoModelo = avaliacao.Veiculo?.AnoModelo,
            Cor = avaliacao.Veiculo?.Cor,
            Combustivel = avaliacao.Veiculo?.Combustivel,
            Cambio = avaliacao.Veiculo?.Cambio,
            Quilometragem = avaliacao.Veiculo?.Quilometragem,
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
        var query = _context.Avaliacoes
            .Include(a => a.Veiculo)
            .AsQueryable();

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
            Marca = a.Veiculo?.Marca,
            Modelo = a.Veiculo?.Modelo,
            Versao = a.Veiculo?.Versao,
            Placa = a.Veiculo?.Placa,
            AnoFabricacao = a.Veiculo?.AnoFabricacao,
            AnoModelo = a.Veiculo?.AnoModelo,
            Cor = a.Veiculo?.Cor,
            Combustivel = a.Veiculo?.Combustivel,
            Cambio = a.Veiculo?.Cambio,
            Quilometragem = a.Veiculo?.Quilometragem,
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
            .Include(a => a.Veiculo)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (avaliacao == null) throw new Exception("Avaliação não encontrada");

        avaliacao.ValorAprovado = valorAprovado;
        avaliacao.Status = StatusAvaliacao.Aprovada;
        avaliacao.DataAprovacao = DateTime.UtcNow;
        avaliacao.UsuarioId = usuarioAprovadorId;

        if (avaliacao.Veiculo != null)
        {
            avaliacao.Veiculo.Status = StatusVeiculo.EmPreparacao;
            avaliacao.Veiculo.ValorCompra = valorAprovado;
        }

        await _context.SaveChangesAsync();

        return await ObterAvaliacaoAsync(id) ?? throw new Exception("Erro ao recarregar avaliação");
    }
}
