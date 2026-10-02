using System;
using System.Collections.Generic;
using GravityCarSystem.Domain.Enums;

namespace GravityCarSystem.Application.DTOs.Veiculos;

public class VeiculoDetalhesDto : VeiculoDto
{
    public List<VeiculoFotoDto> Fotos { get; set; } = new();
    public List<VeiculoDocumentoDto> Documentos { get; set; } = new();
    public List<VeiculoCustoDto> Custos { get; set; } = new();
    public List<VeiculoHistoricoDto> Historico { get; set; } = new();
}

public class VeiculoFotoDto
{
    public Guid Id { get; set; }
    public string Url { get; set; } = string.Empty;
    public bool IsPrincipal { get; set; }
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
    public string Descricao { get; set; } = string.Empty;
    public decimal Valor { get; set; }
    public DateTime DataCusto { get; set; }
}

public class VeiculoHistoricoDto
{
    public Guid Id { get; set; }
    public string TipoEvento { get; set; } = string.Empty;
    public string? ValorAnterior { get; set; }
    public string? ValorNovo { get; set; }
    public string? Descricao { get; set; }
    public DateTime DataEvento { get; set; }
}
