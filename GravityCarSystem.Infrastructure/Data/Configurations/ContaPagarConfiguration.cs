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


        builder.HasQueryFilter(x => x.EmpresaId == new System.Guid("00000000-0000-0000-0000-000000000001"));
        builder.HasOne(cp => cp.Fornecedor).WithMany().HasForeignKey(cp => cp.FornecedorId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(cp => cp.Categoria).WithMany().HasForeignKey(cp => cp.CategoriaId).OnDelete(DeleteBehavior.Restrict);
    }
}
