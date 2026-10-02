@echo off
chcp 65001 >nul
title Gravity Car System — Atualização do Sistema
color 0B

echo.
echo  ╔══════════════════════════════════════════════════════════╗
echo  ║       GRAVITY CAR SYSTEM — ATUALIZADOR DO SISTEMA       ║
echo  ║          Atualização em menos de 30 segundos             ║
echo  ╚══════════════════════════════════════════════════════════╝
echo.

cd /d "%~dp0.."

:: ─────────────────────────────────────────────────────
:: 1. Baixar nova versão do GitHub
:: ─────────────────────────────────────────────────────
echo [1/4] Baixando nova versão do servidor...
git pull origin master
if %errorlevel% neq 0 (
    echo  ERRO: Não foi possível baixar a atualização.
    echo  Verifique a conexão com a internet.
    pause
    exit /b 1
)
echo  ✓ Código atualizado com sucesso
echo.

:: ─────────────────────────────────────────────────────
:: 2. Rebuildar as imagens Docker
:: ─────────────────────────────────────────────────────
echo [2/4] Reconstruindo imagens (pode levar 2-3 minutos)...
docker compose build --no-cache
if %errorlevel% neq 0 (
    echo  ERRO: Falha ao reconstruir as imagens.
    pause
    exit /b 1
)
echo  ✓ Imagens reconstruídas
echo.

:: ─────────────────────────────────────────────────────
:: 3. Reiniciar containers (downtime ~15 segundos)
:: ─────────────────────────────────────────────────────
echo [3/4] Reiniciando sistema (downtime ~15 segundos)...
docker compose up -d --force-recreate
if %errorlevel% neq 0 (
    echo  ERRO: Falha ao reiniciar os containers.
    pause
    exit /b 1
)
echo  ✓ Sistema reiniciado
echo  ✓ Banco de dados migrado automaticamente pela API
echo.

:: ─────────────────────────────────────────────────────
:: 4. Verificar saúde do sistema
:: ─────────────────────────────────────────────────────
echo [4/4] Verificando sistema...
timeout /t 10 /nobreak >nul

curl -s http://localhost:5263/api/veiculos >nul 2>&1
if %errorlevel% equ 0 (
    echo  ✓ API respondendo normalmente
) else (
    echo  Aviso: API ainda inicializando. Aguarde alguns segundos e pressione F5 no navegador.
)

echo.
echo  ╔══════════════════════════════════════════════════════════╗
echo  ║         SISTEMA ATUALIZADO COM SUCESSO!                  ║
echo  ║  Os usuários precisam apenas pressionar F5 no navegador. ║
echo  ╚══════════════════════════════════════════════════════════╝
echo.
pause
