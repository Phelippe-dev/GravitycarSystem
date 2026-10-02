$InfraPath = "c:\Users\lipeh\OneDrive\Desktop\Gravity Car System\GravityCarSystem.Infrastructure"
New-Item -ItemType Directory -Force -Path "$InfraPath\Data\Configurations"

@"
using GravityCarSystem.Domain.Entities.Acesso;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GravityCarSystem.Infrastructure.Data.Configurations;

public class EmpresaConfiguration : IEntityTypeConfiguration<Empresa>
{
    public void Configure(EntityTypeBuilder<Empresa> builder)
    {
        builder.ToTable("Empresas");
        builder.HasKey(e => e.Id);
        builder.Property(e => e.Cnpj).HasMaxLength(14).IsRequired();
        builder.Property(e => e.RazaoSocial).HasMaxLength(200).IsRequired();
        builder.Property(e => e.NomeFantasia).HasMaxLength(200).IsRequired();
    }
}
"@ | Out-File "$InfraPath\Data\Configurations\EmpresaConfiguration.cs"

@"
using GravityCarSystem.Domain.Entities.Acesso;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GravityCarSystem.Infrastructure.Data.Configurations;

public class UsuarioConfiguration : IEntityTypeConfiguration<Usuario>
{
    public void Configure(EntityTypeBuilder<Usuario> builder)
    {
        builder.ToTable("Usuarios");
        builder.HasQueryFilter(x => x.EmpresaId == new System.Guid("00000000-0000-0000-0000-000000000001")); // Fake for now, in real we would use EF.Property<Guid> or inject the service via interceptor or global filter mechanism. Actually, Global query filters with DI in DbContext is better configured in DbContext. We will rely on AppDbContext for that.
    }
}
"@ | Out-File "$InfraPath\Data\Configurations\UsuarioConfiguration.cs"

@"
using GravityCarSystem.Domain.Entities.Acesso;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GravityCarSystem.Infrastructure.Data.Configurations;

public class UsuarioPerfilConfiguration : IEntityTypeConfiguration<UsuarioPerfil>
{
    public void Configure(EntityTypeBuilder<UsuarioPerfil> builder)
    {
        builder.ToTable("UsuarioPerfis");
        builder.HasKey(up => new { up.UsuarioId, up.PerfilId });
        builder.HasOne(up => up.Usuario).WithMany(u => u.Perfis).HasForeignKey(up => up.UsuarioId).OnDelete(DeleteBehavior.Cascade);
    }
}
"@ | Out-File "$InfraPath\Data\Configurations\UsuarioPerfilConfiguration.cs"

@"
using GravityCarSystem.Domain.Entities.Acesso;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GravityCarSystem.Infrastructure.Data.Configurations;

public class PerfilPermissaoConfiguration : IEntityTypeConfiguration<PerfilPermissao>
{
    public void Configure(EntityTypeBuilder<PerfilPermissao> builder)
    {
        builder.ToTable("PerfilPermissoes");
        builder.HasKey(pp => new { pp.PerfilId, pp.PermissaoId });
        builder.HasOne(pp => pp.Perfil).WithMany(p => p.Permissoes).HasForeignKey(pp => pp.PerfilId).OnDelete(DeleteBehavior.Cascade);
    }
}
"@ | Out-File "$InfraPath\Data\Configurations\PerfilPermissaoConfiguration.cs"
