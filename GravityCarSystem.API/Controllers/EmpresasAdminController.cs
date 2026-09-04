using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using GravityCarSystem.Application.DTOs.Acesso;
using GravityCarSystem.Application.Interfaces.Acesso;

namespace GravityCarSystem.API.Controllers;

// NOTA: Para um MVP, podemos deixar AllowAnonymous se quisermos testar rápido, 
// ou Authorize para forçar login (Mesmo que seja um usuário comum por enquanto, o ideal é ter uma Role "SuperAdmin").
[Authorize] 
[ApiController]
[Route("api/admin/empresas")]
public class EmpresasAdminController : ControllerBase
{
    private readonly IEmpresaService _empresaService;

    public EmpresasAdminController(IEmpresaService empresaService)
    {
        _empresaService = empresaService;
    }

    [HttpGet]
    public async Task<IActionResult> ObterTodas()
    {
        var empresas = await _empresaService.ObterTodasAsync();
        return Ok(empresas);
    }

    [HttpPost]
    public async Task<IActionResult> Criar(EmpresaDto dto)
    {
        var result = await _empresaService.CriarAsync(dto);
        return Ok(result);
    }

    [HttpPatch("{id}/toggle-status")]
    public async Task<IActionResult> AlternarStatus(Guid id)
    {
        var status = await _empresaService.AlternarStatusAsync(id);
        return Ok(new { Ativa = status });
    }
}
