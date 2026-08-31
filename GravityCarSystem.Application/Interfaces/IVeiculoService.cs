using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using GravityCarSystem.Application.DTOs.Veiculos;
using GravityCarSystem.Domain.Enums;

namespace GravityCarSystem.Application.Interfaces;

public interface IVeiculoService
{
    Task<VeiculoDto> AdicionarAsync(VeiculoDto dto);
    Task<VeiculoDto> AtualizarAsync(Guid id, VeiculoDto dto);
    Task AlterarStatusAsync(Guid id, StatusVeiculo novoStatus);
    Task RemoverAsync(Guid id);
    Task<VeiculoDto?> ObterPorIdAsync(Guid id);
    Task<IEnumerable<VeiculoDto>> ObterTodosAsync();
    Task<IEnumerable<VeiculoDto>> ObterPorStatusAsync(StatusVeiculo status);

    // Fase 2 - Gestão de Veículos
    Task<VeiculoDetalhesDto?> ObterDetalhesAsync(Guid id);
    Task<VeiculoFotoDto> AdicionarFotoAsync(Guid veiculoId, string url, bool isPrincipal);
    Task<VeiculoDocumentoDto> AdicionarDocumentoAsync(Guid veiculoId, string nomeArquivo, string url, string tipo);
    Task<VeiculoCustoDto> AdicionarCustoAsync(Guid veiculoId, VeiculoCustoDto custoDto);
}
