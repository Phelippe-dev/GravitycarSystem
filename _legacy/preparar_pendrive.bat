@echo off
chcp 65001 >nul
title Gravity Car System — Preparar Pendrive de Instalação
color 0E

echo.
echo  ╔══════════════════════════════════════════════════════════╗
echo  ║    GRAVITY CAR SYSTEM — PREPARADOR DE PENDRIVE          ║
echo  ║    Gera o pacote completo para instalação no cliente    ║
echo  ╚══════════════════════════════════════════════════════════╝
echo.

cd /d "%~dp0"

:: ─────────────────────────────────────────────────────
:: 0. Verificações de pré-requisitos
:: ─────────────────────────────────────────────────────
echo [0/7] Verificando pré-requisitos...

where dotnet >nul 2>&1
if %errorlevel% neq 0 (
    echo  ERRO: .NET SDK não encontrado. Instale o .NET 8 SDK.
    pause
    exit /b 1
)

where node >nul 2>&1
if %errorlevel% neq 0 (
    echo  ERRO: Node.js não encontrado. Instale o Node.js 18+.
    pause
    exit /b 1
)

echo  ✓ .NET SDK e Node.js encontrados
echo.

:: ─────────────────────────────────────────────────────
:: 1. Definir diretório de saída (Release limpa)
:: ─────────────────────────────────────────────────────
set BASE_DIR=%~dp0
set RELEASE_DIR=%BASE_DIR%Release\GravityCarSystem
set OUTPUT_ZIP=%BASE_DIR%Release\GravityCarSystem_Pendrive.zip

echo [1/7] Limpando e preparando diretório de Release...
if exist "%RELEASE_DIR%" rmdir /s /q "%RELEASE_DIR%"
mkdir "%RELEASE_DIR%"
mkdir "%RELEASE_DIR%\API"
mkdir "%RELEASE_DIR%\Web"
mkdir "%RELEASE_DIR%\deploy"
mkdir "%RELEASE_DIR%\scripts"
mkdir "%RELEASE_DIR%\Docker"
echo  ✓ Diretório preparado: %RELEASE_DIR%
echo.

:: ─────────────────────────────────────────────────────
:: 2. Compilar API (.NET Backend)
:: ─────────────────────────────────────────────────────
echo [2/7] Compilando API (.NET 8 Release)...
dotnet publish "%BASE_DIR%GravityCarSystem.API\GravityCarSystem.API.csproj" -c Release -o "%RELEASE_DIR%\API" --no-self-contained
if %errorlevel% neq 0 (
    echo  ERRO: Falha na compilação da API!
    pause
    exit /b 1
)
echo  ✓ API compilada em Release
echo.

:: ─────────────────────────────────────────────────────
:: 3. Compilar Frontend (React/Vite)
:: ─────────────────────────────────────────────────────
echo [3/7] Instalando dependências e compilando Frontend (React)...
cd /d "%BASE_DIR%GravityCarSystem.Web"
call npm install --production=false >nul 2>&1
call npm run build
if %errorlevel% neq 0 (
    echo  ERRO: Falha na compilação do Frontend!
    pause
    exit /b 1
)
xcopy /s /e /y /q "dist\*" "%RELEASE_DIR%\Web\" >nul
cd /d "%BASE_DIR%"
echo  ✓ Frontend compilado e copiado
echo.

:: ─────────────────────────────────────────────────────
:: 4. Copiar Docker Compose e Dockerfiles
:: ─────────────────────────────────────────────────────
echo [4/7] Copiando arquivos Docker...
copy /y "%BASE_DIR%docker-compose.yml" "%RELEASE_DIR%\Docker\" >nul
copy /y "%BASE_DIR%Dockerfile" "%RELEASE_DIR%\Docker\" >nul
copy /y "%BASE_DIR%GravityCarSystem.Web\Dockerfile" "%RELEASE_DIR%\Docker\Dockerfile.web" >nul
copy /y "%BASE_DIR%GravityCarSystem.Web\nginx.conf" "%RELEASE_DIR%\Docker\" >nul
copy /y "%BASE_DIR%.env.example" "%RELEASE_DIR%\Docker\" >nul
copy /y "%BASE_DIR%.dockerignore" "%RELEASE_DIR%\Docker\" >nul
echo  ✓ Arquivos Docker copiados
echo.

