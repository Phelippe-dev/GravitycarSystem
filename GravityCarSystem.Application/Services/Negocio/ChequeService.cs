using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using GravityCarSystem.Application.DTOs.Negocio;
using GravityCarSystem.Application.Interfaces;
using GravityCarSystem.Domain.Entities.Negocio;
using GravityCarSystem.Domain.Enums;

namespace GravityCarSystem.Application.Services.Negocio;

public class ChequeService : IChequeService
{
    private readonly IAppDbContext _context;
    private readonly ICurrentTenantService _tenantService;

    public ChequeService(IAppDbContext context, ICurrentTenantService tenantService)
    {
        _context = context;
        _tenantService = tenantService;
    }

    public async Task<ChequeDto> RegistrarChequeAsync(ChequeDto dto)
    {
        var empresaId = _tenantService.GetEmpresaId();
        var cheque = new Cheque
        {
            Id = Guid.NewGuid(),
            EmpresaId = empresaId ?? Guid.Empty,
            ClienteId = dto.ClienteId,
            VendaPagamentoId = dto.VendaPagamentoId,
            Valor = dto.Valor,
            DataEmissao = dto.DataEmissao == default ? DateTime.Now : dto.DataEmissao,
            DataBomPara = dto.DataBomPara == default ? DateTime.Now : dto.DataBomPara,
            Banco = dto.Banco,
            Agencia = dto.Agencia,
            Conta = dto.Conta,
            NumeroCheque = dto.NumeroCheque,
            Status = StatusCheque.Recebido, // Ao criar, status é sempre Recebido (ou Custódia)
            Observacao = dto.Observacao
        };

        _context.Cheques.Add(cheque);
        await _context.SaveChangesAsync();

        dto.Id = cheque.Id;
        dto.Status = cheque.Status;
        return dto;
    }

    public async Task<IEnumerable<ChequeDto>> ObterTodosAsync()
    {
        var empresaId = _tenantService.GetEmpresaId();
        var query = _context.Cheques.Include(c => c.Cliente).AsQueryable();

        if (empresaId.HasValue && empresaId.Value != Guid.Empty)
        {
            query = query.Where(c => c.EmpresaId == empresaId.Value);
        }

        var cheques = await query.OrderBy(c => c.DataBomPara).ToListAsync();

        return cheques.Select(c => new ChequeDto
        {
            Id = c.Id,
            VendaPagamentoId = c.VendaPagamentoId,
            ClienteId = c.ClienteId,
            ClienteNome = c.Cliente?.NomeRazaoSocial,
            Valor = c.Valor,
            Banco = c.Banco,
            Agencia = c.Agencia,
            Conta = c.Conta,
            NumeroCheque = c.NumeroCheque,
            DataEmissao = c.DataEmissao,
            DataBomPara = c.DataBomPara,
            Status = c.Status,
            DataDeposito = c.DataDeposito,
            DataCompensacao = c.DataCompensacao,
            Observacao = c.Observacao
        });
    }

    public async Task<ChequeDto> AlterarStatusAsync(Guid id, StatusCheque novoStatus)
    {
        var cheque = await _context.Cheques
            .FirstOrDefaultAsync(c => c.Id == id);

        if (cheque == null) throw new KeyNotFoundException("Cheque não encontrado.");

        cheque.Status = novoStatus;

        if (novoStatus == StatusCheque.Depositado)
            cheque.DataDeposito = DateTime.Now;
            
        if (novoStatus == StatusCheque.Compensado)
        {
            cheque.DataCompensacao = DateTime.Now;
            
            // Localiza a Conta a Receber correspondente a este cheque para liquidação
            var contaReceber = await _context.ContasReceber
                .FirstOrDefaultAsync(cr => cr.ClienteId == cheque.ClienteId 
                    && cr.Status == StatusConta.Aberto 
                    && cr.ValorOriginal == cheque.Valor);

            if (contaReceber != null)
            {
                contaReceber.Status = StatusConta.Pago;
                contaReceber.ValorPago = cheque.Valor;
                contaReceber.Saldo = 0;
                contaReceber.DataPagamento = DateTime.Now;
            }

            // Registra Movimento Financeiro de Entrada por compensação do cheque
            var contaPadrao = await _context.ContasFinanceiras.FirstOrDefaultAsync(c => c.Ativa);
            if (contaPadrao == null)
            {
                contaPadrao = new GravityCarSystem.Domain.Entities.Financeiro.ContaFinanceira
                {
                    Id = Guid.NewGuid(),
                    EmpresaId = cheque.EmpresaId,
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
                    EmpresaId = cheque.EmpresaId,
                    Nome = "Vendas de Veículos",
                    Tipo = 1,
                    Ativa = true,
                    DataCadastro = DateTime.UtcNow
                };
                _context.CategoriasFinanceiras.Add(categoriaReceita);
            }

            var mov = new GravityCarSystem.Domain.Entities.Financeiro.MovimentoFinanceiro
            {
                Id = Guid.NewGuid(),
                EmpresaId = cheque.EmpresaId,
                ContaFinanceira = contaPadrao,
                Categoria = categoriaReceita,
                Tipo = 1, // 1 = Entrada
                Valor = cheque.Valor,
                DataMovimento = DateTime.Now,
                Descricao = $"Compensação Cheque Nº {cheque.NumeroCheque} ({cheque.Banco})",
                ChequeId = cheque.Id,
                ContaReceberId = contaReceber?.Id
            };
            _context.MovimentosFinanceiros.Add(mov);
        }

        await _context.SaveChangesAsync();

        return new ChequeDto
        {
            Id = cheque.Id,
            Status = cheque.Status,
            Valor = cheque.Valor,
            DataCompensacao = cheque.DataCompensacao
        };
    }

    public async Task<ChequeDto> AtualizarDadosChequeAsync(Guid id, ChequeDto dto)
    {
        var cheque = await _context.Cheques
            .FirstOrDefaultAsync(c => c.Id == id);

        if (cheque == null) throw new KeyNotFoundException("Cheque não encontrado.");

        cheque.Banco = dto.Banco;
        cheque.Agencia = dto.Agencia;
        cheque.Conta = dto.Conta;
        cheque.NumeroCheque = dto.NumeroCheque;
        cheque.DataBomPara = dto.DataBomPara;

        await _context.SaveChangesAsync();
        return dto;
    }
}
