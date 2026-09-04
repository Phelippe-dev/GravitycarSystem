using System;
using System.Threading.Tasks;
using GravityCarSystem.Application.DTOs.Fiscal;
using GravityCarSystem.Application.Interfaces.Fiscal;
using Microsoft.AspNetCore.Mvc;

namespace GravityCarSystem.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class NotasFiscaisController : ControllerBase
{
    private readonly INotaFiscalService _notaFiscalService;

    public NotasFiscaisController(INotaFiscalService notaFiscalService)
    {
        _notaFiscalService = notaFiscalService;
    }

    [HttpGet]
    public async Task<IActionResult> ObterTodas([FromQuery] NotaFiscalFiltroDto filtro)
    {
        var notas = await _notaFiscalService.ObterTodasAsync(filtro);
        return Ok(notas);
    }

    [HttpPost("emitir/venda")]
    public async Task<IActionResult> EmitirParaVenda([FromBody] EmitirNotaFiscalDto dto)
    {
        try
        {
            var nota = await _notaFiscalService.EmitirParaVendaAsync(dto);
            return Ok(nota);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("emitir/entrada")]
    public async Task<IActionResult> EmitirNotaEntrada([FromBody] EmitirNotaFiscalEntradaDto dto)
    {
        try
        {
            var nota = await _notaFiscalService.EmitirNotaEntradaAsync(dto);
            return Ok(nota);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

}
