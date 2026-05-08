# update_prod_db.ps1
# Script para SOBRESCRIBIR la base de datos de Producción (VPS) con los datos locales
# [!] ADVERTENCIA: Este proceso elimina los datos existentes en el servidor.

$REMOTE_USER = 'root'
$REMOTE_HOST = 'sgh.accesovirtual.com.ar'
$CONTAINER_PROD = 'sgh-db'
$CONTAINER_LOCAL = 'sgh-db'  # Tu contenedor local
$DB_USER = 'horarios_user'
$DB_NAME = 'horarios'

Write-Host '--- INICIANDO SOBREESCRITURA TOTAL DE PRODUCCION ---' -ForegroundColor Cyan

# 1. Crear Dump Local usando Docker
Write-Host '[1/3] Generando volcado (dump) desde el contenedor local sgh-db...' -ForegroundColor Yellow
docker exec -i $CONTAINER_LOCAL pg_dump -U $DB_USER -d $DB_NAME --clean --no-owner --no-privileges > local_dump.sql

if ($LASTEXITCODE -ne 0) {
    Write-Host 'Error al generar el dump local desde el contenedor.' -ForegroundColor Red
    exit 1
}

# 2. Limpiar base de datos remota
Write-Host '[2/3] Limpiando base de datos en produccion...' -ForegroundColor Yellow
$DROP_CMD = "docker exec -i $CONTAINER_PROD psql -U $DB_USER -d $DB_NAME -c 'DROP SCHEMA public CASCADE; CREATE SCHEMA public;'"
ssh "$REMOTE_USER@$REMOTE_HOST" $DROP_CMD

# 3. Restaurar en Produccion
Write-Host '[3/3] Restaurando datos locales en el servidor...' -ForegroundColor Yellow
Get-Content local_dump.sql | ssh "$REMOTE_USER@$REMOTE_HOST" "docker exec -i $CONTAINER_PROD psql -U $DB_USER -d $DB_NAME"

if ($LASTEXITCODE -ne 0) {
    Write-Host 'Error durante la restauracion en produccion.' -ForegroundColor Red
    exit 1
}

# Limpieza
Remove-Item local_dump.sql

Write-Host 'DONE: Base de datos de produccion actualizada e identica a desarrollo.' -ForegroundColor Green
Write-Host 'Proceso Finalizado.' -ForegroundColor Cyan