:: ─────────────────────────────────────────────────────
:: 5. Copiar scripts de deploy e manuais
:: ─────────────────────────────────────────────────────
echo [5/7] Copiando scripts e manuais...
copy /y "%BASE_DIR%deploy\instalar_loja.bat" "%RELEASE_DIR%\deploy\" >nul
copy /y "%BASE_DIR%deploy\atualizar_sistema.bat" "%RELEASE_DIR%\deploy\" >nul
copy /y "%BASE_DIR%deploy\backup_banco.bat" "%RELEASE_DIR%\deploy\" >nul
copy /y "%BASE_DIR%deploy\appsettings.template.json" "%RELEASE_DIR%\deploy\" >nul
copy /y "%BASE_DIR%scripts\backup_postgres_gdrive.ps1" "%RELEASE_DIR%\scripts\" >nul
copy /y "%BASE_DIR%instrucoes_publicacao_local.md" "%RELEASE_DIR%\" >nul
echo  ✓ Scripts e manuais copiados
echo.

:: ─────────────────────────────────────────────────────
:: 6. Gerar o instalador fácil para o técnico
:: ─────────────────────────────────────────────────────
echo [6/7] Gerando INSTALAR.bat (Instalador 1-clique para pendrive)...

(
echo @echo off
echo chcp 65001 ^>nul
echo title Gravity Car System — INSTALADOR DO PENDRIVE
echo color 0A
echo.
echo echo.
echo echo  ╔══════════════════════════════════════════════════════════════╗
echo echo  ║         GRAVITY CAR SYSTEM — INSTALACAO VIA PENDRIVE       ║
echo echo  ║                                                              ║
echo echo  ║  Este instalador ira configurar o sistema completo no PC     ║
echo echo  ║  do cliente. Basta conectar o pendrive e executar.           ║
echo echo  ╚══════════════════════════════════════════════════════════════╝
echo echo.
echo.
echo cd /d "%%~dp0"
echo.
echo :: ═══════════════════════════════════════════════════
echo :: ETAPA 1: Verificar Docker
echo :: ═══════════════════════════════════════════════════
echo echo [1/8] Verificando Docker Desktop...
echo docker info ^>nul 2^>^&1
echo if %%errorlevel%% neq 0 ^(
echo     echo.
echo     echo  ╔═══════════════════════════════════════════════════════╗
echo     echo  ║  Docker Desktop NAO encontrado ou nao esta rodando!  ║
echo     echo  ║                                                       ║
echo     echo  ║  1. Baixe em: https://docker.com/products/docker-desktop  ║
echo     echo  ║  2. Instale e REINICIE o computador                  ║
echo     echo  ║  3. Execute este instalador novamente                ║
echo     echo  ╚═══════════════════════════════════════════════════════╝
echo     pause
echo     exit /b 1
echo ^)
echo echo  ✓ Docker Desktop encontrado
echo echo.
echo.
echo :: ═══════════════════════════════════════════════════
echo :: ETAPA 2: Coletar dados da loja
echo :: ═══════════════════════════════════════════════════
echo echo [2/8] Configurando a loja...
echo echo.
echo set /p "LOJA_NOME=  Nome fantasia da loja: "
echo set /p "LOJA_RAZAO=  Razao Social: "
echo set /p "LOJA_CNPJ=  CNPJ: "
echo set /p "LOJA_CODIGO=  Codigo unico (ex: loja-bh, loja-sp^): "
echo.
echo if "%%LOJA_NOME%%"=="" set LOJA_NOME=Gravity Motors
echo if "%%LOJA_RAZAO%%"=="" set LOJA_RAZAO=Gravity Motors LTDA
echo if "%%LOJA_CNPJ%%"=="" set LOJA_CNPJ=00.000.000/0001-00
echo if "%%LOJA_CODIGO%%"=="" set LOJA_CODIGO=loja-001
echo.
echo echo  Dados confirmados:
echo echo    Nome:   %%LOJA_NOME%%
echo echo    Razao:  %%LOJA_RAZAO%%
echo echo    CNPJ:   %%LOJA_CNPJ%%
echo echo    Codigo: %%LOJA_CODIGO%%
echo echo.
echo echo Pressione qualquer tecla para confirmar e iniciar...
echo pause ^>nul
echo echo.
echo.
echo :: ═══════════════════════════════════════════════════
echo :: ETAPA 3: Criar pasta de instalacao
echo :: ═══════════════════════════════════════════════════
echo echo [3/8] Criando pasta de instalacao...
echo set INSTALL_DIR=C:\GravityCar
echo if not exist "%%INSTALL_DIR%%" mkdir "%%INSTALL_DIR%%"
echo echo  ✓ Pasta criada: %%INSTALL_DIR%%
echo echo.
echo.
echo :: ═══════════════════════════════════════════════════
echo :: ETAPA 4: Copiar arquivos do pendrive
echo :: ═══════════════════════════════════════════════════
echo echo [4/8] Copiando arquivos do pendrive para o PC...
echo xcopy /s /e /y /q "%%~dp0*" "%%INSTALL_DIR%%\" ^>nul
echo echo  ✓ Arquivos copiados
echo echo.
echo.
echo :: ═══════════════════════════════════════════════════
echo :: ETAPA 5: Gerar .env seguro
echo :: ═══════════════════════════════════════════════════
echo echo [5/8] Gerando configuracao de seguranca...
echo.
echo :: Gerar chave JWT aleatoria via PowerShell
echo for /f "delims=" %%%%A in ^('powershell -command "[Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))"'^) do set JWT_KEY=%%%%A
echo.
echo ^(
echo echo # Configuracoes do Gravity Car System
echo echo # GERADO AUTOMATICAMENTE - NAO COMPARTILHE ESTE ARQUIVO
echo echo.
echo echo DB_PASSWORD=GravityDB_%%LOJA_CODIGO%%_%%RANDOM%%%%RANDOM%%!
echo echo JWT_SECRET=%%JWT_KEY%%
echo echo.
echo echo LOJA_TENANT_ID=%%LOJA_CODIGO%%
echo echo LOJA_RAZAO_SOCIAL=%%LOJA_RAZAO%%
echo echo LOJA_NOME_FANTASIA=%%LOJA_NOME%%
echo echo LOJA_CNPJ=%%LOJA_CNPJ%%
echo echo.
echo echo CORS_ORIGINS=http://localhost,http://localhost:80
echo ^) ^> "%%INSTALL_DIR%%\Docker\.env"
echo.
echo echo  ✓ Configuracao de seguranca gerada
echo echo.
echo.
echo :: ═══════════════════════════════════════════════════
echo :: ETAPA 6: Docker Build e Start
echo :: ═══════════════════════════════════════════════════
echo echo [6/8] Construindo e iniciando o sistema (3-5 min na 1a vez^)...
echo cd /d "%%INSTALL_DIR%%\Docker"
echo docker compose build --no-cache
echo if %%errorlevel%% neq 0 ^(
echo     echo  ERRO: Falha ao construir. Verifique o Docker Desktop.
echo     pause
echo     exit /b 1
echo ^)
echo docker compose up -d
echo if %%errorlevel%% neq 0 ^(
echo     echo  ERRO: Falha ao iniciar containers.
echo     pause
echo     exit /b 1
echo ^)
echo echo  ✓ Containers iniciados
echo echo.
echo.
echo :: ═══════════════════════════════════════════════════
echo :: ETAPA 7: Aguardar API
echo :: ═══════════════════════════════════════════════════
echo echo [7/8] Aguardando sistema ficar online...
echo timeout /t 10 /nobreak ^>nul
echo set TRIES=0
echo :WAIT_API
echo set /a TRIES+=1
echo curl -s http://localhost:5263/api/veiculos ^>nul 2^>^&1
echo if %%errorlevel%% neq 0 ^(
echo     if %%TRIES%% lss 20 ^(
echo         echo  Aguardando... (%%TRIES%%/20^)
echo         timeout /t 3 /nobreak ^>nul
echo         goto WAIT_API
echo     ^)
echo ^)
echo echo  ✓ Sistema online
echo echo.
echo.
echo :: ═══════════════════════════════════════════════════
echo :: ETAPA 8: Backup Agendado
echo :: ═══════════════════════════════════════════════════
echo echo [8/8] Configurando backup automatico diario (03:00^)...
echo schtasks /create /tn "GravityCarSystem_Backup" /tr "%%INSTALL_DIR%%\deploy\backup_banco.bat" /sc DAILY /st 03:00 /ru SYSTEM /f ^>nul 2^>^&1
echo if %%errorlevel%% equ 0 ^(
echo     echo  ✓ Backup automatico configurado
echo ^) else ^(
echo     echo  Aviso: Configure manualmente no Agendador de Tarefas
echo ^)
echo echo.
echo.
echo :: ═══════════════════════════════════════════════════
echo :: CONCLUSAO
echo :: ═══════════════════════════════════════════════════
echo echo.
echo echo  ╔══════════════════════════════════════════════════════════════╗
echo echo  ║          SISTEMA INSTALADO COM SUCESSO!                     ║
echo echo  ╠══════════════════════════════════════════════════════════════╣
echo echo  ║                                                              ║
echo echo  ║  Acesso:  http://localhost                                   ║
echo echo  ║  API:     http://localhost:5263/swagger                      ║
echo echo  ║                                                              ║
echo echo  ║  Login padrao:                                               ║
echo echo  ║    Email: admin@gravitycar.com                               ║
echo echo  ║    Senha: 123456 (troque imediatamente!)                     ║
echo echo  ║                                                              ║
echo echo  ║  IMPORTANTE: Fixe o IP do servidor no roteador               ║
echo echo  ║  para que os outros PCs da loja acessem.                     ║
echo echo  ╚══════════════════════════════════════════════════════════════╝
echo echo.
echo start http://localhost
echo pause
) > "%RELEASE_DIR%\INSTALAR.bat"

