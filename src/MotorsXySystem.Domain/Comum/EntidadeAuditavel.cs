using System;

namespace MotorsXySystem.Domain.Comum;

public abstract class EntidadeAuditavel : Entidade
{
    public DateTime DataCriacao { get; set; } = DateTime.UtcNow;
    public string? CriadoPor { get; set; }
    public DateTime? DataAtualizacao { get; set; }
    public string? AtualizadoPor { get; set; }
    public bool Ativo { get; set; } = true;
}
