using System;
using MotorsXySystem.Domain.Comum;
using MotorsXySystem.Domain.Entidades.Cadastros;
using MotorsXySystem.Domain.Entidades.Negocio;
using MotorsXySystem.Domain.Enums;

namespace MotorsXySystem.Domain.Entidades.Financeiro;

public class ContaReceber : EntidadeTenant
{
    public Guid ClienteId { get; set; }
    public Guid? VendaId { get; set; }
    
    public string Descricao { get; set; } = string.Empty;
    public decimal ValorOriginal { get; set; }
    public decimal? ValorPago { get; set; }
    
    public DateTime DataVencimento { get; set; }
    public DateTime? DataPagamento { get; set; }
    
    public StatusConta Status { get; set; } = StatusConta.Aberta;
    public TipoPagamento? TipoPagamento { get; set; }
    
    public virtual Cliente Cliente { get; set; } = null!;
    public virtual Venda? Venda { get; set; }
}
