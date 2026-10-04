using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text.Json.Serialization;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Caching.Memory;
using MotorsXySystem.Application.Interfaces;
using MotorsXySystem.Domain.Enums;

namespace MotorsXySystem.Integracoes.Fipe;

/// <summary>
/// Cliente da API FIPE v2 (https://deividfortuna.github.io/fipe/v2/) — base: https://parallelum.com.br/fipe/api/v2/.
/// Para limites maiores configure "Fipe:Token" (header X-Subscription-Token).
/// Respostas são cacheadas (marcas/modelos 24h, preços 6h) para reduzir chamadas.
/// </summary>
public class ParallelumFipeService : IFipeService
{
    private readonly HttpClient _http;
    private readonly IMemoryCache _cache;

    public ParallelumFipeService(HttpClient http, IMemoryCache cache)
    {
        _http = http;
        _cache = cache;
    }

    public Task<IReadOnlyList<FipeItem>> ListarMarcasAsync(TipoVeiculo tipo, CancellationToken ct = default)
        => ListarAsync($"{tipo.SegmentoFipe()}/brands", ct);

    public Task<IReadOnlyList<FipeItem>> ListarModelosAsync(TipoVeiculo tipo, string marcaId, CancellationToken ct = default)
        => ListarAsync($"{tipo.SegmentoFipe()}/brands/{Seguro(marcaId)}/models", ct);

    public Task<IReadOnlyList<FipeItem>> ListarAnosAsync(TipoVeiculo tipo, string marcaId, string modeloId, CancellationToken ct = default)
        => ListarAsync($"{tipo.SegmentoFipe()}/brands/{Seguro(marcaId)}/models/{Seguro(modeloId)}/years", ct);

    public Task<FipePreco?> ObterPrecoAsync(TipoVeiculo tipo, string marcaId, string modeloId, string anoId, CancellationToken ct = default)
        => PrecoAsync(tipo, $"{tipo.SegmentoFipe()}/brands/{Seguro(marcaId)}/models/{Seguro(modeloId)}/years/{Seguro(anoId)}", ct);

    public Task<FipePreco?> ObterPrecoPorCodigoAsync(TipoVeiculo tipo, string codigoFipe, string anoId, CancellationToken ct = default)
        => PrecoAsync(tipo, $"{tipo.SegmentoFipe()}/{Seguro(codigoFipe)}/years/{Seguro(anoId)}", ct);

    // ------------------------------------------------------------------

    private async Task<IReadOnlyList<FipeItem>> ListarAsync(string path, CancellationToken ct)
    {
        return await _cache.GetOrCreateAsync("fipe:" + path, async entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(24);
            using var resp = await _http.GetAsync(path, ct);
            if (resp.StatusCode == HttpStatusCode.NotFound) return (IReadOnlyList<FipeItem>)Array.Empty<FipeItem>();
            resp.EnsureSuccessStatusCode();
            var itens = await resp.Content.ReadFromJsonAsync<List<ItemApi>>(cancellationToken: ct) ?? new();
            return itens.Select(i => new FipeItem(i.Code, i.Name)).ToList();
        }) ?? Array.Empty<FipeItem>();
    }

    private async Task<FipePreco?> PrecoAsync(TipoVeiculo tipo, string path, CancellationToken ct)
    {
        return await _cache.GetOrCreateAsync("fipe:" + path, async entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(6);
            using var resp = await _http.GetAsync(path, ct);
            if (resp.StatusCode == HttpStatusCode.NotFound) return null;
            resp.EnsureSuccessStatusCode();
            var p = await resp.Content.ReadFromJsonAsync<PrecoApi>(cancellationToken: ct);
            if (p == null) return null;
            return new FipePreco(p.Brand, p.Model, p.ModelYear, p.Fuel, p.CodeFipe, ParseReais(p.Price), p.ReferenceMonth, tipo.SegmentoFipe());
        });
    }

    /// <summary>"R$ 45.123,00" → 45123.00</summary>
    public static decimal ParseReais(string? valor)
    {
        if (string.IsNullOrWhiteSpace(valor)) return 0m;
        var limpo = new string(valor.Where(c => char.IsDigit(c) || c == ',' || c == '.').ToArray());
        return decimal.TryParse(limpo, NumberStyles.Number, new CultureInfo("pt-BR"), out var d) ? d : 0m;
    }

    private static string Seguro(string segmento) => Uri.EscapeDataString(segmento.Trim());

    private sealed class ItemApi
    {
        [JsonPropertyName("code")] public string Code { get; set; } = "";
        [JsonPropertyName("name")] public string Name { get; set; } = "";
    }

    private sealed class PrecoApi
    {
        [JsonPropertyName("brand")] public string Brand { get; set; } = "";
        [JsonPropertyName("codeFipe")] public string CodeFipe { get; set; } = "";
        [JsonPropertyName("fuel")] public string Fuel { get; set; } = "";
        [JsonPropertyName("model")] public string Model { get; set; } = "";
        [JsonPropertyName("modelYear")] public int ModelYear { get; set; }
        [JsonPropertyName("price")] public string Price { get; set; } = "";
        [JsonPropertyName("referenceMonth")] public string ReferenceMonth { get; set; } = "";
    }
}
