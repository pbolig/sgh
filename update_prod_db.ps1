# update_prod_db.ps1
# Script para SOBRESCRIBIR la base de datos de Producción (VPS) con los datos locales
# Corregido para manejar correctamente TILDES y Caracteres Especiales (UTF-8)

$REMOTE_USER = 'root'
$REMOTE_HOST = 'sgh.accesovirtual.com.ar'
$CONTAINER_PROD = 'sgh-db'
$CONTAINER_LOCAL = 'sgh-db'
$DB_USER = 'horarios_user'
$DB_NAME = 'horarios'

Write-Host '--- INICIANDO SOBREESCRITURA TOTAL (FIX TILDES) ---' -ForegroundColor Cyan

# 1. Crear Dump Local forzando UTF-8
Write-Host '[1/3] Generando volcado local en UTF-8...' -ForegroundColor Yellow
docker exec -i $CONTAINER_LOCAL pg_dump -U $DB_USER -d $DB_NAME --clean --no-owner --no-privileges --encoding=UTF8 > local_dump.sql

if ($LASTEXITCODE -ne 0) {
    Write-Host 'Error al generar el dump local.' -ForegroundColor Red
    exit 1
}

# 2. Limpiar base de datos remota
Write-Host '[2/3] Limpiando base de datos en produccion...' -ForegroundColor Yellow
$DROP_CMD = "docker exec -i $CONTAINER_PROD psql -U $DB_USER -d $DB_NAME -c 'DROP SCHEMA public CASCADE; CREATE SCHEMA public;'"
ssh "$REMOTE_USER@$REMOTE_HOST" $DROP_CMD

# 3. Restaurar en Produccion usando codificación explícita
Write-Host '[3/3] Restaurando datos en el servidor (Preservando tildes)...' -ForegroundColor Yellow

# Usamos -Encoding UTF8 para que PowerShell no rompa los caracteres al leer
Get-Content -Raw -Encoding UTF8 local_dump.sql | ssh "$REMOTE_USER@$REMOTE_HOST" "docker exec -i $CONTAINER_PROD psql -U $DB_USER -d $DB_NAME"

if ($LASTEXITCODE -ne 0) {
    Write-Host 'Error durante la restauracion.' -ForegroundColor Red
    exit 1
}

# Limpieza
Remove-Item local_dump.sql

Write-Host 'DONE: Base de datos actualizada con tildes corregidas.' -ForegroundColor Green
Write-Host 'Proceso Finalizado.' -ForegroundColor Cyan
