using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using GravityCarSystem.Application.DTOs.Veiculos;

namespace GravityCarSystem.Application.Interfaces;

public interface IAvaliacaoService
{
    Task<AvaliacaoDto> CriarAvaliacaoAsync(AvaliacaoDto dto);
    Task<AvaliacaoDto?> ObterAvaliacaoAsync(Guid id);
    Task<IEnumerable<AvaliacaoDto>> ObterTodasAvaliacoesAsync();
    Task<AvaliacaoDto> AprovarAvaliacaoAsync(Guid id, decimal valorAprovado, Guid usuarioAprovadorId);
}
