$DomainPath = "c:\Users\lipeh\OneDrive\Desktop\Gravity Car System\GravityCarSystem.Domain"

# VEICULOS
@"
using System;
using System.Collections.Generic;
using GravityCarSystem.Domain.Common;
using GravityCarSystem.Domain.Enums;

namespace GravityCarSystem.Domain.Entities.Veiculos;

public class Veiculo : TenantEntity
{
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
    
    public StatusVeiculo Status { get; set; } = StatusVeiculo.Disponivel;
    public string? Observacoes { get; set; }
    
    public virtual ICollection<VeiculoFoto> Fotos { get; set; } = new List<VeiculoFoto>();
    public virtual ICollection<VeiculoDocumento> Documentos { get; set; } = new List<VeiculoDocumento>();
    public virtual ICollection<VeiculoCusto> Custos { get; set; } = new List<VeiculoCusto>();
    public virtual ICollection<VeiculoHistorico> Historicos { get; set; } = new List<VeiculoHistorico>();
    public virtual ICollection<VeiculoConsulta> Consultas { get; set; } = new List<VeiculoConsulta>();
}
"@ | Out-File "$DomainPath\Entities\Veiculos\Veiculo.cs"

@"
using System;
using GravityCarSystem.Domain.Common;

namespace GravityCarSystem.Domain.Entities.Veiculos;

public class VeiculoFoto : AuditableEntity
{
    public Guid VeiculoId { get; set; }
    public virtual Veiculo? Veiculo { get; set; }
    
    public string Url { get; set; } = string.Empty;
    public byte Tipo { get; set; }
    public int Ordem { get; set; }
    public bool Principal { get; set; }
}
"@ | Out-File "$DomainPath\Entities\Veiculos\VeiculoFoto.cs"

@"
using System;
using GravityCarSystem.Domain.Common;
using GravityCarSystem.Domain.Enums;

namespace GravityCarSystem.Domain.Entities.Veiculos;

public class VeiculoDocumento : AuditableEntity
{
    public Guid VeiculoId { get; set; }
    public virtual Veiculo? Veiculo { get; set; }
    
    public TipoDocumento TipoDocumento { get; set; }
    public string NomeArquivo { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
    public DateTime? DataDocumento { get; set; }
    public string? Observacao { get; set; }
}
"@ | Out-File "$DomainPath\Entities\Veiculos\VeiculoDocumento.cs"

@"
using System;
using GravityCarSystem.Domain.Common;
using GravityCarSystem.Domain.Entities.Financeiro;
using GravityCarSystem.Domain.Entities.Cadastros;
using GravityCarSystem.Domain.Entities.Fiscal;

namespace GravityCarSystem.Domain.Entities.Veiculos;

public class VeiculoCusto : AuditableEntity
{
    public Guid VeiculoId { get; set; }
    public virtual Veiculo? Veiculo { get; set; }
    
    public Guid CategoriaId { get; set; }
    public virtual CategoriaFinanceira? Categoria { get; set; }
    
    public string Descricao { get; set; } = string.Empty;
    public decimal Valor { get; set; }
    public DateTime DataCusto { get; set; }
    
    public Guid? FornecedorId { get; set; }
    public virtual Fornecedor? Fornecedor { get; set; }
    
    public Guid? NotaFiscalId { get; set; }
    public virtual NotaFiscal? NotaFiscal { get; set; }
    
    public string? Observacao { get; set; }
}
"@ | Out-File "$DomainPath\Entities\Veiculos\VeiculoCusto.cs"

@"
using System;
using GravityCarSystem.Domain.Common;
using GravityCarSystem.Domain.Entities.Acesso;

namespace GravityCarSystem.Domain.Entities.Veiculos;

public class VeiculoHistorico : Entity
{
    public Guid VeiculoId { get; set; }
    public virtual Veiculo? Veiculo { get; set; }
    
    public Guid? UsuarioId { get; set; }
    public virtual Usuario? Usuario { get; set; }
    
    public string TipoEvento { get; set; } = string.Empty;
    public string? Descricao { get; set; }
    public string? ValorAnterior { get; set; }
    public string? ValorNovo { get; set; }
    public DateTime DataEvento { get; set; } = DateTime.UtcNow;
}
"@ | Out-File "$DomainPath\Entities\Veiculos\VeiculoHistorico.cs"

@"
using System;
using GravityCarSystem.Domain.Common;
using GravityCarSystem.Domain.Entities.Acesso;

namespace GravityCarSystem.Domain.Entities.Veiculos;

public class VeiculoConsulta : Entity
{
    public Guid VeiculoId { get; set; }
    public virtual Veiculo? Veiculo { get; set; }
    
    public string TipoConsulta { get; set; } = string.Empty;
    public string Origem { get; set; } = string.Empty;
    public DateTime DataConsulta { get; set; } = DateTime.UtcNow;
    
    public Guid? UsuarioId { get; set; }
    public virtual Usuario? Usuario { get; set; }
    
    public bool Sucesso { get; set; }
    public string? Protocolo { get; set; }
    public string? ResultadoJson { get; set; }
    public string? MensagemErro { get; set; }
}
"@ | Out-File "$DomainPath\Entities\Veiculos\VeiculoConsulta.cs"

@"
using System;
using System.Collections.Generic;
using GravityCarSystem.Domain.Common;
using GravityCarSystem.Domain.Entities.Acesso;
using GravityCarSystem.Domain.Entities.Cadastros;
using GravityCarSystem.Domain.Enums;

namespace GravityCarSystem.Domain.Entities.Veiculos;

public class Avaliacao : TenantEntity
{
    public Guid ClienteId { get; set; }
    public virtual Cliente? Cliente { get; set; }
    
    public Guid VeiculoId { get; set; }
    public virtual Veiculo? Veiculo { get; set; }
    
    public Guid? UsuarioId { get; set; }
    public virtual Usuario? Usuario { get; set; }
    
    public decimal? ValorMercado { get; set; }
    public decimal? ValorAvaliacao { get; set; }
    public decimal? ValorAprovado { get; set; }
    
    public StatusAvaliacao Status { get; set; } = StatusAvaliacao.Pendente;
    public string? Observacoes { get; set; }
    
    public DateTime? DataAvaliacao { get; set; }
    public DateTime? DataAprovacao { get; set; }
    
    public virtual ICollection<AvaliacaoItem> Itens { get; set; } = new List<AvaliacaoItem>();
}
"@ | Out-File "$DomainPath\Entities\Veiculos\Avaliacao.cs"

@"
using System;
using GravityCarSystem.Domain.Common;
using GravityCarSystem.Domain.Enums;

namespace GravityCarSystem.Domain.Entities.Veiculos;

public class AvaliacaoItem : Entity
{
    public Guid AvaliacaoId { get; set; }
    public virtual Avaliacao? Avaliacao { get; set; }
    
    public string Categoria { get; set; } = string.Empty;
    public string Item { get; set; } = string.Empty;
    public StatusChecklist Status { get; set; } = StatusChecklist.Ok;
    public string? Observacao { get; set; }
    public decimal? CustoEstimado { get; set; }
}
"@ | Out-File "$DomainPath\Entities\Veiculos\AvaliacaoItem.cs"
