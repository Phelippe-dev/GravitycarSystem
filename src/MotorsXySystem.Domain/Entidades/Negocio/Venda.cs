using System;
using System.Collections.Generic;
using MotorsXySystem.Domain.Comum;
using MotorsXySystem.Domain.Entidades.Cadastros;
using MotorsXySystem.Domain.Enums;

namespace MotorsXySystem.Domain.Entidades.Negocio;

public class Venda : EntidadeTenant
{
    public Guid ClienteId { get; set; }
    public Guid UsuarioId { get; set; }
    public string NumeroVenda { get; set; } = string.Empty;
    public DateTime DataVenda { get; set; } = DateTime.UtcNow;
    public StatusVenda Status { get; set; } = StatusVenda.EmNegociacao;
    
    public decimal ValorTotalVeiculos { get; set; }
    public decimal ValorTotalAcessorios { get; set; }
    public decimal ValorDesconto { get; set; }
    public decimal ValorTotalFinal { get; set; }
    
    public string? Observacoes { get; set; }
    
    public virtual Cliente Cliente { get; set; } = null!;
    public virtual ICollection<VendaVeiculo> Veiculos { get; set; } = new List<VendaVeiculo>();
}
