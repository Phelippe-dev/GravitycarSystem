using System;
using GravityCarSystem.Domain.Common;

namespace GravityCarSystem.Domain.Entities.Acesso;

public class HistoricoRecarga : TenantEntity
{
    public int QuantidadeCreditos { get; set; }
    public decimal ValorPago { get; set; }
    public string MetodoPagamento { get; set; } = string.Empty;
    public string Status { get; set; } = "APROVADO";
    public DateTime DataRecarga { get; set; } = DateTime.UtcNow;
    public string Observacao { get; set; } = string.Empty;
}
