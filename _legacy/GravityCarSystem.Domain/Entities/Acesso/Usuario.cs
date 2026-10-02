using System;
using System.Collections.Generic;
using GravityCarSystem.Domain.Common;

namespace GravityCarSystem.Domain.Entities.Acesso;

public class Usuario : TenantEntity
{
    public string Nome { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string SenhaHash { get; set; } = string.Empty;
    public string? Cpf { get; set; }
    public string? Telefone { get; set; }
    public bool Ativo { get; set; } = true;
    public DateTime? UltimoLogin { get; set; }
    
    // Dados profissionais
    public string? Cargo { get; set; }
    public double ComissaoPercent { get; set; } = 2.0;
    
    public string? ResetToken { get; set; }
    public DateTime? ResetTokenExpiry { get; set; }
    
    public virtual Empresa? Empresa { get; set; }
    public virtual ICollection<UsuarioPerfil> Perfis { get; set; } = new List<UsuarioPerfil>();
}
