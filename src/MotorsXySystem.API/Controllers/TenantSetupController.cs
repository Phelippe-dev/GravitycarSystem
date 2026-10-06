using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MotorsXySystem.Application.DTOs;
using MotorsXySystem.Application.Interfaces;

namespace MotorsXySystem.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "SuperAdmin")]
public class TenantSetupController : ControllerBase
{
    private readonly ITenantSetupService _setupService;

    public TenantSetupController(ITenantSetupService setupService)
    {
        _setupService = setupService;
    }

    [HttpPost]
    public async Task<IActionResult> Setup([FromBody] TenantSetupRequest request)
    {
        try
        {
            var resultado = await _setupService.SetupNovoTenantAsync(request);
            return Ok(new { Mensagem = resultado });
        }
        catch (System.Exception ex)
        {
            return BadRequest(new { Erro = ex.Message });
        }
    }
}
