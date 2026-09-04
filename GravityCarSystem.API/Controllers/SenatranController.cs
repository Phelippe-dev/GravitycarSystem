using System;
using System.Threading.Tasks;
using GravityCarSystem.Application.DTOs.Integracoes;
using GravityCarSystem.Application.Interfaces.Integracoes;
using Microsoft.AspNetCore.Mvc;

namespace GravityCarSystem.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SenatranController : ControllerBase
{
    private readonly ISenatranService _senatranService;

    public SenatranController(ISenatranService senatranService)
    {
        _senatranService = senatranService;
    }

    [HttpGet("consulta")]
    public async Task<IActionResult> ConsultarVeiculo([FromQuery] string placa, [FromQuery] string renavam = "")
    {
        try
        {
            if (string.IsNullOrEmpty(placa))
                return BadRequest(new { message = "Placa é obrigatória para a consulta." });

            var resultado = await _senatranService.ConsultarVeiculoAsync(placa, renavam);
            return Ok(resultado);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("renave/entrada/{veiculoId}")]
    public async Task<IActionResult> RegistrarEntradaRenave(Guid veiculoId)
    {
        try
        {
            var sucesso = await _senatranService.RegistrarEntradaRenaveAsync(veiculoId);
            return Ok(new { Sucesso = sucesso });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("atpve/gerar")]
    public async Task<IActionResult> GerarAtpve([FromBody] GerarAtpveRequestDto request)
    {
        try
        {
            var resultado = await _senatranService.GerarAtpveSaidaAsync(request);
            return Ok(resultado);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
