using System;
using System.Collections.Generic;

namespace MotorsXySystem.Application.DTOs.Vendas;

public class VendaDto
{
    public Guid? Id { get; set; }
    public string? NumeroVenda { get; set; }
    public int? Status { get; set; }
    public DateTime? DataVenda { get; set; }
    public decimal? ValorLiquido { get; set; }
    public Guid ClienteId { get; set; }
    public Guid UsuarioId { get; set; }
    public List<Guid> VeiculosIds { get; set; } = new();
    public decimal Desconto { get; set; }
    public string? Observacoes { get; set; }
    public List<VendaPagamentoDto> Pagamentos { get; set; } = new();
    public List<VendaTrocaDto> Trocas { get; set; } = new();
}

public class VendaPagamentoDto
{
    public string? Metodo { get; set; }
    public decimal? Valor { get; set; }
    public int? Parcelas { get; set; }
    public decimal? ValorParcela { get; set; }
    public decimal? TaxaJuros { get; set; }
    public decimal? ValorEntrada { get; set; }
    public string? NumeroContrato { get; set; }
    public string? Bandeira { get; set; }
    public string? TipoCartao { get; set; }
    public string? Maquininha { get; set; }
    public decimal? TaxaAdm { get; set; }
    public string? NumeroAutorizacao { get; set; }
    public string? Banco { get; set; }
    public string? Agencia { get; set; }
    public string? Conta { get; set; }
    public string? NumeroCheque { get; set; }
    public DateTime? DataBomPara { get; set; }
    public string? Emitente { get; set; }
}

public class VendaTrocaDto
{
    public string? Marca { get; set; }
    public string? Modelo { get; set; }
    public string? Versao { get; set; }
    public int? AnoFabricacao { get; set; }
    public int? AnoModelo { get; set; }
    public string? Placa { get; set; }
    public decimal? ValorAvaliacao { get; set; }
}
