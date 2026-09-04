using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using GravityCarSystem.Application.DTOs.Veiculos;
using GravityCarSystem.Application.Interfaces;

namespace GravityCarSystem.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class AvaliacoesController : ControllerBase
{
    private readonly IAvaliacaoService _avaliacaoService;

    public AvaliacoesController(IAvaliacaoService avaliacaoService)
    {
        _avaliacaoService = avaliacaoService;
    }

    [HttpGet]
    public async Task<IActionResult> ObterTodas()
    {
        var avaliacoes = await _avaliacaoService.ObterTodasAvaliacoesAsync();
        return Ok(avaliacoes);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> ObterPorId(Guid id)
    {
        var avaliacao = await _avaliacaoService.ObterAvaliacaoAsync(id);
        if (avaliacao == null) return NotFound();
        return Ok(avaliacao);
    }

    [HttpPost]
    public async Task<IActionResult> Criar(AvaliacaoDto dto)
    {
        var result = await _avaliacaoService.CriarAvaliacaoAsync(dto);
        return CreatedAtAction(nameof(ObterPorId), new { id = result.Id }, result);
    }

    [HttpPost("{id}/aprovar")]
    public async Task<IActionResult> Aprovar(Guid id, [FromBody] AprovarAvaliacaoRequest request)
    {
        // Aqui pegaríamos o ID do usuário do token JWT. Simplificando para Guid Empty se não achar.
        var userIdString = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        var userId = Guid.TryParse(userIdString, out var uid) ? uid : Guid.Empty;

        var result = await _avaliacaoService.AprovarAvaliacaoAsync(id, request.ValorAprovado, userId);
        return Ok(result);
    }
}

public class AprovarAvaliacaoRequest
{
    public decimal ValorAprovado { get; set; }
}
