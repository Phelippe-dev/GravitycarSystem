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
public class ContasReceberController : ControllerBase
{
    private readonly IContaReceberService _contaReceberService;

    public ContasReceberController(IContaReceberService contaReceberService)
    {
        _contaReceberService = contaReceberService;
    }

    [HttpPost]
    public async Task<IActionResult> Adicionar([FromBody] ContaReceberDto dto)
    {
        var result = await _contaReceberService.AdicionarAsync(dto);
        return CreatedAtAction(nameof(ObterPorId), new { id = result.Id }, result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> ObterPorId(Guid id)
    {
        var result = await _contaReceberService.ObterPorIdAsync(id);
        if (result == null) return NotFound();
        return Ok(result);
    }

    [HttpGet]
    public async Task<IActionResult> ObterTodas([FromQuery] StatusConta? status)
    {
        if (status.HasValue)
        {
            var result = await _contaReceberService.ObterPorStatusAsync(status.Value);
            return Ok(result);
        }
        else
        {
            var result = await _contaReceberService.ObterTodasAsync();
            return Ok(result);
        }
    }

    [HttpPost("{id}/receber")]
    public async Task<IActionResult> Receber(Guid id, [FromBody] decimal valorRecebido)
    {
        await _contaReceberService.EfetuarRecebimentoAsync(id, valorRecebido);
        return NoContent();
    }

    [HttpPost("{id}/cancelar")]
    public async Task<IActionResult> Cancelar(Guid id)
    {
        await _contaReceberService.CancelarAsync(id);
        return NoContent();
    }
}
