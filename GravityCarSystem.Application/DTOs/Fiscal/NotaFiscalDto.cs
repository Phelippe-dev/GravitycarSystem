using System;
using System.Collections.Generic;

namespace GravityCarSystem.Application.DTOs.Fiscal;

public class NotaFiscalDto
{
    public Guid Id { get; set; }
    public string ChaveAcesso { get; set; } = string.Empty;
    public string? Numero { get; set; }
    public string? Serie { get; set; }
    
    // 0: Entrada, 1: Saída
    public byte Tipo { get; set; } 
    public DateTime DataEmissao { get; set; }
    
    public string? EmitenteCnpj { get; set; }
    public string? EmitenteNome { get; set; }
    
    public string? DestinatarioCnpj { get; set; }
    public string? DestinatarioNome { get; set; }
    
    public decimal ValorTotal { get; set; }
    
    // FASE 4.2 - Novos Campos Fiscais
    public string? NaturezaOperacao { get; set; }
    public string? Cfop { get; set; }
    public decimal ValorIcms { get; set; }
    public decimal ValorPis { get; set; }
    public decimal ValorCofins { get; set; }
    
    // 1: Autorizada, 2: Cancelada, 3: Rejeitada, 4: Rascunho
    public byte Status { get; set; }
}

public class EmitirNotaFiscalDto
{
    public Guid VendaId { get; set; }
    public string NaturezaOperacao { get; set; } = "Venda de Veículo";
}

public class EmitirNotaFiscalEntradaDto
{
    public Guid VeiculoId { get; set; }
    public Guid ClienteId { get; set; }
    public string NaturezaOperacao { get; set; } = "Entrada Trade-In / Compra";
    public decimal ValorCompra { get; set; }
}

public class NotaFiscalFiltroDto
{
    public DateTime? DataInicio { get; set; }
    public DateTime? DataFim { get; set; }
    public byte? Tipo { get; set; } // 0 ou 1
    public byte? Status { get; set; }
    public string? Busca { get; set; } // Busca em Chave, Número, ou Nome Destinatário
}
