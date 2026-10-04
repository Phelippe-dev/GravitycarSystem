using System;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MotorsXySystem.Application.Interfaces;
using MotorsXySystem.Domain.Enums;
using MotorsXySystem.Infrastructure.Data;

namespace MotorsXySystem.API.Controllers;

[ApiController]
[Route("api/webhooks")]
[AllowAnonymous]
public class WebhooksController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IAssinaturaEletronicaProvider _assinaturaProvider;

    public WebhooksController(AppDbContext db, IAssinaturaEletronicaProvider assinaturaProvider)
    {
        _db = db;
        _assinaturaProvider = assinaturaProvider;
    }

    [HttpPost("assinatura/{provedor}")]
    public async Task<IActionResult> ProcessarWebhookAssinatura(string provedor, CancellationToken ct = default)
    {
        using var reader = new StreamReader(Request.Body, Encoding.UTF8);
        var corpo = await reader.ReadToEndAsync(ct);

        var headers = Request.Headers.ToDictionary(h => h.Key, h => h.Value.ToString());

        var evento = await _assinaturaProvider.ProcessarWebhookAsync(corpo, headers, ct);
        if (evento == null)
        {
            return BadRequest(new { Erro = "Webhook inválido ou não autenticado." });
        }

        var recibo = await _db.Recibos
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(r => r.ProvedorAssinatura == provedor && r.IdExternoAssinatura == evento.IdExterno, ct);

        if (recibo == null)
        {
            return NotFound(new { Erro = "Documento correspondente não encontrado." });
        }

        recibo.StatusAssinatura = evento.Status;
        if (evento.Status == StatusAssinatura.Assinado)
        {
            recibo.DataAssinatura = evento.DataEvento ?? DateTime.UtcNow;
            if (evento.PdfAssinado != null && evento.PdfAssinado.Length > 0)
            {
                recibo.PdfAssinado = evento.PdfAssinado;
            }
        }
        recibo.DataAtualizacao = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);

        return Ok(new { Sucesso = true, ReciboId = recibo.Id, Status = recibo.StatusAssinatura.ToString() });
    }
}
