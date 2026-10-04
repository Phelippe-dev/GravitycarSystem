using System;
using MotorsXySystem.Domain.Comum;

namespace MotorsXySystem.Domain.Entidades.Acesso;

public class Usuario : EntidadeTenant
{
    public string Nome { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string SenhaHash { get; set; } = string.Empty;
    
    public Guid PerfilId { get; set; }
    
    /// <summary>
    /// Código de liberação de 6 dígitos fornecido ao cliente para acesso/ativação.
    /// </summary>
    public string? CodigoLiberacao { get; set; }
    public DateTime? DataExpiracaoCodigoLiberacao { get; set; }
    
    public virtual Perfil Perfil { get; set; } = null!;
}
