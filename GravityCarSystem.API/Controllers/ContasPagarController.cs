using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using GravityCarSystem.Application.DTOs.Financeiro;
using GravityCarSystem.Application.Interfaces.Financeiro;
using GravityCarSystem.Domain.Enums;

namespace GravityCarSystem.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ContasPagarController : ControllerBase
{
    private readonly IContaPagarService _contaPagarService;

    public ContasPagarController(IContaPagarService contaPagarService)
    {
        _contaPagarService = contaPagarService;
    }

    [HttpPost]
    public async Task<IActionResult> Adicionar([FromBody] ContaPagarDto dto)
    {
        var result = await _contaPagarService.AdicionarAsync(dto);
        return CreatedAtAction(nameof(ObterPorId), new { id = result.Id }, result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> ObterPorId(Guid id)
    {
        var result = await _contaPagarService.ObterPorIdAsync(id);
        if (result == null) return NotFound();
        return Ok(result);
    }

    [HttpGet]
    public async Task<IActionResult> ObterTodas([FromQuery] StatusConta? status)
    {
        if (status.HasValue)
        {
            var result = await _contaPagarService.ObterPorStatusAsync(status.Value);
            return Ok(result);
        }
        else
        {
            var result = await _contaPagarService.ObterTodasAsync();
            return Ok(result);
        }
    }

    [HttpPost("{id}/pagar")]
    public async Task<IActionResult> Pagar(Guid id, [FromBody] decimal valorPago)
    {
        await _contaPagarService.EfetuarPagamentoAsync(id, valorPago);
        return NoContent();
    }

    [HttpPost("{id}/cancelar")]
    public async Task<IActionResult> Cancelar(Guid id)
    {
        await _contaPagarService.CancelarAsync(id);
        return NoContent();
    }
}