echo  ✓ INSTALAR.bat criado
echo.

:: ─────────────────────────────────────────────────────
:: 7. Criar o README rápido
:: ─────────────────────────────────────────────────────
echo [7/7] Gerando LEIA-ME...

(
echo ═══════════════════════════════════════════════════════
echo        GRAVITY CAR SYSTEM — GUIA RAPIDO DO PENDRIVE
echo ═══════════════════════════════════════════════════════
echo.
echo PRE-REQUISITOS NO PC DO CLIENTE:
echo   1. Windows 10/11 Pro ou Enterprise
echo   2. Docker Desktop instalado ^(https://docker.com^)
echo   3. Minimo 8GB RAM, 10GB disco livre
echo.
echo COMO INSTALAR:
echo   1. Conecte o pendrive no PC do cliente
echo   2. Abra a pasta do pendrive
echo   3. Clique com botao direito no INSTALAR.bat
echo   4. Selecione "Executar como administrador"
echo   5. Preencha os dados da loja quando solicitado
echo   6. Aguarde a instalacao ^(3-5 minutos^)
echo   7. O sistema abrira automaticamente no navegador
echo.
echo COMO ATUALIZAR:
echo   1. Copie os novos arquivos para C:\GravityCar
echo   2. Execute deploy\atualizar_sistema.bat
echo.
echo BACKUP:
echo   O backup roda automaticamente as 03:00
echo   Local: C:\GravityCar\backups\
echo   Nuvem: OneDrive\GravityCarBackups\ ^(se configurado^)
echo.
echo SUPORTE:
echo   Email: lipehsilva666@gmail.com
echo ═══════════════════════════════════════════════════════
) > "%RELEASE_DIR%\LEIA-ME.txt"

echo  ✓ LEIA-ME.txt criado
echo.

:: ─────────────────────────────────────────────────────
:: Compactar tudo em ZIP
:: ─────────────────────────────────────────────────────
echo Compactando pacote final para pendrive...
if exist "%OUTPUT_ZIP%" del /f /q "%OUTPUT_ZIP%"
powershell -command "Compress-Archive -Path '%RELEASE_DIR%\*' -DestinationPath '%OUTPUT_ZIP%' -CompressionLevel Optimal"

if %errorlevel% equ 0 (
    echo  ✓ ZIP gerado: %OUTPUT_ZIP%
) else (
    echo  Aviso: Nao foi possivel gerar ZIP. Copie a pasta manualmente.
)

echo.
echo  ╔══════════════════════════════════════════════════════════════╗
echo  ║                 PENDRIVE PRONTO!                            ║
echo  ╠══════════════════════════════════════════════════════════════╣
echo  ║                                                              ║
echo  ║  Pasta: %RELEASE_DIR%
echo  ║  ZIP:   %OUTPUT_ZIP%
echo  ║                                                              ║
echo  ║  PROXIMO PASSO:                                              ║
echo  ║  Copie a pasta Release\GravityCarSystem para o pendrive.     ║
echo  ║  No PC do cliente, execute INSTALAR.bat                      ║
echo  ╚══════════════════════════════════════════════════════════════╝
echo.
pause
