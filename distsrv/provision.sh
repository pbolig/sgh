#!/bin/bash
# Script de auto-configuración NATIVA para Horarios (Debian/Ubuntu Server)
# Proyecto Estático + Turso
# Incluye: Nginx, Avahi (http://horarios.local), Samba y Node.js

echo "============================================================"
echo " CONFIGURANDO SERVIDOR NATIVO - PROYECTO HORARIOS"
echo "============================================================"

# 1. Configuración de Identidad (Hostname)
# ============================================================
echo "[1/4] Configurando nombre del servidor (horarios)..."
sudo hostnamectl set-hostname horarios
echo "127.0.1.1 horarios" | sudo tee -a /etc/hosts > /dev/null

# 2. Actualización e Instalación de Dependencias
# ============================================================
echo "[2/4] Instalando dependencias del sistema..."
sudo apt-get update
sudo apt-get install -y nginx avahi-daemon samba nodejs npm git curl

# Permisos para que Nginx (www-data) pueda leer el proyecto
sudo chmod +x /home/$USER
sudo chmod -R 755 /home/$USER/horarios

# 3. Configurar Nginx para Proyecto Estático
# ============================================================
echo "[3/4] Configurando Nginx..."
sudo rm -f /etc/nginx/sites-enabled/default

cat <<EOF | sudo tee /etc/nginx/sites-available/horarios > /dev/null
server {
    listen 80;
    server_name horarios horarios.local _;

    # Raíz del proyecto estático
    location / {
        root /home/$USER/horarios;
        index index.html;
        try_files \$uri \$uri/ /index.html;
    }

    # Documentación Automática (Centro de Control)
    location /docs/ {
        alias /home/$USER/horarios/distsrv/;
        index index.html;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/horarios /etc/nginx/sites-enabled/
sudo systemctl restart nginx
sudo systemctl restart avahi-daemon

# 4. Configurar Backups Automáticos (Cron)
# ============================================================
echo "[4/4] Configurando sistema de respaldos..."
mkdir -p /home/$USER/backups
cp /home/$USER/horarios/distsrv/backup.sh /home/$USER/backup.sh
chmod +x /home/$USER/backup.sh

# Agregar tarea cron (al arrancar la VM) si no existe
(crontab -l 2>/dev/null | grep -F "/home/$USER/backup.sh") || (crontab -l 2>/dev/null; echo "@reboot sleep 60 && /home/$USER/backup.sh >> /home/$USER/backups/backup.log 2>&1") | crontab -

# Fin
IP_ADDR=$(hostname -I | awk '{print $1}')
echo "============================================================"
echo " SISTEMA LISTO - ACCESO NATIVO"
echo " URL: http://horarios.local  o  http://$IP_ADDR"
echo " Documentación: http://horarios.local/docs/"
echo "============================================================"
