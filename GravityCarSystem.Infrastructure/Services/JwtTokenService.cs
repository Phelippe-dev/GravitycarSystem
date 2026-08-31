using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using GravityCarSystem.Domain.Entities.Acesso;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace GravityCarSystem.Infrastructure.Services;

public class JwtTokenService
{
    private readonly IConfiguration _configuration;

    public JwtTokenService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public string GenerateToken(Usuario usuario)
    {
        var tokenHandler = new JwtSecurityTokenHandler();
        // Fallback to a hardcoded key if not present in appsettings, just for development
        var secret = _configuration["JwtSettings:Secret"] ?? "MySuperSecretKeyForDevelopmentOnly_NeedToBeLongerToWorkProperly32Chars";
        var key = Encoding.ASCII.GetBytes(secret);

        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, usuario.Id.ToString()),
            new Claim(ClaimTypes.Email, usuario.Email),
            new Claim(ClaimTypes.Name, usuario.Nome),
            new Claim("EmpresaId", usuario.EmpresaId.ToString())
        };

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddHours(8),
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature),
            Issuer = _configuration["JwtSettings:Issuer"] ?? "GravityCarSystem",
            Audience = _configuration["JwtSettings:Audience"] ?? "GravityCarSystemApp"
        };

        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }
}
