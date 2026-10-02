namespace MotorsXySystem.Application.DTOs;

public class VeiculoDto
{
    public Guid? Id { get; set; }
    public string Marca { get; set; } = string.Empty;
    public string Modelo { get; set; } = string.Empty;
    public string? Versao { get; set; }
    public int? AnoFabricacao { get; set; }
    public int? AnoModelo { get; set; }
    public string? Placa { get; set; }
    public string? Cor { get; set; }
    public string? Combustivel { get; set; }
    public string? Cambio { get; set; }
    public int? Quilometragem { get; set; }
    public decimal? ValorCompra { get; set; }
    public decimal? ValorVenda { get; set; }
    public int Status { get; set; } = 4; // Disponível por padrão
    public string? FotoPrincipal { get; set; }
    public string? Observacoes { get; set; }
    public string? Chassi { get; set; }
    public string? Renavam { get; set; }
    public int TipoVeiculo { get; set; } = 0; // 0 = Carro, 1 = Moto
    public bool Consignado { get; set; }
    public DateTime? DataCadastro { get; set; }
}
