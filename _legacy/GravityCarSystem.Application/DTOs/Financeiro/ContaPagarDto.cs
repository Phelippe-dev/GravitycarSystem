using System;
using GravityCarSystem.Domain.Enums;

namespace GravityCarSystem.Application.DTOs.Financeiro;

public class ContaPagarDto
{
    public Guid Id { get; set; }
    public Guid FornecedorId { get; set; }
    public string? FornecedorNome { get; set; }
    public Guid CategoriaId { get; set; }
    public string? CategoriaNome { get; set; }
    public string Descricao { get; set; } = string.Empty;
    public decimal ValorOriginal { get; set; }
    public decimal ValorPago { get; set; }
    public decimal Saldo { get; set; }
    public DateTime DataEmissao { get; set; }
    public DateTime DataVencimento { get; set; }
    public DateTime? DataPagamento { get; set; }
    public StatusConta Status { get; set; }
}
