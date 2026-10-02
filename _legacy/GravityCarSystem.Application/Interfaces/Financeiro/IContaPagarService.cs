using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using GravityCarSystem.Application.DTOs.Financeiro;
using GravityCarSystem.Domain.Enums;

namespace GravityCarSystem.Application.Interfaces.Financeiro;

public interface IContaPagarService
{
    Task<ContaPagarDto> AdicionarAsync(ContaPagarDto dto);
    Task<ContaPagarDto?> ObterPorIdAsync(Guid id);
    Task<IEnumerable<ContaPagarDto>> ObterTodasAsync();
    Task<IEnumerable<ContaPagarDto>> ObterPorStatusAsync(StatusConta status);
    Task EfetuarPagamentoAsync(Guid id, decimal valorPago);
    Task CancelarAsync(Guid id);
}
