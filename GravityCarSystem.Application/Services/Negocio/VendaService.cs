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

        var defaultTenantId = Guid.Parse("00000000-0000-0000-0000-000000000001");
        var usuarioId = dto.UsuarioId;
        if (usuarioId == Guid.Empty)
        {
            var fallbackUser = await _context.Usuarios.IgnoreQueryFilters().FirstOrDefaultAsync(u => u.Ativo);
            if (fallbackUser != null)
            {
                usuarioId = fallbackUser.Id;
            }
        }

        var venda = new Venda
        {
            Id = Guid.NewGuid(),
            EmpresaId = defaultTenantId,
            ClienteId = dto.ClienteId,
            UsuarioId = usuarioId,
            NumeroVenda = dto.NumeroVenda ?? $"VD-{DateTime.UtcNow:yyyyMMddHHmmss}",
            DataVenda = dto.DataVenda == default ? DateTime.UtcNow : dto.DataVenda,
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
            Veiculo? veiculoTroca = null;
            if (!string.IsNullOrWhiteSpace(trocaDto.Placa))
            {
                veiculoTroca = await _context.Veiculos.FirstOrDefaultAsync(v => v.Placa == trocaDto.Placa);
            }

            if (veiculoTroca != null)
            {
                veiculoTroca.Status = StatusVeiculo.EmPreparacao;
                veiculoTroca.ValorCompra = trocaDto.ValorAvaliacao;
                veiculoTroca.DataEntrada ??= DateTime.UtcNow;
                if (!string.IsNullOrWhiteSpace(trocaDto.Marca)) veiculoTroca.Marca = trocaDto.Marca;
                if (!string.IsNullOrWhiteSpace(trocaDto.Modelo)) veiculoTroca.Modelo = trocaDto.Modelo;
            }
            else
            {
                veiculoTroca = new Veiculo
                {
                    Id = Guid.NewGuid(),
                    EmpresaId = defaultTenantId,
                    Marca = !string.IsNullOrWhiteSpace(trocaDto.Marca) ? trocaDto.Marca : "Não informada",
                    Modelo = !string.IsNullOrWhiteSpace(trocaDto.Modelo) ? trocaDto.Modelo : "Não informado",
                    AnoFabricacao = trocaDto.AnoFabricacao > 0 ? trocaDto.AnoFabricacao : (short)DateTime.UtcNow.Year,
                    AnoModelo = trocaDto.AnoModelo > 0 ? trocaDto.AnoModelo : (short)DateTime.UtcNow.Year,
                    Placa = trocaDto.Placa,
                    ValorCompra = trocaDto.ValorAvaliacao,
                    ValorVenda = trocaDto.ValorAvaliacao,
                    Status = StatusVeiculo.EmPreparacao,
                    DataEntrada = DateTime.UtcNow
                };
                _context.Veiculos.Add(veiculoTroca);
            }
            
            venda.Trocas.Add(new VendaTroca
            {
                Id = Guid.NewGuid(),
                ClienteId = dto.ClienteId,
                Veiculo = veiculoTroca,
                ValorAvaliacao = trocaDto.ValorAvaliacao,
                ValorAtribuido = trocaDto.ValorAvaliacao
            });
        }

        var contaPadrao = await _context.ContasFinanceiras.FirstOrDefaultAsync(c => c.Ativa);
        if (contaPadrao == null)
        {
            contaPadrao = new GravityCarSystem.Domain.Entities.Financeiro.ContaFinanceira
            {
                Id = Guid.NewGuid(),
                EmpresaId = defaultTenantId,
                Nome = "Caixa Geral / Principal",
                Tipo = 1,
                SaldoInicial = 0,
                Ativa = true,
                DataCadastro = DateTime.UtcNow
            };
            _context.ContasFinanceiras.Add(contaPadrao);
        }

        var categoriaReceita = await _context.CategoriasFinanceiras.FirstOrDefaultAsync(c => c.Tipo == 1);
        if (categoriaReceita == null)
        {
            categoriaReceita = new GravityCarSystem.Domain.Entities.Financeiro.CategoriaFinanceira
            {
                Id = Guid.NewGuid(),
                EmpresaId = defaultTenantId,
                Nome = "Vendas de Veículos",
                Tipo = 1,
                Ativa = true,
                DataCadastro = DateTime.UtcNow
            };
            _context.CategoriasFinanceiras.Add(categoriaReceita);
        }

        // Lidar com Pagamentos (Financiamento, Pix, etc)
        foreach (var pagDto in dto.Pagamentos)
        {
            var pagamento = new VendaPagamento
            {
                Id = Guid.NewGuid(),
                TipoPagamento = pagDto.TipoPagamento,
                Valor = pagDto.Valor,
                BancoFinanciamento = pagDto.BancoFinanciamento,
                Parcelas = pagDto.Parcelas,
                ValorParcela = pagDto.ValorParcela,
                TaxaJuros = pagDto.TaxaJuros,
                DataVencimento = DateTime.UtcNow
            };
            venda.Pagamentos.Add(pagamento);

            // Integração com Fase 5 (Financeiro): Se for cheque, lança na custódia
            if (pagDto.TipoPagamento == TipoPagamento.Cheque)
            {
                var dataBomPara = pagDto.DataBomPara ?? DateTime.UtcNow.AddDays(30);
                var cheque = new Cheque
                {
                    Id = Guid.NewGuid(),
                    EmpresaId = defaultTenantId,
                    ClienteId = dto.ClienteId,
                    VendaPagamento = pagamento,
                    Valor = pagDto.Valor,
                    Banco = !string.IsNullOrWhiteSpace(pagDto.Banco) ? pagDto.Banco : "Não informado",
                    Agencia = pagDto.Agencia ?? "",
                    Conta = pagDto.Conta ?? "",
                    NumeroCheque = !string.IsNullOrWhiteSpace(pagDto.NumeroCheque) ? pagDto.NumeroCheque : $"CHQ-{DateTime.UtcNow:mmssff}",
                    DataEmissao = DateTime.UtcNow,
                    DataBomPara = dataBomPara,
                    Status = StatusCheque.Recebido,
                    Observacao = $"Venda {venda.NumeroVenda}{(string.IsNullOrWhiteSpace(pagDto.Emitente) ? "" : $" • Emitente: {pagDto.Emitente}")} • Bom Para: {dataBomPara:dd/MM/yyyy}"
                };
                _context.Cheques.Add(cheque);
            }

            // Gerar Conta a Receber correspondente ao pagamento
            bool isLiquidadoImediato = pagDto.TipoPagamento == TipoPagamento.Dinheiro 
                || pagDto.TipoPagamento == TipoPagamento.Pix 
                || pagDto.TipoPagamento == TipoPagamento.CartaoCredito 
                || pagDto.TipoPagamento == TipoPagamento.CartaoDebito 
                || pagDto.TipoPagamento == TipoPagamento.Transferencia;
            var dataVenc = pagDto.TipoPagamento == TipoPagamento.Cheque && pagDto.DataBomPara.HasValue
                ? pagDto.DataBomPara.Value
                : (pagDto.TipoPagamento == TipoPagamento.Financiamento ? DateTime.UtcNow.AddDays(5) : DateTime.UtcNow);

            var contaReceber = new GravityCarSystem.Domain.Entities.Financeiro.ContaReceber
            {
                Id = Guid.NewGuid(),
                EmpresaId = defaultTenantId,
                ClienteId = dto.ClienteId,
                Venda = venda, 
                Descricao = $"Venda {venda.NumeroVenda} - {pagDto.TipoPagamento}",
                ValorOriginal = pagDto.Valor,
                Saldo = isLiquidadoImediato ? 0 : pagDto.Valor,
                ValorPago = isLiquidadoImediato ? pagDto.Valor : 0,
                DataEmissao = DateTime.UtcNow,
                DataVencimento = dataVenc,
                DataPagamento = isLiquidadoImediato ? DateTime.UtcNow : null,
                Status = isLiquidadoImediato ? StatusConta.Pago : StatusConta.Aberto
            };
            _context.ContasReceber.Add(contaReceber);

            // Se for Dinheiro ou PIX, gera imediatamente o Movimento Financeiro de Entrada no Caixa
            if (isLiquidadoImediato)
            {
                var movFinanceiro = new GravityCarSystem.Domain.Entities.Financeiro.MovimentoFinanceiro
                {
                    Id = Guid.NewGuid(),
                    EmpresaId = defaultTenantId,
                    ContaFinanceira = contaPadrao,
                    Categoria = categoriaReceita,
                    Tipo = 1, // 1 = Entrada
                    Valor = pagDto.Valor,
                    DataMovimento = DateTime.UtcNow,
                    Descricao = $"Recebimento Venda {venda.NumeroVenda} - {pagDto.TipoPagamento}",
                    Venda = venda,
                    ContaReceber = contaReceber,
                    UsuarioId = dto.UsuarioId
                };
                _context.MovimentosFinanceiros.Add(movFinanceiro);
            }
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
