using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MotorsXySystem.Application.DTOs.Vendas;
using MotorsXySystem.Domain.Entidades.Financeiro;
using MotorsXySystem.Domain.Entidades.Negocio;
using MotorsXySystem.Domain.Entidades.Veiculos;
using MotorsXySystem.Domain.Enums;
using MotorsXySystem.Infrastructure.Data;

namespace MotorsXySystem.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class VendasController : ControllerBase
{
    private readonly AppDbContext _context;

    public VendasController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> Listar()
    {
        var vendas = await _context.Vendas
            .Include(v => v.Cliente)
            .Include(v => v.Veiculos)
                .ThenInclude(vv => vv.Veiculo)
            .OrderByDescending(v => v.DataVenda)
            .ToListAsync();

        var dtos = vendas.Select(v => new VendaDto
        {
            Id = v.Id,
            NumeroVenda = v.NumeroVenda,
            Status = (int)v.Status,
            DataVenda = v.DataVenda,
            ValorLiquido = v.ValorTotalFinal,
            ClienteId = v.ClienteId,
            UsuarioId = v.UsuarioId,
            Desconto = v.ValorDesconto,
            Observacoes = v.Observacoes,
            VeiculosIds = v.Veiculos.Select(x => x.VeiculoId).ToList()
        });

        return Ok(dtos);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Obter(Guid id)
    {
        var v = await _context.Vendas
            .Include(v => v.Cliente)
            .Include(v => v.Veiculos)
                .ThenInclude(vv => vv.Veiculo)
            .FirstOrDefaultAsync(x => x.Id == id);

        if (v == null) return NotFound();

        return Ok(new VendaDto
        {
            Id = v.Id,
            NumeroVenda = v.NumeroVenda,
            Status = (int)v.Status,
            DataVenda = v.DataVenda,
            ValorLiquido = v.ValorTotalFinal,
            ClienteId = v.ClienteId,
            UsuarioId = v.UsuarioId,
            Desconto = v.ValorDesconto,
            Observacoes = v.Observacoes,
            VeiculosIds = v.Veiculos.Select(x => x.VeiculoId).ToList()
        });
    }

    [HttpPost]
    public async Task<IActionResult> Criar([FromBody] VendaDto dto)
    {
        if (dto.VeiculosIds == null || !dto.VeiculosIds.Any())
            return BadRequest("A venda precisa ter pelo menos um veículo.");

        // Buscar veículos sendo vendidos
        var veiculos = await _context.Veiculos
            .Where(v => dto.VeiculosIds.Contains(v.Id))
            .ToListAsync();

        var totalVeiculos = veiculos.Sum(v => v.ValorVenda ?? 0m);
        var totalFinal = totalVeiculos - dto.Desconto;

        var novaVenda = new Venda
        {
            Id = Guid.NewGuid(),
            NumeroVenda = $"VD-{DateTime.UtcNow:yyyyMMdd}-{new Random().Next(1000, 9999)}",
            ClienteId = dto.ClienteId,
            UsuarioId = dto.UsuarioId != Guid.Empty ? dto.UsuarioId : Guid.Parse("11111111-1111-1111-1111-111111111111"),
            DataVenda = dto.DataVenda ?? DateTime.UtcNow,
            Status = StatusVenda.Concluida,
            ValorTotalVeiculos = totalVeiculos,
            ValorDesconto = dto.Desconto,
            ValorTotalFinal = totalFinal,
            Observacoes = dto.Observacoes
        };

        // Adicionar VendaVeiculo e atualizar status do estoque
        foreach (var veic in veiculos)
        {
            novaVenda.Veiculos.Add(new VendaVeiculo
            {
                Id = Guid.NewGuid(),
                VendaId = novaVenda.Id,
                VeiculoId = veic.Id,
                ValorVenda = veic.ValorVenda ?? 0m
            });

            // Status 6 = Vendido
            veic.Status = 6;
        }

        _context.Vendas.Add(novaVenda);

        // Processar Pagamentos -> Gerar Contas a Receber
        foreach (var pag in dto.Pagamentos)
        {
            if (pag.Metodo == "promissoria" || pag.Metodo == "financeira" || pag.Metodo == "cartao" || pag.Metodo == "cheque")
            {
                int numParcelas = pag.Parcelas ?? 1;
                decimal valorParcela = pag.ValorParcela ?? pag.Valor ?? 0m;
                
                for (int i = 1; i <= numParcelas; i++)
                {
                    _context.ContasReceber.Add(new ContaReceber
                    {
                        Id = Guid.NewGuid(),
                        ClienteId = dto.ClienteId,
                        VendaId = novaVenda.Id,
                        Descricao = $"Venda {novaVenda.NumeroVenda} - {pag.Metodo?.ToUpper()} ({i}/{numParcelas})",
                        ValorOriginal = valorParcela,
                        DataVencimento = DateTime.UtcNow.AddMonths(i),
                        Status = StatusConta.Aberta
                    });
                }
            }
            else if (pag.Metodo == "dinheiro" || pag.Metodo == "pix" || pag.Metodo == "transferencia")
            {
                // Pagamento à vista, já entra como Pago
                _context.ContasReceber.Add(new ContaReceber
                {
                    Id = Guid.NewGuid(),
                    ClienteId = dto.ClienteId,
                    VendaId = novaVenda.Id,
                    Descricao = $"Venda {novaVenda.NumeroVenda} - {pag.Metodo?.ToUpper()} (À Vista)",
                    ValorOriginal = pag.Valor ?? 0m,
                    ValorPago = pag.Valor ?? 0m,
                    DataVencimento = DateTime.UtcNow,
                    DataPagamento = DateTime.UtcNow,
                    Status = StatusConta.Paga
                });
            }
        }

        // Processar Trocas -> Entrar no Estoque
        foreach (var troca in dto.Trocas)
        {
            var veiculoTroca = new Veiculo
            {
                Id = Guid.NewGuid(),
                Marca = troca.Marca ?? "",
                Modelo = troca.Modelo ?? "",
                Versao = troca.Versao ?? "",
                AnoFabricacao = (short)(troca.AnoFabricacao ?? DateTime.UtcNow.Year),
                AnoModelo = (short)(troca.AnoModelo ?? DateTime.UtcNow.Year),
                Placa = troca.Placa ?? "",
                ValorCompra = troca.ValorAvaliacao ?? 0m,
                Status = 1, // 1 = Em Avaliação / Disponivel
                Observacoes = $"Veículo entrou como troca na venda {novaVenda.NumeroVenda}"
            };
            _context.Veiculos.Add(veiculoTroca);
        }

        await _context.SaveChangesAsync();
        dto.Id = novaVenda.Id;
        dto.NumeroVenda = novaVenda.NumeroVenda;
        dto.Status = (int)novaVenda.Status;
        return Ok(dto);
    }

    [HttpPost("{id}/cancelar")]
    public async Task<IActionResult> Cancelar(Guid id)
    {
        var venda = await _context.Vendas
            .Include(v => v.Veiculos)
                .ThenInclude(vv => vv.Veiculo)
            .FirstOrDefaultAsync(v => v.Id == id);

        if (venda == null) return NotFound("Venda não encontrada.");

        venda.Status = StatusVenda.Cancelada;

        // Voltar veículos para estoque
        foreach (var vv in venda.Veiculos)
        {
            vv.Veiculo.Status = 4; // 4 = Disponivel
        }

        // Cancelar as contas a receber geradas por essa venda
        var contas = await _context.ContasReceber.Where(c => c.VendaId == id).ToListAsync();
        foreach (var c in contas)
        {
            c.Status = StatusConta.Cancelada;
        }

        await _context.SaveChangesAsync();
        return Ok();
    }
}
