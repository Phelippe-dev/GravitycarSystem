using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using MotorsXySystem.Domain.Enums;

namespace MotorsXySystem.Application.Interfaces;

public record FipeItem(string Codigo, string Nome);

public record FipePreco(
    string Marca,
    string Modelo,
    int AnoModelo,
    string Combustivel,
    string CodigoFipe,
    decimal Valor,
    string MesReferencia,
    string Segmento);

/// <summary>Consulta à Tabela FIPE (carros, motos e caminhões/utilitários).</summary>
public interface IFipeService
{
    Task<IReadOnlyList<FipeItem>> ListarMarcasAsync(TipoVeiculo tipo, CancellationToken ct = default);
    Task<IReadOnlyList<FipeItem>> ListarModelosAsync(TipoVeiculo tipo, string marcaId, CancellationToken ct = default);
    Task<IReadOnlyList<FipeItem>> ListarAnosAsync(TipoVeiculo tipo, string marcaId, string modeloId, CancellationToken ct = default);
    Task<FipePreco?> ObterPrecoAsync(TipoVeiculo tipo, string marcaId, string modeloId, string anoId, CancellationToken ct = default);
    Task<FipePreco?> ObterPrecoPorCodigoAsync(TipoVeiculo tipo, string codigoFipe, string anoId, CancellationToken ct = default);
}
