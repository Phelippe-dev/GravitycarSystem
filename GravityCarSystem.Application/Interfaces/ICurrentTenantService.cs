using System;

namespace GravityCarSystem.Application.Interfaces;

public interface ICurrentTenantService
{
    Guid? GetEmpresaId();
    Guid? GetUsuarioId();
}
