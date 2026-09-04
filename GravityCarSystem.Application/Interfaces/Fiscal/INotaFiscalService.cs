using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using GravityCarSystem.Application.DTOs.Fiscal;

namespace GravityCarSystem.Application.Interfaces.Fiscal;

public interface INotaFiscalService
{
    Task<IEnumerable<NotaFiscalDto>> ObterTodasAsync(NotaFiscalFiltroDto filtro = null);
    Task<NotaFiscalDto> EmitirParaVendaAsync(EmitirNotaFiscalDto dto);
    Task<NotaFiscalDto> EmitirNotaEntradaAsync(EmitirNotaFiscalEntradaDto dto);
}
