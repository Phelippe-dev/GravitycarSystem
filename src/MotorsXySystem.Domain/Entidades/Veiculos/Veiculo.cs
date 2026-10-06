using System;
using System.Collections.Generic;
using MotorsXySystem.Domain.Comum;
using MotorsXySystem.Domain.Enums;

namespace MotorsXySystem.Domain.Entidades.Veiculos;

public class Veiculo : EntidadeTenant
{
    // === Identificação ===
    public string? Placa { get; set; }
    public string? Renavam { get; set; }
    public string? Chassi { get; set; }
    
    // === Tipo de Veículo ===
    public TipoVeiculo Tipo { get; set; }
    
    // === Dados Gerais ===
    public string Marca { get; set; } = string.Empty;
    public string Modelo { get; set; } = string.Empty;
    public string Versao { get; set; } = string.Empty;
    public short? AnoFabricacao { get; set; }
    public short? AnoModelo { get; set; }
    public string? Cor { get; set; }
    public string? Combustivel { get; set; }
    public string? Cambio { get; set; }
    public int? Quilometragem { get; set; }
    
    // === Específicos Motos ===
    /// <summary>Cilindrada em cc.</summary>
    public int? Cilindrada { get; set; }
    /// <summary>Estilo: Street, Trail, Custom, Scooter, etc.</summary>
    public CategoriaMoto? CategoriaMoto { get; set; }
    public TipoPartida? Partida { get; set; }
    public TipoRefrigeracao? Refrigeracao { get; set; }
    /// <summary>Legado (texto livre). Use <see cref="Refrigeracao"/>.</summary>
    public string? TipoRefrigeracao { get; set; }
    public string? TipoFreio { get; set; }
    public bool? PossuiABS { get; set; }
    public string? HabilitacaoNecessaria { get; set; }
    
    // === Específicos Carros ===
    public int? NumeroPortas { get; set; }
    public int? NumeroLugares { get; set; }
    public TipoCarroceria? Carroceria { get; set; }
    public decimal? Motorizacao { get; set; }
    
    // === Financeiro ===
    public decimal? ValorCompra { get; set; }
    public decimal? ValorVenda { get; set; }
    public decimal? ValorFipe { get; set; }

    // === Referência FIPE ===
    public string? CodigoFipe { get; set; }
    public string? MesReferenciaFipe { get; set; }
    public DateTime? DataConsultaFipe { get; set; }
    
    // === Datas ===
    public DateTime? DataEntrada { get; set; }
    public DateTime? DataVenda { get; set; }
    
    // === Status ===
    public int Status { get; set; } = 1; // 1 = Disponivel (pode ser mapeado para um enum futuramente)
    public bool Consignado { get; set; } = false;
    public string? Observacoes { get; set; }

    // === Reserva & Concorrência ===
    public DateTime? DataExpiracaoReserva { get; set; }
    public byte[]? RowVersion { get; set; }

    // === Relacionamentos ===
    public virtual ICollection<VeiculoCusto> Custos { get; set; } = new List<VeiculoCusto>();
}
