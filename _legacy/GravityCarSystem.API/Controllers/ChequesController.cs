using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using GravityCarSystem.Application.DTOs.Negocio;
using GravityCarSystem.Application.Interfaces;
using GravityCarSystem.Domain.Enums;

namespace GravityCarSystem.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ChequesController : ControllerBase
{
    private readonly IChequeService _chequeService;

    public ChequesController(IChequeService chequeService)
    {
        _chequeService = chequeService;
    }

    [HttpGet]
    public async Task<IActionResult> ObterTodos()
    {
        var cheques = await _chequeService.ObterTodosAsync();
        return Ok(cheques);
    }

    [HttpPost]
    public async Task<IActionResult> Registrar(ChequeDto dto)
    {
        var result = await _chequeService.RegistrarChequeAsync(dto);
        return Ok(result);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Atualizar(Guid id, [FromBody] ChequeDto dto)
    {
        var result = await _chequeService.AtualizarDadosChequeAsync(id, dto);
        return Ok(result);
    }

    [HttpPatch("{id}/status")]
    public async Task<IActionResult> AlterarStatus(Guid id, [FromBody] AlterarStatusChequeRequest request)
    {
        var result = await _chequeService.AlterarStatusAsync(id, request.Status);
        return Ok(result);
    }
}

public class AlterarStatusChequeRequest
{
    public StatusCheque Status { get; set; }
}
