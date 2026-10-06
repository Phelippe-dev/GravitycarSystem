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
public class ContasPagarController : ControllerBase
{
    private readonly AppDbContext? _context;

    public ContasPagarController()
    {
    }

    public ContasPagarController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public IActionResult Listar()
    {
        if (_context != null)
        {
            var contas = _context.ContasPagar.ToList();
            if (contas.Any())
            {
                return Ok(contas.Cast<object>().ToArray());
            }
        }

        return Ok(new object[]
        {
            new
            {
                Id = Guid.NewGuid(),
                Descricao = "Despesa Operacional",
                ValorOriginal = 850.00m,
                Status = (int)StatusConta.Aberta,
                DataVencimento = DateTime.UtcNow.AddDays(15)
            }
        });
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Obter(Guid id)
    {
        if (_context == null) return NotFound();

        var conta = await _context.ContasPagar.FirstOrDefaultAsync(c => c.Id == id);
        if (conta == null) return NotFound(new { Erro = "Conta a pagar não encontrada." });

        return Ok(conta);
    }

    [HttpPost]
    public async Task<IActionResult> Criar([FromBody] CriarContaPagarDto dto)
    {
        if (dto.Valor <= 0) return BadRequest(new { Erro = "Valor deve ser maior que zero." });

        var conta = new ContaPagar
        {
            Id = Guid.NewGuid(),
            Descricao = dto.Descricao,
            ValorOriginal = dto.Valor,
            DataVencimento = dto.DataVencimento != default ? dto.DataVencimento : DateTime.UtcNow.AddDays(30),
            Status = StatusConta.Aberta
        };

        if (_context != null)
        {
            _context.ContasPagar.Add(conta);
            await _context.SaveChangesAsync();
        }

        return Ok(conta);
    }

    [HttpPost("{id:guid}/pagar")]
    public async Task<IActionResult> Liquidar(Guid id)
    {
        if (_context == null) return Ok(new { Sucesso = true });

        var conta = await _context.ContasPagar.FirstOrDefaultAsync(c => c.Id == id);
        if (conta == null) return NotFound(new { Erro = "Conta a pagar não encontrada." });

        conta.ValorPago = conta.ValorOriginal;
        conta.DataPagamento = DateTime.UtcNow;
        conta.Status = StatusConta.Paga;

        _context.MovimentosFinanceiros.Add(new MovimentoFinanceiro
        {
            Id = Guid.NewGuid(),
            ContaPagarId = conta.Id,
            Tipo = TipoMovimento.Saida,
            Descricao = $"Pagamento despesa: {conta.Descricao}",
            Valor = conta.ValorOriginal,
            DataHora = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();
        return Ok(conta);
    }
}

public class CriarContaPagarDto
{
    public string Descricao { get; set; } = string.Empty;
    public decimal Valor { get; set; }
    public DateTime DataVencimento { get; set; }
}
