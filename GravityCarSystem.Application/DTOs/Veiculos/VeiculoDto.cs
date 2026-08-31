using System;
using GravityCarSystem.Domain.Enums;

namespace GravityCarSystem.Application.DTOs.Veiculos;

public class VeiculoDto
{
    public Guid Id { get; set; }
    public string? Placa { get; set; }
    public string? Renavam { get; set; }
    public string? Chassi { get; set; }
    
    public string Marca { get; set; } = string.Empty;
    public string Modelo { get; set; } = string.Empty;
    public string Versao { get; set; } = string.Empty;
    
    public short? AnoFabricacao { get; set; }
    public short? AnoModelo { get; set; }
    
    public string? Cor { get; set; }
    public string? Combustivel { get; set; }
    public string? Cambio { get; set; }
    
    public int? Quilometragem { get; set; }
    
    public decimal? ValorCompra { get; set; }
    public decimal? ValorVenda { get; set; }
    
    public DateTime? DataEntrada { get; set; }
    public DateTime? DataVenda { get; set; }
    
    public StatusVeiculo Status { get; set; }
    public string? Observacoes { get; set; }
    
    public string? FotoPrincipal { get; set; }
}
