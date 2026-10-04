using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using MotorsXySystem.Domain.Enums;

namespace MotorsXySystem.Application.DTOs.Crm;

public class LeadInteresseDto
{
    public TipoVeiculo? Tipo { get; set; }
    [MaxLength(60)] public string? Marca { get; set; }
    [MaxLength(80)] public string? Modelo { get; set; }
    [Range(0, 100_000_000)] public decimal? PrecoMin { get; set; }
    [Range(0, 100_000_000)] public decimal? PrecoMax { get; set; }
    [Range(1900, 2100)] public short? AnoMin { get; set; }
    [Range(1900, 2100)] public short? AnoMax { get; set; }
    public Guid? VeiculoId { get; set; }
}

/// <summary>Payload aceito pelos endpoints públicos (formulários, landing pages, chatbots, marketplaces).</summary>
public class LeadEntradaPublicaDto
{
    [Required, MaxLength(150)] public string Nome { get; set; } = string.Empty;
    [EmailAddress, MaxLength(150)] public string? Email { get; set; }
    [MaxLength(30)] public string? Telefone { get; set; }
    [MaxLength(2000)] public string? Mensagem { get; set; }
    public TipoOportunidade TipoOportunidade { get; set; } = TipoOportunidade.Compra;
    public OrigemLead Origem { get; set; } = OrigemLead.FormularioSite;
    [MaxLength(80)] public string? Canal { get; set; }
    [MaxLength(80)] public string? UtmSource { get; set; }
    [MaxLength(80)] public string? UtmMedium { get; set; }
    [MaxLength(80)] public string? UtmCampaign { get; set; }
    public LeadInteresseDto? Interesse { get; set; }
    /// <summary>Honeypot anti-bot: deve vir vazio.</summary>
    public string? Website { get; set; }
}

public class LeadSalvarDto
{
    [Required, MaxLength(150)] public string Nome { get; set; } = string.Empty;
    [EmailAddress, MaxLength(150)] public string? Email { get; set; }
    [MaxLength(30)] public string? Telefone { get; set; }
    [MaxLength(2000)] public string? Mensagem { get; set; }
    public EstagioLead Estagio { get; set; } = EstagioLead.Novo;
    public TipoOportunidade TipoOportunidade { get; set; } = TipoOportunidade.Compra;
    public OrigemLead Origem { get; set; } = OrigemLead.Manual;
    [MaxLength(80)] public string? Canal { get; set; }
    public decimal? ValorEstimado { get; set; }
    public DateTime? DataProximoContato { get; set; }
    public Guid? ResponsavelId { get; set; }
    public Guid? ClienteId { get; set; }
    public LeadInteresseDto? Interesse { get; set; }
}

public class LeadMoverDto
{
    public EstagioLead Estagio { get; set; }
    public int Ordem { get; set; }
    [MaxLength(300)] public string? MotivoPerda { get; set; }
}

public class LeadInteracaoDto
{
    [MaxLength(30)] public string Tipo { get; set; } = "Nota";
    [Required, MaxLength(2000)] public string Descricao { get; set; } = string.Empty;
}

public record LeadCardDto(
    Guid Id, string Nome, string? Telefone, string? Email, EstagioLead Estagio, int Ordem,
    TipoOportunidade TipoOportunidade, OrigemLead Origem, string? Canal, decimal? ValorEstimado,
    TipoVeiculo? InteresseTipo, string? InteresseMarca, string? InteresseModelo,
    decimal? InteressePrecoMin, decimal? InteressePrecoMax, short? InteresseAnoMin, short? InteresseAnoMax,
    Guid? ResponsavelId, Guid? ClienteId, DateTime? DataProximoContato, DateTime DataCriacao);

public record KanbanColunaDto(EstagioLead Estagio, string Titulo, int Quantidade, decimal ValorTotal, IReadOnlyList<LeadCardDto> Leads);
