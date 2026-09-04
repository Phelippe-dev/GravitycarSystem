using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using GravityCarSystem.Application.DTOs.Negocio;
using GravityCarSystem.Domain.Enums;

namespace GravityCarSystem.Application.Interfaces;

public interface IChequeService
{
    Task<ChequeDto> RegistrarChequeAsync(ChequeDto dto);
    Task<IEnumerable<ChequeDto>> ObterTodosAsync();
    Task<ChequeDto> AlterarStatusAsync(Guid id, StatusCheque novoStatus);
    Task<ChequeDto> AtualizarDadosChequeAsync(Guid id, ChequeDto dto);
}
