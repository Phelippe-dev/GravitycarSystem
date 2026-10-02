$DomainPath = "c:\Users\lipeh\OneDrive\Desktop\Gravity Car System\GravityCarSystem.Domain"

New-Item -ItemType Directory -Force -Path "$DomainPath\Common"
New-Item -ItemType Directory -Force -Path "$DomainPath\Enums"
New-Item -ItemType Directory -Force -Path "$DomainPath\Entities\Acesso"
New-Item -ItemType Directory -Force -Path "$DomainPath\Entities\Cadastros"
New-Item -ItemType Directory -Force -Path "$DomainPath\Entities\Veiculos"
New-Item -ItemType Directory -Force -Path "$DomainPath\Entities\Negocio"
New-Item -ItemType Directory -Force -Path "$DomainPath\Entities\Financeiro"
New-Item -ItemType Directory -Force -Path "$DomainPath\Entities\Fiscal"
New-Item -ItemType Directory -Force -Path "$DomainPath\Entities\Auditoria"

# Remove Class1.cs se existir
$class1 = "$DomainPath\Class1.cs"
if (Test-Path $class1) { Remove-Item $class1 -Force }

# COMMON
@"
using System;
namespace GravityCarSystem.Domain.Common;
public abstract class Entity
{
    public Guid Id { get; set; } = Guid.NewGuid();
}
"@ | Out-File "$DomainPath\Common\Entity.cs"

@"
using System;
namespace GravityCarSystem.Domain.Common;
public abstract class AuditableEntity : Entity
{
    public DateTime DataCadastro { get; set; } = DateTime.UtcNow;
    public DateTime? DataAtualizacao { get; set; }
}
"@ | Out-File "$DomainPath\Common\AuditableEntity.cs"

@"
using System;
namespace GravityCarSystem.Domain.Common;
public abstract class TenantEntity : AuditableEntity
{
    public Guid EmpresaId { get; set; }
}
"@ | Out-File "$DomainPath\Common\TenantEntity.cs"

# ENUMS
@"
namespace GravityCarSystem.Domain.Enums;
public enum StatusVeiculo : byte
{
    EmAvaliacao = 1,
    EmCompra = 2,
    EmPreparacao = 3,
    Disponivel = 4,
    Reservado = 5,
    Vendido = 6,
    Devolvido = 7,
    Bloqueado = 8
}
"@ | Out-File "$DomainPath\Enums\StatusVeiculo.cs"

@"
namespace GravityCarSystem.Domain.Enums;
public enum TipoDocumento : byte
{
    CRLV = 1, ATPV = 2, NFe = 3, Laudo = 4, Contrato = 5, Recibo = 6, Outro = 7
}
"@ | Out-File "$DomainPath\Enums\TipoDocumento.cs"

@"
namespace GravityCarSystem.Domain.Enums;
public enum StatusAvaliacao : byte
{
    Pendente = 1, Aprovada = 2, Recusada = 3, ConvertidaEmCompra = 4, ConvertidaEmTroca = 5
}
"@ | Out-File "$DomainPath\Enums\StatusAvaliacao.cs"

@"
namespace GravityCarSystem.Domain.Enums;
public enum StatusChecklist : byte
{
    Ok = 1, Atencao = 2, Trocar = 3
}
"@ | Out-File "$DomainPath\Enums\StatusChecklist.cs"

@"
namespace GravityCarSystem.Domain.Enums;
public enum StatusVenda : byte
{
    Pendente = 1, Concluida = 2, Cancelada = 3
}
"@ | Out-File "$DomainPath\Enums\StatusVenda.cs"

@"
namespace GravityCarSystem.Domain.Enums;
public enum TipoPagamento : byte
{
    Dinheiro = 1, Pix = 2, CartaoCredito = 3, CartaoDebito = 4, Cheque = 5, Financiamento = 6, Boleto = 7, Transferencia = 8, Troca = 9, Outro = 10
}
"@ | Out-File "$DomainPath\Enums\TipoPagamento.cs"

@"
namespace GravityCarSystem.Domain.Enums;
public enum StatusCheque : byte
{
    Recebido = 1, Custodia = 2, Depositado = 3, Compensado = 4, Devolvido = 5, Reapresentado = 6, Cancelado = 7
}
"@ | Out-File "$DomainPath\Enums\StatusCheque.cs"

@"
namespace GravityCarSystem.Domain.Enums;
public enum StatusConta : byte
{
    Aberto = 1, Parcial = 2, Pago = 3, Vencido = 4, Cancelado = 5
}
"@ | Out-File "$DomainPath\Enums\StatusConta.cs"

@"
namespace GravityCarSystem.Domain.Enums;
public enum TipoPessoa : byte
{
    Fisica = 1, Juridica = 2
}
"@ | Out-File "$DomainPath\Enums\TipoPessoa.cs"
