using System;
using MotorsXySystem.Domain.Comum;

namespace MotorsXySystem.Domain.Entidades.Veiculos;

public class VeiculoInspecao : EntidadeTenant
{
    public Guid VeiculoId { get; set; }
    
    /// <summary>
    /// Ex: "Freios", "Pneus", "Faróis", "Relação"
    /// </summary>
    public string Item { get; set; } = string.Empty;      
    public bool Aprovado { get; set; } = false;
    public string? Observacao { get; set; }
    public DateTime DataInspecao { get; set; }
    public string? InspecionadoPor { get; set; }           
    
    public virtual Veiculo Veiculo { get; set; } = null!;
}
