using System;
using System.Threading.Tasks;
using GravityCarSystem.Application.DTOs.Integracoes;
using GravityCarSystem.Application.Interfaces;
using GravityCarSystem.Application.Interfaces.Integracoes;

namespace GravityCarSystem.Application.Services.Integracoes;

public class SenatranMockService : ISenatranService
{
    private readonly IAppDbContext _context;

    public SenatranMockService(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<SenatranVeiculoResultDto> ConsultarVeiculoAsync(string placa, string renavam)
    {
        // Simulação de delay de rede
        await Task.Delay(800);

        var random = new Random();
        
        // Mocking de regras de negócio: Placas terminadas em 0 têm multa, em 1 têm alienação, etc (para fins de teste UI)
        bool temMulta = placa.EndsWith("0") || placa.EndsWith("5");
        bool temAlienacao = placa.EndsWith("1");
        bool temRoubo = placa.EndsWith("9");

        decimal debitos = temMulta ? random.Next(150, 2500) : 0;

        return new SenatranVeiculoResultDto
        {
            Placa = placa.ToUpper(),
            Renavam = string.IsNullOrEmpty(renavam) ? "00000000000" : renavam,
            MarcaModelo = "VEICULO CONSULTADO NA BASE NACIONAL",
            AnoFabricacao = DateTime.UtcNow.Year - random.Next(1, 15),
            AnoModelo = DateTime.UtcNow.Year - random.Next(1, 15),
            PossuiRestricaoRouboFurto = temRoubo,
            PossuiRestricaoJudicial = false, // hardcoded false para simplificar
            PossuiAlienacaoFiduciaria = temAlienacao,
            TotalDebitosPendentes = debitos,
            StatusRenave = "NÃO REGISTRADO",
            DataConsulta = DateTime.UtcNow
        };
    }

    public async Task<bool> RegistrarEntradaRenaveAsync(Guid veiculoId)
    {
        var veiculo = await _context.Veiculos.FindAsync(veiculoId);
        if (veiculo == null) throw new Exception("Veículo não encontrado");

        // Aqui, num ambiente real, chamaria a API do SERPRO informando o chassi/renavam e o CNPJ da loja.
        await Task.Delay(1000);
        
        // O veículo passaria a ter um status RENAVE vinculado na base da concessionária.
        return true; 
    }

    public async Task<AtpveResultDto> GerarAtpveSaidaAsync(GerarAtpveRequestDto request)
    {
        var venda = await _context.Vendas.FindAsync(request.VendaId);
        if (venda == null) throw new Exception("Venda não encontrada");

        await Task.Delay(1000);

        return new AtpveResultDto
        {
            NumeroAtpve = $"ATPV-{new Random().Next(100000, 999999)}",
            Status = "AGUARDANDO_ASSINATURA",
            DataEmissao = DateTime.UtcNow
        };
    }
}
