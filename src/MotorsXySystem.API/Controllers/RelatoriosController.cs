using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MotorsXySystem.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class RelatoriosController : ControllerBase
{
    [HttpGet("resumo-financeiro")]
    public IActionResult ResumoFinanceiro() => Ok(new { totalEntradasVendas = 0, totalSaidasContasPagar = 0, totalSaidasComprasVeiculos = 0, saldoLiquido = 0 });
}
