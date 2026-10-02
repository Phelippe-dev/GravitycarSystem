using System;
using GravityCarSystem.Domain.Enums;

namespace GravityCarSystem.Application.DTOs.Negocio;

public class ChequeDto
{
    public Guid? Id { get; set; }
    public Guid? VendaPagamentoId { get; set; }
    public Guid ClienteId { get; set; }
    
    public string? ClienteNome { get; set; }
    
    public string? Banco { get; set; }
    public string? Agencia { get; set; }
    public string? Conta { get; set; }
    public string? NumeroCheque { get; set; }
    
    public decimal Valor { get; set; }
    public DateTime DataEmissao { get; set; }
    public DateTime DataBomPara { get; set; }
    
    public StatusCheque Status { get; set; }
    public DateTime? DataDeposito { get; set; }
    public DateTime? DataCompensacao { get; set; }
    
    public string? Observacao { get; set; }
}
