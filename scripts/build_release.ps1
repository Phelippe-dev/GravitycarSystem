# Script para compilar e empacotar a versão de Produção do Gravity Car System
$ErrorActionPreference = "Stop"

$baseDir = "C:\Users\lipeh\OneDrive\Desktop\Gravity Car System"
$releaseDir = "$baseDir\Release"
$zipFile = "$baseDir\GravityCarSystem_Producao.zip"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Gerando Release do Gravity Car System" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# 1. Preparar pastas
if (Test-Path $releaseDir) {
    Remove-Item -Recurse -Force $releaseDir
}
New-Item -ItemType Directory -Path $releaseDir | Out-Null
New-Item -ItemType Directory -Path "$releaseDir\API" | Out-Null
New-Item -ItemType Directory -Path "$releaseDir\Web" | Out-Null

if (Test-Path $zipFile) {
    Remove-Item -Force $zipFile
}

# 2. Compilar API (Backend)
Write-Host "`n[1/4] Compilando a API (.NET)..." -ForegroundColor Yellow
Set-Location "$baseDir\GravityCarSystem.API"
dotnet publish -c Release -o "$releaseDir\API"
if ($LASTEXITCODE -ne 0) { throw "Falha na compilação da API" }

# 3. Compilar Web (Frontend)
Write-Host "`n[2/4] Instalando dependências e compilando o Frontend (React)..." -ForegroundColor Yellow
Set-Location "$baseDir\GravityCarSystem.Web"
npm install
npm run build
if ($LASTEXITCODE -ne 0) { throw "Falha na compilação do Frontend" }
Copy-Item -Recurse -Force "dist\*" "$releaseDir\Web\"

# 4. Copiar scripts e manuais úteis
Write-Host "`n[3/4] Copiando scripts de deploy e manuais..." -ForegroundColor Yellow
Copy-Item -Force "$baseDir\instrucoes_publicacao_local.md" "$releaseDir\"
Copy-Item -Recurse -Force "$baseDir\scripts" "$releaseDir\scripts"
Copy-Item -Recurse -Force "$baseDir\deploy" "$releaseDir\deploy"

# 5. Zipar tudo
Write-Host "`n[4/4] Compactando arquivo de Release (ZIP)..." -ForegroundColor Yellow
Compress-Archive -Path "$releaseDir\*" -DestinationPath $zipFile

Write-Host "`n========================================" -ForegroundColor Green
Write-Host " Sucesso! Pacote gerado:" -ForegroundColor Green
Write-Host " Arquivo: $zipFile" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Green
