using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using GravityCarSystem.Application.DTOs.Acesso;

namespace GravityCarSystem.Application.Interfaces.Acesso;

public interface IEmpresaService
{
    Task<IEnumerable<EmpresaDto>> ObterTodasAsync();
    Task<EmpresaDto> ObterPorIdAsync(Guid id);
    Task<EmpresaDto> CriarAsync(EmpresaDto dto);
    Task<bool> AlternarStatusAsync(Guid id); // Bloqueia ou desbloqueia a concessionária
}
