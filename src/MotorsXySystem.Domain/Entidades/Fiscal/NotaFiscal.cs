using System;
using MotorsXySystem.Domain.Comum;

namespace MotorsXySystem.Domain.Entidades.Fiscal;

public enum StatusNotaFiscal
{
    Rascunho = 0,
    Transmitida = 1,
    Autorizada = 2,
    Rejeitada = 3,
    Cancelada = 4
}

public class NotaFiscal : EntidadeTenant
{
    public Guid? VendaId { get; set; }
    public Guid? ClienteId { get; set; }

    public int Numero { get; set; }
    public int Serie { get; set; } = 1;
    public string ChaveAcesso { get; set; } = string.Empty;
    public string NaturezaOperacao { get; set; } = "Venda de veículo";
    
    public decimal ValorTotal { get; set; }
    public decimal? ValorIcms { get; set; }
    public decimal? ValorPis { get; set; }
    public decimal? ValorCofins { get; set; }

    public StatusNotaFiscal Status { get; set; } = StatusNotaFiscal.Rascunho;
    public string? ProtocoloAutorizacao { get; set; }
    public string? MensagemSefaz { get; set; }
    public DateTime? DataEmissao { get; set; }
    public DateTime? DataCancelamento { get; set; }
    public string? MotivoCancelamento { get; set; }

    // Dados Fiscais de Validação
    public string? DestinatarioCpfCnpj { get; set; }
    public string? DestinatarioNome { get; set; }
    public string? DestinatarioUf { get; set; }
    public string? Cfop { get; set; }
    public string? Ncm { get; set; }
}
