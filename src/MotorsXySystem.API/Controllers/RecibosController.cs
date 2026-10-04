using System;
using System.Linq;
using System.Security.Claims;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MotorsXySystem.Application.DTOs.Recibos;
using MotorsXySystem.Application.Interfaces;
using MotorsXySystem.Domain.Enums;
using MotorsXySystem.Infrastructure.Data;

namespace MotorsXySystem.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class RecibosController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IReciboService _reciboService;
    private readonly IAssinaturaEletronicaProvider _assinaturaProvider;

    public RecibosController(
        AppDbContext db,
        IReciboService reciboService,
        IAssinaturaEletronicaProvider assinaturaProvider)
    {
        _db = db;
        _reciboService = reciboService;
        _assinaturaProvider = assinaturaProvider;
    }

    private Guid? ObterUsuarioId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier);
        return claim != null && Guid.TryParse(claim.Value, out var id) ? id : null;
    }

    [HttpGet]
    public async Task<IActionResult> Listar(
        [FromQuery] int? tipo, 
        [FromQuery] string? busca,
        CancellationToken ct = default)
    {
        var query = _db.Recibos.AsNoTracking().Where(r => r.Ativo);

        if (tipo.HasValue && tipo > 0)
        {
            query = query.Where(r => (int)r.Tipo == tipo.Value);
        }

        var lista = await query
            .OrderByDescending(r => r.EmitidoEmUtc)
            .Take(100)
            .ToListAsync(ct);

        var recibos = lista.Select(r =>
        {
            string compradorNome = "";
            string veiculoDesc = "";
            try
            {
                var doc = JsonSerializer.Deserialize<ReciboSnapshot>(r.DadosJson, MotorsXySystem.Infrastructure.Servicos.ReciboService.JsonCanonico);
                if (doc != null)
                {
                    compradorNome = doc.Comprador.Nome ?? "";
                    veiculoDesc = $"{doc.Veiculo.Marca} {doc.Veiculo.Modelo}".Trim();
                    if (!string.IsNullOrWhiteSpace(doc.Veiculo.Placa))
                        veiculoDesc += $" ({doc.Veiculo.Placa})";
                }
            }
            catch { }

            return new ReciboResumoDto(
                r.Id,
                r.Numero,
                r.Tipo.ToString(),
                compradorNome,
                veiculoDesc,
                r.ValorTotal,
                r.ValorRecebido,
                r.EmitidoEmUtc,
                r.HashSha256,
                r.Cancelado,
                r.StatusAssinatura.ToString(),
                r.UrlAssinatura);
        }).ToList();

        if (!string.IsNullOrWhiteSpace(busca))
        {
            var b = busca.Trim().ToLower();
            recibos = recibos.Where(r => 
                r.Numero.ToLower().Contains(b) || 
                r.CompradorNome.ToLower().Contains(b) || 
                r.VeiculoDescricao.ToLower().Contains(b) ||
                r.HashSha256.ToLower().Contains(b)).ToList();
        }

        return Ok(recibos);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> ObterPorId(Guid id, CancellationToken ct = default)
    {
        var recibo = await _db.Recibos.AsNoTracking().FirstOrDefaultAsync(r => r.Id == id, ct);
        if (recibo == null) return NotFound(new { Erro = "Recibo não encontrado." });

        var integro = _reciboService.VerificarIntegridade(recibo);

        return Ok(new
        {
            recibo.Id,
            recibo.Numero,
            Tipo = recibo.Tipo.ToString(),
            recibo.VendaId,
            recibo.ClienteId,
            recibo.VeiculoId,
            recibo.ValorTotal,
            recibo.ValorRecebido,
            recibo.HashSha256,
            recibo.PdfSha256,
            recibo.EmitidoEmUtc,
            recibo.Cancelado,
            recibo.MotivoCancelamento,
            StatusAssinatura = recibo.StatusAssinatura.ToString(),
            recibo.ProvedorAssinatura,
            recibo.UrlAssinatura,
            recibo.DataAssinatura,
            IntegridadeValida = integro,
            DadosSnapshot = System.Text.Json.JsonDocument.Parse(recibo.DadosJson)
        });
    }

    [HttpPost]
    public async Task<IActionResult> Emitir([FromBody] EmitirReciboRequest request, CancellationToken ct = default)
    {
        try
        {
            var usuarioId = ObterUsuarioId();
            var recibo = await _reciboService.EmitirAsync(request, usuarioId, ct);

            return CreatedAtAction(nameof(ObterPorId), new { id = recibo.Id }, new
            {
                recibo.Id,
                recibo.Numero,
                Tipo = recibo.Tipo.ToString(),
                recibo.ValorTotal,
                recibo.ValorRecebido,
                recibo.HashSha256,
                recibo.EmitidoEmUtc,
                Mensagem = "Recibo emitido com sucesso com hash criptográfico SHA-256 e PDF gerado!"
            });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { Erro = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { Erro = "Falha ao emitir recibo: " + ex.Message });
        }
    }

    [HttpGet("{id:guid}/pdf")]
    public async Task<IActionResult> BaixarPdf(Guid id, CancellationToken ct = default)
    {
        var recibo = await _db.Recibos.AsNoTracking().FirstOrDefaultAsync(r => r.Id == id, ct);
        if (recibo == null) return NotFound(new { Erro = "Recibo não encontrado." });

        var bytes = recibo.PdfAssinado ?? recibo.Pdf;
        var nomeArquivo = $"Recibo_{recibo.Numero}.pdf";

        return File(bytes, "application/pdf", nomeArquivo);
    }

    [HttpGet("{id:guid}/integridade")]
    public async Task<IActionResult> VerificarIntegridade(Guid id, CancellationToken ct = default)
    {
        var recibo = await _db.Recibos.AsNoTracking().FirstOrDefaultAsync(r => r.Id == id, ct);
        if (recibo == null) return NotFound(new { Erro = "Recibo não encontrado." });

        var valida = _reciboService.VerificarIntegridade(recibo);

        return Ok(new
        {
            ReciboId = recibo.Id,
            recibo.Numero,
            recibo.HashSha256,
            recibo.PdfSha256,
            IntegridadeValida = valida,
            Mensagem = valida 
                ? "Documento 100% autêntico. Os dados gravados e o PDF conferem integralmente com os hashes criptográficos originais." 
                : "ATENÇÃO: Houve divergência no hash do documento!"
        });
    }

    [HttpPost("{id:guid}/cancelar")]
    public async Task<IActionResult> Cancelar(Guid id, [FromBody] CancelarReciboRequest request, CancellationToken ct = default)
    {
        var recibo = await _db.Recibos.FirstOrDefaultAsync(r => r.Id == id, ct);
        if (recibo == null) return NotFound(new { Erro = "Recibo não encontrado." });

        if (recibo.Cancelado) return BadRequest(new { Erro = "Este recibo já está cancelado." });

        recibo.Cancelado = true;
        recibo.MotivoCancelamento = request.Motivo ?? "Cancelado administrativamente";
        recibo.DataAtualizacao = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);
        return Ok(new { Mensagem = "Recibo cancelado com sucesso." });
    }

    [HttpPost("{id:guid}/solicitar-assinatura")]
    public async Task<IActionResult> SolicitarAssinatura(Guid id, CancellationToken ct = default)
    {
        var recibo = await _db.Recibos.FirstOrDefaultAsync(r => r.Id == id, ct);
        if (recibo == null) return NotFound(new { Erro = "Recibo não encontrado." });

        if (recibo.StatusAssinatura == StatusAssinatura.Assinado)
            return BadRequest(new { Erro = "Documento já está assinado." });

        var docSnapshot = System.Text.Json.JsonSerializer.Deserialize<ReciboSnapshot>(recibo.DadosJson, MotorsXySystem.Infrastructure.Servicos.ReciboService.JsonCanonico);
        if (docSnapshot == null) return BadRequest(new { Erro = "Não foi possível carregar os dados do recibo." });

        var signatarios = new[]
        {
            new SignatarioAssinatura(docSnapshot.Comprador.Nome, docSnapshot.Comprador.Email ?? "comprador@sememail.com", docSnapshot.Comprador.CpfCnpj, docSnapshot.Comprador.Telefone, "Comprador"),
            new SignatarioAssinatura(docSnapshot.Empresa.RazaoSocial, docSnapshot.Empresa.Email ?? "empresa@sememail.com", docSnapshot.Empresa.Cnpj, docSnapshot.Empresa.Telefone, "Vendedor")
        };

        var docParaAssinar = new DocumentoParaAssinatura(
            recibo.Id,
            recibo.EmpresaId,
            $"Recibo_{recibo.Numero}.pdf",
            recibo.Pdf,
            recibo.HashSha256,
            signatarios,
            null);

        var resultado = await _assinaturaProvider.SolicitarAssinaturaAsync(docParaAssinar, ct);

        if (!resultado.Sucesso)
            return StatusCode(502, new { Erro = "Erro ao enviar para provedor de assinatura: " + resultado.Erro });

        recibo.StatusAssinatura = StatusAssinatura.Pendente;
        recibo.ProvedorAssinatura = _assinaturaProvider.Nome;
        recibo.IdExternoAssinatura = resultado.IdExterno;
        recibo.UrlAssinatura = resultado.UrlAssinatura;
        recibo.DataAtualizacao = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);

        return Ok(new
        {
            Mensagem = "Solicitação de assinatura eletrônica enviada com sucesso.",
            recibo.StatusAssinatura,
            recibo.ProvedorAssinatura,
            recibo.IdExternoAssinatura,
            recibo.UrlAssinatura
        });
    }
}

public class CancelarReciboRequest
{
    public string? Motivo { get; set; }
}
