using System;
using MotorsXySystem.Domain.Comum;
using MotorsXySystem.Domain.Enums;

namespace MotorsXySystem.Domain.Entidades.Financeiro;

public class ContaPagar : EntidadeTenant
{
    public string Descricao { get; set; } = string.Empty;
    public decimal ValorOriginal { get; set; }
    public decimal? ValorPago { get; set; }
    
    public DateTime DataVencimento { get; set; }
    public DateTime? DataPagamento { get; set; }
    
    public StatusConta Status { get; set; } = StatusConta.Aberta;
    public TipoPagamento? TipoPagamento { get; set; }
}
