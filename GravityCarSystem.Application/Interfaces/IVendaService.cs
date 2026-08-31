using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using GravityCarSystem.Application.DTOs.Negocio;

namespace GravityCarSystem.Application.Interfaces;

public interface IVendaService
{
    Task<VendaDto> RealizarVendaAsync(VendaDto dto);
    Task CancelarVendaAsync(Guid vendaId);
    Task<VendaDto?> ObterPorIdAsync(Guid id);
    Task<IEnumerable<VendaDto>> ObterTodasAsync();
}
