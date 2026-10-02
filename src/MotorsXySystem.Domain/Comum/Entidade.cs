using System;

namespace MotorsXySystem.Domain.Comum;

public abstract class Entidade
{
    public Guid Id { get; set; } = Guid.NewGuid();
}
