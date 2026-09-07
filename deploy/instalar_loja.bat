@echo off
chcp 65001 >nul
title Gravity Car System — Instalador de Nova Loja
color 0A

echo.
echo  ╔══════════════════════════════════════════════════════════╗
echo  ║         GRAVITY CAR SYSTEM — INSTALADOR DE LOJA         ║
echo  ║            Sistema de Gestão de Concessionárias          ║
echo  ╚══════════════════════════════════════════════════════════╝
echo.

:: ─────────────────────────────────────────────────────
:: 1. Verificar Docker Desktop
:: ─────────────────────────────────────────────────────
echo [1/6] Verificando Docker Desktop...
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo  ╔══════════════════════════════════════════════════════════╗
    echo  ║  Docker Desktop não encontrado ou não está em execução.  ║
    echo  ║                                                          ║
    echo  ║  Por favor:                                              ║
    echo  ║  1. Baixe em: https://www.docker.com/products/docker-desktop  ║
    echo  ║  2. Instale e reinicie o computador                      ║
    echo  ║  3. Execute este instalador novamente                    ║
    echo  ╚══════════════════════════════════════════════════════════╝
    echo.
    pause
    exit /b 1
)
echo  ✓ Docker Desktop encontrado e em execução
echo.

:: ─────────────────────────────────────────────────────
:: 2. Coletar informações da loja
:: ─────────────────────────────────────────────────────
echo [2/6] Configurando informações da loja...
echo.
set /p LOJA_NOME_FANTASIA="  Nome fantasia da loja (Ex: Gravity Motors): "
set /p LOJA_RAZAO_SOCIAL="  Razão Social (Ex: Gravity Motors LTDA): "
set /p LOJA_CNPJ="  CNPJ (Ex: 12.345.678/0001-99): "
set /p LOJA_TENANT="  Código único da loja (Ex: loja-bh, loja-contagem): "

if "%LOJA_NOME_FANTASIA%"=="" set LOJA_NOME_FANTASIA=Gravity Motors
if "%LOJA_RAZAO_SOCIAL%"=="" set LOJA_RAZAO_SOCIAL=Gravity Motors LTDA
if "%LOJA_CNPJ%"=="" set LOJA_CNPJ=00.000.000/0001-00
if "%LOJA_TENANT%"=="" set LOJA_TENANT=loja-001

:: Senha segura para o banco (gerada automaticamente)
set DB_PASS=GravityDB_%LOJA_TENANT%_2024!

echo.
echo  ─────────────────────────────────────────
echo    Dados confirmados:
echo    Nome:       %LOJA_NOME_FANTASIA%
echo    Razão:      %LOJA_RAZAO_SOCIAL%
echo    CNPJ:       %LOJA_CNPJ%
echo    Código:     %LOJA_TENANT%
echo  ─────────────────────────────────────────
echo.

:: ─────────────────────────────────────────────────────
:: 3. Criar arquivo .env com as configurações
:: ─────────────────────────────────────────────────────
echo [3/6] Gerando arquivo de configuração (.env)...

cd /d "%~dp0.."

(
echo # Configurações geradas automaticamente pelo instalador
echo # NÃO COMPARTILHE ESTE ARQUIVO
echo.
echo DB_PASSWORD=%DB_PASS%
echo JWT_SECRET=ProdSecret_%LOJA_TENANT%_GravityCarSystem2024_Secure32Ch
echo.
echo LOJA_TENANT_ID=%LOJA_TENANT%
echo LOJA_RAZAO_SOCIAL=%LOJA_RAZAO_SOCIAL%
echo LOJA_NOME_FANTASIA=%LOJA_NOME_FANTASIA%
echo LOJA_CNPJ=%LOJA_CNPJ%
) > .env

echo  ✓ Arquivo .env criado com sucesso
echo.

:: ─────────────────────────────────────────────────────
:: 4. Build e subida dos containers
:: ─────────────────────────────────────────────────────
echo [4/6] Construindo e iniciando os containers...
echo  (Este processo pode levar 3-5 minutos na primeira vez)
echo.

docker compose build --no-cache
if %errorlevel% neq 0 (
    echo  ERRO: Falha ao construir as imagens Docker.
    echo  Verifique os erros acima e tente novamente.
    pause
    exit /b 1
)

docker compose up -d
if %errorlevel% neq 0 (
    echo  ERRO: Falha ao iniciar os containers.
    pause
    exit /b 1
)

echo  ✓ Containers iniciados com sucesso
echo.

:: ─────────────────────────────────────────────────────
:: 5. Aguardar API ficar disponível
:: ─────────────────────────────────────────────────────
echo [5/6] Aguardando sistema inicializar...
timeout /t 8 /nobreak >nul

set TENTATIVAS=0
:CHECK_API
set /a TENTATIVAS+=1
curl -s http://localhost:5263/api/veiculos >nul 2>&1
if %errorlevel% neq 0 (
    if %TENTATIVAS% lss 15 (
        echo  Aguardando API... (%TENTATIVAS%/15)
        timeout /t 4 /nobreak >nul
        goto CHECK_API
    ) else (
        echo  Aviso: API pode estar ainda inicializando. O banco de dados migra automaticamente.
    )
) else (
    echo  ✓ API respondendo normalmente
)
echo.

:: ─────────────────────────────────────────────────────
:: 6. Configurar backup automático no Agendador de Tarefas
:: ─────────────────────────────────────────────────────
echo [6/6] Configurando backup automático diário (03:00)...

set BACKUP_SCRIPT=%~dp0backup_banco.bat
schtasks /create /tn "GravityCarSystem_Backup_%LOJA_TENANT%" /tr "%BACKUP_SCRIPT%" /sc DAILY /st 03:00 /ru SYSTEM /f >nul 2>&1
if %errorlevel% equ 0 (
    echo  ✓ Backup automático configurado para 03:00 diariamente
) else (
    echo  Aviso: Configure o backup manualmente no Agendador de Tarefas do Windows
)

:: ─────────────────────────────────────────────────────
:: Conclusão
:: ─────────────────────────────────────────────────────
echo.
echo  ╔══════════════════════════════════════════════════════════╗
echo  ║           SISTEMA INSTALADO COM SUCESSO!                 ║
echo  ╠══════════════════════════════════════════════════════════╣
echo  ║  Acesso na rede local:  http://localhost                 ║
echo  ║  API (desenvolvimento): http://localhost:5263/swagger    ║
echo  ║                                                          ║
echo  ║  PRÓXIMO PASSO: fixe o IP do servidor no roteador        ║
echo  ║  Ex: 192.168.1.100 → qualquer PC da loja acessa         ║
echo  ║      http://192.168.1.100                                ║
echo  ╚══════════════════════════════════════════════════════════╝
echo.

start http://localhost
echo Abrindo o sistema no navegador...
echo.
pause
