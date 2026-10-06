using System;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Builder;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;
using MotorsXySystem.Application.Interfaces;
using MotorsXySystem.Infrastructure.Data;
using MotorsXySystem.Infrastructure.Middleware;
using MotorsXySystem.Infrastructure.Seed;
using MotorsXySystem.Infrastructure.Servicos;
using MotorsXySystem.Integracoes.Assinatura;
using MotorsXySystem.Integracoes.Fipe;
using QuestPDF.Infrastructure;

// Configura licença comunitária do QuestPDF
QuestPDF.Settings.License = LicenseType.Community;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Configure Database
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Configure Memory Cache & HttpClients
builder.Services.AddMemoryCache();
builder.Services.AddHttpClient<IFipeService, ParallelumFipeService>(client =>
{
    client.BaseAddress = new Uri("https://parallelum.com.br/fipe/api/v2/");
    client.Timeout = TimeSpan.FromSeconds(15);
});

// Configure Dependency Injection
builder.Services.AddScoped<ICurrentTenantService, CurrentTenantService>();
builder.Services.AddScoped<ITenantSetupService, TenantSetupService>();
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IReciboService, ReciboService>();
builder.Services.AddScoped<IAssinaturaEletronicaProvider, ManualAssinaturaProvider>();

// Configure CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// Configure JWT Authentication
var jwtKey = builder.Configuration["Jwt:Key"] ?? Environment.GetEnvironmentVariable("JWT_SECRET_KEY") ?? "SecureTenantAuthKey_ConfiguredAtRuntime_Prod2026_HS256Algorithm!";
var key = Encoding.ASCII.GetBytes(jwtKey);
builder.Services.AddAuthentication(x =>
{
    x.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    x.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(x =>
{
    x.RequireHttpsMetadata = false;
    x.SaveToken = true;
    x.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(key),
        ValidateIssuer = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidateAudience = true,
        ValidAudience = builder.Configuration["Jwt:Audience"],
        ValidateLifetime = true
    };
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger(c =>
    {
        c.SerializeAsV2 = true;
    });
    app.UseSwaggerUI();
}

app.UseCors("AllowAll");
app.UseAuthentication();
app.UseMiddleware<TenantMiddleware>();
app.UseAuthorization();
app.MapControllers();

// Inicialização automática do banco e seed do SuperAdmin
try
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    if (db.Database.CanConnect())
    {
        SuperAdminSeeder.ExecutarAsync(db, app.Configuration, app.Logger).GetAwaiter().GetResult();
    }
}
catch (Exception ex)
{
    app.Logger.LogWarning("Inicialização de seed do SuperAdmin adiada: {Msg}", ex.Message);
}

app.Run();
