using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using GravityCarSystem.Application.DTOs.Negocio;
using GravityCarSystem.Application.Interfaces;
using GravityCarSystem.Domain.Entities.Negocio;
using GravityCarSystem.Domain.Entities.Veiculos;
using GravityCarSystem.Domain.Enums;

namespace GravityCarSystem.Application.Services.Negocio;

public class VendaService : IVendaService
{
    private readonly IAppDbContext _context;

    public VendaService(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<VendaDto> RealizarVendaAsync(VendaDto dto)
    {
        if (dto.VeiculosIds == null || !dto.VeiculosIds.Any())
            throw new ArgumentException("A venda deve conter pelo menos um veículo.");

        var cliente = await _context.Clientes.FindAsync(dto.ClienteId);
        if (cliente == null)
            throw new KeyNotFoundException("Cliente não encontrado.");

        decimal valorTotalBruto = 0;
        var vendaVeiculos = new List<VendaVeiculo>();

        foreach (var veiculoId in dto.VeiculosIds)
        {
            var veiculo = await _context.Veiculos.FindAsync(veiculoId);
            if (veiculo == null)
                throw new KeyNotFoundException($"Veículo com ID {veiculoId} não encontrado.");

            if (veiculo.Status != StatusVeiculo.Disponivel)
                throw new InvalidOperationException($"O veículo {veiculo.Placa ?? veiculo.Modelo} não está disponível para venda.");

            // Calcula preço de venda ou lança erro se não tiver
            var valorVenda = veiculo.ValorVenda ?? 0;
            if (valorVenda <= 0)
                throw new InvalidOperationException($"O veículo {veiculo.Placa ?? veiculo.Modelo} não possui um Valor de Venda definido.");

            valorTotalBruto += valorVenda;
            
            // Marca o veículo como vendido
            veiculo.Status = StatusVeiculo.Vendido;
            veiculo.DataVenda = DateTime.Now;

            vendaVeiculos.Add(new VendaVeiculo
            {
                VeiculoId = veiculoId,
                ValorVenda = valorVenda
            });
        }

        var venda = new Venda
        {
            ClienteId = dto.ClienteId,
            UsuarioId = dto.UsuarioId,
            NumeroVenda = dto.NumeroVenda ?? $"VD-{DateTime.Now:yyyyMMddHHmmss}",
            DataVenda = dto.DataVenda == default ? DateTime.Now : dto.DataVenda,
            ValorBruto = valorTotalBruto,
            Desconto = dto.Desconto,
            ValorLiquido = valorTotalBruto - dto.Desconto,
            Status = StatusVenda.Concluida,
            Observacoes = dto.Observacoes,
            Veiculos = vendaVeiculos
        };

        // Validação estrita: Total dos pagamentos + Trocas deve bater com o ValorLíquido
        decimal totalTrocas = dto.Trocas.Sum(t => t.ValorAvaliacao);
        decimal totalPagamentos = dto.Pagamentos.Sum(p => p.Valor);
        decimal totalGeral = totalTrocas + totalPagamentos;

        if (totalGeral != venda.ValorLiquido)
            throw new InvalidOperationException($"O total dos pagamentos (Troca: {totalTrocas:C} + Outros: {totalPagamentos:C}) não confere com o valor da venda ({venda.ValorLiquido:C}). Diferença de {venda.ValorLiquido - totalGeral:C}.");

        // Lidar com Veículos na Troca
        foreach (var trocaDto in dto.Trocas)
        {
            var veiculoTroca = new Veiculo
            {
                Marca = trocaDto.Marca,
                Modelo = trocaDto.Modelo,
                Versao = trocaDto.Versao,
                AnoFabricacao = trocaDto.AnoFabricacao,
                AnoModelo = trocaDto.AnoModelo,
                Placa = trocaDto.Placa,
                ValorCompra = trocaDto.ValorAvaliacao,
                Status = StatusVeiculo.EmPreparacao, // Conforme pedido do usuário
                DataEntrada = DateTime.Now
            };
            
            _context.Veiculos.Add(veiculoTroca);
            
            venda.Trocas.Add(new VendaTroca
            {
                ClienteId = dto.ClienteId,
                Veiculo = veiculoTroca,
                ValorAvaliacao = trocaDto.ValorAvaliacao,
                ValorAtribuido = trocaDto.ValorAvaliacao
            });
        }

        // Lidar com Pagamentos (Financiamento, Pix, etc)
        foreach (var pagDto in dto.Pagamentos)
        {
            var pagamento = new VendaPagamento
            {
                TipoPagamento = pagDto.TipoPagamento,
                Valor = pagDto.Valor,
                BancoFinanciamento = pagDto.BancoFinanciamento,
                Parcelas = pagDto.Parcelas,
                ValorParcela = pagDto.ValorParcela,
                TaxaJuros = pagDto.TaxaJuros,
                DataVencimento = DateTime.Now
            };
            venda.Pagamentos.Add(pagamento);

            // Integração com Fase 5 (Financeiro): Se for cheque, lança na custódia
            if (pagDto.TipoPagamento == TipoPagamento.Cheque)
            {
                var cheque = new Cheque
                {
                    ClienteId = dto.ClienteId,
                    VendaPagamento = pagamento,
                    Valor = pagDto.Valor,
                    Status = StatusCheque.Recebido,
                    DataEmissao = DateTime.Now,
                    DataBomPara = DateTime.Now.AddDays(30), // Default bom para 30 dias se n informado
                    Observacao = $"Cheque oriundo da Venda {venda.NumeroVenda}"
                };
                _context.Cheques.Add(cheque);
            }

            // Gerar Conta a Receber correspondente ao pagamento
            var contaReceber = new GravityCarSystem.Domain.Entities.Financeiro.ContaReceber
            {
                ClienteId = dto.ClienteId,
                Venda = venda, 
                Descricao = $"Venda {venda.NumeroVenda} - {pagDto.TipoPagamento}",
                ValorOriginal = pagDto.Valor,
                Saldo = pagDto.Valor,
                ValorPago = 0,
                DataEmissao = DateTime.Now,
                DataVencimento = DateTime.Now.AddDays(pagDto.TipoPagamento == TipoPagamento.Financiamento ? 5 : 0), 
                Status = StatusConta.Aberto
            };
            _context.ContasReceber.Add(contaReceber);
        }

        _context.Vendas.Add(venda);
        
        await _context.SaveChangesAsync();

        dto.Id = venda.Id;
        dto.ValorBruto = venda.ValorBruto;
        dto.ValorLiquido = venda.ValorLiquido;
        dto.Status = venda.Status;
        dto.NumeroVenda = venda.NumeroVenda;

        return dto;
    }

    public async Task CancelarVendaAsync(Guid vendaId)
    {
        var venda = await _context.Vendas
            .Include(v => v.Veiculos)
            .ThenInclude(vv => vv.Veiculo)
            .FirstOrDefaultAsync(v => v.Id == vendaId);

        if (venda == null)
            throw new KeyNotFoundException("Venda não encontrada.");

        if (venda.Status == StatusVenda.Cancelada)
            throw new InvalidOperationException("A venda já está cancelada.");

        // Voltar status dos veículos para Disponível
        foreach (var vendaVeiculo in venda.Veiculos)
        {
            if (vendaVeiculo.Veiculo != null)
            {
                vendaVeiculo.Veiculo.Status = StatusVeiculo.Disponivel;
                vendaVeiculo.Veiculo.DataVenda = null;
            }
        }

        venda.Status = StatusVenda.Cancelada;
        
        // INTERLIGAÇÃO (Fase 5 -> 6): Estorno de Contas a Receber
        var contasReceber = await _context.ContasReceber.Where(c => c.VendaId == vendaId).ToListAsync();
        foreach (var conta in contasReceber)
        {
            conta.Status = StatusConta.Cancelado;
        }

        await _context.SaveChangesAsync();
    }

    public async Task<VendaDto?> ObterPorIdAsync(Guid id)
    {
        var venda = await _context.Vendas
            .Include(v => v.Veiculos)
            .AsNoTracking()
            .FirstOrDefaultAsync(v => v.Id == id);

        if (venda == null) return null;

        return new VendaDto
        {
            Id = venda.Id,
            ClienteId = venda.ClienteId,
            UsuarioId = venda.UsuarioId,
            NumeroVenda = venda.NumeroVenda,
            DataVenda = venda.DataVenda,
            ValorBruto = venda.ValorBruto,
            Desconto = venda.Desconto,
            ValorLiquido = venda.ValorLiquido,
            Status = venda.Status,
            Observacoes = venda.Observacoes,
            VeiculosIds = venda.Veiculos.Select(v => v.VeiculoId).ToList()
        };
    }

    public async Task<IEnumerable<VendaDto>> ObterTodasAsync()
    {
        return await _context.Vendas
            .Include(v => v.Veiculos)
            .AsNoTracking()
            .Select(venda => new VendaDto
            {
                Id = venda.Id,
                ClienteId = venda.ClienteId,
                UsuarioId = venda.UsuarioId,
                NumeroVenda = venda.NumeroVenda,
                DataVenda = venda.DataVenda,
                ValorBruto = venda.ValorBruto,
                Desconto = venda.Desconto,
                ValorLiquido = venda.ValorLiquido,
                Status = venda.Status,
                Observacoes = venda.Observacoes,
                VeiculosIds = venda.Veiculos.Select(v => v.VeiculoId).ToList()
            })
            .ToListAsync();
    }
}
