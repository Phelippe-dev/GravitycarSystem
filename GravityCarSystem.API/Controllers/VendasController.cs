using System;
using System.Threading.Tasks;
using GravityCarSystem.Application.DTOs.Negocio;
using GravityCarSystem.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace GravityCarSystem.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class VendasController : ControllerBase
{
    private readonly IVendaService _vendaService;

    public VendasController(IVendaService vendaService)
    {
        _vendaService = vendaService;
    }

    [HttpGet]
    public async Task<IActionResult> ObterTodas()
    {
        var vendas = await _vendaService.ObterTodasAsync();
        return Ok(vendas);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> ObterPorId(Guid id)
    {
        var venda = await _vendaService.ObterPorIdAsync(id);
        if (venda == null) return NotFound("Venda não encontrada.");
        
        return Ok(venda);
    }

    [HttpPost]
    public async Task<IActionResult> RealizarVenda([FromBody] VendaDto dto)
    {
        try
        {
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (Guid.TryParse(userIdClaim, out var userId) && userId != Guid.Empty)
            {
                dto.UsuarioId = userId;
            }

            var venda = await _vendaService.RealizarVendaAsync(dto);
            return CreatedAtAction(nameof(ObterPorId), new { id = venda.Id }, venda);
        }
        catch (Exception ex)
        {
            var innerMsg = ex.InnerException != null ? $" -> {ex.InnerException.Message}" : "";
            return BadRequest(new { message = $"{ex.Message}{innerMsg}" });
        }
    }

    [HttpPost("{id:guid}/cancelar")]
    public async Task<IActionResult> CancelarVenda(Guid id)
    {
        try
        {
            await _vendaService.CancelarVendaAsync(id);
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }
}
