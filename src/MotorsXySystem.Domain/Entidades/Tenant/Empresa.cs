using System;
using MotorsXySystem.Domain.Comum;

namespace MotorsXySystem.Domain.Entidades.Tenant;

public class Empresa : EntidadeAuditavel
{
    public string RazaoSocial { get; set; } = string.Empty;
    public string NomeFantasia { get; set; } = string.Empty;
    public string? Cnpj { get; set; }
    
    // Configurações personalizadas da concessionária
    public string? LogoUrl { get; set; }
    public string? TemaCorPrincipal { get; set; }
    public string? TemaCorSecundaria { get; set; }
}
