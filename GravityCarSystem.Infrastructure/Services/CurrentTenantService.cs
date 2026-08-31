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
        if (claim != null && Guid.TryParse(claim.Value, out var empresaId))
        {
            return empresaId;
        }

        return null;
    }

    public Guid? GetUsuarioId()
    {
        var claim = _httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.NameIdentifier);
        if (claim != null && Guid.TryParse(claim.Value, out var usuarioId))
        {
            return usuarioId;
        }

        return null;
    }
}
