$InfraPath = "c:\Users\lipeh\OneDrive\Desktop\Gravity Car System\GravityCarSystem.Infrastructure"

# NEGOCIO
@"
using GravityCarSystem.Domain.Entities.Negocio;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GravityCarSystem.Infrastructure.Data.Configurations;

public class VendaConfiguration : IEntityTypeConfiguration<Venda>
{
    public void Configure(EntityTypeBuilder<Venda> builder)
    {
        builder.ToTable("Vendas");
        builder.HasKey(v => v.Id);
        builder.Property(v => v.ValorTotal).HasColumnType("decimal(18,2)");
        builder.Property(v => v.ValorDesconto).HasColumnType("decimal(18,2)");
        builder.HasQueryFilter(x => x.EmpresaId == new System.Guid("00000000-0000-0000-0000-000000000001"));
        builder.HasOne(v => v.Cliente).WithMany().HasForeignKey(v => v.ClienteId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(v => v.Vendedor).WithMany().HasForeignKey(v => v.VendedorId).OnDelete(DeleteBehavior.Restrict);
    }
}
"@ | Out-File "$InfraPath\Data\Configurations\VendaConfiguration.cs"

@"
using GravityCarSystem.Domain.Entities.Negocio;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GravityCarSystem.Infrastructure.Data.Configurations;

public class CompraConfiguration : IEntityTypeConfiguration<Compra>
{
    public void Configure(EntityTypeBuilder<Compra> builder)
    {
        builder.ToTable("Compras");
        builder.HasKey(c => c.Id);
        builder.Property(c => c.ValorTotal).HasColumnType("decimal(18,2)");
        builder.HasQueryFilter(x => x.EmpresaId == new System.Guid("00000000-0000-0000-0000-000000000001"));
        builder.HasOne(c => c.Fornecedor).WithMany().HasForeignKey(c => c.FornecedorId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(c => c.Comprador).WithMany().HasForeignKey(c => c.CompradorId).OnDelete(DeleteBehavior.Restrict);
    }
}
"@ | Out-File "$InfraPath\Data\Configurations\CompraConfiguration.cs"

@"
using GravityCarSystem.Domain.Entities.Negocio;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GravityCarSystem.Infrastructure.Data.Configurations;

public class ChequeConfiguration : IEntityTypeConfiguration<Cheque>
{
    public void Configure(EntityTypeBuilder<Cheque> builder)
    {
        builder.ToTable("Cheques");
        builder.HasKey(c => c.Id);
        builder.Property(c => c.Valor).HasColumnType("decimal(18,2)");
        builder.Property(c => c.Numero).HasMaxLength(50);
        builder.Property(c => c.Banco).HasMaxLength(100);
        builder.HasQueryFilter(x => x.EmpresaId == new System.Guid("00000000-0000-0000-0000-000000000001"));
    }
}
"@ | Out-File "$InfraPath\Data\Configurations\ChequeConfiguration.cs"


# FINANCEIRO E FISCAL
@"
using GravityCarSystem.Domain.Entities.Financeiro;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GravityCarSystem.Infrastructure.Data.Configurations;

public class ContaPagarConfiguration : IEntityTypeConfiguration<ContaPagar>
{
    public void Configure(EntityTypeBuilder<ContaPagar> builder)
    {
        builder.ToTable("ContasPagar");
        builder.HasKey(cp => cp.Id);
        builder.Property(cp => cp.ValorOriginal).HasColumnType("decimal(18,2)");
        builder.Property(cp => cp.ValorPago).HasColumnType("decimal(18,2)");
        builder.Property(cp => cp.Acrescimo).HasColumnType("decimal(18,2)");
        builder.Property(cp => cp.Desconto).HasColumnType("decimal(18,2)");
        builder.HasQueryFilter(x => x.EmpresaId == new System.Guid("00000000-0000-0000-0000-000000000001"));
        builder.HasOne(cp => cp.Fornecedor).WithMany().HasForeignKey(cp => cp.FornecedorId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(cp => cp.Categoria).WithMany().HasForeignKey(cp => cp.CategoriaId).OnDelete(DeleteBehavior.Restrict);
    }
}
"@ | Out-File "$InfraPath\Data\Configurations\ContaPagarConfiguration.cs"

@"
using GravityCarSystem.Domain.Entities.Financeiro;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GravityCarSystem.Infrastructure.Data.Configurations;

public class ContaReceberConfiguration : IEntityTypeConfiguration<ContaReceber>
{
    public void Configure(EntityTypeBuilder<ContaReceber> builder)
    {
        builder.ToTable("ContasReceber");
        builder.HasKey(cr => cr.Id);
        builder.Property(cr => cr.ValorOriginal).HasColumnType("decimal(18,2)");
        builder.Property(cr => cr.ValorRecebido).HasColumnType("decimal(18,2)");
        builder.Property(cr => cr.Acrescimo).HasColumnType("decimal(18,2)");
        builder.Property(cr => cr.Desconto).HasColumnType("decimal(18,2)");
        builder.HasQueryFilter(x => x.EmpresaId == new System.Guid("00000000-0000-0000-0000-000000000001"));
        builder.HasOne(cr => cr.Cliente).WithMany().HasForeignKey(cr => cr.ClienteId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(cr => cr.Categoria).WithMany().HasForeignKey(cr => cr.CategoriaId).OnDelete(DeleteBehavior.Restrict);
    }
}
"@ | Out-File "$InfraPath\Data\Configurations\ContaReceberConfiguration.cs"

@"
using GravityCarSystem.Domain.Entities.Financeiro;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GravityCarSystem.Infrastructure.Data.Configurations;

public class MovimentoFinanceiroConfiguration : IEntityTypeConfiguration<MovimentoFinanceiro>
{
    public void Configure(EntityTypeBuilder<MovimentoFinanceiro> builder)
    {
        builder.ToTable("MovimentosFinanceiros");
        builder.HasKey(m => m.Id);
        builder.Property(m => m.Valor).HasColumnType("decimal(18,2)");
        builder.HasQueryFilter(x => x.EmpresaId == new System.Guid("00000000-0000-0000-0000-000000000001"));
        builder.HasOne(m => m.Conta).WithMany().HasForeignKey(m => m.ContaId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(m => m.Categoria).WithMany().HasForeignKey(m => m.CategoriaId).OnDelete(DeleteBehavior.Restrict);
    }
}
"@ | Out-File "$InfraPath\Data\Configurations\MovimentoFinanceiroConfiguration.cs"
