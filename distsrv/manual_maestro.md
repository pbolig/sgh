# Manual Maestro - Sistema de Horarios
## Guía de Operación, Desarrollo y Despliegue Nativo

Este manual describe el flujo de trabajo profesional para el desarrollo del Sistema de Gestión de Horarios, utilizando un entorno nativo en Debian y control de versiones con ramas de GitHub.

---

### Menú de Navegación
- [**1. Arquitectura del Sistema**](#1-arquitectura)
- [**2. Flujo de Trabajo (Git Branches)**](#2-workflow-git)
- [**3. Configuración de la PC Virtual (Debian)**](#3-configuracion-vm)
- [**4. Despliegue en Producción (Vercel)**](#4-despliegue-vercel)
- [**5. Mantenimiento y Backups**](#5-mantenimiento)

---

<div id="1-arquitectura"></div>

### 1. Arquitectura del Sistema
El sistema es una **Single Page Application (SPA)** de arquitectura moderna y ligera:
- **Frontend:** HTML5, CSS3 (Vanilla) y JavaScript Moderno (ES6+).
- **Persistencia:** PostgreSQL (Base de datos nativa en la VM).
- **Backend:** API REST desarrollada en Python con FastAPI.
- **Servidor de Desarrollo:** PC Virtual Debian Nativo (Nginx + Backend + DB).

---

<div id="2-workflow-git"></div>

### 2. Flujo de Trabajo con Ramas (Git Branches)
Para mantener un desarrollo limpio y seguro, utilizamos la siguiente estrategia de ramas:

1.  **Rama `dev` (Desarrollo):**
    - Es la rama donde se realizan todos los cambios y nuevas funcionalidades.
    - Se prueba localmente en la PC Virtual Debian.
2.  **Rama `main` (Producción):**
    - Contiene el código estable que está "en vivo" en Vercel.
    - Solo recibe cambios mediante *Merges* desde la rama `dev`.

#### Comandos de Rutina:
```bash
# Cambiar a rama de desarrollo
git checkout dev

# Guardar cambios
git add .
git commit -m "Descripción del cambio"
git push origin dev

# Cuando dev es estable, pasar a main:
git checkout main
git merge dev
git push origin main
```

---

<div id="3-configuracion-vm"></div>

### 3. Configuración de la PC Virtual (Debian Nativo)
Ya **no utilizamos Docker**. El desarrollo se realiza directamente sobre Debian para máximo rendimiento.

1.  **Instalación Inicial:**
    - Debian 12 (Netinst) con servidor SSH activo.
    - Usuario: `horarios`.
2.  **Sincronización:**
    - Usamos **WinSCP** o **RSYNC** para subir el código desde Windows a `/home/horarios/horarios`.
3.  **Provisión:**
    - Ejecutar el script: `bash distsrv/provision.sh`.
    - Esto configura Nginx y el acceso por nombre: `http://horarios.local`.

---

<div id="4-despliegue-vercel"></div>

### 4. Despliegue en Producción (Vercel)
Vercel está conectado a la rama `main` de GitHub.
- Cada vez que hagas un `git push origin main`, Vercel actualizará automáticamente el sitio Web público.
- **Variables de Entorno:** Asegúrate de configurar `TURSO_URL` y `TURSO_TOKEN` en el panel de Vercel.

---

<div id="5-mantenimiento"></div>

### 5. Mantenimiento y Backups
#### Backups Locales:
El script `distsrv/backup.sh` se ejecuta automáticamente al iniciar la VM.
- Los respaldos se guardan en `/home/horarios/backups/`.
- Incluyen la base de datos (exportando esquema) y todos los archivos del código.

#### Actualización del Sistema:
Ante cualquier cambio en la configuración del servidor, simplemente vuelve a ejecutar:
```bash
bash distsrv/provision.sh
```
El script es inteligente y no borrará tus datos existentes.

---
*Documento actualizado el 12/03/2026 para el nuevo Workflow Nativo.*
