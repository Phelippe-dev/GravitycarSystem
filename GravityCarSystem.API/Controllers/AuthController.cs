using System;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using GravityCarSystem.API.DTOs;
using GravityCarSystem.Domain.Entities.Acesso;
using GravityCarSystem.Infrastructure.Data;
using GravityCarSystem.Infrastructure.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GravityCarSystem.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly JwtTokenService _jwtTokenService;

    public AuthController(AppDbContext context, JwtTokenService jwtTokenService)
    {
        _context = context;
        _jwtTokenService = jwtTokenService;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var usuario = await _context.Usuarios
            .IgnoreQueryFilters()
            .Include(u => u.Empresa)
            .Include(u => u.Perfis)
                .ThenInclude(up => up.Perfil)
            .FirstOrDefaultAsync(u => u.Email == request.Email);

        if (usuario == null)
        {
            return Unauthorized(new { message = "E-mail ou senha invÃ¡lidos." });
        }

        if (!BCrypt.Net.BCrypt.Verify(request.Senha, usuario.SenhaHash))
        {
            return Unauthorized(new { message = "E-mail ou senha invÃ¡lidos." });
        }

        if (!usuario.Ativo)
        {
            return Unauthorized(new { message = "UsuÃ¡rio inativo." });
        }

        var token = _jwtTokenService.GenerateToken(usuario);

        // Determinar a role real do usuário baseado nos perfis
        var userRole = usuario.Perfis?.FirstOrDefault()?.Perfil?.Nome ?? "Admin";

        return Ok(new LoginResponse
        {
            Token = token,
            Nome = usuario.Nome,
            Email = usuario.Email,
            Role = userRole,
            Cargo = usuario.Cargo
        });
    }

    [HttpPost("seed")]
    public async Task<IActionResult> SeedAdmin([FromBody] LoginRequest request)
    {
        // Validation for the password rule requested by the user:
        // 6 digits only, cannot repeat the same digit more than 3 times in sequence
        if (!Regex.IsMatch(request.Senha, @"^\d{6}$"))
        {
            return BadRequest(new { message = "A senha deve conter exatamente 6 dÃ­gitos numÃ©ricos." });
        }

        if (Regex.IsMatch(request.Senha, @"(\d)\1{3,}"))
        {
            return BadRequest(new { message = "A senha nÃ£o pode repetir o mesmo nÃºmero mais de 3 vezes em sequÃªncia." });
        }

        var existingUser = await _context.Usuarios.FirstOrDefaultAsync(u => u.Email == request.Email);
        if (existingUser != null)
        {
            return BadRequest(new { message = "UsuÃ¡rio jÃ¡ existe." });
        }

        var empresa = await _context.Empresas.FirstOrDefaultAsync();
        if (empresa == null)
        {
            empresa = new Empresa
            {
                Id = Guid.NewGuid(),
                RazaoSocial = "Gravity Car System Matriz",
                NomeFantasia = "Gravity Car",
                Cnpj = "00000000000100"
            };
            _context.Empresas.Add(empresa);
        }

        var hash = BCrypt.Net.BCrypt.HashPassword(request.Senha);
        
        var newUser = new Usuario
        {
            Id = Guid.NewGuid(),
            Nome = "Administrador",
            Email = request.Email,
            SenhaHash = hash,
            EmpresaId = empresa.Id,
            Ativo = true
        };

        _context.Usuarios.Add(newUser);
        await _context.SaveChangesAsync();

        return Ok(new { message = "UsuÃ¡rio administrador criado com sucesso." });
    }

    public class ForgotPasswordRequest
    {
        public string Email { get; set; } = string.Empty;
    }

    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
    {
        var usuario = await _context.Usuarios.IgnoreQueryFilters().FirstOrDefaultAsync(u => u.Email == request.Email);
        if (usuario == null)
        {
            // Retornamos OK mesmo se nÃ£o achar para nÃ£o expor quais emails existem na base
            return Ok(new { message = "Se o e-mail existir, as instruÃ§Ãµes foram enviadas." });
        }

        // Gera um token simples numÃ©rico de 6 dÃ­gitos para o usuÃ¡rio digitar
        var random = new Random();
        var token = random.Next(100000, 999999).ToString();

        usuario.ResetToken = token;
        usuario.ResetTokenExpiry = DateTime.UtcNow.AddMinutes(15);
        await _context.SaveChangesAsync();

        // TODO: SimulaÃ§Ã£o de envio de E-mail
        Console.WriteLine($"[EMAIL SIMULADO] Para: {usuario.Email} | Seu cÃ³digo de recuperaÃ§Ã£o Ã©: {token}");

        // Como nÃ£o temos e-mail configurado, estamos retornando o token na resposta apenas para facilitar os testes iniciais.
        // EM PRODUÃ‡Ã­O: NUNCA RETORNE O TOKEN NA RESPOSTA HTTP!
        return Ok(new { message = "Se o e-mail existir, as instruÃ§Ãµes foram enviadas.", token_dev = token });
    }

        [HttpPost("impersonate/{empresaId:guid}")]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<IActionResult> Impersonate(Guid empresaId)
    {
        var currentUserIdStr = User.FindFirstValue(System.Security.Claims.ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(currentUserIdStr, out var currentUserId)) return Unauthorized();

        var usuario = await _context.Usuarios
            .IgnoreQueryFilters()
            .Include(u => u.Perfis)
                .ThenInclude(up => up.Perfil)
            .FirstOrDefaultAsync(u => u.Id == currentUserId);

        if (usuario == null || !usuario.Ativo) return Unauthorized();

        var targetEmpresa = await _context.Empresas.FirstOrDefaultAsync(e => e.Id == empresaId);
        if (targetEmpresa == null) return NotFound("Empresa não encontrada.");

        var token = _jwtTokenService.GenerateToken(usuario, targetEmpresa.Id);

        return Ok(new LoginResponse
        {
            Token = token,
            Nome = usuario.Nome,
            Email = usuario.Email
        });
    }

    public class ResetPasswordRequest
    {
        public string Email { get; set; } = string.Empty;
        public string Token { get; set; } = string.Empty;
        public string NovaSenha { get; set; } = string.Empty;
    }

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
    {
        var usuario = await _context.Usuarios.IgnoreQueryFilters().FirstOrDefaultAsync(u => u.Email == request.Email);
        
        if (usuario == null || usuario.ResetToken != request.Token || usuario.ResetTokenExpiry < DateTime.UtcNow)
        {
            return BadRequest(new { message = "Token invÃ¡lido ou expirado." });
        }

        if (!Regex.IsMatch(request.NovaSenha, @"^\d{6}$") || Regex.IsMatch(request.NovaSenha, @"(\d)\1{3,}"))
        {
            return BadRequest(new { message = "A senha deve conter exatamente 6 dÃ­gitos numÃ©ricos e nÃ£o pode repetir o mesmo nÃºmero mais de 3 vezes em sequÃªncia." });
        }

        usuario.SenhaHash = BCrypt.Net.BCrypt.HashPassword(request.NovaSenha);
        usuario.ResetToken = null;
        usuario.ResetTokenExpiry = null;
        
        await _context.SaveChangesAsync();

        return Ok(new { message = "Senha redefinida com sucesso." });
    }
}

