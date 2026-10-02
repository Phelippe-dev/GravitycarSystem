using System;
using MotorsXySystem.Domain.Comum;
using MotorsXySystem.Domain.Enums;

namespace MotorsXySystem.Domain.Entidades.Tenant;

public class Assinatura : EntidadeAuditavel
{
    public Guid EmpresaId { get; set; }
    public PlanoAssinatura Plano { get; set; }
    public DateTime DataInicio { get; set; }
    public DateTime? DataFim { get; set; }
    public bool Ativa { get; set; } = true;
    public decimal ValorMensal { get; set; }
    
    public virtual Empresa Empresa { get; set; } = null!;
}
