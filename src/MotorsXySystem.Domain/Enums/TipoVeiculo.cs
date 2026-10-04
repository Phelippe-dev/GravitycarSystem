namespace MotorsXySystem.Domain.Enums;

public enum TipoVeiculo
{
    Carro = 1,
    Moto = 2,
    Scooter = 3,
    Quadriciclo = 4,
    UTV = 5,
    Caminhao = 6,
    Utilitario = 7
}

public static class TipoVeiculoExtensions
{
    /// <summary>Tipos que usam os campos específicos de motocicleta.</summary>
    public static bool EhDuasRodas(this TipoVeiculo tipo) => tipo is TipoVeiculo.Moto or TipoVeiculo.Scooter;

    /// <summary>Segmento correspondente na API FIPE (cars | motorcycles | trucks).</summary>
    public static string SegmentoFipe(this TipoVeiculo tipo) => tipo switch
    {
        TipoVeiculo.Moto or TipoVeiculo.Scooter or TipoVeiculo.Quadriciclo => "motorcycles",
        TipoVeiculo.Caminhao => "trucks",
        _ => "cars" // Carro, Utilitário (furgões/pickups estão na tabela de carros), UTV
    };
}
