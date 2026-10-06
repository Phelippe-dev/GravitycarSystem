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

    /// <summary>Identificador público do tenant (subdomínio): {slug}.seudominio.com.br</summary>
    public string? Slug { get; set; }
    /// <summary>Chave para integrações servidor-a-servidor de leads (header X-Api-Key).</summary>
    public string? LeadApiKey { get; set; }

    // === Dados para documentos ===
    public string? InscricaoEstadual { get; set; }
    public string? Endereco { get; set; }
    public string? Cidade { get; set; }
    public string? Uf { get; set; }
    public string? Cep { get; set; }
    public string? Telefone { get; set; }
    public string? Email { get; set; }
    /// <summary>Termo de garantia padrão impresso nos recibos.</summary>
    public string? TermoGarantiaPadrao { get; set; }

    /// <summary>Saldo de créditos de consultas veiculares.</summary>
    public int SaldoConsultas { get; set; } = 250;
}
