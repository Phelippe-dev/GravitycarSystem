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


        builder.HasQueryFilter(x => x.EmpresaId == new System.Guid("00000000-0000-0000-0000-000000000001"));
        builder.HasOne(v => v.Cliente).WithMany().HasForeignKey(v => v.ClienteId).OnDelete(DeleteBehavior.Restrict);

    }
}
