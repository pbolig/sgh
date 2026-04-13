# sync_local_to_prod.ps1
# Script para migración ÚNICA de base de datos desde Local hacia Producción (VPS)

$TIMESTAMP = Get-Date -Format "yyyyMMdd_HHmmss"
$DUMP_FILE = "sgh_dump_$TIMESTAMP.sql"
$REMOTE_USER = "root"
$REMOTE_HOST = "sgh.accesovirtual.com.ar"
$REMOTE_PATH = "/root/"
$CONTAINER_LOCAL = "sgh-db"
$CONTAINER_PROD = "sgh-db"

Write-Host "--- INICIANDO MIGRACIÓN ÚNICA DE BASE DE DATOS ---" -ForegroundColor Cyan

# 1. Generar volcado local
Write-Host "[1/4] Generando dump de base de datos local..." -ForegroundColor Yellow
docker exec $CONTAINER_LOCAL pg_dump -U horarios_user -d horarios > $DUMP_FILE

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error al generar dump local." -ForegroundColor Red
    exit 1
}

# 2. Transferir al VPS
Write-Host "[2/4] Transfiriendo archivo al servidor de producción..." -ForegroundColor Yellow
scp $DUMP_FILE "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}"

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error al transferir archivo vía SCP." -ForegroundColor Red
    exit 1
}

# 3. Restaurar en Producción
Write-Host "[3/4] Restaurando base de datos en el servidor (esto sobrescribirá los datos actuales)..." -ForegroundColor Yellow
ssh ${REMOTE_USER}@${REMOTE_HOST} "cat ${REMOTE_PATH}${DUMP_FILE} | docker exec -i $CONTAINER_PROD psql -U horarios_user -d horarios"

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error al restaurar base de datos en producción." -ForegroundColor Red
    exit 1
}

# 4. Limpieza
Write-Host "[4/4] Limpiando archivos temporales..." -ForegroundColor Yellow
Remove-Item $DUMP_FILE
ssh ${REMOTE_USER}@${REMOTE_HOST} "rm ${REMOTE_PATH}${DUMP_FILE}"

Write-Host "DONE: Migracion completada con exito." -ForegroundColor Green
Write-Host "Proceso Finalizado." -ForegroundColor Cyan
