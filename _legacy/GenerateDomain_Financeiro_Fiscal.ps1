$DomainPath = "c:\Users\lipeh\OneDrive\Desktop\Gravity Car System\GravityCarSystem.Domain"

# FINANCEIRO
@"
using System;
using GravityCarSystem.Domain.Common;
using GravityCarSystem.Domain.Entities.Cadastros;
using GravityCarSystem.Domain.Entities.Negocio;
using GravityCarSystem.Domain.Enums;

namespace GravityCarSystem.Domain.Entities.Financeiro;

public class ContaReceber : TenantEntity
{
    public Guid ClienteId { get; set; }
    public virtual Cliente? Cliente { get; set; }
    
    public Guid? VendaId { get; set; }
    public virtual Venda? Venda { get; set; }
    
    public Guid? VendaPagamentoId { get; set; }
    public virtual VendaPagamento? VendaPagamento { get; set; }
    
    public string Descricao { get; set; } = string.Empty;
    public decimal ValorOriginal { get; set; }
    public decimal ValorPago { get; set; }
    public decimal Saldo { get; set; }
    
    public DateTime DataEmissao { get; set; }
    public DateTime DataVencimento { get; set; }
    public DateTime? DataPagamento { get; set; }
    
    public StatusConta Status { get; set; } = StatusConta.Aberto;
}
"@ | Out-File "$DomainPath\Entities\Financeiro\ContaReceber.cs"

@"
using System;
using GravityCarSystem.Domain.Common;
using GravityCarSystem.Domain.Entities.Cadastros;
using GravityCarSystem.Domain.Enums;

namespace GravityCarSystem.Domain.Entities.Financeiro;

public class ContaPagar : TenantEntity
{
    public Guid FornecedorId { get; set; }
    public virtual Fornecedor? Fornecedor { get; set; }
    
    public Guid CategoriaId { get; set; }
    public virtual CategoriaFinanceira? Categoria { get; set; }
    
    public string Descricao { get; set; } = string.Empty;
    
    public decimal ValorOriginal { get; set; }
    public decimal ValorPago { get; set; }
    public decimal Saldo { get; set; }
    
    public DateTime DataEmissao { get; set; }
    public DateTime DataVencimento { get; set; }
    public DateTime? DataPagamento { get; set; }
    
    public StatusConta Status { get; set; } = StatusConta.Aberto;
}
"@ | Out-File "$DomainPath\Entities\Financeiro\ContaPagar.cs"

@"
using System;
using GravityCarSystem.Domain.Common;

namespace GravityCarSystem.Domain.Entities.Financeiro;

public class CategoriaFinanceira : TenantEntity
{
    public string Nome { get; set; } = string.Empty;
    public byte Tipo { get; set; }
    public bool Ativa { get; set; } = true;
}
"@ | Out-File "$DomainPath\Entities\Financeiro\CategoriaFinanceira.cs"

@"
using System;
using GravityCarSystem.Domain.Common;

namespace GravityCarSystem.Domain.Entities.Financeiro;

public class ContaFinanceira : TenantEntity
{
    public string Nome { get; set; } = string.Empty;
    public string? Banco { get; set; }
    public string? Agencia { get; set; }
    public string? Numero { get; set; }
    public byte Tipo { get; set; }
    public decimal SaldoInicial { get; set; }
    public bool Ativa { get; set; } = true;
}
"@ | Out-File "$DomainPath\Entities\Financeiro\ContaFinanceira.cs"

@"
using System;
using GravityCarSystem.Domain.Common;
using GravityCarSystem.Domain.Entities.Negocio;
using GravityCarSystem.Domain.Entities.Acesso;

namespace GravityCarSystem.Domain.Entities.Financeiro;

public class MovimentoFinanceiro : TenantEntity
{
    public Guid ContaFinanceiraId { get; set; }
    public virtual ContaFinanceira? ContaFinanceira { get; set; }
    
    public Guid CategoriaId { get; set; }
    public virtual CategoriaFinanceira? Categoria { get; set; }
    
    public byte Tipo { get; set; }
    public decimal Valor { get; set; }
    
    public DateTime DataMovimento { get; set; }
    public string? Descricao { get; set; }
    
    public Guid? ContaReceberId { get; set; }
    public virtual ContaReceber? ContaReceber { get; set; }
    
    public Guid? ContaPagarId { get; set; }
    public virtual ContaPagar? ContaPagar { get; set; }
    
    public Guid? VendaId { get; set; }
    public virtual Venda? Venda { get; set; }
    
    public Guid? CompraId { get; set; }
    public virtual Compra? Compra { get; set; }
    
    public Guid? ChequeId { get; set; }
    public virtual Cheque? Cheque { get; set; }
    
    public Guid? UsuarioId { get; set; }
    public virtual Usuario? Usuario { get; set; }
}
"@ | Out-File "$DomainPath\Entities\Financeiro\MovimentoFinanceiro.cs"

# FISCAL
@"
using System;
using System.Collections.Generic;
using GravityCarSystem.Domain.Common;

namespace GravityCarSystem.Domain.Entities.Fiscal;

public class NotaFiscal : TenantEntity
{
    public string ChaveAcesso { get; set; } = string.Empty;
    public string? Numero { get; set; }
    public string? Serie { get; set; }
    
    public byte Tipo { get; set; }
    public DateTime DataEmissao { get; set; }
    
    public string? EmitenteCnpj { get; set; }
    public string? EmitenteNome { get; set; }
    
    public string? DestinatarioCnpj { get; set; }
    public string? DestinatarioNome { get; set; }
    
    public decimal ValorTotal { get; set; }
    
    public string? XmlUrl { get; set; }
    public byte Status { get; set; }
    public DateTime DataImportacao { get; set; } = DateTime.UtcNow;
    
    public virtual ICollection<NotaFiscalItem> Itens { get; set; } = new List<NotaFiscalItem>();
}
"@ | Out-File "$DomainPath\Entities\Fiscal\NotaFiscal.cs"

@"
using System;
using GravityCarSystem.Domain.Common;

namespace GravityCarSystem.Domain.Entities.Fiscal;

public class NotaFiscalItem : Entity
{
    public Guid NotaFiscalId { get; set; }
    public virtual NotaFiscal? NotaFiscal { get; set; }
    
    public string? CodigoProduto { get; set; }
    public string? Descricao { get; set; }
    public decimal Quantidade { get; set; }
    public decimal ValorUnitario { get; set; }
    public decimal ValorTotal { get; set; }
    public string? Ncm { get; set; }
    public string? Cfop { get; set; }
}
"@ | Out-File "$DomainPath\Entities\Fiscal\NotaFiscalItem.cs"

# AUDITORIA
@"
using System;
using GravityCarSystem.Domain.Common;

namespace GravityCarSystem.Domain.Entities.Auditoria;

public class AuditoriaLog : TenantEntity
{
    public Guid UsuarioId { get; set; }
    
    public string Entidade { get; set; } = string.Empty;
    public string EntidadeId { get; set; } = string.Empty;
    
    public string Acao { get; set; } = string.Empty;
    
    public string? DadosAntes { get; set; }
    public string? DadosDepois { get; set; }
    
    public string? Ip { get; set; }
    public DateTime DataHora { get; set; } = DateTime.UtcNow;
}
"@ | Out-File "$DomainPath\Entities\Auditoria\AuditoriaLog.cs"
