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

    }
}
