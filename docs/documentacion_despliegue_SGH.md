# Documentación de Despliegue — Sistema SGH
**Instituto Superior de Educación Técnica N° 57 (ISET 57)**  
**Fecha:** 12 de abril de 2026  
**Responsable:** Pedro Bolig — Vicedirector  

---

## Resumen del sistema

| Ítem | Detalle |
|---|---|
| Sistema | SGH — Sistema de Gestión de Horarios |
| URL producción | https://sgh.accesovirtual.com.ar |
| Repositorio | https://github.com/pbolig/sgh |
| Servidor | Contabo VPS — vmi3226011 |
| IP pública | 213.136.70.104 |
| Sistema operativo | Ubuntu 24.04.4 LTS |
| Stack | FastAPI + PostgreSQL + Nginx + Docker |

---

## Infraestructura del servidor

### Especificaciones del VPS (Contabo)

| Recurso | Valor |
|---|---|
| Plan | Cloud VPS 10 SSD |
| CPU | 4 núcleos |
| RAM | 8 GB |
| Disco | 150 GB SSD |
| Región | EU |
| IPv4 | 213.136.70.104 |
| IPv6 | 2a02:c207:2322:6011::1/64 |
| SO | Ubuntu 24.04.4 LTS (noble) |
| Fecha de creación | 11 de abril de 2026 |

---

## Estructura de directorios

```
/opt/
└── accesovirtual/              ← raíz del dominio
    ├── sgh/                    ← sistema SGH
    │   ├── app/                ← código clonado de GitHub
    │   ├── backups/
    │   │   ├── db/             ← backups de PostgreSQL (.dump)
    │   │   ├── files/          ← backups de archivos
    │   │   └── backup_db.sh    ← script de backup automático
    │   └── logs/               ← logs de la app y backups
    └── backups_globales/       ← backups completos del servidor
```

---

## Paso 1 — Preparación del servidor

### 1.1 Conexión SSH

```bash
ssh root@213.136.70.104
```

### 1.2 Verificación del sistema operativo

```bash
lsb_release -a
# Resultado: Ubuntu 24.04.4 LTS (noble)
```

### 1.3 Actualización del sistema

```bash
apt update && apt upgrade -y
```

---

## Paso 2 — Instalación de Docker

```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
```

**Versiones instaladas:**
- Docker: 29.4.0
- Docker Compose: v5.1.2

---

## Paso 3 — Estructura de carpetas

```bash
mkdir -p /opt/accesovirtual/sgh/{app,backups/db,backups/files,logs}
mkdir -p /opt/accesovirtual/backups_globales
```

---

## Paso 4 — Clonar el repositorio

```bash
git clone https://github.com/pbolig/sgh /opt/accesovirtual/sgh/app
```

---

## Paso 5 — Configuración de archivos de producción

### 5.1 Archivo `.env`

Ubicación: `/opt/accesovirtual/sgh/app/.env`

```env
POSTGRES_DB=horarios
POSTGRES_USER=horarios_user
POSTGRES_PASSWORD=Sgh2026#Iset57!
SECRET_KEY=<clave generada con openssl rand -hex 32>
DATABASE_URL=postgresql://horarios_user:Sgh2026#Iset57!@db/horarios
```

> ⚠️ La SECRET_KEY se generó con: `openssl rand -hex 32`

### 5.2 Nginx de producción

Ubicación: `/opt/accesovirtual/sgh/app/nginx.prod.conf`

```nginx
server {
    listen 80;
    server_name sgh.accesovirtual.com.ar;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name sgh.accesovirtual.com.ar;
    underscores_in_headers on;

    ssl_certificate /etc/letsencrypt/live/sgh.accesovirtual.com.ar/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/sgh.accesovirtual.com.ar/privkey.pem;

    location / {
        root /usr/share/nginx/html;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://backend:8000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Authorization $http_authorization;
        proxy_pass_header Authorization;
    }

    location /docs/ {
        alias /usr/share/nginx/html/distsrv/;
        index index.html;
    }
}
```

### 5.3 Docker Compose de producción

Ubicación: `/opt/accesovirtual/sgh/app/docker-compose.prod.yml`

