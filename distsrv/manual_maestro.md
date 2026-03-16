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
7.  [**Funcionalidades Avanzadas (Dashboard y Reportes)**](#7-avanzado)

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
3.  **Inicialización de BD y Admin:**
    Ejecuta el script de semilla para crear el usuario admin inicial:
    ```bash
    docker exec sgh-backend python seed_admin.py
    ```
    - **Credenciales por defecto:** `admin` / `admin123`
4.  **Acceso:**
    - Sistema: [http://localhost](http://localhost)
    - Documentación: [http://localhost/docs/](http://localhost/docs/)

---

<div id="3-git-workflow"></div>

### 3. Seguridad y Autenticación
El sistema utiliza estándares modernos de seguridad:
- **Hashing:** Las contraseñas se guardan hasheadas con **Bcrypt** (algoritmo lento y seguro contra ataques de fuerza bruta).
- **Tokens JWT:** Una vez logueado, el servidor entrega un token JWT (JSON Web Token) que el navegador usa para identificarse en cada petición posterior. El token expira cada 8 horas.
- **Backend:** Desarrollado con **FastAPI**, que valida automáticamente los tipos de datos y la seguridad de los tokens.

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

<div id="7-avanzado"></div>

### 7. Funcionalidades Avanzadas y UI
El sistema ha sido evolucionado con capacidades de monitoreo y reportes de nivel profesional.

#### 7.1 Dashboard en Tiempo Real
- **Relojes Analógicos:** Sincronizados con la hora real del navegador.
- **Estado de Aulas:** Visualización en vivo de materias, docentes y tiempo restante.
- **Sistema de Sirenas:** Los recreos se indican mediante una "alarma visual" naranja pulsante en la tarjeta del departamento.

#### 7.2 Editor de Horarios e Inteligencia de Datos
- **Recreos Automáticos:** El sistema detecta huecos entre módulos y genera filas de "RECREO" con duración calculada automáticamente.
- **Ordenamiento Inteligente:** Las listas se autogestionan alfabéticamente (por apellido en docentes, por nombre en materias).
- **Layout Adaptativo:** Interfaz colapsable con scroll vertical infinito soportado por una jerarquía de contenedores flexbox robusta.

#### 7.3 Reportes y PDF
- **Alta Legibilidad:** Estilos CSS específicos para impresión (`@media print`) que garantizan contraste total en nombres de docentes y ocultan elementos de edición.
- **Formato Limpio:** Las celdas vacías se exportan sin símbolos de edición, manteniendo una estética profesional.

---
*Manual actualizado al 13/03/2026 - Dashboard y Sistema de Recreos Implementado.*
