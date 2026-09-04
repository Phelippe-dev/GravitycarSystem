using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using GravityCarSystem.Application.DTOs.Financeiro;
using GravityCarSystem.Domain.Enums;

namespace GravityCarSystem.Application.Interfaces.Financeiro;

public interface IContaReceberService
{
    Task<ContaReceberDto> AdicionarAsync(ContaReceberDto dto);
    Task<ContaReceberDto?> ObterPorIdAsync(Guid id);
    Task<IEnumerable<ContaReceberDto>> ObterTodasAsync();
    Task<IEnumerable<ContaReceberDto>> ObterPorStatusAsync(StatusConta status);
    Task EfetuarRecebimentoAsync(Guid id, decimal valorRecebido);
    Task CancelarAsync(Guid id);
}