```yaml
services:
  db:
    image: postgres:15-alpine
    container_name: sgh-db
    env_file: .env
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: always

  backend:
    build: ./backend
    container_name: sgh-backend
    env_file: .env
    environment:
      - DATABASE_URL=${DATABASE_URL}
    volumes:
      - ./backend:/app
    ports:
      - "8000:8000"
    depends_on:
      - db
    restart: always

  nginx:
    image: nginx:alpine
    container_name: sgh-nginx
    volumes:
      - .:/usr/share/nginx/html
      - ./nginx.prod.conf:/etc/nginx/conf.d/default.conf:ro
      - /etc/letsencrypt:/etc/letsencrypt:ro
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - backend
    restart: always

volumes:
  postgres_data:
```

---

## Paso 6 — Primer arranque de los contenedores

```bash
cd /opt/accesovirtual/sgh/app
docker compose -f docker-compose.prod.yml up -d --build
```

**Contenedores levantados:**
- `sgh-db` — PostgreSQL 15
- `sgh-backend` — FastAPI (Python 3.11)
- `sgh-nginx` — Nginx Alpine

### 6.1 Inicialización de la base de datos

```bash
docker exec sgh-backend python seed_admin.py
```

Crea las tablas, módulos, roles y el usuario administrador inicial:
- **Usuario:** `admin`
- **Contraseña:** `admin123` ⚠️ cambiar en producción

---

## Paso 7 — Migración de datos desde desarrollo

### 7.1 Exportar desde PC local (PowerShell)

```powershell
docker exec sgh-db pg_dump -U horarios_user --no-owner --no-acl -Fc -f /tmp/backup_custom.dump horarios
docker cp sgh-db:/tmp/backup_custom.dump backup_custom.dump
```

### 7.2 Transferir al servidor

```powershell
scp backup_custom.dump root@213.136.70.104:/opt/accesovirtual/sgh/backups/db/
```

### 7.3 Restaurar en el servidor

```bash
# Copiar al contenedor
docker cp /opt/accesovirtual/sgh/backups/db/backup_custom.dump sgh-db:/tmp/backup_custom.dump

# Limpiar base vacía
docker exec -i sgh-db psql -U horarios_user -d horarios -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# Restaurar
docker exec sgh-db pg_restore -U horarios_user -d horarios --no-owner --no-acl /tmp/backup_custom.dump
```

> ⚠️ Usar siempre el formato `-Fc` (binario) para evitar problemas de encoding UTF-8/UTF-16 con caracteres especiales del español.

---

## Paso 8 — Certificado SSL (Let's Encrypt)

### 8.1 Instalación de Certbot

```bash
apt install -y certbot python3-certbot-nginx
```

### 8.2 Obtención del certificado

```bash
docker stop sgh-nginx
certbot certonly --standalone -d sgh.accesovirtual.com.ar \
  --email pedro.bolig@gmail.com \
  --agree-tos --non-interactive
docker start sgh-nginx
```

**Resultado:**
- Certificado: `/etc/letsencrypt/live/sgh.accesovirtual.com.ar/fullchain.pem`
- Clave privada: `/etc/letsencrypt/live/sgh.accesovirtual.com.ar/privkey.pem`
- Vencimiento: 11 de julio de 2026 (renovación automática configurada)

### 8.3 Reinicio de Nginx con SSL

```bash
docker compose -f docker-compose.prod.yml up -d --force-recreate nginx
```

---

## Paso 9 — Deploy automático con GitHub Actions

### 9.1 Generación de clave SSH para el deploy

```bash
ssh-keygen -t ed25519 -C "github-actions-deploy" -f /root/.ssh/github_deploy -N ""
cat /root/.ssh/github_deploy.pub >> /root/.ssh/authorized_keys
```

### 9.2 Secrets configurados en GitHub

Ubicación: `github.com/pbolig/sgh → Settings → Secrets and variables → Actions`

| Secret | Valor |
|---|---|
| `DEPLOY_HOST` | `213.136.70.104` |
| `DEPLOY_USER` | `root` |
| `DEPLOY_SSH_KEY` | contenido de `/root/.ssh/github_deploy` en base64 |

