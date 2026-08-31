$InfraPath = "c:\Users\lipeh\OneDrive\Desktop\Gravity Car System\GravityCarSystem.Infrastructure"

# CADASTROS
@"
using GravityCarSystem.Domain.Entities.Cadastros;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GravityCarSystem.Infrastructure.Data.Configurations;

public class ClienteConfiguration : IEntityTypeConfiguration<Cliente>
{
    public void Configure(EntityTypeBuilder<Cliente> builder)
    {
        builder.ToTable("Clientes");
        builder.HasKey(c => c.Id);
        builder.Property(c => c.NomeRazaoSocial).HasMaxLength(200).IsRequired();
        builder.Property(c => c.CpfCnpj).HasMaxLength(14);
        builder.Property(c => c.Email).HasMaxLength(150);
        builder.Property(c => c.Telefone).HasMaxLength(20);
        builder.HasQueryFilter(x => x.EmpresaId == new System.Guid("00000000-0000-0000-0000-000000000001"));
    }
}
"@ | Out-File "$InfraPath\Data\Configurations\ClienteConfiguration.cs"

@"
using GravityCarSystem.Domain.Entities.Cadastros;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GravityCarSystem.Infrastructure.Data.Configurations;

public class FornecedorConfiguration : IEntityTypeConfiguration<Fornecedor>
{
    public void Configure(EntityTypeBuilder<Fornecedor> builder)
    {
        builder.ToTable("Fornecedores");
        builder.HasKey(f => f.Id);
        builder.Property(f => f.NomeRazaoSocial).HasMaxLength(200).IsRequired();
        builder.Property(f => f.CpfCnpj).HasMaxLength(14);
        builder.Property(f => f.Email).HasMaxLength(150);
        builder.HasQueryFilter(x => x.EmpresaId == new System.Guid("00000000-0000-0000-0000-000000000001"));
    }
}
"@ | Out-File "$InfraPath\Data\Configurations\FornecedorConfiguration.cs"

# VEICULOS
@"
using GravityCarSystem.Domain.Entities.Veiculos;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GravityCarSystem.Infrastructure.Data.Configurations;

public class VeiculoConfiguration : IEntityTypeConfiguration<Veiculo>
{
    public void Configure(EntityTypeBuilder<Veiculo> builder)
    {
        builder.ToTable("Veiculos");
        builder.HasKey(v => v.Id);
        builder.Property(v => v.Placa).HasMaxLength(10);
        builder.Property(v => v.Chassi).HasMaxLength(30);
        builder.Property(v => v.Renavam).HasMaxLength(20);
        builder.Property(v => v.Marca).HasMaxLength(100).IsRequired();
        builder.Property(v => v.Modelo).HasMaxLength(150).IsRequired();
        builder.Property(v => v.ValorCompra).HasColumnType("decimal(18,2)");
        builder.Property(v => v.ValorVenda).HasColumnType("decimal(18,2)");
        builder.HasQueryFilter(x => x.EmpresaId == new System.Guid("00000000-0000-0000-0000-000000000001"));
    }
}
"@ | Out-File "$InfraPath\Data\Configurations\VeiculoConfiguration.cs"

@"
using GravityCarSystem.Domain.Entities.Veiculos;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GravityCarSystem.Infrastructure.Data.Configurations;

public class AvaliacaoConfiguration : IEntityTypeConfiguration<Avaliacao>
{
    public void Configure(EntityTypeBuilder<Avaliacao> builder)
    {
        builder.ToTable("Avaliacoes");
        builder.HasKey(a => a.Id);
        builder.Property(a => a.ValorMercado).HasColumnType("decimal(18,2)");
        builder.Property(a => a.ValorAvaliacao).HasColumnType("decimal(18,2)");
        builder.Property(a => a.ValorAprovado).HasColumnType("decimal(18,2)");
        builder.HasQueryFilter(x => x.EmpresaId == new System.Guid("00000000-0000-0000-0000-000000000001"));
        
        // Disable cascade deletes for foreign keys
        builder.HasOne(a => a.Cliente).WithMany().HasForeignKey(a => a.ClienteId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(a => a.Veiculo).WithMany().HasForeignKey(a => a.VeiculoId).OnDelete(DeleteBehavior.Restrict);
    }
}
"@ | Out-File "$InfraPath\Data\Configurations\AvaliacaoConfiguration.cs"

@"
using GravityCarSystem.Domain.Entities.Veiculos;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GravityCarSystem.Infrastructure.Data.Configurations;

public class AvaliacaoItemConfiguration : IEntityTypeConfiguration<AvaliacaoItem>
{
    public void Configure(EntityTypeBuilder<AvaliacaoItem> builder)
    {
        builder.ToTable("AvaliacaoItens");
        builder.HasKey(ai => ai.Id);
        builder.Property(ai => ai.CustoEstimado).HasColumnType("decimal(18,2)");
        builder.Property(ai => ai.Categoria).HasMaxLength(100);
        builder.Property(ai => ai.Item).HasMaxLength(200);
    }
}
"@ | Out-File "$InfraPath\Data\Configurations\AvaliacaoItemConfiguration.cs"

@"
using GravityCarSystem.Domain.Entities.Veiculos;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GravityCarSystem.Infrastructure.Data.Configurations;

public class VeiculoCustoConfiguration : IEntityTypeConfiguration<VeiculoCusto>
{
    public void Configure(EntityTypeBuilder<VeiculoCusto> builder)
    {
        builder.ToTable("VeiculoCustos");
        builder.HasKey(vc => vc.Id);
        builder.Property(vc => vc.Valor).HasColumnType("decimal(18,2)");
        builder.HasOne(vc => vc.Categoria).WithMany().HasForeignKey(vc => vc.CategoriaId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(vc => vc.Fornecedor).WithMany().HasForeignKey(vc => vc.FornecedorId).OnDelete(DeleteBehavior.SetNull);
    }
}
"@ | Out-File "$InfraPath\Data\Configurations\VeiculoCustoConfiguration.cs"
