using System;
using System.Collections.Generic;
using MotorsXySystem.Domain.Comum;
using MotorsXySystem.Domain.Entidades.Cadastros;
using MotorsXySystem.Domain.Entidades.Veiculos;
using MotorsXySystem.Domain.Enums;

namespace MotorsXySystem.Domain.Entidades.Crm;

/// <summary>Oportunidade de compra/venda no pipeline (Kanban) da loja.</summary>
public class Lead : EntidadeTenant
{
    // === Contato ===
    public string Nome { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Telefone { get; set; }
    public string? Mensagem { get; set; }

    // === Pipeline ===
    public EstagioLead Estagio { get; set; } = EstagioLead.Novo;
    /// <summary>Posição do card dentro da coluna.</summary>
    public int Ordem { get; set; }
    public TipoOportunidade TipoOportunidade { get; set; } = TipoOportunidade.Compra;
    public OrigemLead Origem { get; set; } = OrigemLead.Manual;
    public string? Canal { get; set; }          // ex.: "landing-black-friday", "whatsapp-loja-centro"
    public string? UtmSource { get; set; }
    public string? UtmMedium { get; set; }
    public string? UtmCampaign { get; set; }
    public string? MotivoPerda { get; set; }
    public decimal? ValorEstimado { get; set; }
    public DateTime? DataProximoContato { get; set; }
    public DateTime? DataFechamento { get; set; }

    // === Interesse ===
    public TipoVeiculo? InteresseTipo { get; set; }
    public string? InteresseMarca { get; set; }
    public string? InteresseModelo { get; set; }
    public decimal? InteressePrecoMin { get; set; }
    public decimal? InteressePrecoMax { get; set; }
    public short? InteresseAnoMin { get; set; }
    public short? InteresseAnoMax { get; set; }
    public Guid? VeiculoInteresseId { get; set; }

    // === Relacionamentos ===
    public Guid? ClienteId { get; set; }
    public Guid? ResponsavelId { get; set; } // Usuario (vendedor)

    public virtual Cliente? Cliente { get; set; }
    public virtual Veiculo? VeiculoInteresse { get; set; }
    public virtual ICollection<LeadInteracao> Interacoes { get; set; } = new List<LeadInteracao>();
}

/// <summary>Histórico de contatos/movimentações do lead.</summary>
public class LeadInteracao : EntidadeTenant
{
    public Guid LeadId { get; set; }
    public string Tipo { get; set; } = "Nota"; // Nota, Ligacao, WhatsApp, Email, MudancaEstagio
    public string Descricao { get; set; } = string.Empty;
    public Guid? UsuarioId { get; set; }

    public virtual Lead Lead { get; set; } = null!;
}
