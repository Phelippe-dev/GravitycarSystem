using System;
using System.Threading;
using System.Threading.Tasks;
using MotorsXySystem.Application.DTOs.Recibos;
using MotorsXySystem.Domain.Entidades.Documentos;

namespace MotorsXySystem.Application.Interfaces;

public interface IReciboService
{
    /// <summary>Monta o snapshot, calcula o SHA-256, gera o PDF e persiste o recibo (imutável).</summary>
    Task<ReciboVenda> EmitirAsync(EmitirReciboRequest request, Guid? usuarioId, CancellationToken ct = default);

    /// <summary>Recalcula o hash do snapshot salvo e compara com o hash gravado.</summary>
    bool VerificarIntegridade(ReciboVenda recibo);
}
