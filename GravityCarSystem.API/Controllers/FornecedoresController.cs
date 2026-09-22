using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using GravityCarSystem.Application.DTOs.Cadastros;
using GravityCarSystem.Application.Interfaces;

namespace GravityCarSystem.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class FornecedoresController : ControllerBase
{
    private readonly IFornecedorService _service;

    public FornecedoresController(IFornecedorService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<IActionResult> Listar()
    {
        var fornecedores = await _service.ListarAtivosAsync();
        return Ok(fornecedores);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Obter(Guid id)
    {
        var fornecedor = await _service.ObterPorIdAsync(id);
        if (fornecedor == null) return NotFound();
        return Ok(fornecedor);
    }

    [HttpPost]
    public async Task<IActionResult> Criar([FromBody] FornecedorDto dto)
    {
        var resultado = await _service.CriarAsync(dto);
        return CreatedAtAction(nameof(Obter), new { id = resultado.Id }, resultado);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Atualizar(Guid id, [FromBody] FornecedorDto dto)
    {
        try
        {
            await _service.AtualizarAsync(id, dto);
            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(ex.Message);
        }
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Inativar(Guid id)
    {
        await _service.InativarAsync(id);
        return NoContent();
    }
}
