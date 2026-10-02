using System;

namespace MotorsXySystem.Application.DTOs;

public class AuthResponse
{
    public string Token { get; set; } = string.Empty;
    public Guid UsuarioId { get; set; }
    public Guid EmpresaId { get; set; }
    public string Nome { get; set; } = string.Empty;
}
