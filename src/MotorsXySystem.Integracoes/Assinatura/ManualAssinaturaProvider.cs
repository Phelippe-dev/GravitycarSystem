using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using MotorsXySystem.Application.Interfaces;

namespace MotorsXySystem.Integracoes.Assinatura;

/// <summary>
/// Provedor padrão: assinatura física/presencial. Não envia nada a terceiros — o recibo fica
/// "Pendente" até ser marcado como assinado. Substitua por um provedor real (Clicksign, D4Sign,
/// ZapSign, DocuSign) implementando <see cref="IAssinaturaEletronicaProvider"/>.
/// </summary>
public class ManualAssinaturaProvider : IAssinaturaEletronicaProvider
{
    public string Nome => "manual";

    public Task<SolicitacaoAssinaturaResultado> SolicitarAssinaturaAsync(DocumentoParaAssinatura documento, CancellationToken ct = default)
        => Task.FromResult(new SolicitacaoAssinaturaResultado(true, $"manual-{documento.ReciboId:N}", null, null));

    public Task<EventoAssinatura?> ProcessarWebhookAsync(string corpo, IReadOnlyDictionary<string, string> headers, CancellationToken ct = default)
        => Task.FromResult<EventoAssinatura?>(null); // provedor manual não recebe webhooks
}
