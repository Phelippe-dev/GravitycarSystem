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

        builder.HasOne(m => m.Categoria).WithMany().HasForeignKey(m => m.CategoriaId).OnDelete(DeleteBehavior.Restrict);
    }
}
