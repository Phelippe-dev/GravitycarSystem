# Script de Backup Diário do PostgreSQL para o Google Drive
# Pré-requisitos:
# 1. PostgreSQL instalado e pg_dump disponível no PATH (ou ajustar o caminho do PGBIN)
# 2. Rclone instalado (https://rclone.org/) e configurado com um remote chamado "gdrive"

$DB_NAME = "gravitycarsystem"
$DB_USER = "gravity_user"
# A senha pode ser passada via variável de ambiente PGPASSWORD para evitar prompt.
$env:PGPASSWORD = "Gravity@2024!Seguro"

$BACKUP_DIR = "C:\Backups\GravityCarSystem"
$DATE = Get-Date -Format "yyyyMMdd_HHmmss"
$BACKUP_FILE = "$BACKUP_DIR\backup_$DB_NAME_$DATE.sql"

# Certifique-se de que a pasta de backup existe
if (!(Test-Path -Path $BACKUP_DIR)) {
    New-Item -ItemType Directory -Path $BACKUP_DIR
}

Write-Host "Iniciando backup do banco $DB_NAME..."
# Executa o dump
pg_dump -U $DB_USER -h localhost -d $DB_NAME -F c -f $BACKUP_FILE

if ($LASTEXITCODE -eq 0) {
    Write-Host "Backup local concluído com sucesso: $BACKUP_FILE"
    
    # Envia para o Google Drive via Rclone
    Write-Host "Enviando para o Google Drive..."
    # rclone copy <origem> <destino>
    # rclone copy $BACKUP_FILE gdrive:/Backups/GravityCarSystem
    # Descomente a linha acima após configurar o rclone usando 'rclone config'
    
    Write-Host "Processo finalizado."
} else {
    Write-Host "Falha ao realizar o backup do PostgreSQL."
}

# (Opcional) Limpar backups antigos locais (mais velhos que 7 dias)
# Get-ChildItem -Path $BACKUP_DIR -Filter "*.sql" | Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-7) } | Remove-Item
