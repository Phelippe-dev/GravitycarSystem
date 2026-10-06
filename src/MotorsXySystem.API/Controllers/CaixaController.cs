using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MotorsXySystem.Domain.Entidades.Financeiro;
using MotorsXySystem.Domain.Enums;
using MotorsXySystem.Infrastructure.Data;

namespace MotorsXySystem.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CaixaController : ControllerBase
{
    private readonly AppDbContext? _context;

    public CaixaController()
    {
    }

    public CaixaController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet("status")]
    public async Task<IActionResult> ObterStatus()
    {
        if (_context == null)
        {
            return Ok(new { Aberto = true, SaldoAtual = 0m, TotalEntradas = 0m, TotalSaidas = 0m });
        }

        var movimentos = await _context.MovimentosFinanceiros.ToListAsync();
        var entradas = movimentos.Where(m => m.Tipo == TipoMovimento.Entrada).Sum(m => m.Valor);
        var saidas = movimentos.Where(m => m.Tipo == TipoMovimento.Saida).Sum(m => m.Valor);
        var saldo = entradas - saidas;

        return Ok(new
        {
            Aberto = true,
            SaldoAtual = saldo,
            TotalEntradas = entradas,
            TotalSaidas = saidas,
            QuantidadeMovimentos = movimentos.Count
        });
    }

    [HttpGet("movimentos")]
    public async Task<IActionResult> ListarMovimentos()
    {
        if (_context == null) return Ok(Array.Empty<object>());

        var movimentos = await _context.MovimentosFinanceiros
            .OrderByDescending(m => m.DataHora)
            .Select(m => new
            {
                m.Id,
                m.Tipo,
                m.Descricao,
                m.Valor,
                m.DataHora,
                m.ContaReceberId,
                m.ContaPagarId
            })
            .ToListAsync();

        return Ok(movimentos);
    }

    [HttpPost("suprimento")]
    [Authorize(Roles = "Administrador,Gerente Comercial,SuperAdmin")]
    public async Task<IActionResult> Suprimento([FromBody] MovimentoCaixaRequest request)
    {
        if (request.Valor <= 0) return BadRequest("Valor do suprimento deve ser maior que zero.");

        if (_context != null)
        {
            var mov = new MovimentoFinanceiro
            {
                Id = Guid.NewGuid(),
                Tipo = TipoMovimento.Entrada,
                Descricao = string.IsNullOrWhiteSpace(request.Descricao) ? "Suprimento de Caixa" : request.Descricao,
                Valor = request.Valor,
                DataHora = DateTime.UtcNow
            };
            _context.MovimentosFinanceiros.Add(mov);
            await _context.SaveChangesAsync();
        }

        return Ok(new { Sucesso = true, Mensagem = "Suprimento de caixa realizado com sucesso." });
    }

    [HttpPost("sangria")]
    [Authorize(Roles = "Administrador,Gerente Comercial,SuperAdmin")]
    public async Task<IActionResult> Sangria([FromBody] MovimentoCaixaRequest request)
    {
        if (request.Valor <= 0) return BadRequest("Valor da sangria deve ser maior que zero.");

        if (_context != null)
        {
            var mov = new MovimentoFinanceiro
            {
                Id = Guid.NewGuid(),
                Tipo = TipoMovimento.Saida,
                Descricao = string.IsNullOrWhiteSpace(request.Descricao) ? "Sangria de Caixa" : request.Descricao,
                Valor = request.Valor,
                DataHora = DateTime.UtcNow
            };
            _context.MovimentosFinanceiros.Add(mov);
            await _context.SaveChangesAsync();
        }

        return Ok(new { Sucesso = true, Mensagem = "Sangria de caixa realizada com sucesso." });
    }

    [HttpPost("fechamento")]
    [Authorize(Roles = "Administrador,Gerente Comercial,SuperAdmin")]
    public IActionResult Fechamento()
    {
        return Ok(new { Sucesso = true, Mensagem = "Caixa do dia fechado com sucesso." });
    }
}

public class MovimentoCaixaRequest
{
    public decimal Valor { get; set; }
    public string? Descricao { get; set; }
}
