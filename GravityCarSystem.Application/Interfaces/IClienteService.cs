using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using GravityCarSystem.Application.DTOs.Cadastros;

namespace GravityCarSystem.Application.Interfaces;

public interface IClienteService
{
    Task<ClienteDto> AdicionarAsync(ClienteDto dto);
    Task<ClienteDto> AtualizarAsync(Guid id, ClienteDto dto);
    Task RemoverAsync(Guid id);
    Task<ClienteDto?> ObterPorIdAsync(Guid id);
    Task<IEnumerable<ClienteDto>> ObterTodosAsync();
}
