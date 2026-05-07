# sync_local_to_prod.ps1
# Script para migración ÚNICA de base de datos desde Local hacia Producción (VPS)

$TIMESTAMP = Get-Date -Format 'yyyyMMdd_HHmmss'
$DUMP_FILE = "sgh_dump_$TIMESTAMP.sql"
$REMOTE_USER = 'root'
$REMOTE_HOST = 'sgh.accesovirtual.com.ar'
$REMOTE_PATH = '/root/'
$CONTAINER_LOCAL = 'sgh-db'
$CONTAINER_PROD = 'sgh-db'

Write-Host '--- INICIANDO MIGRACION UNICA DE BASE DE DATOS ---' -ForegroundColor Cyan

# 1. Generar volcado local
Write-Host '[1/4] Generando dump de base de datos local...' -ForegroundColor Yellow
# Usamos --clean e --if-exists para que el destino se limpie antes de restaurar
docker exec $CONTAINER_LOCAL pg_dump -U horarios_user -d horarios --clean --if-exists --no-owner --no-privileges -f /tmp/sgh_dump.sql
docker cp ($CONTAINER_LOCAL + ':/tmp/sgh_dump.sql') $DUMP_FILE
docker exec $CONTAINER_LOCAL rm /tmp/sgh_dump.sql

if ($LASTEXITCODE -ne 0) {
    Write-Host 'Error al generar dump local.' -ForegroundColor Red
    exit 1
}

# 2. Transferir al VPS
Write-Host '[2/4] Transfiriendo archivo al servidor de produccion...' -ForegroundColor Yellow
$dest = $REMOTE_USER + '@' + $REMOTE_HOST + ':' + $REMOTE_PATH
scp $DUMP_FILE $dest

if ($LASTEXITCODE -ne 0) {
    Write-Host 'Error al transferir archivo via SCP.' -ForegroundColor Red
    exit 1
}

# 3. Restaurar en Produccion
Write-Host '[3/4] Restaurando base de datos en el servidor...' -ForegroundColor Yellow
$remote_cmd = 'cat ' + $REMOTE_PATH + $DUMP_FILE + ' | docker exec -i ' + $CONTAINER_PROD + ' psql -U horarios_user -d horarios'
$remote_target = $REMOTE_USER + '@' + $REMOTE_HOST
ssh $remote_target $remote_cmd

if ($LASTEXITCODE -ne 0) {
    Write-Host 'Error al restaurar base de datos en produccion.' -ForegroundColor Red
    exit 1
}

# 4. Limpieza
Write-Host '[4/4] Limpiando archivos temporales...' -ForegroundColor Yellow
if (Test-Path $DUMP_FILE) { Remove-Item $DUMP_FILE }
$rm_cmd = 'rm ' + $REMOTE_PATH + $DUMP_FILE
ssh $remote_target $rm_cmd

Write-Host 'DONE: Migracion completada con exito.' -ForegroundColor Green
Write-Host 'Proceso Finalizado.' -ForegroundColor Cyan
