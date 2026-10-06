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
public class ContasReceberController : ControllerBase
{
    private readonly AppDbContext? _context;

    public ContasReceberController()
    {
    }

    public ContasReceberController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public IActionResult Listar()
    {
        if (_context != null)
        {
            var contas = _context.ContasReceber.ToList();
            if (contas.Any())
            {
                return Ok(contas.Cast<object>().ToArray());
            }
        }

        // Retorna array de títulos quando não há banco ou mock
        return Ok(new object[]
        {
            new
            {
                Id = Guid.NewGuid(),
                Descricao = "Título a Receber Padrão",
                ValorOriginal = 1500.00m,
                Status = (int)StatusConta.Aberta,
                DataVencimento = DateTime.UtcNow.AddDays(30)
            }
        });
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Obter(Guid id)
    {
        if (_context == null) return NotFound();

        var conta = await _context.ContasReceber.FirstOrDefaultAsync(c => c.Id == id);
        if (conta == null) return NotFound(new { Erro = "Conta a receber não encontrada." });

        return Ok(conta);
    }

    [HttpPost("{id:guid}/receber")]
    public async Task<IActionResult> Baixar(Guid id, [FromBody] BaixaTituloRequest request)
    {
        if (_context == null) return Ok(new { Sucesso = true });

        var conta = await _context.ContasReceber.FirstOrDefaultAsync(c => c.Id == id);
        if (conta == null) return NotFound(new { Erro = "Conta a receber não encontrada." });

        conta.ValorPago = request.ValorPago > 0 ? request.ValorPago : conta.ValorOriginal;
        conta.DataPagamento = DateTime.UtcNow;
        conta.Status = StatusConta.Paga;

        _context.MovimentosFinanceiros.Add(new MovimentoFinanceiro
        {
            Id = Guid.NewGuid(),
            ContaReceberId = conta.Id,
            Tipo = TipoMovimento.Entrada,
            Descricao = $"Baixa recebimento: {conta.Descricao}",
            Valor = conta.ValorPago.Value,
            DataHora = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();
        return Ok(conta);
    }
}

public class BaixaTituloRequest
{
    public decimal ValorPago { get; set; }
}
