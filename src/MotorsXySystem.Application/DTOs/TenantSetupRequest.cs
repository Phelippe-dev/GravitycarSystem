namespace MotorsXySystem.Application.DTOs;

public class TenantSetupRequest
{
    public string RazaoSocial { get; set; } = string.Empty;
    public string NomeFantasia { get; set; } = string.Empty;
    public string? Cnpj { get; set; }
    
    public string AdminNome { get; set; } = string.Empty;
    public string AdminEmail { get; set; } = string.Empty;
    public string AdminSenha { get; set; } = string.Empty;
}
