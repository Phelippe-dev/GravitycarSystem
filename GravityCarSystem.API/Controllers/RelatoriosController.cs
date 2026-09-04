using System;
using System.Threading.Tasks;
using GravityCarSystem.Application.Interfaces.Relatorios;
using Microsoft.AspNetCore.Mvc;

namespace GravityCarSystem.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RelatoriosController : ControllerBase
{
    private readonly IRelatorioService _relatorioService;

    public RelatoriosController(IRelatorioService relatorioService)
    {
        _relatorioService = relatorioService;
    }

    [HttpGet("rentabilidade")]
    public async Task<IActionResult> ObterRentabilidadeVeiculos([FromQuery] DateTime? dataInicio, [FromQuery] DateTime? dataFim)
    {
        var relatorio = await _relatorioService.ObterRentabilidadeVeiculosAsync(dataInicio, dataFim);
        return Ok(relatorio);
    }

    [HttpGet("resumo-financeiro")]
    public async Task<IActionResult> ObterResumoFinanceiro([FromQuery] DateTime? dataInicio, [FromQuery] DateTime? dataFim)
    {
        var relatorio = await _relatorioService.ObterResumoFinanceiroAsync(dataInicio, dataFim);
        return Ok(relatorio);
    }
}
