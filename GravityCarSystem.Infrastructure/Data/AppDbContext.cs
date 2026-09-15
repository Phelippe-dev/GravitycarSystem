using System;
using System.Linq;
using System.Linq.Expressions;
using System.Reflection;
using GravityCarSystem.Application.Interfaces;
using GravityCarSystem.Domain.Common;
using GravityCarSystem.Domain.Entities.Acesso;
using GravityCarSystem.Domain.Entities.Auditoria;
using GravityCarSystem.Domain.Entities.Cadastros;
using GravityCarSystem.Domain.Entities.Financeiro;
using GravityCarSystem.Domain.Entities.Fiscal;
using GravityCarSystem.Domain.Entities.Negocio;
using System.Threading;
using System.Threading.Tasks;
using GravityCarSystem.Domain.Entities.Veiculos;
using Microsoft.EntityFrameworkCore;

namespace GravityCarSystem.Infrastructure.Data;

public class AppDbContext : DbContext, IAppDbContext
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
    public DbSet<HistoricoRecarga> HistoricoRecargas => Set<HistoricoRecarga>();
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

        // =====================================================================
        // QUERY FILTERS DINÂMICOS — Multi-Tenant
        // Aplica filtro automático por EmpresaId em TODAS as entidades que
        // herdam de TenantEntity. O EmpresaId vem do JWT do usuário logado.
        // =====================================================================
        foreach (var entityType in builder.Model.GetEntityTypes())
        {
            if (typeof(TenantEntity).IsAssignableFrom(entityType.ClrType))
            {
                var method = typeof(AppDbContext)
                    .GetMethod(nameof(ApplyTenantFilter), BindingFlags.NonPublic | BindingFlags.Instance)!
                    .MakeGenericMethod(entityType.ClrType);
                method.Invoke(this, new object[] { builder });
            }
        }
    }

    /// <summary>
    /// Aplica HasQueryFilter dinâmico para uma entidade TenantEntity.
    /// O filtro captura _currentTenantService por referência, garantindo
    /// que o EmpresaId é avaliado a cada query (não em tempo de compilação).
    /// </summary>
    private void ApplyTenantFilter<TEntity>(ModelBuilder builder) where TEntity : TenantEntity
    {
        builder.Entity<TEntity>().HasQueryFilter(e => e.EmpresaId == _currentTenantService.GetEmpresaId());
    }

    public override int SaveChanges()
    {
        SetTenantIdOnAddedEntities();
        return base.SaveChanges();
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        SetTenantIdOnAddedEntities();
        return base.SaveChangesAsync(cancellationToken);
    }

    private void SetTenantIdOnAddedEntities()
    {
        var tenantId = _currentTenantService.GetEmpresaId();
        // Se nulo ou Guid.Empty, significa que não tem usuário logado ou é um seed do sistema.
        if (tenantId == null || tenantId == Guid.Empty) return;

        foreach (var entry in ChangeTracker.Entries<TenantEntity>().Where(e => e.State == EntityState.Added))
        {
            if (entry.Entity.EmpresaId == Guid.Empty)
            {
                entry.Entity.EmpresaId = tenantId.Value;
            }
        }
    }
}

