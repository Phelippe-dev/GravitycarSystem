using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MotorsXySystem.Application.DTOs.Recibos;
using MotorsXySystem.Application.Interfaces;
using MotorsXySystem.Infrastructure.Data;

namespace MotorsXySystem.API.Controllers;

[ApiController]
[Route("api/public/recibos")]
[AllowAnonymous]
public class PublicRecibosController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IReciboService _reciboService;

    public PublicRecibosController(AppDbContext db, IReciboService reciboService)
    {
        _db = db;
        _reciboService = reciboService;
    }

    /// <summary>
    /// Consulta pública de validação de autenticidade através do Hash SHA-256 do documento.
    /// Utilizado pelo QR Code e link impresso no rodapé de cada recibo.
    /// </summary>
    [HttpGet("verificar/{hash}")]
    public async Task<IActionResult> VerificarPorHash(string hash, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(hash) || hash.Length < 16)
            return BadRequest(new { Erro = "Hash inválido." });

        var recibo = await _db.Recibos
            .IgnoreQueryFilters()
            .AsNoTracking()
            .FirstOrDefaultAsync(r => r.HashSha256.ToLower() == hash.ToLower().Trim(), ct);

        if (recibo == null)
        {
            return NotFound(new
            {
                Valido = false,
                Mensagem = "Documento não encontrado na base de dados oficial da Motors Xy. Este recibo pode ser falso ou ter sido adulterado."
            });
        }

        var integro = _reciboService.VerificarIntegridade(recibo);

        ReciboSnapshot? snapshot = null;
        try
        {
            snapshot = JsonSerializer.Deserialize<ReciboSnapshot>(recibo.DadosJson, MotorsXySystem.Infrastructure.Servicos.ReciboService.JsonCanonico);
        }
        catch { }

        return Ok(new
        {
            Valido = integro && !recibo.Cancelado,
            Cancelado = recibo.Cancelado,
            MotivoCancelamento = recibo.MotivoCancelamento,
            recibo.Numero,
            Tipo = recibo.Tipo.ToString(),
            recibo.EmitidoEmUtc,
            recibo.HashSha256,
            StatusAssinatura = recibo.StatusAssinatura.ToString(),
            Empresa = snapshot != null ? new
            {
                snapshot.Empresa.NomeFantasia,
                snapshot.Empresa.RazaoSocial,
                snapshot.Empresa.Cnpj,
                snapshot.Empresa.Cidade,
                snapshot.Empresa.Uf
            } : null,
            Veiculo = snapshot != null ? new
            {
                snapshot.Veiculo.Tipo,
                snapshot.Veiculo.Marca,
                snapshot.Veiculo.Modelo,
                snapshot.Veiculo.Versao,
                snapshot.Veiculo.AnoModelo,
                snapshot.Veiculo.Placa,
                snapshot.Veiculo.Cilindrada
            } : null,
            CompradorNome = snapshot?.Comprador.Nome,
            ValorTotal = recibo.ValorTotal,
            ValorRecebido = recibo.ValorRecebido,
            Mensagem = !recibo.Cancelado && integro
                ? "Documento autêntico e válido, registrado no sistema com assinatura criptográfica."
                : (recibo.Cancelado ? "Atenção: Este documento foi CANCELADO pelo emissor." : "Atenção: Hash de integridade divergente!")
        });
    }
}
