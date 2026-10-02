namespace MotorsXySystem.Application.DTOs;

public class ClienteDto
{
    public Guid? Id { get; set; }
    public string Nome { get; set; } = string.Empty;
    public string? CpfCnpj { get; set; }
    public string? Email { get; set; }
    public string? Telefone { get; set; }
    public string? Endereco { get; set; }
    public string? Cep { get; set; }
    public string? Bairro { get; set; }
    public string? Cidade { get; set; }
    public string? Estado { get; set; }
    public DateTime? DataCadastro { get; set; }
}
