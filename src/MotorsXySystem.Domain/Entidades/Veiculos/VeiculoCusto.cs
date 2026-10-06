using System;
using MotorsXySystem.Domain.Comum;

namespace MotorsXySystem.Domain.Entidades.Veiculos;

public class VeiculoCusto : EntidadeTenant
{
    public Guid VeiculoId { get; set; }
    public string TipoCusto { get; set; } = "Geral";
    public string Descricao { get; set; } = string.Empty;
    public decimal Valor { get; set; }
    public DateTime DataCusto { get; set; } = DateTime.UtcNow;
    public string? Responsavel { get; set; }

    public virtual Veiculo Veiculo { get; set; } = null!;
}
