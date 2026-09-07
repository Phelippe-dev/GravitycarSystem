# =====================================================================
# Dockerfile — Gravity Car System API (.NET)
# Build multi-stage: compila no SDK, roda no runtime (imagem menor)
# =====================================================================

# Estágio 1: Build
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copia arquivos de projeto e restaura dependências (cache de layers)
COPY ["GravityCarSystem.API/GravityCarSystem.API.csproj", "GravityCarSystem.API/"]
COPY ["GravityCarSystem.Application/GravityCarSystem.Application.csproj", "GravityCarSystem.Application/"]
COPY ["GravityCarSystem.Domain/GravityCarSystem.Domain.csproj", "GravityCarSystem.Domain/"]
COPY ["GravityCarSystem.Infrastructure/GravityCarSystem.Infrastructure.csproj", "GravityCarSystem.Infrastructure/"]
RUN dotnet restore "GravityCarSystem.API/GravityCarSystem.API.csproj"

# Copia o código-fonte e compila
COPY . .
WORKDIR /src/GravityCarSystem.API
RUN dotnet publish -c Release -o /app/publish --no-restore

# Estágio 2: Runtime (imagem final enxuta ~200MB)
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app

# Cria pasta para uploads de fotos (volume persistente)
RUN mkdir -p /app/wwwroot/uploads/fotos

COPY --from=build /app/publish .

# Porta exposta pela API
EXPOSE 5263

# Variáveis de ambiente padrão (sobrescritas pelo docker-compose)
ENV ASPNETCORE_URLS=http://+:5263
ENV ASPNETCORE_ENVIRONMENT=Production

ENTRYPOINT ["dotnet", "GravityCarSystem.API.dll"]
