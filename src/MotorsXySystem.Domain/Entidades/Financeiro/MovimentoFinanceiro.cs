using System;
using MotorsXySystem.Domain.Comum;
using MotorsXySystem.Domain.Enums;

namespace MotorsXySystem.Domain.Entidades.Financeiro;

public enum TipoMovimento
{
    Entrada = 1,
    Saida = 2
}

public class MovimentoFinanceiro : EntidadeTenant
{
    public string Descricao { get; set; } = string.Empty;
    public decimal Valor { get; set; }
    public DateTime DataHora { get; set; } = DateTime.UtcNow;
    public TipoMovimento Tipo { get; set; }
    
    public Guid? ContaReceberId { get; set; }
    public Guid? ContaPagarId { get; set; }
    
    public virtual ContaReceber? ContaReceber { get; set; }
    public virtual ContaPagar? ContaPagar { get; set; }
}
