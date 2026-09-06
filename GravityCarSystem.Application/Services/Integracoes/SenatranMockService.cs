using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using GravityCarSystem.Application.DTOs.Integracoes;
using GravityCarSystem.Application.Interfaces;
using GravityCarSystem.Application.Interfaces.Integracoes;

namespace GravityCarSystem.Application.Services.Integracoes;

/// <summary>
/// Serviço de consulta de veículos.
/// Prioridade 1: Base local da loja (dados exatos e confiáveis)
/// Prioridade 2: Retorno transparente quando não encontrado.
/// 
/// Observação: Não existe API pública e gratuita de consulta por placa no Brasil.
/// Consultas reais por placa exigem convênio com SERPRO ou serviço pago (APIPlacas, etc.).
/// A consulta FIPE gratuita (por Marca/Modelo/Ano) é feita diretamente no frontend via BrasilAPI.
/// </summary>
public class SenatranMockService : ISenatranService
{
    private readonly IAppDbContext _context;
    private readonly ILogger<SenatranMockService> _logger;

    public SenatranMockService(
        IAppDbContext context,
        ILogger<SenatranMockService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<SenatranVeiculoResultDto> ConsultarVeiculoAsync(string placa, string renavam)
    {
        var placaLimpa = (placa ?? "").Replace("-", "").Trim().ToUpper();
        var renavamLimpo = (renavam ?? "").Trim();

        // =============================================================
        // PRIORIDADE 1: Base local da loja (dados exatos e confiáveis)
        // =============================================================
        var veiculoDb = await _context.Veiculos
            .FirstOrDefaultAsync(v =>
                (!string.IsNullOrEmpty(placaLimpa) && v.Placa.Replace("-", "").ToUpper() == placaLimpa) ||
                (!string.IsNullOrEmpty(renavamLimpo) && v.Renavam == renavamLimpo));

        if (veiculoDb != null)
        {
            _logger.LogInformation("Veículo {Placa} encontrado na base local da loja.", placaLimpa);
            return new SenatranVeiculoResultDto
            {
                Placa = veiculoDb.Placa,
                Renavam = veiculoDb.Renavam ?? renavamLimpo,
                Chassi = veiculoDb.Chassi ?? "",
                MarcaModelo = $"{veiculoDb.Marca} {veiculoDb.Modelo}",
                Marca = veiculoDb.Marca,
                Modelo = veiculoDb.Modelo,
                Versao = veiculoDb.Versao ?? "",
                AnoFabricacao = veiculoDb.AnoFabricacao ?? DateTime.UtcNow.Year,
                AnoModelo = veiculoDb.AnoModelo ?? DateTime.UtcNow.Year,
                Cor = veiculoDb.Cor ?? "",
                Combustivel = veiculoDb.Combustivel ?? "Flex",
                Cambio = veiculoDb.Cambio ?? "Manual",
                // Valor de referência de mercado baseado nos valores registrados na loja
                ValorFipe = (veiculoDb.ValorVenda ?? 0) > 0
                    ? veiculoDb.ValorVenda!.Value
                    : (veiculoDb.ValorCompra ?? 0),
                PossuiRestricaoRouboFurto = false,
                PossuiRestricaoJudicial = false,
                PossuiAlienacaoFiduciaria = false,
                TotalDebitosPendentes = 0,
                DescricaoDebitos = "Veículo localizado na base da loja. Sem débitos registrados internamente.",
                StatusRenave = "REGISTRADO",
                Origem = "BASE LOCAL DA LOJA",
                DataConsulta = DateTime.UtcNow
            };
        }

        // =============================================================
        // NÃO ENCONTRADO — resposta honesta e limpa
        // Para consulta FIPE oficial, use o widget no formulário de cadastro.
        // Para débitos/restrições reais, acesse o DETRAN-MG.
        // =============================================================
        _logger.LogInformation(
            "Placa {Placa} não encontrada na base local. Consulta externa por placa requer convênio SERPRO.",
            placaLimpa);

        return new SenatranVeiculoResultDto
        {
            Placa = !string.IsNullOrEmpty(placaLimpa) ? placaLimpa : renavamLimpo,
            Renavam = renavamLimpo,
            Chassi = "",
            MarcaModelo = "",
            Marca = "",
            Modelo = "",
            Versao = "",
            AnoFabricacao = 0,
            AnoModelo = 0,
            Cor = "",
            Combustivel = "Flex",
            Cambio = "Manual",
            ValorFipe = 0m,
            PossuiRestricaoRouboFurto = false,
            PossuiRestricaoJudicial = false,
            PossuiAlienacaoFiduciaria = false,
            TotalDebitosPendentes = 0m,
            DescricaoDebitos = "Veículo não encontrado na base da loja. Use o widget FIPE no formulário para buscar o valor de mercado por Marca/Modelo/Ano.",
            StatusRenave = "NÃO ENCONTRADO",
            Origem = "BASE LOCAL (veículo não cadastrado)",
            DataConsulta = DateTime.UtcNow
        };
    }

    public async Task<bool> RegistrarEntradaRenaveAsync(Guid veiculoId)
    {
        var veiculo = await _context.Veiculos.FindAsync(veiculoId);
        if (veiculo == null) throw new Exception("Veículo não encontrado");

        // Integração real com RENAVE requer credenciais SERPRO / SINESP via convênio.
        _logger.LogWarning(
            "RegistrarEntradaRenave: veículo {Id}. Integração RENAVE real requer convênio SERPRO.",
            veiculoId);

        await Task.Delay(200);
        return true;
    }

    public async Task<AtpveResultDto> GerarAtpveSaidaAsync(GerarAtpveRequestDto request)
    {
        var venda = await _context.Vendas.FindAsync(request.VendaId);
        if (venda == null) throw new Exception("Venda não encontrada");

        // Geração real de ATPV-e requer certificado digital A1/A3 + integração DETRAN.
        _logger.LogWarning(
            "GerarAtpve: venda {Id}. Integração ATPV-e real requer certificado digital + DETRAN.",
            request.VendaId);

        await Task.Delay(200);

        return new AtpveResultDto
        {
            NumeroAtpve = $"ATPV-PENDENTE-{venda.Id.ToString("N")[..8].ToUpper()}",
            Status = "AGUARDANDO_CONFIGURACAO_DETRAN",
            DataEmissao = DateTime.UtcNow
        };
    }
}
