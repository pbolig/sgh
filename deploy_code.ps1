# deploy_code.ps1
# Script para subir los archivos de código modificados hoy al VPS

$REMOTE_USER = 'root'
$REMOTE_HOST = '213.136.70.104'
$REMOTE_PATH = '/opt/accesovirtual/sgh/app' # RUTA DEFINITIVA
$CONTAINER_BACKEND = 'sgh-backend'

Write-Host '--- INICIANDO DESPLIEGUE DE CODIGO AL VPS ---' -ForegroundColor Cyan

# 1. Subir archivos de Backend
Write-Host '[1/3] Subiendo archivos de Backend...' -ForegroundColor Yellow
scp backend/main.py "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}/backend/main.py"
scp backend/schemas.py "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}/backend/schemas.py"

# 2. Subir archivos de Frontend (JS y CSS)
Write-Host '[2/3] Subiendo archivos de Frontend...' -ForegroundColor Yellow
scp js/modules/docentes.js "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}/js/modules/docentes.js"
scp js/modules/calendario.js "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}/js/modules/calendario.js"
scp js/modules/dashboard.js "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}/js/modules/dashboard.js"
scp css/styles.css "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}/css/styles.css"

# 3. Reiniciar el contenedor de Backend para aplicar cambios de Python
Write-Host '[3/3] Reiniciando contenedor de backend en el servidor...' -ForegroundColor Yellow
ssh "${REMOTE_USER}@${REMOTE_HOST}" "docker restart $CONTAINER_BACKEND"

Write-Host 'DONE: Codigo actualizado en produccion.' -ForegroundColor Green
Write-Host 'IMPORTANTE: Refresca el navegador (Ctrl+F5) en produccion para ver los cambios.' -ForegroundColor Cyan
