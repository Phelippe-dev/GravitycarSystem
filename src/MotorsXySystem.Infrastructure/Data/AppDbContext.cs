using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using MotorsXySystem.Application.Interfaces;
using MotorsXySystem.Domain.Comum;
using MotorsXySystem.Domain.Entidades.Tenant;
using MotorsXySystem.Domain.Entidades.Veiculos;
using MotorsXySystem.Domain.Entidades.Cadastros;
using MotorsXySystem.Domain.Entidades.Negocio;
using MotorsXySystem.Domain.Entidades.Financeiro;
using MotorsXySystem.Domain.Entidades.Acesso;
using MotorsXySystem.Domain.Entidades.Auditoria;
using MotorsXySystem.Domain.Entidades.Crm;
using MotorsXySystem.Domain.Entidades.Documentos;
using MotorsXySystem.Domain.Entidades.Fiscal;

namespace MotorsXySystem.Infrastructure.Data;

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

    // Tenant
    public DbSet<Empresa> Empresas => Set<Empresa>();
    public DbSet<Assinatura> Assinaturas => Set<Assinatura>();

    // Acesso
    public DbSet<Usuario> Usuarios => Set<Usuario>();
    public DbSet<Perfil> Perfis => Set<Perfil>();

    // Veiculos
    public DbSet<Veiculo> Veiculos => Set<Veiculo>();
    public DbSet<VeiculoCusto> VeiculoCustos => Set<VeiculoCusto>();
    public DbSet<VeiculoAcessorio> VeiculoAcessorios => Set<VeiculoAcessorio>();
    public DbSet<VeiculoInspecao> VeiculoInspecoes => Set<VeiculoInspecao>();

    // Cadastros
    public DbSet<Cliente> Clientes => Set<Cliente>();

    // Negocio
    public DbSet<Venda> Vendas => Set<Venda>();
    public DbSet<VendaVeiculo> VendaVeiculos => Set<VendaVeiculo>();

    // Financeiro
    public DbSet<ContaReceber> ContasReceber => Set<ContaReceber>();
    public DbSet<ContaPagar> ContasPagar => Set<ContaPagar>();
    public DbSet<MovimentoFinanceiro> MovimentosFinanceiros => Set<MovimentoFinanceiro>();
    public DbSet<Cheque> Cheques => Set<Cheque>();

    // Fiscal
    public DbSet<NotaFiscal> NotasFiscais => Set<NotaFiscal>();

    // Auditoria
    public DbSet<AuditoriaLog> AuditoriaLogs => Set<AuditoriaLog>();

    // CRM
    public DbSet<Lead> Leads => Set<Lead>();
    public DbSet<LeadInteracao> LeadInteracoes => Set<LeadInteracao>();

    // Documentos
    public DbSet<ReciboVenda> Recibos => Set<ReciboVenda>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);
        
        // =====================================================================
        // QUERY FILTERS DINÂMICOS — Multi-Tenant (Isolamento de Dados via EF Core)
        // =====================================================================
        builder.Entity<Veiculo>().HasQueryFilter(e => _currentTenantService.ObterEmpresaId() == null || e.EmpresaId == _currentTenantService.ObterEmpresaId());
        builder.Entity<VeiculoCusto>().HasQueryFilter(e => _currentTenantService.ObterEmpresaId() == null || e.EmpresaId == _currentTenantService.ObterEmpresaId());
        builder.Entity<VeiculoAcessorio>().HasQueryFilter(e => _currentTenantService.ObterEmpresaId() == null || e.EmpresaId == _currentTenantService.ObterEmpresaId());
        builder.Entity<VeiculoInspecao>().HasQueryFilter(e => _currentTenantService.ObterEmpresaId() == null || e.EmpresaId == _currentTenantService.ObterEmpresaId());
        
        builder.Entity<Usuario>().HasQueryFilter(e => _currentTenantService.ObterEmpresaId() == null || e.EmpresaId == _currentTenantService.ObterEmpresaId());
        builder.Entity<Perfil>().HasQueryFilter(e => _currentTenantService.ObterEmpresaId() == null || e.EmpresaId == _currentTenantService.ObterEmpresaId());
        builder.Entity<Cliente>().HasQueryFilter(e => _currentTenantService.ObterEmpresaId() == null || e.EmpresaId == _currentTenantService.ObterEmpresaId());
        
        builder.Entity<Venda>().HasQueryFilter(e => _currentTenantService.ObterEmpresaId() == null || e.EmpresaId == _currentTenantService.ObterEmpresaId());
        builder.Entity<VendaVeiculo>().HasQueryFilter(e => _currentTenantService.ObterEmpresaId() == null || e.EmpresaId == _currentTenantService.ObterEmpresaId());
        
        builder.Entity<ContaReceber>().HasQueryFilter(e => _currentTenantService.ObterEmpresaId() == null || e.EmpresaId == _currentTenantService.ObterEmpresaId());
        builder.Entity<ContaPagar>().HasQueryFilter(e => _currentTenantService.ObterEmpresaId() == null || e.EmpresaId == _currentTenantService.ObterEmpresaId());
        builder.Entity<MovimentoFinanceiro>().HasQueryFilter(e => _currentTenantService.ObterEmpresaId() == null || e.EmpresaId == _currentTenantService.ObterEmpresaId());
        builder.Entity<Cheque>().HasQueryFilter(e => _currentTenantService.ObterEmpresaId() == null || e.EmpresaId == _currentTenantService.ObterEmpresaId());

        builder.Entity<NotaFiscal>().HasQueryFilter(e => _currentTenantService.ObterEmpresaId() == null || e.EmpresaId == _currentTenantService.ObterEmpresaId());
        builder.Entity<AuditoriaLog>().HasQueryFilter(e => _currentTenantService.ObterEmpresaId() == null || e.EmpresaId == _currentTenantService.ObterEmpresaId());

        builder.Entity<Lead>().HasQueryFilter(e => _currentTenantService.ObterEmpresaId() == null || e.EmpresaId == _currentTenantService.ObterEmpresaId());
        builder.Entity<LeadInteracao>().HasQueryFilter(e => _currentTenantService.ObterEmpresaId() == null || e.EmpresaId == _currentTenantService.ObterEmpresaId());
        builder.Entity<ReciboVenda>().HasQueryFilter(e => _currentTenantService.ObterEmpresaId() == null || e.EmpresaId == _currentTenantService.ObterEmpresaId());

        // =====================================================================
        // CONFIGURAÇÕES / ÍNDICES
        // =====================================================================
        builder.Entity<Empresa>(e =>
        {
            e.Property(x => x.Slug).HasMaxLength(63);
            e.HasIndex(x => x.Slug).IsUnique();
            e.Property(x => x.Uf).HasMaxLength(2);
        });

        builder.Entity<Veiculo>(e =>
        {
            e.HasIndex(x => new { x.EmpresaId, x.Tipo, x.Status });
            e.Property(x => x.CodigoFipe).HasMaxLength(10);
        });

        builder.Entity<Lead>(e =>
        {
            e.Property(x => x.Nome).HasMaxLength(150).IsRequired();
            e.HasIndex(x => new { x.EmpresaId, x.Estagio, x.Ordem });
            e.HasOne(x => x.Cliente).WithMany().HasForeignKey(x => x.ClienteId).OnDelete(DeleteBehavior.SetNull);
            e.HasOne(x => x.VeiculoInteresse).WithMany().HasForeignKey(x => x.VeiculoInteresseId).OnDelete(DeleteBehavior.SetNull);
            e.HasMany(x => x.Interacoes).WithOne(i => i.Lead).HasForeignKey(i => i.LeadId).OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<ReciboVenda>(e =>
        {
            e.Property(x => x.Numero).HasMaxLength(30);
            e.HasIndex(x => new { x.EmpresaId, x.Numero }).IsUnique();
            e.Property(x => x.HashSha256).HasMaxLength(64);
            e.HasIndex(x => x.HashSha256).IsUnique();
            e.Property(x => x.PdfSha256).HasMaxLength(64);
            // "text" (e não jsonb): jsonb reordena chaves/espaços e quebraria a verificação do hash.
            e.Property(x => x.DadosJson).HasColumnType("text");
            e.HasIndex(x => new { x.ProvedorAssinatura, x.IdExternoAssinatura });
        });
    }

    public override int SaveChanges()
    {
        ConfigurarTenantId();
        return base.SaveChanges();
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        ConfigurarTenantId();
        return base.SaveChangesAsync(cancellationToken);
    }

    private void ConfigurarTenantId()
    {
        var tenantId = _currentTenantService.ObterEmpresaId();
        if (tenantId == null || tenantId == Guid.Empty) return;

        foreach (var entry in ChangeTracker.Entries<EntidadeTenant>().Where(e => e.State == EntityState.Added))
        {
            if (entry.Entity.EmpresaId == Guid.Empty)
            {
                entry.Entity.EmpresaId = tenantId.Value;
            }
        }
    }
}
