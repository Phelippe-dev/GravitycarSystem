using System;
using System.Collections.Generic;
using MotorsXySystem.Domain.Enums;

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
    
    // Tipo flexível: Carro = 1, Moto = 2, Scooter = 3, Quadriciclo = 4, UTV = 5, Caminhao = 6, Utilitario = 7
    public int TipoVeiculo { get; set; } = 1;
    public bool Consignado { get; set; }
    public DateTime? DataCadastro { get; set; }

    // === Específicos para Motos / Duas Rodas ===
    public int? Cilindrada { get; set; }
    public CategoriaMoto? CategoriaMoto { get; set; } // Estilo: Street, Trail, Custom, Scooter, etc.
    public TipoPartida? Partida { get; set; }         // Elétrica, Pedal, Elétrica e Pedal
    public TipoRefrigeracao? Refrigeracao { get; set; } // Ar, Líquida, Óleo, Ar e Óleo
    public string? TipoRefrigeracao { get; set; }     // Legado texto livre

    // === Tabela FIPE ===
    public string? CodigoFipe { get; set; }
    public decimal? ValorFipe { get; set; }
    public string? MesReferenciaFipe { get; set; }
    public DateTime? DataConsultaFipe { get; set; }
}

public class VeiculoFotoDto
{
    public Guid Id { get; set; }
    public string Url { get; set; } = string.Empty;
    public bool Principal { get; set; }
}

public class VeiculoDocumentoDto
{
    public Guid Id { get; set; }
    public string NomeArquivo { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
    public string TipoDocumento { get; set; } = string.Empty;
}

public class VeiculoCustoDto
{
    public Guid Id { get; set; }
    public string TipoCusto { get; set; } = "Geral";
    public string Descricao { get; set; } = string.Empty;
    public decimal Valor { get; set; }
    public DateTime DataCusto { get; set; } = DateTime.UtcNow;
    public string? Responsavel { get; set; }
}

public class VeiculoHistoricoDto
{
    public Guid Id { get; set; }
    public string TipoEvento { get; set; } = string.Empty;
    public string? ValorAnterior { get; set; }
    public string? ValorNovo { get; set; }
    public string Descricao { get; set; } = string.Empty;
    public DateTime DataEvento { get; set; }
}

public class VeiculoDetalhesDto : VeiculoDto
{
    public List<VeiculoFotoDto> Fotos { get; set; } = new();
    public List<VeiculoDocumentoDto> Documentos { get; set; } = new();
    public List<VeiculoCustoDto> Custos { get; set; } = new();
    public List<VeiculoHistoricoDto> Historico { get; set; } = new();
}
