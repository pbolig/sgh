#!/bin/bash
# Script de Respaldo - Horarios (Estático + Turso)
# Guarda los archivos locales y exporta metadatos de Turso si es posible

USER_NAME="horarios"
BACKUP_DIR="/home/$USER_NAME/backups"
PROJECT_DIR="/home/$USER_NAME/horarios"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
FINAL_BACKUP="$BACKUP_DIR/backup_horarios_$TIMESTAMP.tar.gz"

mkdir -p $BACKUP_DIR

echo "--- Iniciando Respaldo: $TIMESTAMP ---"

# 1. Backup de Archivos del Proyecto
echo "Comprimiendo archivos del proyecto..."
tar -czf $FINAL_BACKUP --exclude=".git" --exclude="node_modules" $PROJECT_DIR

# 2. Backup de Turso (Opcional - Si la CLI está instalada y logueada)
if command -v turso &> /dev/null
then
    echo "CLI de Turso detectada. Intentando exportar esquema..."
    # Nota: El nombre de la db debe coincidir con el creado en Turso
    turso db show horarios-institucionales --url &> /tmp/turso_url.txt
    # Se podría agregar un dump SQL si se desea, pero Turso es nube
    # tar -rvf $FINAL_BACKUP /tmp/turso_url.txt
fi

# 3. Mantener solo los últimos 10 respaldos
ls -t $BACKUP_DIR/backup_horarios_*.tar.gz | tail -n +11 | xargs -I {} rm {}

echo "Respaldo completado: $FINAL_BACKUP"
echo "--------------------------------------"
