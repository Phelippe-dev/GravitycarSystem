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



        builder.HasQueryFilter(x => x.EmpresaId == new System.Guid("00000000-0000-0000-0000-000000000001"));
        builder.HasOne(cr => cr.Cliente).WithMany().HasForeignKey(cr => cr.ClienteId).OnDelete(DeleteBehavior.Restrict);

    }
}
