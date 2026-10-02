using System;
using MotorsXySystem.Domain.Comum;

namespace MotorsXySystem.Domain.Entidades.Cadastros;

public class Cliente : EntidadeTenant
{
    public string Nome { get; set; } = string.Empty;
    public string? CpfCnpj { get; set; }
    public string? Email { get; set; }
    public string? Telefone { get; set; }
    public string? EnderecoCompleto { get; set; }
    public DateTime? DataNascimento { get; set; }
    public string? Rg { get; set; }
}
