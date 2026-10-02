using System;
using GravityCarSystem.Domain.Enums;

namespace GravityCarSystem.Application.DTOs.Financeiro;

public class ContaReceberDto
{
    public Guid Id { get; set; }
    public Guid ClienteId { get; set; }
    public string? ClienteNome { get; set; }
    public Guid? VendaId { get; set; }
    public string Descricao { get; set; } = string.Empty;
    public decimal ValorOriginal { get; set; }
    public decimal ValorPago { get; set; }
    public decimal Saldo { get; set; }
    public DateTime DataEmissao { get; set; }
    public DateTime DataVencimento { get; set; }
    public DateTime? DataPagamento { get; set; }
    public StatusConta Status { get; set; }
}
