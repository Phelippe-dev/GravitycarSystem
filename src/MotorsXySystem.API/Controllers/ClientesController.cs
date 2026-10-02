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
