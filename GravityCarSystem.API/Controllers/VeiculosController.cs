using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using GravityCarSystem.Application.DTOs.Veiculos;
using GravityCarSystem.Application.Interfaces;
using GravityCarSystem.Domain.Enums;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace GravityCarSystem.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class VeiculosController : ControllerBase
{
    private readonly IVeiculoService _veiculoService;
    private readonly IFileStorageService _fileStorageService;

    public VeiculosController(IVeiculoService veiculoService, IFileStorageService fileStorageService)
    {
        _veiculoService = veiculoService;
        _fileStorageService = fileStorageService;
    }

    [HttpGet]
    public async Task<IActionResult> ObterTodos()
    {
        var veiculos = await _veiculoService.ObterTodosAsync();
        return Ok(veiculos);
    }

    [HttpGet("status/{status}")]
    public async Task<IActionResult> ObterPorStatus(StatusVeiculo status)
    {
        var veiculos = await _veiculoService.ObterPorStatusAsync(status);
        return Ok(veiculos);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> ObterPorId(Guid id)
    {
        var veiculo = await _veiculoService.ObterPorIdAsync(id);
        if (veiculo == null) return NotFound("Veículo não encontrado.");
        
        return Ok(veiculo);
    }

    [HttpPost]
    public async Task<IActionResult> Adicionar([FromBody] VeiculoDto dto)
    {
        try
        {
            var veiculo = await _veiculoService.AdicionarAsync(dto);
            return CreatedAtAction(nameof(ObterPorId), new { id = veiculo.Id }, veiculo);
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Atualizar(Guid id, [FromBody] VeiculoDto dto)
    {
        try
        {
            var veiculo = await _veiculoService.AtualizarAsync(id, dto);
            return Ok(veiculo);
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

    [HttpPatch("{id:guid}/status")]
    public async Task<IActionResult> AlterarStatus(Guid id, [FromBody] StatusVeiculo novoStatus)
    {
        try
        {
            await _veiculoService.AlterarStatusAsync(id, novoStatus);
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

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Remover(Guid id)
    {
        try
        {
            await _veiculoService.RemoverAsync(id);
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

    // FASE 2: DETALHES, FOTOS, DOCUMENTOS E CUSTOS

    [HttpGet("{id:guid}/detalhes")]
    public async Task<IActionResult> ObterDetalhes(Guid id)
    {
        var veiculo = await _veiculoService.ObterDetalhesAsync(id);
        if (veiculo == null) return NotFound("Veículo não encontrado.");
        
        return Ok(veiculo);
    }

    [HttpPost("{id:guid}/fotos")]
    public async Task<IActionResult> AdicionarFoto(Guid id, IFormFile file, [FromForm] bool isPrincipal = false)
    {
        try
        {
            using var stream = file.OpenReadStream();
            var url = await _fileStorageService.UploadFileAsync(stream, file.FileName, "fotos");
            var foto = await _veiculoService.AdicionarFotoAsync(id, url, isPrincipal);
            return Ok(foto);
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpDelete("{id:guid}/fotos/{fotoId:guid}")]
    public async Task<IActionResult> RemoverFoto(Guid id, Guid fotoId)
    {
        try
        {
            await _veiculoService.RemoverFotoAsync(id, fotoId);
            return NoContent();
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPatch("{id:guid}/fotos/{fotoId:guid}/principal")]
    public async Task<IActionResult> DefinirFotoPrincipal(Guid id, Guid fotoId)
    {
        try
        {
            await _veiculoService.DefinirFotoPrincipalAsync(id, fotoId);
            return Ok();
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPost("{id:guid}/documentos")]
    public async Task<IActionResult> AdicionarDocumento(Guid id, IFormFile file, [FromForm] string tipo = "Outro")
    {
        try
        {
            using var stream = file.OpenReadStream();
            var url = await _fileStorageService.UploadFileAsync(stream, file.FileName, "documentos");
            var documento = await _veiculoService.AdicionarDocumentoAsync(id, file.FileName, url, tipo);
            return Ok(documento);
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpDelete("{id:guid}/documentos/{documentoId:guid}")]
    public async Task<IActionResult> RemoverDocumento(Guid id, Guid documentoId)
    {
        try
        {
            await _veiculoService.RemoverDocumentoAsync(id, documentoId);
            return NoContent();
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPost("{id:guid}/custos")]
    public async Task<IActionResult> AdicionarCusto(Guid id, [FromBody] VeiculoCustoDto custoDto)
    {
        try
        {
            var custo = await _veiculoService.AdicionarCustoAsync(id, custoDto);
            return Ok(custo);
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPatch("{id:guid}/observacoes")]
    public async Task<IActionResult> AtualizarObservacoes(Guid id, [FromBody] AtualizarObservacoesRequest request)
    {
        try
        {
            await _veiculoService.AtualizarObservacoesAsync(id, request.Observacoes ?? string.Empty);
            return Ok(new { sucesso = true, observacoes = request.Observacoes });
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

public record AtualizarObservacoesRequest(string? Observacoes);
