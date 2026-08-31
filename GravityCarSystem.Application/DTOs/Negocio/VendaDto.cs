using System;
using System.Collections.Generic;
using GravityCarSystem.Domain.Enums;

namespace GravityCarSystem.Application.DTOs.Negocio;

public class VendaDto
{
    public Guid Id { get; set; }
    public Guid ClienteId { get; set; }
    public Guid UsuarioId { get; set; }
    public string? NumeroVenda { get; set; }
    public DateTime DataVenda { get; set; }
    public decimal ValorBruto { get; set; }
    public decimal Desconto { get; set; }
    public decimal ValorLiquido { get; set; }
    public StatusVenda Status { get; set; }
    public string? Observacoes { get; set; }
    
    // Simplificando o cadastro, passamos apenas os IDs dos veículos
    public List<Guid> VeiculosIds { get; set; } = new List<Guid>();

    public List<VendaPagamentoDto> Pagamentos { get; set; } = new List<VendaPagamentoDto>();
    public List<VendaTrocaDto> Trocas { get; set; } = new List<VendaTrocaDto>();
}

public class VendaPagamentoDto
{
    public TipoPagamento TipoPagamento { get; set; }
    public decimal Valor { get; set; }
    public string? BancoFinanciamento { get; set; }
    public int? Parcelas { get; set; }
    public decimal? ValorParcela { get; set; }
    public decimal? TaxaJuros { get; set; }
}

public class VendaTrocaDto
{
    public string Marca { get; set; } = string.Empty;
    public string Modelo { get; set; } = string.Empty;
    public string Versao { get; set; } = string.Empty;
    public short AnoFabricacao { get; set; }
    public short AnoModelo { get; set; }
    public string Placa { get; set; } = string.Empty;
    public decimal ValorAvaliacao { get; set; }
}
