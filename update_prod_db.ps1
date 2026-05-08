# update_prod_db.ps1
# Script para parchear la estructura de la base de datos en Producción (VPS)
# sin borrar los datos existentes.

$REMOTE_USER = 'root'
$REMOTE_HOST = 'sgh.accesovirtual.com.ar'
$CONTAINER_PROD = 'sgh-db'
$DB_USER = 'horarios_user'
$DB_NAME = 'horarios'

Write-Host '--- INICIANDO ACTUALIZACION DE ESTRUCTURA EN PRODUCCION ---' -ForegroundColor Cyan

$SQL_COMMANDS = @"
ALTER TABLE instituciones ADD COLUMN IF NOT EXISTS turnos_activos VARCHAR DEFAULT 'mañana,tarde,noche';
UPDATE instituciones SET turnos_activos = 'mañana,tarde,noche' WHERE turnos_activos IS NULL;
DROP INDEX IF EXISTS ix_comisiones_codigo;
CREATE UNIQUE INDEX IF NOT EXISTS uix_comision_codigo_materia ON comisiones (materia_id, codigo);
ALTER TABLE cargo_asignaciones ADD COLUMN IF NOT EXISTS carrera_id INTEGER;
"@

Write-Host '[1/1] Ejecutando comandos SQL en el contenedor...' -ForegroundColor Yellow

$remote_cmd = "echo `"$SQL_COMMANDS`" | docker exec -i $CONTAINER_PROD psql -U $DB_USER -d $DB_NAME"
$remote_target = "$REMOTE_USER@$REMOTE_HOST"

ssh $remote_target $remote_cmd

if ($LASTEXITCODE -ne 0) {
    Write-Host 'Error al ejecutar los comandos en produccion.' -ForegroundColor Red
    exit 1
}

Write-Host 'DONE: Estructura actualizada con exito.' -ForegroundColor Green
Write-Host 'Proceso Finalizado.' -ForegroundColor Cyan
