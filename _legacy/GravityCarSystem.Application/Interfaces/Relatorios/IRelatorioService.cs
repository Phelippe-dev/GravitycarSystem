using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using GravityCarSystem.Application.DTOs.Relatorios;

namespace GravityCarSystem.Application.Interfaces.Relatorios;

public interface IRelatorioService
{
    Task<IEnumerable<RentabilidadeVeiculoDto>> ObterRentabilidadeVeiculosAsync(DateTime? dataInicio, DateTime? dataFim);
    Task<ResumoFinanceiroDto> ObterResumoFinanceiroAsync(DateTime? dataInicio, DateTime? dataFim);
}
