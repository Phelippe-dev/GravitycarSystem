using System;
using MotorsXySystem.Domain.Comum;

namespace MotorsXySystem.Domain.Entidades.Auditoria;

public class AuditoriaLog : EntidadeTenant
{
    public string Acao { get; set; } = string.Empty;
    public string EntidadeNome { get; set; } = string.Empty;
    public Guid? EntidadeId { get; set; }
    public Guid? UsuarioId { get; set; }
    public string? UsuarioNome { get; set; }
    public string? Detalhes { get; set; }
    public string? ValorAnterior { get; set; }
    public string? ValorNovo { get; set; }
    public DateTime DataHoraUtc { get; set; } = DateTime.UtcNow;
    public string? IpOrigem { get; set; }
}
