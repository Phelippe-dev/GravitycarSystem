using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MotorsXySystem.Application.DTOs;
using MotorsXySystem.Application.Interfaces;
using MotorsXySystem.Domain.Entidades.Cadastros;
using MotorsXySystem.Infrastructure.Data;

namespace MotorsXySystem.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ClientesController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ICurrentTenantService _tenant;

    public ClientesController(AppDbContext context, ICurrentTenantService tenant)
    {
        _context = context;
        _tenant = tenant;
    }

    [HttpGet]
    public async Task<IActionResult> Listar()
    {
        var clientes = await _context.Clientes
            .OrderByDescending(c => c.DataCriacao)
            .Select(c => new ClienteDto
            {
                Id = c.Id,
                Nome = c.Nome,
                CpfCnpj = c.CpfCnpj,
                Email = c.Email,
                Telefone = c.Telefone,
                Endereco = c.EnderecoCompleto,
                DataCadastro = c.DataCriacao
            })
            .ToListAsync();

        return Ok(clientes);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> ObterPorId(Guid id)
    {
        var c = await _context.Clientes.FindAsync(id);
        if (c == null) return NotFound(new { Erro = "Cliente não encontrado." });

        return Ok(new ClienteDto
        {
            Id = c.Id,
            Nome = c.Nome,
            CpfCnpj = c.CpfCnpj,
            Email = c.Email,
            Telefone = c.Telefone,
            Endereco = c.EnderecoCompleto,
            DataCadastro = c.DataCriacao
        });
    }

    [HttpPost]
    public async Task<IActionResult> Criar([FromBody] ClienteDto dto)
    {
        if (!ValidarCpfCnpj(dto.CpfCnpj))
        {
            return BadRequest(new { Erro = "CPF ou CNPJ inválido." });
        }

        var cliente = new Cliente
        {
            Nome = dto.Nome,
            CpfCnpj = dto.CpfCnpj,
            Email = dto.Email,
            Telefone = dto.Telefone,
            EnderecoCompleto = $"{dto.Endereco}, {dto.Bairro}, {dto.Cidade}/{dto.Estado} - CEP: {dto.Cep}",
            DataCriacao = DateTime.UtcNow,
            Ativo = true
        };

        _context.Clientes.Add(cliente);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(ObterPorId), new { id = cliente.Id }, new { Id = cliente.Id, Mensagem = "Cliente cadastrado com sucesso!" });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Atualizar(Guid id, [FromBody] ClienteDto dto)
    {
        if (!string.IsNullOrWhiteSpace(dto.CpfCnpj) && !ValidarCpfCnpj(dto.CpfCnpj))
        {
            return BadRequest(new { Erro = "CPF ou CNPJ inválido." });
        }

        var cliente = await _context.Clientes.FindAsync(id);
        if (cliente == null) return NotFound(new { Erro = "Cliente não encontrado." });

        cliente.Nome = dto.Nome;
        cliente.CpfCnpj = dto.CpfCnpj;
        cliente.Email = dto.Email;
        cliente.Telefone = dto.Telefone;
        cliente.EnderecoCompleto = $"{dto.Endereco}, {dto.Bairro}, {dto.Cidade}/{dto.Estado} - CEP: {dto.Cep}";
        cliente.DataAtualizacao = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(new { Mensagem = "Cliente atualizado com sucesso!" });
    }

    private static bool ValidarCpfCnpj(string? documento)
    {
        if (string.IsNullOrWhiteSpace(documento)) return false;
        var digits = new string(documento.Where(char.IsDigit).ToArray());
        if (digits.Length == 11) return ValidarCpf(digits);
        if (digits.Length == 14) return ValidarCnpj(digits);
        return false;
    }

    private static bool ValidarCpf(string cpf)
    {
        if (cpf.Distinct().Count() == 1) return false;
        int[] mult1 = { 10, 9, 8, 7, 6, 5, 4, 3, 2 };
        int[] mult2 = { 11, 10, 9, 8, 7, 6, 5, 4, 3, 2 };

        int soma = 0;
        for (int i = 0; i < 9; i++) soma += (cpf[i] - '0') * mult1[i];
        int resto = soma % 11;
        int dig1 = resto < 2 ? 0 : 11 - resto;
        if (cpf[9] - '0' != dig1) return false;

        soma = 0;
        for (int i = 0; i < 10; i++) soma += (cpf[i] - '0') * mult2[i];
        resto = soma % 11;
        int dig2 = resto < 2 ? 0 : 11 - resto;
        return cpf[10] - '0' == dig2;
    }

    private static bool ValidarCnpj(string cnpj)
    {
        if (cnpj.Distinct().Count() == 1) return false;
        int[] mult1 = { 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2 };
        int[] mult2 = { 6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2 };

        int soma = 0;
        for (int i = 0; i < 12; i++) soma += (cnpj[i] - '0') * mult1[i];
        int resto = soma % 11;
        int dig1 = resto < 2 ? 0 : 11 - resto;
        if (cnpj[12] - '0' != dig1) return false;

        soma = 0;
        for (int i = 0; i < 13; i++) soma += (cnpj[i] - '0') * mult2[i];
        resto = soma % 11;
        int dig2 = resto < 2 ? 0 : 11 - resto;
        return cnpj[13] - '0' == dig2;
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Excluir(Guid id)
    {
        var cliente = await _context.Clientes.FindAsync(id);
        if (cliente == null) return NotFound(new { Erro = "Cliente não encontrado." });

        cliente.Ativo = false;
        await _context.SaveChangesAsync();

        return Ok(new { Mensagem = "Cliente removido com sucesso!" });
    }
}
