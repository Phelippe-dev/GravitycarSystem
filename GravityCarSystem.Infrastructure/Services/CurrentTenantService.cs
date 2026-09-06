using System;
using System.Security.Claims;
using GravityCarSystem.Application.Interfaces;
using Microsoft.AspNetCore.Http;

namespace GravityCarSystem.Infrastructure.Services;

public class CurrentTenantService : ICurrentTenantService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentTenantService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public Guid? GetEmpresaId()
    {
        var claim = _httpContextAccessor.HttpContext?.User?.FindFirst("EmpresaId");
        if (claim != null && Guid.TryParse(claim.Value, out var empresaId) && empresaId != Guid.Empty)
        {
            return empresaId;
        }

        // Fallback para o tenant padrão da concessionária matriz
        return Guid.Parse("00000000-0000-0000-0000-000000000001");
    }

    public Guid? GetUsuarioId()
    {
        var claim = _httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.NameIdentifier);
        if (claim != null && Guid.TryParse(claim.Value, out var usuarioId) && usuarioId != Guid.Empty)
        {
            return usuarioId;
        }

        return null;
    }
}
