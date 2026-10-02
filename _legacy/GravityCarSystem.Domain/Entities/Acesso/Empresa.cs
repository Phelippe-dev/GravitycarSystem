using System;
using System.Collections.Generic;
using GravityCarSystem.Domain.Common;

namespace GravityCarSystem.Domain.Entities.Acesso;

public class Empresa : AuditableEntity
{
    public string RazaoSocial { get; set; } = string.Empty;
    public string NomeFantasia { get; set; } = string.Empty;
    public string Cnpj { get; set; } = string.Empty;
    public string? InscricaoEstadual { get; set; }
    public string? InscricaoMunicipal { get; set; }
    public string? Telefone { get; set; }
    public string? Email { get; set; }
    public string? Site { get; set; }
    public string? Cep { get; set; }
    public string? Logradouro { get; set; }
    public string? Numero { get; set; }
    public string? Complemento { get; set; }
    public string? Bairro { get; set; }
    public string? Cidade { get; set; }
    public string? Estado { get; set; }
    public string? RegimeTributario { get; set; }
    public string? ResponsavelTecnico { get; set; }
    public bool Ativa { get; set; } = true;

    // Campos de Saldo/Integração API
    public int SaldoConsultas { get; set; } = 0;
    public int ConsultasRealizadas { get; set; } = 0;
    
    public virtual ICollection<Usuario> Usuarios { get; set; } = new List<Usuario>();
}
