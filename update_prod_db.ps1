# update_prod_db.ps1
# Script de Sincronización Total (VERSIÓN FINAL - FIX TILDES DEFINITIVO)
# Usa CMD para evitar que PowerShell altere la codificación de los caracteres.

$REMOTE_USER = 'root'
$REMOTE_HOST = 'sgh.accesovirtual.com.ar'
$CONTAINER_PROD = 'sgh-db'
$CONTAINER_LOCAL = 'sgh-db'
$DB_USER = 'horarios_user'
$DB_NAME = 'horarios'

Write-Host '--- INICIANDO SINCRONIZACION BINARIA (TILDES OK) ---' -ForegroundColor Cyan

# 1. Crear Dump Local (Usando CMD para preservar UTF-8 puro)
Write-Host '[1/3] Exportando base de datos local (binario)...' -ForegroundColor Yellow
cmd /c "docker exec -i $CONTAINER_LOCAL pg_dump -U $DB_USER -d $DB_NAME --clean --no-owner --no-privileges --encoding=UTF8 > local_dump.sql"

if ($LASTEXITCODE -ne 0) {
    Write-Host 'Error al exportar. Verifique que el contenedor sgh-db esté corriendo.' -ForegroundColor Red
    exit 1
}

# 2. Limpiar base de datos remota
Write-Host '[2/3] Limpiando base de datos en produccion...' -ForegroundColor Yellow
$DROP_CMD = "docker exec -i $CONTAINER_PROD psql -h localhost -U $DB_USER -d $DB_NAME -c 'DROP SCHEMA public CASCADE; CREATE SCHEMA public;'"
ssh "$REMOTE_USER@$REMOTE_HOST" $DROP_CMD

# 3. Restaurar en Produccion (Usando CMD para inyección directa de bytes)
Write-Host '[3/3] Inyectando datos en produccion...' -ForegroundColor Yellow
cmd /c "ssh $REMOTE_USER@$REMOTE_HOST `"docker exec -i $CONTAINER_PROD psql -h localhost -U $DB_USER -d $DB_NAME`" < local_dump.sql"

if ($LASTEXITCODE -ne 0) {
    Write-Host 'Error durante la inyeccion de datos.' -ForegroundColor Red
    exit 1
}

# Limpieza
if (Test-Path local_dump.sql) { Remove-Item local_dump.sql }

Write-Host 'DONE: Sincronizacion completada. Las tildes deben verse correctamente ahora.' -ForegroundColor Green
Write-Host 'Proceso Finalizado.' -ForegroundColor Cyan
