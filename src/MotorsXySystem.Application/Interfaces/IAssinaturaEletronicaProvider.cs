using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using MotorsXySystem.Domain.Enums;

namespace MotorsXySystem.Application.Interfaces;

public record SignatarioAssinatura(string Nome, string Email, string? CpfCnpj, string? Telefone, string Papel); // Papel: Comprador, Vendedor, Testemunha

public record DocumentoParaAssinatura(
    Guid ReciboId,
    Guid EmpresaId,
    string NomeArquivo,
    byte[] Pdf,
    string HashSha256,
    IReadOnlyList<SignatarioAssinatura> Signatarios,
    string? UrlCallback);

public record SolicitacaoAssinaturaResultado(bool Sucesso, string? IdExterno, string? UrlAssinatura, string? Erro);

public record EventoAssinatura(string IdExterno, StatusAssinatura Status, DateTime? DataEvento, byte[]? PdfAssinado);

/// <summary>
/// Hook para provedores de assinatura eletrônica com validade jurídica
/// (MP 2.200-2/2001 e Lei 14.063/2020): Clicksign, D4Sign, ZapSign, DocuSign, Certisign...
/// Para adicionar um provedor: implemente esta interface e registre no DI
/// (<c>services.AddScoped&lt;IAssinaturaEletronicaProvider, MeuProvider&gt;()</c>).
/// O webhook público é <c>POST /api/webhooks/assinatura/{Nome}</c>.
/// </summary>
public interface IAssinaturaEletronicaProvider
{
    /// <summary>Identificador usado na rota do webhook e salvo no recibo (ex.: "clicksign").</summary>
    string Nome { get; }

    Task<SolicitacaoAssinaturaResultado> SolicitarAssinaturaAsync(DocumentoParaAssinatura documento, CancellationToken ct = default);

    /// <summary>Valida a autenticidade do webhook (HMAC/token) e converte no evento interno. Retorna null se inválido.</summary>
    Task<EventoAssinatura?> ProcessarWebhookAsync(string corpo, IReadOnlyDictionary<string, string> headers, CancellationToken ct = default);
}
