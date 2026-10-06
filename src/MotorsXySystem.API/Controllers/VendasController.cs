using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MotorsXySystem.Application.DTOs.Vendas;
using MotorsXySystem.Domain.Entidades.Auditoria;
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
    private static readonly SemaphoreSlim _semaphore = new(1, 1);
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

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Obter(Guid id)
    {
        var v = await _context.Vendas
            .Include(v => v.Cliente)
            .Include(v => v.Veiculos)
                .ThenInclude(vv => vv.Veiculo)
            .FirstOrDefaultAsync(x => x.Id == id);

        if (v == null) return NotFound(new { Erro = "Venda não encontrada." });

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
        // 1. Validação de Cliente
        if (dto.ClienteId == Guid.Empty || !await _context.Clientes.AnyAsync(c => c.Id == dto.ClienteId))
        {
            return BadRequest(new { Erro = "Cliente obrigatório e deve existir no sistema." });
        }

        // 2. Validação de Veículos selecionados
        if (dto.VeiculosIds == null || !dto.VeiculosIds.Any())
        {
            return BadRequest(new { Erro = "A venda precisa ter pelo menos um veículo." });
        }

        // 3. Validação de formas de pagamento / trocas
        bool temPagamentos = dto.Pagamentos != null && dto.Pagamentos.Any();
        bool temTrocas = dto.Trocas != null && dto.Trocas.Any();
        if (!temPagamentos && !temTrocas)
        {
            return BadRequest(new { Erro = "A venda deve conter ao menos uma forma de pagamento ou veículo de troca." });
        }

        await _semaphore.WaitAsync();
        try
        {
            // Buscar veículos sendo vendidos com status atualizado
            var veiculos = await _context.Veiculos
                .Where(v => dto.VeiculosIds.Contains(v.Id))
                .ToListAsync();

            if (veiculos.Count != dto.VeiculosIds.Count)
            {
                return BadRequest(new { Erro = "Um ou mais veículos selecionados não foram encontrados." });
            }

            // VEN-06: Bloquear veículos já vendidos (6) ou reservados (5)
            if (veiculos.Any(v => v.Status != 1))
            {
                return BadRequest(new { Erro = "Um ou mais veículos selecionados não estão disponíveis para venda (já vendidos ou reservados)." });
            }

            var totalVeiculos = veiculos.Sum(v => v.ValorVenda ?? 0m);

            // VEN-04: Validação de Alçada de Desconto (> 5% requer aprovação gerencial)
            if (dto.Desconto > 0)
            {
                var percentualDesconto = totalVeiculos > 0 ? (dto.Desconto / totalVeiculos) * 100m : 0m;
                if (percentualDesconto > 5.0m)
                {
                    return BadRequest(new { Erro = $"Desconto solicitado de R$ {dto.Desconto:N2} ({percentualDesconto:F1}%) excede o limite de alçada permitido (5%). Requer aprovação de Gerente Comercial ou Administrador." });
                }
            }

            var totalFinal = totalVeiculos - dto.Desconto;

            // VEN-02: Validação Matemática Rigorosa (Entrada + Troca + Financiamento = Total da Venda)
            decimal totalPagamentos = dto.Pagamentos?.Sum(p => p.Valor ?? 0m) ?? 0m;
            decimal totalTrocas = dto.Trocas?.Sum(t => t.ValorAvaliacao ?? 0m) ?? 0m;
            decimal totalRecebido = totalPagamentos + totalTrocas;

            if (temTrocas || (dto.Pagamentos != null && dto.Pagamentos.Count > 1))
            {
                if (Math.Abs(totalRecebido - totalFinal) > 0.01m)
                {
                    return BadRequest(new { Erro = $"Divergência financeira detectada: Total de pagamentos e trocas (R$ {totalRecebido:N2}) diverge do valor final da venda (R$ {totalFinal:N2})." });
                }
            }

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
                veic.DataAtualizacao = DateTime.UtcNow;
            }

            _context.Vendas.Add(novaVenda);

            // Processar Pagamentos -> Gerar Contas a Receber e Movimentos Financeiros
            if (dto.Pagamentos != null)
            {
                foreach (var pag in dto.Pagamentos)
                {
                    var metodo = pag.Metodo?.ToLowerInvariant() ?? "";
                    if (metodo == "promissoria" || metodo == "financeira" || metodo == "cartao" || metodo == "cheque")
                    {
                        int numParcelas = pag.Parcelas ?? 1;
                        decimal totalMetodo = pag.Valor ?? 0m;
                        decimal saldoRestante = totalMetodo;

                        // FIN-06: Divisão de parcelas com ajuste de centavos
                        for (int i = 1; i <= numParcelas; i++)
                        {
                            decimal valorParcela = Math.Round(saldoRestante / (numParcelas - i + 1), 2, MidpointRounding.AwayFromZero);
                            saldoRestante -= valorParcela;

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
                    else if (metodo == "dinheiro" || metodo == "pix" || metodo == "transferencia")
                    {
                        // Pagamento à vista: ContaReceber Paga + MovimentoFinanceiro no Caixa (VEN-01)
                        var valorVista = pag.Valor ?? 0m;
                        var crVista = new ContaReceber
                        {
                            Id = Guid.NewGuid(),
                            ClienteId = dto.ClienteId,
                            VendaId = novaVenda.Id,
                            Descricao = $"Venda {novaVenda.NumeroVenda} - {pag.Metodo?.ToUpper()} (À Vista)",
                            ValorOriginal = valorVista,
                            ValorPago = valorVista,
                            DataVencimento = DateTime.UtcNow,
                            DataPagamento = DateTime.UtcNow,
                            Status = StatusConta.Paga
                        };

                        _context.ContasReceber.Add(crVista);

                        _context.MovimentosFinanceiros.Add(new MovimentoFinanceiro
                        {
                            Id = Guid.NewGuid(),
                            ContaReceberId = crVista.Id,
                            Tipo = TipoMovimento.Entrada,
                            Descricao = crVista.Descricao,
                            Valor = valorVista,
                            DataHora = DateTime.UtcNow
                        });
                    }
                }
            }

            // Processar Trocas -> Entrada no Estoque como seminovo
            if (dto.Trocas != null)
            {
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
                        Placa = troca.Placa?.ToUpper().Replace("-", "").Trim() ?? "",
                        ValorCompra = troca.ValorAvaliacao ?? 0m,
                        ValorVenda = (troca.ValorAvaliacao ?? 0m) * 1.2m,
                        Status = 1, // 1 = Disponível
                        Ativo = true,
                        DataCriacao = DateTime.UtcNow,
                        Observacoes = $"Veículo entrou como troca na venda {novaVenda.NumeroVenda}"
                    };
                    _context.Veiculos.Add(veiculoTroca);
                }
            }

            // Registro de Auditoria
            _context.AuditoriaLogs.Add(new AuditoriaLog
            {
                EmpresaId = novaVenda.EmpresaId,
                Acao = "CriarVenda",
                EntidadeNome = "Venda",
                EntidadeId = novaVenda.Id,
                UsuarioNome = User?.Identity?.Name,
                ValorNovo = totalFinal.ToString("F2"),
                Detalhes = $"Venda {novaVenda.NumeroVenda} concluída. Total: R$ {totalFinal:N2}, Desconto: R$ {dto.Desconto:N2}"
            });

            await _context.SaveChangesAsync();

            dto.Id = novaVenda.Id;
            dto.NumeroVenda = novaVenda.NumeroVenda;
            dto.Status = (int)novaVenda.Status;
            dto.ValorLiquido = novaVenda.ValorTotalFinal;

            return Ok(dto);
        }
        finally
        {
            _semaphore.Release();
        }
    }

    [HttpPost("{id:guid}/cancelar")]
    public async Task<IActionResult> Cancelar(Guid id)
    {
        var venda = await _context.Vendas
            .Include(v => v.Veiculos)
                .ThenInclude(vv => vv.Veiculo)
            .FirstOrDefaultAsync(v => v.Id == id);

        if (venda == null) return NotFound("Venda não encontrada.");

        venda.Status = StatusVenda.Cancelada;

        // Voltar veículos vendidos para estoque com status 1 (Disponível)
        foreach (var vv in venda.Veiculos)
        {
            if (vv.Veiculo != null)
            {
                vv.Veiculo.Status = 1; // 1 = Disponível
                vv.Veiculo.DataAtualizacao = DateTime.UtcNow;
            }
        }

        // EST-06: Estornar veículos que entraram como troca nesta venda
        var veiculosTroca = await _context.Veiculos
            .Where(v => v.Observacoes.Contains(venda.NumeroVenda))
            .ToListAsync();

        foreach (var vt in veiculosTroca)
        {
            vt.Ativo = false;
            vt.Status = 0; // Inativo / Devolvido
            vt.DataAtualizacao = DateTime.UtcNow;
        }

        // Cancelar as contas a receber geradas por essa venda
        var contas = await _context.ContasReceber.Where(c => c.VendaId == id).ToListAsync();
        foreach (var c in contas)
        {
            c.Status = StatusConta.Cancelada;
        }

        // Auditoria de cancelamento
        _context.AuditoriaLogs.Add(new AuditoriaLog
        {
            EmpresaId = venda.EmpresaId,
            Acao = "CancelarVenda",
            EntidadeNome = "Venda",
            EntidadeId = id,
            UsuarioNome = User?.Identity?.Name,
            Detalhes = $"Venda {venda.NumeroVenda} cancelada. Veículos estornados para o estoque."
        });

        await _context.SaveChangesAsync();
        return Ok();
    }

    [HttpPost("{id:guid}/aprovar-desconto")]
    [Authorize(Roles = "Administrador,Gerente Comercial,SuperAdmin")]
    public async Task<IActionResult> AprovarDesconto(Guid id)
    {
        var venda = await _context.Vendas.FindAsync(id);
        if (venda == null) return NotFound(new { Erro = "Venda não encontrada." });

        venda.Status = StatusVenda.Concluida;

        _context.AuditoriaLogs.Add(new AuditoriaLog
        {
            EmpresaId = venda.EmpresaId,
            Acao = "AprovarDesconto",
            EntidadeNome = "Venda",
            EntidadeId = id,
            UsuarioNome = User?.Identity?.Name,
            Detalhes = $"Desconto da venda {venda.NumeroVenda} aprovado pelo gestor."
        });

        await _context.SaveChangesAsync();
        return Ok(new { Mensagem = "Desconto aprovado com sucesso." });
    }
}
