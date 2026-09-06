using System;

namespace GravityCarSystem.Application.DTOs.Integracoes;

public class SenatranVeiculoResultDto
{
    public string Placa { get; set; } = string.Empty;
    public string Renavam { get; set; } = string.Empty;
    public string Chassi { get; set; } = string.Empty;
    public string MarcaModelo { get; set; } = string.Empty;
    public string Marca { get; set; } = string.Empty;
    public string Modelo { get; set; } = string.Empty;
    public string Versao { get; set; } = string.Empty;
    public string Cor { get; set; } = string.Empty;
    public string Combustivel { get; set; } = "Flex";
    public string Cambio { get; set; } = "Automático";
    public int AnoFabricacao { get; set; }
    public int AnoModelo { get; set; }
    public decimal ValorFipe { get; set; }
    
    // Status Governamentais e Fiscais
    public bool PossuiRestricaoRouboFurto { get; set; }
    public bool PossuiRestricaoJudicial { get; set; }
    public bool PossuiAlienacaoFiduciaria { get; set; }
    public decimal TotalDebitosPendentes { get; set; } // IPVA, Multas
    public string DescricaoDebitos { get; set; } = string.Empty;
    
    // Status RENAVE
    public string StatusRenave { get; set; } = string.Empty; // "NÃO REGISTRADO", "EM ESTOQUE", "TRANSFERÊNCIA PENDENTE"
    public string Origem { get; set; } = "SENATRAN / DETRAN / PRF & FIPE";
    
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
