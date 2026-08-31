using System;
using GravityCarSystem.Domain.Common;
using GravityCarSystem.Domain.Enums;

namespace GravityCarSystem.Domain.Entities.Negocio;

public class VendaPagamento : Entity
{
    public Guid VendaId { get; set; }
    public virtual Venda? Venda { get; set; }
    
    public TipoPagamento TipoPagamento { get; set; }
    public decimal Valor { get; set; }
    public DateTime? DataVencimento { get; set; }
    public byte Status { get; set; }
    public string? Observacao { get; set; }

    // Campos adicionais para Financiamento
    public string? BancoFinanciamento { get; set; }
    public int? Parcelas { get; set; }
    public decimal? ValorParcela { get; set; }
    public decimal? TaxaJuros { get; set; }
}
