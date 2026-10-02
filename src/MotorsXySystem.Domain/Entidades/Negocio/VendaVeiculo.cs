using System;
using MotorsXySystem.Domain.Comum;
using MotorsXySystem.Domain.Entidades.Veiculos;

namespace MotorsXySystem.Domain.Entidades.Negocio;

public class VendaVeiculo : EntidadeTenant
{
    public Guid VendaId { get; set; }
    public Guid VeiculoId { get; set; }
    
    public decimal ValorVenda { get; set; }
    
    public virtual Venda Venda { get; set; } = null!;
    public virtual Veiculo Veiculo { get; set; } = null!;
}
