using System;
using GravityCarSystem.Domain.Enums;

namespace GravityCarSystem.Application.DTOs.Cadastros;

public class FornecedorDto
{
    public Guid? Id { get; set; }
    public TipoPessoa TipoPessoa { get; set; }
    public string NomeRazaoSocial { get; set; } = string.Empty;
    public string? CpfCnpj { get; set; }
    public string? RgIe { get; set; }
    public string? Telefone { get; set; }
    public string? Celular { get; set; }
    public string? Email { get; set; }
    public string? Cep { get; set; }
    public string? Logradouro { get; set; }
    public string? Numero { get; set; }
    public string? Complemento { get; set; }
    public string? Bairro { get; set; }
    public string? Cidade { get; set; }
    public string? Estado { get; set; }
    public string? Observacoes { get; set; }
    public bool Ativo { get; set; }
}
