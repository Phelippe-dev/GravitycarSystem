$DomainPath = "c:\Users\lipeh\OneDrive\Desktop\Gravity Car System\GravityCarSystem.Domain"

# NEGOCIO
@"
using System;
using System.Collections.Generic;
using GravityCarSystem.Domain.Common;
using GravityCarSystem.Domain.Entities.Cadastros;

namespace GravityCarSystem.Domain.Entities.Negocio;

public class Compra : TenantEntity
{
    public Guid FornecedorId { get; set; }
    public virtual Fornecedor? Fornecedor { get; set; }
    
    public Guid? ClienteId { get; set; }
    public virtual Cliente? Cliente { get; set; }
    
    public string? NumeroDocumento { get; set; }
    public DateTime DataCompra { get; set; }
    public decimal ValorTotal { get; set; }
    
    public byte Status { get; set; }
    public string? Observacao { get; set; }
    
    public virtual ICollection<CompraVeiculo> Veiculos { get; set; } = new List<CompraVeiculo>();
}
"@ | Out-File "$DomainPath\Entities\Negocio\Compra.cs"

@"
using System;
using GravityCarSystem.Domain.Common;
using GravityCarSystem.Domain.Entities.Veiculos;

namespace GravityCarSystem.Domain.Entities.Negocio;

public class CompraVeiculo : Entity
{
    public Guid CompraId { get; set; }
    public virtual Compra? Compra { get; set; }
    
    public Guid VeiculoId { get; set; }
    public virtual Veiculo? Veiculo { get; set; }
    
    public decimal ValorCompra { get; set; }
}
"@ | Out-File "$DomainPath\Entities\Negocio\CompraVeiculo.cs"

@"
using System;
using System.Collections.Generic;
using GravityCarSystem.Domain.Common;
using GravityCarSystem.Domain.Entities.Acesso;
using GravityCarSystem.Domain.Entities.Cadastros;
using GravityCarSystem.Domain.Enums;

namespace GravityCarSystem.Domain.Entities.Negocio;

public class Venda : TenantEntity
{
    public Guid ClienteId { get; set; }
    public virtual Cliente? Cliente { get; set; }
    
    public Guid UsuarioId { get; set; }
    public virtual Usuario? Usuario { get; set; }
    
    public string? NumeroVenda { get; set; }
    public DateTime DataVenda { get; set; }
    
    public decimal ValorBruto { get; set; }
    public decimal Desconto { get; set; }
    public decimal ValorLiquido { get; set; }
    
    public StatusVenda Status { get; set; } = StatusVenda.Pendente;
    public string? Observacoes { get; set; }
    
    public virtual ICollection<VendaVeiculo> Veiculos { get; set; } = new List<VendaVeiculo>();
    public virtual ICollection<VendaPagamento> Pagamentos { get; set; } = new List<VendaPagamento>();
    public virtual ICollection<VendaTroca> Trocas { get; set; } = new List<VendaTroca>();
}
"@ | Out-File "$DomainPath\Entities\Negocio\Venda.cs"

@"
using System;
using GravityCarSystem.Domain.Common;
using GravityCarSystem.Domain.Entities.Veiculos;

namespace GravityCarSystem.Domain.Entities.Negocio;

public class VendaVeiculo : Entity
{
    public Guid VendaId { get; set; }
    public virtual Venda? Venda { get; set; }
    
    public Guid VeiculoId { get; set; }
    public virtual Veiculo? Veiculo { get; set; }
    
    public decimal ValorVenda { get; set; }
}
"@ | Out-File "$DomainPath\Entities\Negocio\VendaVeiculo.cs"

@"
using System;
using GravityCarSystem.Domain.Common;
using GravityCarSystem.Domain.Enums;

namespace GravityCarSystem.Domain.Entities.Negocio;

public class VendaPagamento : Entity
{
    public Guid VendaId { get; set; }
    public virtual Venda? Venda { get; set; }
    
    public TipoPagamento TipoPagamento { get; set; }
    public decimal Valor { get; set; }
    public DateTime? DataVencimento { get; set; }
    public byte Status { get; set; }
    public string? Observacao { get; set; }
}
"@ | Out-File "$DomainPath\Entities\Negocio\VendaPagamento.cs"

@"
using System;
using GravityCarSystem.Domain.Common;
using GravityCarSystem.Domain.Entities.Cadastros;
using GravityCarSystem.Domain.Entities.Veiculos;

namespace GravityCarSystem.Domain.Entities.Negocio;

public class VendaTroca : Entity
{
    public Guid VendaId { get; set; }
    public virtual Venda? Venda { get; set; }
    
    public Guid VeiculoId { get; set; }
    public virtual Veiculo? Veiculo { get; set; }
    
    public Guid ClienteId { get; set; }
    public virtual Cliente? Cliente { get; set; }
    
    public decimal ValorAtribuido { get; set; }
    public decimal ValorAvaliacao { get; set; }
    public string? Observacoes { get; set; }
}
"@ | Out-File "$DomainPath\Entities\Negocio\VendaTroca.cs"

@"
using System;
using GravityCarSystem.Domain.Common;
using GravityCarSystem.Domain.Entities.Cadastros;
using GravityCarSystem.Domain.Enums;

namespace GravityCarSystem.Domain.Entities.Negocio;

public class Cheque : TenantEntity
{
    public Guid? VendaPagamentoId { get; set; }
    public virtual VendaPagamento? VendaPagamento { get; set; }
    
    public Guid ClienteId { get; set; }
    public virtual Cliente? Cliente { get; set; }
    
    public string? Banco { get; set; }
    public string? Agencia { get; set; }
    public string? Conta { get; set; }
    public string? NumeroCheque { get; set; }
    
    public decimal Valor { get; set; }
    public DateTime DataEmissao { get; set; }
    public DateTime DataBomPara { get; set; }
    
    public StatusCheque Status { get; set; } = StatusCheque.Recebido;
    public DateTime? DataDeposito { get; set; }
    public DateTime? DataCompensacao { get; set; }
    
    public string? Observacao { get; set; }
}
"@ | Out-File "$DomainPath\Entities\Negocio\Cheque.cs"
