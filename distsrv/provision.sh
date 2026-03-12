#!/bin/bash
# Script de auto-configuración NATIVA para Horarios (Debian/Ubuntu Server)
# Proyecto Estático + Backend FastAPI + PostgreSQL

echo "============================================================"
echo " CONFIGURANDO SERVIDOR NATIVO - ARQUITECTURA POSTGRESQL"
echo "============================================================"

# 1. Configuración de Identidad (Hostname)
# ============================================================
echo "[1/6] Configurando nombre del servidor (horarios)..."
sudo hostnamectl set-hostname horarios
echo "127.0.1.1 horarios" | sudo tee -a /etc/hosts > /dev/null

# 2. Actualización e Instalación de Dependencias
# ============================================================
echo "[2/6] Instalando dependencias del sistema..."
sudo apt-get update
sudo apt-get install -y nginx avahi-daemon samba postgresql postgresql-contrib python3-venv python3-pip libpq-dev git curl

# Permisos para que Nginx (www-data) pueda leer el proyecto
sudo chmod +x /home/$USER
sudo chmod -R 755 /home/$USER/horarios

# 3. Configuración de Base de Datos PostgreSQL
# ============================================================
echo "[3/6] Configurando PostgreSQL..."
sudo systemctl start postgresql
sudo systemctl enable postgresql
sudo -u postgres psql -c "CREATE DATABASE horarios;" || echo "Base de datos ya existe."
sudo -u postgres psql -c "CREATE USER horarios_user WITH PASSWORD 'horarios123';" || echo "Usuario ya existe."
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE horarios TO horarios_user;"
sudo -u postgres psql -d horarios -c "GRANT ALL ON SCHEMA public TO horarios_user;"

# 4. Preparar Backend (Python Venv)
# ============================================================
echo "[4/6] Configurando Backend (FastAPI)..."
cd /home/$USER/horarios/backend
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
deactivate

# 5. Configurar Servicio Systemd para Backend
# ============================================================
echo "[5/6] Creando servicio horarios-backend..."
cat <<EOF | sudo tee /etc/systemd/system/horarios-backend.service > /dev/null
[Unit]
Description=Gunicorn instance to serve Horarios Backend
After=network.target postgresql.service

[Service]
User=$USER
Group=www-data
WorkingDirectory=/home/$USER/horarios/backend
Environment="DATABASE_URL=postgresql://horarios_user:horarios123@localhost/horarios"
ExecStart=/home/$USER/horarios/backend/venv/bin/uvicorn main:app --host 127.0.0.1 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable horarios-backend
sudo systemctl restart horarios-backend

# 6. Configurar Nginx como Proxy
# ============================================================
echo "[6/6] Configurando Nginx..."
sudo rm -f /etc/nginx/sites-enabled/default

cat <<EOF | sudo tee /etc/nginx/sites-available/horarios > /dev/null
server {
    listen 80;
    server_name horarios horarios.local _;

    # Frontend estático
    location / {
        root /home/$USER/horarios;
        index index.html;
        try_files \$uri \$uri/ /index.html;
    }

    # API Proxy para el Backend
    location /api/ {
        proxy_pass http://127.0.0.1:8000/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Centro de Documentación
    location /docs/ {
        alias /home/$USER/horarios/distsrv/;
        index index.html;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/horarios /etc/nginx/sites-enabled/
sudo systemctl restart nginx
sudo systemctl restart avahi-daemon

# Fin
IP_ADDR=$(hostname -I | awk '{print $1}')
echo "============================================================"
echo " SISTEMA LISTO CON POSTGRESQL LOCAL"
echo " URL: http://horarios.local  o  http://$IP_ADDR"
echo "============================================================"
