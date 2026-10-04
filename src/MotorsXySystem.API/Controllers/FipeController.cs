using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MotorsXySystem.Application.Interfaces;
using MotorsXySystem.Domain.Enums;

namespace MotorsXySystem.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class FipeController : ControllerBase
{
    private readonly IFipeService _fipeService;

    public FipeController(IFipeService fipeService)
    {
        _fipeService = fipeService;
    }

    [HttpGet("marcas")]
    public async Task<IActionResult> ListarMarcas([FromQuery] int tipo = 1, CancellationToken ct = default)
    {
        var tipoVeiculo = (TipoVeiculo)(tipo > 0 ? tipo : 1);
        var marcas = await _fipeService.ListarMarcasAsync(tipoVeiculo, ct);
        return Ok(marcas);
    }

    [HttpGet("marcas/{marcaId}/modelos")]
    public async Task<IActionResult> ListarModelos(string marcaId, [FromQuery] int tipo = 1, CancellationToken ct = default)
    {
        var tipoVeiculo = (TipoVeiculo)(tipo > 0 ? tipo : 1);
        var modelos = await _fipeService.ListarModelosAsync(tipoVeiculo, marcaId, ct);
        return Ok(modelos);
    }

    [HttpGet("marcas/{marcaId}/modelos/{modeloId}/anos")]
    public async Task<IActionResult> ListarAnos(string marcaId, string modeloId, [FromQuery] int tipo = 1, CancellationToken ct = default)
    {
        var tipoVeiculo = (TipoVeiculo)(tipo > 0 ? tipo : 1);
        var anos = await _fipeService.ListarAnosAsync(tipoVeiculo, marcaId, modeloId, ct);
        return Ok(anos);
    }

    [HttpGet("preco")]
    public async Task<IActionResult> ObterPreco(
        [FromQuery] string marcaId, 
        [FromQuery] string modeloId, 
        [FromQuery] string anoId, 
        [FromQuery] int tipo = 1, 
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(marcaId) || string.IsNullOrWhiteSpace(modeloId) || string.IsNullOrWhiteSpace(anoId))
            return BadRequest(new { Erro = "Parâmetros marcaId, modeloId e anoId são obrigatórios." });

        var tipoVeiculo = (TipoVeiculo)(tipo > 0 ? tipo : 1);
        var preco = await _fipeService.ObterPrecoAsync(tipoVeiculo, marcaId, modeloId, anoId, ct);
        if (preco == null) return NotFound(new { Erro = "Preço FIPE não encontrado para os parâmetros informados." });

        return Ok(preco);
    }

    [HttpGet("codigo/{codigoFipe}")]
    public async Task<IActionResult> ObterPrecoPorCodigo(
        string codigoFipe, 
        [FromQuery] string anoId, 
        [FromQuery] int tipo = 1, 
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(anoId))
            return BadRequest(new { Erro = "O parâmetro anoId é obrigatório." });

        var tipoVeiculo = (TipoVeiculo)(tipo > 0 ? tipo : 1);
        var preco = await _fipeService.ObterPrecoPorCodigoAsync(tipoVeiculo, codigoFipe, anoId, ct);
        if (preco == null) return NotFound(new { Erro = "Preço FIPE não encontrado." });

        return Ok(preco);
    }
}
