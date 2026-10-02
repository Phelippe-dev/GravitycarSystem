$InfraPath = "c:\Users\lipeh\OneDrive\Desktop\Gravity Car System\GravityCarSystem.Infrastructure"
$AppPath = "c:\Users\lipeh\OneDrive\Desktop\Gravity Car System\GravityCarSystem.Application"

New-Item -ItemType Directory -Force -Path "$AppPath\Interfaces"
New-Item -ItemType Directory -Force -Path "$InfraPath\Data"
New-Item -ItemType Directory -Force -Path "$InfraPath\Data\Interceptors"
New-Item -ItemType Directory -Force -Path "$InfraPath\Services"

# Interfaces na Application
@"
using System;

namespace GravityCarSystem.Application.Interfaces;

public interface ICurrentTenantService
{
    Guid? GetEmpresaId();
}
"@ | Out-File "$AppPath\Interfaces\ICurrentTenantService.cs"

# Serviços na Infra
@"
using System;
using GravityCarSystem.Application.Interfaces;

namespace GravityCarSystem.Infrastructure.Services;

// Implementação Fake inicial para permitir compilar e rodar Migrations
public class FakeCurrentTenantService : ICurrentTenantService
{
    public Guid? GetEmpresaId()
    {
        return Guid.Parse("00000000-0000-0000-0000-000000000001");
    }
}
"@ | Out-File "$InfraPath\Services\FakeCurrentTenantService.cs"

# Interceptor
@"
using System;
using System.Threading;
using System.Threading.Tasks;
using GravityCarSystem.Domain.Common;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;

namespace GravityCarSystem.Infrastructure.Data.Interceptors;

public class AuditableEntitySaveChangesInterceptor : SaveChangesInterceptor
{
    public override InterceptionResult<int> SavingChanges(DbContextEventData eventData, InterceptionResult<int> result)
    {
        UpdateEntities(eventData.Context);
        return base.SavingChanges(eventData, result);
    }

    public override ValueTask<InterceptionResult<int>> SavingChangesAsync(DbContextEventData eventData, InterceptionResult<int> result, CancellationToken cancellationToken = default)
    {
        UpdateEntities(eventData.Context);
        return base.SavingChangesAsync(eventData, result, cancellationToken);
    }

    public void UpdateEntities(DbContext? context)
    {
        if (context == null) return;

        foreach (var entry in context.ChangeTracker.Entries<AuditableEntity>())
        {
            if (entry.State == EntityState.Added)
            {
                entry.Entity.DataCadastro = DateTime.UtcNow;
            }
            if (entry.State == EntityState.Added || entry.State == EntityState.Modified)
            {
                entry.Entity.DataAtualizacao = DateTime.UtcNow;
            }
        }
    }
}
"@ | Out-File "$InfraPath\Data\Interceptors\AuditableEntitySaveChangesInterceptor.cs"

# AppDbContext
@"
using System;
using System.Reflection;
using GravityCarSystem.Application.Interfaces;
using GravityCarSystem.Domain.Entities.Acesso;
using GravityCarSystem.Domain.Entities.Auditoria;
using GravityCarSystem.Domain.Entities.Cadastros;
using GravityCarSystem.Domain.Entities.Financeiro;
using GravityCarSystem.Domain.Entities.Fiscal;
using GravityCarSystem.Domain.Entities.Negocio;
using GravityCarSystem.Domain.Entities.Veiculos;
using Microsoft.EntityFrameworkCore;

namespace GravityCarSystem.Infrastructure.Data;

public class AppDbContext : DbContext
{
    private readonly ICurrentTenantService _currentTenantService;

    public AppDbContext(
        DbContextOptions<AppDbContext> options,
        ICurrentTenantService currentTenantService) 
        : base(options)
    {
        _currentTenantService = currentTenantService;
    }

    // Acesso
    public DbSet<Empresa> Empresas => Set<Empresa>();
    public DbSet<Usuario> Usuarios => Set<Usuario>();
    public DbSet<Perfil> Perfis => Set<Perfil>();
    public DbSet<Permissao> Permissoes => Set<Permissao>();
    public DbSet<UsuarioPerfil> UsuarioPerfis => Set<UsuarioPerfil>();
    public DbSet<PerfilPermissao> PerfilPermissoes => Set<PerfilPermissao>();

    // Cadastros
    public DbSet<Cliente> Clientes => Set<Cliente>();
    public DbSet<Fornecedor> Fornecedores => Set<Fornecedor>();

    // Veiculos
    public DbSet<Veiculo> Veiculos => Set<Veiculo>();
    public DbSet<VeiculoFoto> VeiculoFotos => Set<VeiculoFoto>();
    public DbSet<VeiculoDocumento> VeiculoDocumentos => Set<VeiculoDocumento>();
    public DbSet<VeiculoCusto> VeiculoCustos => Set<VeiculoCusto>();
    public DbSet<VeiculoHistorico> VeiculoHistoricos => Set<VeiculoHistorico>();
    public DbSet<VeiculoConsulta> VeiculoConsultas => Set<VeiculoConsulta>();
    public DbSet<Avaliacao> Avaliacoes => Set<Avaliacao>();
    public DbSet<AvaliacaoItem> AvaliacaoItens => Set<AvaliacaoItem>();

    // Negocio
    public DbSet<Compra> Compras => Set<Compra>();
    public DbSet<CompraVeiculo> CompraVeiculos => Set<CompraVeiculo>();
    public DbSet<Venda> Vendas => Set<Venda>();
    public DbSet<VendaVeiculo> VendaVeiculos => Set<VendaVeiculo>();
    public DbSet<VendaPagamento> VendaPagamentos => Set<VendaPagamento>();
    public DbSet<VendaTroca> VendaTrocas => Set<VendaTroca>();
    public DbSet<Cheque> Cheques => Set<Cheque>();

    // Financeiro
    public DbSet<ContaReceber> ContasReceber => Set<ContaReceber>();
    public DbSet<ContaPagar> ContasPagar => Set<ContaPagar>();
    public DbSet<CategoriaFinanceira> CategoriasFinanceiras => Set<CategoriaFinanceira>();
    public DbSet<ContaFinanceira> ContasFinanceiras => Set<ContaFinanceira>();
    public DbSet<MovimentoFinanceiro> MovimentosFinanceiros => Set<MovimentoFinanceiro>();

    // Fiscal e Auditoria
    public DbSet<NotaFiscal> NotasFiscais => Set<NotaFiscal>();
    public DbSet<NotaFiscalItem> NotaFiscalItens => Set<NotaFiscalItem>();
    public DbSet<AuditoriaLog> AuditoriaLogs => Set<AuditoriaLog>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);
        
        // Aplica todas as configurações de IEntityTypeConfiguration<T> da assembly atual
        builder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());
    }
}
"@ | Out-File "$InfraPath\Data\AppDbContext.cs"
