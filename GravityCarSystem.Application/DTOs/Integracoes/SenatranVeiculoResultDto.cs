using System;

namespace GravityCarSystem.Application.DTOs.Integracoes;

public class SenatranVeiculoResultDto
{
    public string Placa { get; set; } = string.Empty;
    public string Renavam { get; set; } = string.Empty;
    public string MarcaModelo { get; set; } = string.Empty;
    public int AnoFabricacao { get; set; }
    public int AnoModelo { get; set; }
    
    // Status Governamentais
    public bool PossuiRestricaoRouboFurto { get; set; }
    public bool PossuiRestricaoJudicial { get; set; }
    public bool PossuiAlienacaoFiduciaria { get; set; }
    public decimal TotalDebitosPendentes { get; set; } // IPVA, Multas
    
    // Status RENAVE
    public string StatusRenave { get; set; } = string.Empty; // "NÃO REGISTRADO", "EM ESTOQUE", "TRANSFERÊNCIA PENDENTE"
    
    public DateTime DataConsulta { get; set; } = DateTime.UtcNow;
}

public class GerarAtpveRequestDto
{
    public Guid VendaId { get; set; }
}

public class AtpveResultDto
{
    public string NumeroAtpve { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty; // "AGUARDANDO_ASSINATURA", "ASSINADO"
    public DateTime DataEmissao { get; set; }
}
