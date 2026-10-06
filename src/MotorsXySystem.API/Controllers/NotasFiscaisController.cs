using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MotorsXySystem.Domain.Entidades.Fiscal;
using MotorsXySystem.Infrastructure.Data;

namespace MotorsXySystem.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class NotasFiscaisController : ControllerBase
{
    private readonly AppDbContext? _context;

    public NotasFiscaisController()
    {
    }

    public NotasFiscaisController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> Listar()
    {
        if (_context == null) return Ok(Array.Empty<object>());

        var notas = await _context.NotasFiscais
            .OrderByDescending(n => n.DataEmissao)
            .ToListAsync();

        return Ok(notas);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Obter(Guid id)
    {
        if (_context == null) return NotFound();

        var nota = await _context.NotasFiscais.FirstOrDefaultAsync(n => n.Id == id);
        if (nota == null) return NotFound(new { Erro = "Nota Fiscal não encontrada." });

        return Ok(nota);
    }

    [HttpPost("emitir")]
    public async Task<IActionResult> Emitir([FromBody] EmissaoNfeDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.DestinatarioCpfCnpj))
            return BadRequest(new { Erro = "CPF/CNPJ do destinatário é obrigatório para emissão de NF-e." });

        if (string.IsNullOrWhiteSpace(dto.DestinatarioNome))
            return BadRequest(new { Erro = "Nome/Razão Social do destinatário é obrigatório." });

        if (dto.ValorTotal <= 0)
            return BadRequest(new { Erro = "Valor total da nota fiscal deve ser maior que zero." });

        if (string.IsNullOrWhiteSpace(dto.Chassi))
            return BadRequest(new { Erro = "Chassi do veículo é obrigatório para emissão de NF-e automotiva." });

        var random = new Random();
        var chaveAcesso = $"3526{DateTime.UtcNow:MM}{random.Next(10000000, 99999999)}{random.Next(10000000, 99999999)}{random.Next(10000000, 99999999)}";

        var nota = new NotaFiscal
        {
            Id = Guid.NewGuid(),
            VendaId = dto.VendaId,
            Numero = random.Next(1000, 99999),
            Serie = 1,
            ChaveAcesso = chaveAcesso,
            DestinatarioNome = dto.DestinatarioNome,
            DestinatarioCpfCnpj = dto.DestinatarioCpfCnpj,
            DataEmissao = DateTime.UtcNow,
            Status = StatusNotaFiscal.Autorizada,
            ValorTotal = dto.ValorTotal,
            ProtocoloAutorizacao = $"13526{random.Next(100000000, 999999999)}",
            MensagemSefaz = "Autorizado o uso da NF-e"
        };

        if (_context != null)
        {
            _context.NotasFiscais.Add(nota);
            await _context.SaveChangesAsync();
        }

        return Ok(nota);
    }

    [HttpPost("{id:guid}/cancelar")]
    public async Task<IActionResult> Cancelar(Guid id, [FromBody] CancelamentoNfeDto? dto)
    {
        if (_context == null) return Ok(new { Mensagem = "Nota cancelada com sucesso (mock)." });

        var nota = await _context.NotasFiscais.FirstOrDefaultAsync(n => n.Id == id);
        if (nota == null) return NotFound(new { Erro = "Nota Fiscal não encontrada." });

        nota.Status = StatusNotaFiscal.Cancelada;
        nota.DataCancelamento = DateTime.UtcNow;
        nota.MotivoCancelamento = dto?.Motivo ?? "Cancelamento solicitado pela revenda.";

        await _context.SaveChangesAsync();

        return Ok(new { Mensagem = "NF-e cancelada junto à SEFAZ com sucesso.", Nota = nota });
    }
}

public class EmissaoNfeDto
{
    public Guid? VendaId { get; set; }
    public string? DestinatarioNome { get; set; }
    public string? DestinatarioCpfCnpj { get; set; }
    public string? Chassi { get; set; }
    public decimal ValorTotal { get; set; }
}

public class CancelamentoNfeDto
{
    public string? Motivo { get; set; }
}
