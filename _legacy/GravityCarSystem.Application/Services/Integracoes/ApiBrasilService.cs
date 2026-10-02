using System;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using GravityCarSystem.Application.DTOs.Integracoes;
using GravityCarSystem.Application.Interfaces;
using GravityCarSystem.Application.Interfaces.Integracoes;
using GravityCarSystem.Domain.Entities.Acesso;

namespace GravityCarSystem.Application.Services.Integracoes;

public class ApiBrasilService : ISenatranService
{
    private readonly IAppDbContext _context;
    private readonly ILogger<ApiBrasilService> _logger;
    private readonly HttpClient _httpClient;
    private readonly string _token;
    private readonly string _baseUrl;
    private readonly ICurrentTenantService _tenantService;

    public ApiBrasilService(
        IAppDbContext context,
        ILogger<ApiBrasilService> logger,
        HttpClient httpClient,
        IConfiguration configuration,
        ICurrentTenantService tenantService)
    {
        _context = context;
        _logger = logger;
        _httpClient = httpClient;
        _tenantService = tenantService;

        _token = configuration["ApiBrasil:Token"] ?? throw new ArgumentNullException("ApiBrasil:Token não configurado");
        _baseUrl = configuration["ApiBrasil:BaseUrl"] ?? "https://gateway.apibrasil.io/api/v2";
        
        _httpClient.BaseAddress = new Uri(_baseUrl);
        _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _token);
        _httpClient.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
    }

    public async Task<SenatranVeiculoResultDto> ConsultarVeiculoAsync(string placa, string renavam)
    {
        var placaLimpa = (placa ?? "").Replace("-", "").Trim().ToUpper();
        
        if (string.IsNullOrEmpty(placaLimpa))
            throw new ArgumentException("Placa é obrigatória para consultar a API Brasil");

        // 1. Obter a Empresa atual para checar Saldo
        var empresaId = _tenantService.GetEmpresaId();
        var empresa = await _context.Empresas.FirstOrDefaultAsync(e => e.Id == empresaId);
        
        if (empresa == null)
            throw new Exception("Empresa não identificada.");

        if (empresa.SaldoConsultas <= 0)
        {
            throw new Exception("SaldoInsuficiente: Você não possui créditos suficientes para realizar a consulta veicular. Recarregue seu saldo.");
        }

        // 2. Tentar buscar primeiro na base local para não gastar API a toa se já temos (Opcional, mas recomendado)
        // No momento, se o usuário clicou no botão "Puxar Dados", ele quer a consulta real, vamos forçar a API.

        _logger.LogInformation("Realizando consulta real na API Brasil para a placa {Placa}. Empresa: {Empresa}", placaLimpa, empresa.NomeFantasia);

        try
        {
            // 3. Chamar API Brasil (Endpoint de Veículos - Dados Nacionais)
            var requestBody = new { placa = placaLimpa };
            var content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");
            
            // Exemplo de endpoint genérico (Depende da assinatura específica do pacote escolhido na APIBrasil)
            // Aqui assumimos um endpoint fictício padrão da apibrasil de veículos /dados
            var response = await _httpClient.PostAsync("/veiculos/dados", content);

            if (!response.IsSuccessStatusCode)
            {
                var errorBody = await response.Content.ReadAsStringAsync();
                _logger.LogError("Erro na API Brasil: {Status} - {Erro}", response.StatusCode, errorBody);
                throw new Exception("Não foi possível consultar o veículo no momento. O órgão pode estar offline.");
            }

            var responseData = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(responseData);
            var root = doc.RootElement;
            
            // O mapeamento exato vai depender do JSON de retorno da APIBrasil.
            // Isso aqui mapeia os dados principais de forma genérica.
            var dados = root.TryGetProperty("dados", out var d) ? d : root;

            var marca = dados.TryGetProperty("marca", out var m) ? m.GetString() : "";
            var modelo = dados.TryGetProperty("modelo", out var md) ? md.GetString() : "";
            var chassi = dados.TryGetProperty("chassi", out var ch) ? ch.GetString() : "";
            var renavamResult = dados.TryGetProperty("renavam", out var r) ? r.GetString() : "";
            
            var rouboFurto = dados.TryGetProperty("situacao_roubo_furto", out var rf) && rf.GetBoolean();
            var alienacao = dados.TryGetProperty("restricao_financeira", out var af) && af.GetBoolean();
            var judicial = dados.TryGetProperty("restricao_judiciaria", out var rj) && rj.GetBoolean();

            // 4. Descontar Saldo
            empresa.SaldoConsultas -= 1;
            empresa.ConsultasRealizadas += 1;
            await _context.SaveChangesAsync();

            return new SenatranVeiculoResultDto
            {
                Placa = placaLimpa,
                Renavam = renavamResult,
                Chassi = chassi,
                MarcaModelo = $"{marca} {modelo}",
                Marca = marca,
                Modelo = modelo,
                AnoFabricacao = dados.TryGetProperty("ano_fabricacao", out var afab) && afab.ValueKind == JsonValueKind.Number ? afab.GetInt32() : DateTime.UtcNow.Year,
                AnoModelo = dados.TryGetProperty("ano_modelo", out var amod) && amod.ValueKind == JsonValueKind.Number ? amod.GetInt32() : DateTime.UtcNow.Year,
                Cor = dados.TryGetProperty("cor", out var c) ? c.GetString() : "",
                Combustivel = dados.TryGetProperty("combustivel", out var comb) ? comb.GetString() : "",
                
                PossuiRestricaoRouboFurto = rouboFurto,
                PossuiRestricaoJudicial = judicial,
                PossuiAlienacaoFiduciaria = alienacao,
                
                DescricaoDebitos = "Consulta Oficial Detran via APIBrasil.",
                StatusRenave = "Consultado",
                Origem = "API BRASIL",
                DataConsulta = DateTime.UtcNow
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Falha ao integrar com API Brasil.");
            throw;
        }
    }

    public Task<bool> RegistrarEntradaRenaveAsync(Guid veiculoId)
    {
        return Task.FromResult(true);
    }

    public Task<AtpveResultDto> GerarAtpveSaidaAsync(GerarAtpveRequestDto request)
    {
        return Task.FromResult(new AtpveResultDto
        {
            NumeroAtpve = $"ATPV-{Guid.NewGuid().ToString("N")[..8].ToUpper()}",
            Status = "AGUARDANDO_DETRAN",
            DataEmissao = DateTime.UtcNow
        });
    }
}
