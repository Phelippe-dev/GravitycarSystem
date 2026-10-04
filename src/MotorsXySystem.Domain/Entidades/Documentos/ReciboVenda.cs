using System;
using MotorsXySystem.Domain.Comum;
using MotorsXySystem.Domain.Enums;

namespace MotorsXySystem.Domain.Entidades.Documentos;

/// <summary>
/// Recibo de Venda/Sinal emitido. O documento é imutável após a emissão:
/// <see cref="DadosJson"/> guarda o snapshot canônico (empresa, comprador, veículo, pagamento, garantia)
/// e <see cref="HashSha256"/> = SHA-256(DadosJson + "|" + EmitidoEmUtc:O). O PDF gerado é guardado
/// em <see cref="Pdf"/> e seu hash binário em <see cref="PdfSha256"/>.
/// </summary>
public class ReciboVenda : EntidadeTenant
{
    public string Numero { get; set; } = string.Empty; // REC-2026-000123
    public TipoRecibo Tipo { get; set; } = TipoRecibo.Venda;

    public Guid? VendaId { get; set; }
    public Guid? ClienteId { get; set; }
    public Guid? VeiculoId { get; set; }

    public decimal ValorTotal { get; set; }
    public decimal ValorRecebido { get; set; }

    // === Integridade ===
    public string DadosJson { get; set; } = "{}";
    public string HashSha256 { get; set; } = string.Empty;
    public string PdfSha256 { get; set; } = string.Empty;
    public DateTime EmitidoEmUtc { get; set; }
    public Guid? EmitidoPorId { get; set; }
    public byte[] Pdf { get; set; } = Array.Empty<byte>();

    // === Cancelamento ===
    public bool Cancelado { get; set; }
    public string? MotivoCancelamento { get; set; }

    // === Assinatura eletrônica (ICP-Brasil / provedores como Clicksign, D4Sign, ZapSign, DocuSign) ===
    public StatusAssinatura StatusAssinatura { get; set; } = StatusAssinatura.NaoSolicitada;
    public string? ProvedorAssinatura { get; set; }
    public string? IdExternoAssinatura { get; set; }
    public string? UrlAssinatura { get; set; }
    public DateTime? DataAssinatura { get; set; }
    public byte[]? PdfAssinado { get; set; }
}
