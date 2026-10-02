@echo off
chcp 65001 >nul
:: =====================================================================
:: backup_banco.bat — Backup do PostgreSQL com envio para OneDrive
:: Configure no Agendador de Tarefas do Windows para rodar às 03:00
:: =====================================================================

:: ─────────────────────────────────────────────────────
:: Configurações (ajuste conforme necessário)
:: ─────────────────────────────────────────────────────
set CONTAINER_DB=gravity-db
set DB_NAME=gravitycarsystem
set DB_USER=gravity_user

:: Pasta local de backup
set BACKUP_DIR=C:\GravityCar\backups
:: Pasta OneDrive (ajuste para o caminho real do OneDrive no servidor)
set ONEDRIVE_DIR=%USERPROFILE%\OneDrive\GravityCarBackups

:: Manter apenas os últimos N backups locais
set MANTER_BACKUPS=30

:: ─────────────────────────────────────────────────────
:: 1. Criar pastas necessárias
:: ─────────────────────────────────────────────────────
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"
if not exist "%ONEDRIVE_DIR%" mkdir "%ONEDRIVE_DIR%" 2>nul

:: ─────────────────────────────────────────────────────
:: 2. Nome do arquivo com data e hora
:: ─────────────────────────────────────────────────────
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set DATETIME=%%I
set TIMESTAMP=%DATETIME:~0,4%%DATETIME:~4,2%%DATETIME:~6,2%_%DATETIME:~8,2%%DATETIME:~10,2%
set BACKUP_FILE=%BACKUP_DIR%\backup_%TIMESTAMP%.sql

:: ─────────────────────────────────────────────────────
:: 3. Executar pg_dump dentro do container Docker
:: ─────────────────────────────────────────────────────
echo [%DATE% %TIME%] Iniciando backup do banco de dados...
docker exec %CONTAINER_DB% pg_dump -U %DB_USER% -d %DB_NAME% -F p > "%BACKUP_FILE%" 2>nul

if %errorlevel% equ 0 (
    echo [%DATE% %TIME%] ✓ Backup gerado: %BACKUP_FILE%
) else (
    echo [%DATE% %TIME%] ERRO: Falha ao gerar o backup!
    exit /b 1
)

:: ─────────────────────────────────────────────────────
:: 4. Copiar para OneDrive (sincroniza automaticamente para a nuvem)
:: ─────────────────────────────────────────────────────
if exist "%ONEDRIVE_DIR%" (
    copy /Y "%BACKUP_FILE%" "%ONEDRIVE_DIR%\" >nul
    echo [%DATE% %TIME%] ✓ Backup copiado para OneDrive: %ONEDRIVE_DIR%
) else (
    echo [%DATE% %TIME%] Aviso: Pasta OneDrive não encontrada. Backup apenas local.
)

:: ─────────────────────────────────────────────────────
:: 5. Remover backups locais antigos (manter últimos 30)
:: ─────────────────────────────────────────────────────
echo [%DATE% %TIME%] Limpando backups antigos (mantendo últimos %MANTER_BACKUPS%)...
for /f "skip=%MANTER_BACKUPS% delims=" %%F in ('dir /b /o-d "%BACKUP_DIR%\backup_*.sql" 2^>nul') do (
    del /f /q "%BACKUP_DIR%\%%F" >nul
    echo [%DATE% %TIME%]   Removido: %%F
)

echo [%DATE% %TIME%] ✓ Backup concluído com sucesso!
