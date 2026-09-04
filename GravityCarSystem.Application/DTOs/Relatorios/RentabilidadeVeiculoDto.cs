using System;

namespace GravityCarSystem.Application.DTOs.Relatorios;

public class RentabilidadeVeiculoDto
{
    public Guid VeiculoId { get; set; }
    public string VeiculoDescricao { get; set; } = string.Empty; // Marca, Modelo, Placa
    public decimal ValorCompra { get; set; }
    public decimal ValorVenda { get; set; }
    public decimal TotalCustosAdicionais { get; set; }
    public decimal DescontoNaVenda { get; set; }
    public decimal MargemLucroLiquido { get; set; } // ValorVenda - Desconto - ValorCompra - Custos
    public decimal PercentualMargem { get; set; } // MargemLucroLiquido / (ValorVenda - Desconto)
    public DateTime? DataVenda { get; set; }
}
