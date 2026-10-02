using System;
using MotorsXySystem.Domain.Comum;

namespace MotorsXySystem.Domain.Entidades.Veiculos;

public class VeiculoAcessorio : EntidadeTenant
{
    public Guid VeiculoId { get; set; }
    
    /// <summary>
    /// Ex: Capacete, Jaqueta, Baú, Tapetes, etc.
    /// </summary>
    public string Nome { get; set; } = string.Empty;     
    public string? Descricao { get; set; }
    public decimal? Valor { get; set; }
    
    /// <summary>
    /// Se foi vendido/incluso junto com o veículo.
    /// </summary>
    public bool Incluso { get; set; } = false;            
    
    public virtual Veiculo Veiculo { get; set; } = null!;
}
