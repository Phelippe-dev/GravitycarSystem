using System;
using System.Threading;
using System.Threading.Tasks;
using System.Collections.Generic;
using System.Text.Json;
using GravityCarSystem.Application.Interfaces;
using GravityCarSystem.Domain.Common;
using GravityCarSystem.Domain.Entities.Auditoria;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;

namespace GravityCarSystem.Infrastructure.Data.Interceptors;

public class AuditableEntitySaveChangesInterceptor : SaveChangesInterceptor
{
    private readonly ICurrentTenantService _currentTenantService;

    public AuditableEntitySaveChangesInterceptor(ICurrentTenantService currentTenantService)
    {
        _currentTenantService = currentTenantService;
    }

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

        var empresaId = _currentTenantService.GetEmpresaId();
        var usuarioId = _currentTenantService.GetUsuarioId() ?? Guid.Empty; // System or background task might not have a user
        
        var auditoriaLogs = new List<AuditoriaLog>();

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
            
            // Auditoria logic
            if (entry.State == EntityState.Added || entry.State == EntityState.Modified || entry.State == EntityState.Deleted)
            {
                var log = new AuditoriaLog
                {
                    Id = Guid.NewGuid(),
                    UsuarioId = usuarioId,
                    EmpresaId = empresaId ?? Guid.Empty,
                    Entidade = entry.Entity.GetType().Name,
                    EntidadeId = entry.Property("Id").CurrentValue?.ToString() ?? "",
                    Acao = entry.State.ToString(),
                    DataHora = DateTime.UtcNow
                };

                if (entry.State == EntityState.Modified)
                {
                    var originalValues = new Dictionary<string, object>();
                    var currentValues = new Dictionary<string, object>();

                    foreach (var prop in entry.OriginalValues.Properties)
                    {
                        var originalValue = entry.OriginalValues[prop];
                        var currentValue = entry.CurrentValues[prop];

                        if (!Equals(originalValue, currentValue))
                        {
                            originalValues[prop.Name] = originalValue!;
                            currentValues[prop.Name] = currentValue!;
                        }
                    }

                    log.DadosAntes = JsonSerializer.Serialize(originalValues);
                    log.DadosDepois = JsonSerializer.Serialize(currentValues);
                }
                else if (entry.State == EntityState.Added)
                {
                    var currentValues = new Dictionary<string, object>();
                    foreach (var prop in entry.CurrentValues.Properties)
                    {
                        currentValues[prop.Name] = entry.CurrentValues[prop]!;
                    }
                    log.DadosDepois = JsonSerializer.Serialize(currentValues);
                }
                else if (entry.State == EntityState.Deleted)
                {
                    var originalValues = new Dictionary<string, object>();
                    foreach (var prop in entry.OriginalValues.Properties)
                    {
                        originalValues[prop.Name] = entry.OriginalValues[prop]!;
                    }
                    log.DadosAntes = JsonSerializer.Serialize(originalValues);
                }

                // Prevent tracking AuditoriaLog itself if we ever inherit AuditableEntity
                if (log.Entidade != nameof(AuditoriaLog))
                {
                    auditoriaLogs.Add(log);
                }
            }
        }

        foreach (var entry in context.ChangeTracker.Entries<TenantEntity>())
        {
            if (entry.State == EntityState.Added)
            {
                if (entry.Entity.EmpresaId == Guid.Empty)
                {
                    entry.Entity.EmpresaId = empresaId ?? Guid.Empty;
                }
            }
        }
        
        if (auditoriaLogs.Count > 0)
        {
            context.Set<AuditoriaLog>().AddRange(auditoriaLogs);
        }
    }
}
