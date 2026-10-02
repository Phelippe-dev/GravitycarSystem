using System.Collections.Generic;
using MotorsXySystem.Domain.Comum;

namespace MotorsXySystem.Domain.Entidades.Acesso;

public class Perfil : EntidadeTenant
{
    public string Nome { get; set; } = string.Empty; // Ex: Admin, Vendedor
    public string? Descricao { get; set; }
    
    public virtual ICollection<Usuario> Usuarios { get; set; } = new List<Usuario>();
}
