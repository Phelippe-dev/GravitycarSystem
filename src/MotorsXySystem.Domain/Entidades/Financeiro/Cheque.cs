using System;
using MotorsXySystem.Domain.Comum;
using MotorsXySystem.Domain.Entidades.Cadastros;

namespace MotorsXySystem.Domain.Entidades.Financeiro;

public enum StatusCheque
{
    Recebido = 0,
    Custodia = 1,
    Depositado = 2,
    Compensado = 3,
    Devolvido = 4
}

public class Cheque : EntidadeTenant
{
    public Guid ClienteId { get; set; }
    public Guid? VendaId { get; set; }

    public string Banco { get; set; } = string.Empty;
    public string Agencia { get; set; } = string.Empty;
    public string Conta { get; set; } = string.Empty;
    public string NumeroCheque { get; set; } = string.Empty;
    public decimal Valor { get; set; }
    public string? Emitente { get; set; }

    public DateTime DataEmissao { get; set; } = DateTime.UtcNow;
    public DateTime DataBomPara { get; set; } = DateTime.UtcNow;
    public DateTime? DataDeposito { get; set; }
    public DateTime? DataCompensacao { get; set; }

    public StatusCheque Status { get; set; } = StatusCheque.Recebido;
    public string? Observacao { get; set; }

    public virtual Cliente? Cliente { get; set; }
}
