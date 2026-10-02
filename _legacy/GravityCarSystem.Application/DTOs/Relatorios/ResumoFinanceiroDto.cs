using System;

namespace GravityCarSystem.Application.DTOs.Relatorios;

public class ResumoFinanceiroDto
{
    public decimal TotalEntradasVendas { get; set; }
    public decimal TotalSaidasContasPagar { get; set; }
    public decimal TotalSaidasComprasVeiculos { get; set; }
    public decimal SaldoLiquido { get; set; } // Entradas - Saidas
}
