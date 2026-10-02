using System;

namespace MotorsXySystem.Domain.Comum;

public abstract class EntidadeTenant : EntidadeAuditavel
{
    public Guid EmpresaId { get; set; }
}