Para obtener la clave en base64:
```bash
cat /root/.ssh/github_deploy | base64 -w 0
```

### 9.3 Workflow de GitHub Actions

Ubicación: `.github/workflows/deploy.yml`

```yaml
name: Deploy SGH

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Setup SSH
        run: |
          mkdir -p ~/.ssh
          echo "${{ secrets.DEPLOY_SSH_KEY }}" | base64 -d > ~/.ssh/deploy_key
          chmod 600 ~/.ssh/deploy_key
          ssh-keyscan -H ${{ secrets.DEPLOY_HOST }} >> ~/.ssh/known_hosts

      - name: Deploy via SSH
        run: |
          ssh -i ~/.ssh/deploy_key -o StrictHostKeyChecking=no ${{ secrets.DEPLOY_USER }}@${{ secrets.DEPLOY_HOST }} '
            cd /opt/accesovirtual/sgh/app
            git pull origin main
            docker compose -f docker-compose.prod.yml up -d --build --force-recreate
            docker image prune -f
          '
```

**Funcionamiento:** cada `git push origin main` desde la PC local dispara el deploy automático al servidor.

---

## Paso 10 — Backups automáticos

### 10.1 Script de backup

Ubicación: `/opt/accesovirtual/sgh/backups/backup_db.sh`

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=/opt/accesovirtual/sgh/backups/db
CONTAINER=sgh-db
DB_USER=horarios_user
DB_NAME=horarios

# Generar backup
docker exec $CONTAINER pg_dump -U $DB_USER -Fc $DB_NAME > $BACKUP_DIR/backup_$DATE.dump

# Eliminar backups con más de 7 días
find $BACKUP_DIR -name "*.dump" -mtime +7 -delete

echo "Backup completado: backup_$DATE.dump"
```

```bash
chmod +x /opt/accesovirtual/sgh/backups/backup_db.sh
```

### 10.2 Cron job diario

```bash
crontab -e
```

Línea agregada:
```
0 2 * * * /opt/accesovirtual/sgh/backups/backup_db.sh >> /opt/accesovirtual/sgh/logs/backup.log 2>&1
```

**Ejecución:** todos los días a las 2:00 AM  
**Retención:** 7 días (los backups más viejos se eliminan automáticamente)  
**Log:** `/opt/accesovirtual/sgh/logs/backup.log`

---

## Comandos útiles de operación

### Ver estado de los contenedores
```bash
docker compose -f /opt/accesovirtual/sgh/app/docker-compose.prod.yml ps
```

### Ver logs de la aplicación
```bash
docker logs sgh-backend --tail 50
docker logs sgh-nginx --tail 50
docker logs sgh-db --tail 50
```

### Reiniciar todos los contenedores
```bash
cd /opt/accesovirtual/sgh/app
docker compose -f docker-compose.prod.yml restart
```

### Hacer backup manual
```bash
/opt/accesovirtual/sgh/backups/backup_db.sh
```

### Bajar un backup a la PC local (PowerShell)
```powershell
scp root@213.136.70.104:/opt/accesovirtual/sgh/backups/db/backup_XXXXXXXX_XXXXXX.dump C:\DiscoD\Pato\Desarrollos\
```

### Renovar certificado SSL manualmente
```bash
docker stop sgh-nginx
certbot renew
docker start sgh-nginx
```

---

## Accesos y credenciales

> ⚠️ Guardar en lugar seguro — no compartir

| Servicio | Detalle |
|---|---|
| SSH servidor | `ssh root@213.136.70.104` |
| Usuario admin SGH | `admin` / `admin123` (cambiar) |
| PostgreSQL | user: `horarios_user` / DB: `horarios` |
| GitHub | usuario: `pbolig` |
| Contabo | panel en my.contabo.com |
| Certbot email | pedro.bolig@gmail.com |

---

## Pendientes recomendados

- [ ] Cambiar la contraseña del usuario `admin` por una segura
- [ ] Configurar acceso SSH con clave en lugar de contraseña para mayor seguridad
- [ ] Configurar monitoreo de uptime (UptimeRobot gratuito)
- [ ] Agregar segundo subdominio para próximo sistema cuando sea necesario
