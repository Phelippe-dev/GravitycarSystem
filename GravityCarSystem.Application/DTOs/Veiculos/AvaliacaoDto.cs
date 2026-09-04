using System;
using System.Collections.Generic;

namespace GravityCarSystem.Application.DTOs.Veiculos;

public class AvaliacaoDto
{
    public Guid? Id { get; set; }
    public Guid ClienteId { get; set; }
    public Guid VeiculoId { get; set; }
    public decimal? ValorMercado { get; set; }
    public decimal? ValorAvaliacao { get; set; } // O ValorSugerido (Mercado - Custos)
    public decimal? ValorAprovado { get; set; }
    public string? Observacoes { get; set; }
    
    // 0: Pendente, 1: Aprovada, 2: Reprovada, 3: Expirada
    public int Status { get; set; }
    
    public DateTime? DataAvaliacao { get; set; }
    public DateTime? DataAprovacao { get; set; }

    public List<AvaliacaoItemDto> Itens { get; set; } = new List<AvaliacaoItemDto>();
}

public class AvaliacaoItemDto
{
    public Guid? Id { get; set; }
    public string Categoria { get; set; } = string.Empty;
    public string Item { get; set; } = string.Empty;
    
    // 0: Ok, 1: ReparoLeve, 2: ReparoMedio, 3: ReparoGrave, 4: TrocaNecessaria, 5: NaoAvaliado
    public int Status { get; set; }
    
    public string? Observacao { get; set; }
    public decimal? CustoEstimado { get; set; }
}
