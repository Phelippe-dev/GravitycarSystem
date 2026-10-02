using System;

namespace MotorsXySystem.Application.Interfaces;

public interface ICurrentTenantService
{
    Guid? ObterEmpresaId();
    void DefinirEmpresaId(Guid empresaId);
}
