namespace MotorsXySystem.Application.DTOs;

public class LoginTokenRequest
{
    /// <summary>
    /// E-mail corporativo opcional para desambiguação de conta.
    /// </summary>
    public string? Email { get; set; }

    /// <summary>
    /// Código numérico de liberação de 6 dígitos fornecido ao cliente.
    /// </summary>
    public string Codigo { get; set; } = string.Empty;
}
