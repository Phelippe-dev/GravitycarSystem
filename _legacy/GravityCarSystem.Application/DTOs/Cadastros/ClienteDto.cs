using System;

namespace GravityCarSystem.Application.DTOs.Cadastros;

public class ClienteDto
{
    public Guid Id { get; set; }
    public string Nome { get; set; } = string.Empty;
    public string CpfCnpj { get; set; } = string.Empty;
    public string TipoPessoa { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Telefone { get; set; } = string.Empty;
    public string? Celular { get; set; }
    public string? Cep { get; set; }
    public string? Logradouro { get; set; }
    public string? Numero { get; set; }
    public string? Complemento { get; set; }
    public string? Bairro { get; set; }
    public string? Cidade { get; set; }
    public string? Estado { get; set; }
    public string? Observacao { get; set; }
}
