# Manual Maestro - Sistema de Horarios
## Guía Integral de Desarrollo, Operación y Despliegue Híbrido

Bienvenido al centro de control del Sistema de Horarios. Este documento detalla el flujo de trabajo de punta a punta, diseñado para ser eficiente en recursos y robusto en producción.

---

### Menú de Navegación
1.  [**Estrategia Híbrida (Docker vs Nativo)**](#1-estrategia)
2.  [**Ambiente de Desarrollo (Docker)**](#2-desarrollo-local)
3.  [**Control de Versiones y Ramas (Git)**](#3-git-workflow)
4.  [**Ambiente de Producción (VM Debian Nativo)**](#4-produccion-vm)
5.  [**Base de Datos (PostgreSQL)**](#5-postgresql)
6.  [**Backups y Recuperación**](#6-backups)

---

<div id="1-estrategia"></div>

### 1. Estrategia Híbrida (El porqué de este modelo)
Para optimizar el uso de disco y memoria, el proyecto utiliza dos entornos distintos:
-   **Local (Windows con Docker):** Ideal para programar y probar cambios rápidamente sin la carga de una VM pesada.
-   **Producción (VM Debian Nativo):** Ideal para despliegue final, garantizando que el sistema corra directamente sobre el hardware virtual con el script de auto-configuración `provision.sh`.

---

<div id="2-desarrollo-local"></div>

### 2. Ambiente de Desarrollo (Docker)
Este ambiente emula toda la infraestructura necesaria (Nginx, Backend, DB) en contenedores ligeros.

#### Requisitos:
- Docker Desktop instalado y corriendo.

#### Paso a paso para iniciar:
1.  Abre una terminal en la raíz del proyecto.
2.  Ejecuta el comando:
    ```bash
    docker-compose up --build -d
    ```
    - `--build`: Reconstruye el backend si has hecho cambios en el código.
    - `-d`: Corre en segundo plano.
3.  **Acceso:**
    - Sistema: [http://localhost](http://localhost)
    - Documentación: [http://localhost/docs/](http://localhost/docs/)

#### Ver logs del backend:
```bash
docker logs -f sgh-backend
```

---

<div id="3-git-workflow"></div>

### 3. Control de Versiones (Git Branches)
Utilizamos ramas para asegurar que el código en producción siempre sea estable.

-   **Rama `dev`:** Aquí vive el código que estás desarrollando localmente.
-   **Rama `main`:** Aquí solo llega el código que ya probaste y funciona.

#### Circuito Pro:
1.  **Desarrollar en local** (Docker).
2.  `git add .` -> `git commit -m "Mejora X"` -> `git push origin dev`.
3.  **Hacer el Merge:** Cuando la mejora esté lista, pasar a `main`.
4.  **Desplegar:** En la VM Debian, hacer un `git pull` de la rama `main`.

---

<div id="4-produccion-vm"></div>

### 4. Ambiente de Producción (VM Debian Nativo)
Aquí el sistema corre "a pelo" sobre Debian para máxima estabilidad.

#### Configuración por primera vez (Provisioning):
1.  Prepara una VM con Debian 12 (instalación mínima).
2.  Sube el proyecto (via WinSCP o Git).
3.  Entra a la carpeta `distsrv` y ejecuta:
    ```bash
    bash distsrv/provision.sh
    ```
#### ¿Qué hace el script?
- Instala PostgreSQL, Nginx, Python y Avahi.
- Configura la base de datos y usuarios.
- Crea el entorno virtual (`venv`) para el backend.
- Registra el backend como un servicio de sistema (**Systemd**) para que inicie solo al prender la VM.
- Configura Nginx como proxy para servir el frontend y la API.

---

<div id="5-postgresql"></div>

### 5. Gestión de Base de Datos (PostgreSQL)
#### En Docker (Local):
La base de datos se gestiona automáticamente. Para entrar a la consola SQL:
```bash
docker exec -it sgh-db psql -U horarios_user -d horarios
```

#### En VM Debian (Nativo):
```bash
sudo -u postgres psql -d horarios
```

---

<div id="6-backups"></div>

### 6. Backups y Recuperación
#### Automatización:
El script `distsrv/backup.sh` se encarga de todo. En la VM, se ejecuta cada vez que el sistema arranca.
-   **Ubicación:** `/home/horarios/backups/`.
-   **Formato:** `backup_horarios_FECHA.tar.gz`.

#### Cómo restaurar en VM:
1.  Extraer el dump: `tar -xzf backup.tar.gz`.
2.  Restaurar SQL: `sudo -u postgres psql horarios < backup_interno.sql`.

---
*Manual actualizado al 12/03/2026 - Flujo Híbrido Implementado.*
