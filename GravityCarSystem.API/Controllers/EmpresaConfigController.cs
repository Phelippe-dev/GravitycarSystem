using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GravityCarSystem.Infrastructure.Data;
using BCrypt.Net;

namespace GravityCarSystem.API.Controllers;

// DTO para configuracoes da empresa
public record EmpresaConfigDto(
    string RazaoSocial,
    string NomeFantasia,
    string Cnpj,
    string InscricaoEstadual,
    string InscricaoMunicipal,
    string Telefone,
    string Email,
    string Site,
    string Logradouro,
    string Numero,
    string Complemento,
    string Bairro,
    string Cidade,
    string Estado,
    string Cep,
    string RegimeTributario,
    string ResponsavelTecnico
);

// DTO para troca de senha
public record TrocaSenhaDto(string SenhaAtual, string NovaSenha);

[Authorize]
[ApiController]
[Route("api/empresa")]
public class EmpresaConfigController : ControllerBase
{
    private readonly AppDbContext _context;

    public EmpresaConfigController(AppDbContext context)
    {
        _context = context;
    }

    private Guid GetEmpresaId()
    {
        var claim = User.Claims.FirstOrDefault(c => c.Type == "EmpresaId" || c.Type == "empresa_id");
        if (claim != null && Guid.TryParse(claim.Value, out var id)) return id;
        return Guid.Parse("00000000-0000-0000-0000-000000000001");
    }

    [HttpGet("minha")]
    public async Task<IActionResult> ObterMinhaEmpresa()
    {
        var empresaId = GetEmpresaId();
        var empresa = await _context.Empresas.FirstOrDefaultAsync(e => e.Id == empresaId);
        if (empresa == null) return NotFound("Empresa nao encontrada.");

        var tipo = empresa.GetType();
        string GetProp(string name, string fallback = "") {
            var prop = tipo.GetProperty(name);
            return prop?.GetValue(empresa)?.ToString() ?? fallback;
        }

        return Ok(new
        {
            id = empresa.Id,
            razaoSocial = empresa.RazaoSocial ?? "",
            nomeFantasia = empresa.NomeFantasia ?? "",
            cnpj = empresa.Cnpj ?? "",
            inscricaoEstadual = GetProp("InscricaoEstadual"),
            inscricaoMunicipal = GetProp("InscricaoMunicipal"),
            telefone = GetProp("Telefone"),
            email = GetProp("Email"),
            site = GetProp("Site"),
            logradouro = GetProp("Logradouro"),
            numero = GetProp("Numero"),
            complemento = GetProp("Complemento"),
            bairro = GetProp("Bairro"),
            cidade = GetProp("Cidade"),
            estado = GetProp("Estado"),
            cep = GetProp("Cep"),
            regimeTributario = GetProp("RegimeTributario", "Simples Nacional"),
            responsavelTecnico = GetProp("ResponsavelTecnico")
        });
    }

    [HttpPut("minha")]
    public async Task<IActionResult> AtualizarMinhaEmpresa([FromBody] EmpresaConfigDto dto)
    {
        var empresaId = GetEmpresaId();
        var empresa = await _context.Empresas.FirstOrDefaultAsync(e => e.Id == empresaId);
        if (empresa == null) return NotFound("Empresa nao encontrada.");

        empresa.RazaoSocial = dto.RazaoSocial;
        empresa.NomeFantasia = dto.NomeFantasia;
        empresa.Cnpj = dto.Cnpj;

        // Usando reflexao segura para campos que podem ou nao estar mapeados na entidade base
        var tipo = empresa.GetType();
        void SetProp(string name, object val) {
            var prop = tipo.GetProperty(name);
            if (prop != null && prop.CanWrite) prop.SetValue(empresa, val);
        }
        SetProp("InscricaoEstadual", dto.InscricaoEstadual ?? "");
        SetProp("InscricaoMunicipal", dto.InscricaoMunicipal ?? "");
        SetProp("Telefone", dto.Telefone ?? "");
        SetProp("Email", dto.Email ?? "");
        SetProp("Site", dto.Site ?? "");
        SetProp("Logradouro", dto.Logradouro ?? "");
        SetProp("Numero", dto.Numero ?? "");
        SetProp("Complemento", dto.Complemento ?? "");
        SetProp("Bairro", dto.Bairro ?? "");
        SetProp("Cidade", dto.Cidade ?? "");
        SetProp("Estado", dto.Estado ?? "");
        SetProp("Cep", dto.Cep ?? "");
        SetProp("RegimeTributario", dto.RegimeTributario ?? "Simples Nacional");
        SetProp("ResponsavelTecnico", dto.ResponsavelTecnico ?? "");

        await _context.SaveChangesAsync();
        return Ok(new { message = "Empresa atualizada com sucesso." });
    }
}

[Authorize]
[ApiController]
[Route("api/auth")]
public class ChangePasswordController : ControllerBase
{
    private readonly AppDbContext _context;
    public ChangePasswordController(AppDbContext context) { _context = context; }

    [HttpPost("change-password")]
    public async Task<IActionResult> TrocarSenha([FromBody] TrocaSenhaDto dto)
    {
        var emailClaim = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Email || c.Type == "email" || c.Type == "sub");
        if (emailClaim == null) return Unauthorized("Token invalido.");

        var usuario = await _context.Usuarios
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(u => u.Email == emailClaim.Value);
        if (usuario == null) return NotFound("Usuario nao encontrado.");

        if (!BCrypt.Net.BCrypt.Verify(dto.SenhaAtual, usuario.SenhaHash))
            return BadRequest("Senha atual incorreta.");

        if (string.IsNullOrEmpty(dto.NovaSenha) || dto.NovaSenha.Length < 6)
            return BadRequest("Nova senha deve ter pelo menos 6 caracteres.");

        usuario.SenhaHash = BCrypt.Net.BCrypt.HashPassword(dto.NovaSenha);
        await _context.SaveChangesAsync();
        return Ok(new { message = "Senha alterada com sucesso." });
    }
}
