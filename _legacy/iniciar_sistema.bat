@echo off
title Iniciar Gravity Car System
echo ========================================================
echo        INICIANDO GRAVITY CAR SYSTEM (LOCAL)
echo ========================================================
echo.

cd /d "%~dp0"

echo [1/3] Iniciando Backend API na porta 5263...
start "GravityCarSystem - API (Porta 5263)" cmd /k "cd /d %~dp0 && .dotnet\dotnet.exe run --project GravityCarSystem.API\GravityCarSystem.API.csproj --urls http://localhost:5263"

echo [2/3] Iniciando Frontend React (Vite) na porta 5173...
start "GravityCarSystem - Frontend (Porta 5173)" cmd /k "cd /d %~dp0GravityCarSystem.Web && npm run dev"

echo [3/3] Aguardando inicializacao dos servidores...
timeout /t 4 /nobreak >nul

echo Abrindo aplicacao no seu navegador padrao...
start http://localhost:5173

echo.
echo ========================================================
echo  Sistema iniciado com sucesso!
echo  - Frontend: http://localhost:5173
echo  - Backend API: http://localhost:5263/swagger
echo ========================================================
echo.
pause
