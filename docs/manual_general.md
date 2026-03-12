# SISTEMA DE GESTIÓN DE HORARIOS INSTITUCIONALES
## Manual General — Versión 1.0

---

# ÍNDICE

1. [Visión General del Sistema](#1-vision-general)
2. [Arquitectura Técnica](#2-arquitectura-tecnica)
3. [Estructura de la Base de Datos](#3-base-de-datos)
4. [Configuración del Entorno — Paso a Paso](#4-configuracion-entorno)
   - 4.1 Requisitos previos
   - 4.2 Crear cuenta en Turso
   - 4.3 Crear la base de datos
   - 4.4 Configurar el proyecto local
   - 4.5 Desplegar en Vercel
5. [Sistema de Autenticación y Roles](#5-autenticacion)
6. [Módulo 1 — CRUD Departamentos y Aulas](#6-crud-departamentos)
7. [Módulo 2 — CRUD Docentes](#7-crud-docentes)
8. [Módulo 3 — CRUD Módulos Horarios](#8-crud-modulos)
9. [Módulo 4 — CRUD Comisiones y Materias](#9-crud-comisiones)
10. [Módulo 5 — Editor de Horario](#10-editor-horario)
11. [Módulo 6 — Dashboard / Vista Grilla](#11-dashboard)
12. [Módulo 7 — Reportes](#12-reportes)
13. [Estructura de Archivos del Proyecto](#13-estructura-archivos)
14. [Flujo de Datos y Relaciones](#14-flujo-datos)
15. [Gestión de Conflictos Multiusuario](#15-multiusuario)
16. [Exportación e Importación de Datos](#16-exportacion)
17. [Mantenimiento y Actualizaciones](#17-mantenimiento)
18. [Solución de Problemas Frecuentes](#18-troubleshooting)
19. [Glosario](#19-glosario)

---

# 1. VISIÓN GENERAL DEL SISTEMA

## 1.1 Descripción

El Sistema de Gestión de Horarios Institucionales es una aplicación web 100% estática (HTML + CSS + JavaScript) que utiliza **Turso** (SQLite distribuido en la nube) como motor de persistencia. Permite gestionar cronogramas académicos organizados por departamentos, aulas, docentes, comisiones y materias.

## 1.2 Objetivos del sistema

- Reemplazar la gestión manual de horarios en planillas Excel
- Permitir que múltiples usuarios editen simultáneamente sin corrupción de datos
- Ofrecer vistas en tiempo real del cronograma idénticas al formato Excel actual
- Proveer reportes filtrables por docente, turno, materia y departamento
- No requerir servidor propio ni base de datos local

## 1.3 Alcance funcional

| Módulo | Descripción |
|---|---|
| Autenticación | Login con roles Admin e Invitado |
| Departamentos | CRUD de departamentos y sus aulas |
| Docentes | CRUD de responsables de comisión |
| Módulos | CRUD de franjas horarias (módulos de 40 min) |
| Comisiones | CRUD de comisiones vinculadas a materias |
| Editor de Horario | Asignación de comisiones y docentes por celda |
| Dashboard | Vista grilla tipo Excel por departamento/turno |
| Reportes | Filtros por docente, turno, materia, departamento |

## 1.4 Tecnologías utilizadas

| Componente | Tecnología | Justificación |
|---|---|---|
| Frontend | HTML5 + CSS3 + JavaScript vanilla | Sin dependencias, máxima portabilidad |
| Base de datos | Turso (SQLite en la nube) | Gratuito, multiusuario, sin servidor propio |
| Autenticación | JWT firmado en cliente + bcrypt.js | Sin backend, seguro para el caso de uso |
| Despliegue | Vercel / Netlify / GitHub Pages | 100% gratuito, CDN global |
| Exportación | CSV nativo + Print CSS | Sin librerías externas |

## 1.5 Usuarios del sistema

| Rol | Acceso |
|---|---|
| **Admin** | Acceso total: leer, crear, editar, eliminar en todos los módulos |
| **Invitado** | Solo lectura: ver dashboard y exportar reportes en CSV |

---

# 2. ARQUITECTURA TÉCNICA

## 2.1 Diagrama de flujo general

```
┌─────────────────────────────────────────────────────┐
│                  BROWSER (Usuario)                   │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────┐  │
│  │  Login/Auth │  │  CRUDs/Editor│  │ Dashboard  │  │
│  └──────┬──────┘  └──────┬───────┘  └─────┬──────┘  │
└─────────┼───────────────┼────────────────┼──────────┘
          │               │                │
          ▼               ▼                ▼
┌─────────────────────────────────────────────────────┐
│              TURSO HTTP API                          │
│         libsql://[db-name].turso.io                 │
│    (SQLite distribuido — row-level locking)          │
└─────────────────────────────────────────────────────┘
```

## 2.2 Modelo de autenticación

```
Usuario ingresa credenciales
         │
         ▼
bcrypt.compare(password, hash_almacenado_en_turso)
         │
    ¿Válido?
    /       \
  Sí         No
  │           │
  ▼           ▼
Generar     Mostrar
JWT en      error
cliente
  │
  ▼
Guardar en sessionStorage
(se borra al cerrar el browser)
  │
  ▼
Cada request a Turso incluye:
  - El JWT para validar rol
  - Si rol = invitado → solo SELECT
  - Si rol = admin → SELECT + INSERT + UPDATE + DELETE
```

## 2.3 Manejo de concurrencia

Turso usa SQLite con WAL (Write-Ahead Logging), lo que garantiza:
- Múltiples lecturas simultáneas sin bloqueo
- Escrituras serializadas a nivel de fila
- En caso de conflicto: el último en escribir gana, con notificación al usuario anterior

## 2.4 Modelo de despliegue

```
GitHub Repository
├── index.html         ← Punto de entrada
├── app.js             ← Lógica principal
├── styles.css         ← Estilos
├── config.js          ← Variables de entorno (URL Turso + token)
└── modules/
    ├── auth.js
    ├── departamentos.js
    ├── docentes.js
    ├── modulos.js
    ├── comisiones.js
    ├── editor.js
    ├── dashboard.js
    └── reportes.js
         │
         ▼ (push a main)
    Vercel/Netlify
    (deploy automático)
```

---

# 3. ESTRUCTURA DE LA BASE DE DATOS

## 3.1 Esquema completo SQL

```sql
-- ============================================================
-- TABLA: usuarios
-- Almacena credenciales y roles del sistema
-- ============================================================
CREATE TABLE IF NOT EXISTS usuarios (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    username    TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,        -- bcrypt hash, nunca texto plano
    rol         TEXT NOT NULL CHECK(rol IN ('admin', 'invitado')),
    activo      INTEGER DEFAULT 1,      -- 1=activo, 0=desactivado
    created_at  TEXT DEFAULT (datetime('now')),
    updated_at  TEXT DEFAULT (datetime('now'))
);

-- ============================================================
-- TABLA: departamentos
-- Unidades académicas que agrupan aulas y horarios
-- ============================================================
CREATE TABLE IF NOT EXISTS departamentos (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre      TEXT NOT NULL UNIQUE,   -- Ej: "TIC", "Matemática"
    codigo      TEXT NOT NULL UNIQUE,   -- Ej: "TIC", "MAT"
    descripcion TEXT,
    activo      INTEGER DEFAULT 1,
    created_at  TEXT DEFAULT (datetime('now')),
    updated_at  TEXT DEFAULT (datetime('now'))
);

-- ============================================================
-- TABLA: aulas
-- Espacios físicos asociados a un departamento
-- ============================================================
CREATE TABLE IF NOT EXISTS aulas (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    departamento_id INTEGER NOT NULL REFERENCES departamentos(id),
    nombre          TEXT NOT NULL,      -- Ej: "AULA 1", "AULA 2"
    capacidad       INTEGER,
    activo          INTEGER DEFAULT 1,
    created_at      TEXT DEFAULT (datetime('now')),
    UNIQUE(departamento_id, nombre)     -- No puede haber 2 "AULA 1" en mismo depto
);

-- ============================================================
-- TABLA: docentes
-- Responsables de clases / comisiones
-- ============================================================
CREATE TABLE IF NOT EXISTS docentes (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    apellido    TEXT NOT NULL,
    nombre      TEXT,
    email       TEXT,
    telefono    TEXT,
    activo      INTEGER DEFAULT 1,
    created_at  TEXT DEFAULT (datetime('now')),
    updated_at  TEXT DEFAULT (datetime('now'))
);

-- ============================================================
-- TABLA: materias
-- Asignaturas dictadas en los departamentos
-- ============================================================
CREATE TABLE IF NOT EXISTS materias (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre          TEXT NOT NULL,
    codigo          TEXT UNIQUE,
    departamento_id INTEGER REFERENCES departamentos(id),
    activo          INTEGER DEFAULT 1,
    created_at      TEXT DEFAULT (datetime('now'))
);

-- ============================================================
-- TABLA: comisiones
-- Grupos de estudiantes asociados a una materia
-- Nomenclatura ejemplo: C1DM1, C3AT2, C4T1
-- ============================================================
CREATE TABLE IF NOT EXISTS comisiones (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo      TEXT NOT NULL UNIQUE,   -- Ej: "C1DM1"
    materia_id  INTEGER REFERENCES materias(id),
    turno       TEXT CHECK(turno IN ('mañana', 'tarde')),
    activo      INTEGER DEFAULT 1,
    created_at  TEXT DEFAULT (datetime('now')),
    updated_at  TEXT DEFAULT (datetime('now'))
);

-- ============================================================
-- TABLA: modulos_horario
-- Franjas horarias de 40 minutos (módulos)
-- ============================================================
CREATE TABLE IF NOT EXISTS modulos_horario (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    numero      INTEGER NOT NULL,       -- 1°, 2°, 3°...
    hora_inicio TEXT NOT NULL,          -- Formato "HH:MM"
    hora_fin    TEXT NOT NULL,          -- Formato "HH:MM"
    turno       TEXT NOT NULL CHECK(turno IN ('mañana', 'tarde')),
    activo      INTEGER DEFAULT 1,
    UNIQUE(numero, turno)
);

-- ============================================================
-- TABLA: asignaciones
-- Corazón del sistema: vincula comisión + docente con
-- aula + día + módulo + departamento
-- ============================================================
CREATE TABLE IF NOT EXISTS asignaciones (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    departamento_id INTEGER NOT NULL REFERENCES departamentos(id),
    aula_id         INTEGER NOT NULL REFERENCES aulas(id),
    modulo_id       INTEGER NOT NULL REFERENCES modulos_horario(id),
    dia_semana      TEXT NOT NULL CHECK(dia_semana IN (
                        'lunes','martes','miércoles','jueves','viernes')),
    comision_id     INTEGER REFERENCES comisiones(id),
    docente_id      INTEGER REFERENCES docentes(id),
    observaciones   TEXT,
    created_at      TEXT DEFAULT (datetime('now')),
    updated_at      TEXT DEFAULT (datetime('now')),
    updated_by      TEXT,               -- username del último que editó
    -- Una celda (aula+módulo+día) no puede tener 2 asignaciones
    UNIQUE(aula_id, modulo_id, dia_semana)
);

-- ============================================================
-- ÍNDICES para mejorar rendimiento de consultas frecuentes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_asig_docente    ON asignaciones(docente_id);
CREATE INDEX IF NOT EXISTS idx_asig_comision   ON asignaciones(comision_id);
CREATE INDEX IF NOT EXISTS idx_asig_depto      ON asignaciones(departamento_id);
CREATE INDEX IF NOT EXISTS idx_asig_modulo     ON asignaciones(modulo_id);
CREATE INDEX IF NOT EXISTS idx_comisiones_turno ON comisiones(turno);
```

## 3.2 Datos iniciales (seed)

```sql
-- Módulos turno mañana (según el Excel actual)
INSERT INTO modulos_horario (numero, hora_inicio, hora_fin, turno) VALUES
(1, '07:45', '08:25', 'mañana'),
(2, '08:25', '09:05', 'mañana'),
(3, '09:15', '09:55', 'mañana'),
(4, '09:55', '10:35', 'mañana'),
(5, '10:45', '11:25', 'mañana'),
(6, '12:05', '12:10', 'mañana'),
(7, '12:10', '12:50', 'mañana');

-- Módulos turno tarde (según el Excel actual)
INSERT INTO modulos_horario (numero, hora_inicio, hora_fin, turno) VALUES
(1, '13:30', '14:10', 'tarde'),
(2, '14:10', '14:50', 'tarde'),
(3, '15:00', '15:40', 'tarde'),
(4, '15:40', '16:20', 'tarde'),
(5, '16:30', '17:10', 'tarde'),
(6, '17:10', '17:50', 'tarde'),
(7, '17:55', '18:35', 'tarde'),
(8, '18:35', '19:15', 'tarde'),
(9, '19:15', '19:55', 'tarde');

-- Departamento inicial: TIC
INSERT INTO departamentos (nombre, codigo) VALUES ('TIC', 'TIC');

-- Aulas del departamento TIC
INSERT INTO aulas (departamento_id, nombre) VALUES
(1, 'AULA 1'), (1, 'AULA 2'), (1, 'AULA 3');

-- Docentes del departamento TIC (extraídos del Excel)
INSERT INTO docentes (apellido) VALUES
('SALVADOR'), ('DUNN'), ('ATTARA'), ('BOLIG'), ('GAIBAZZI'),
('BOZALONGO'), ('TABOADA'), ('SPEERLI'), ('OTTAVIANO'),
('CRISTALLI'), ('AUDISIO'), ('LOPEZ');

-- Usuario admin por defecto
-- IMPORTANTE: Cambiar la contraseña en el primer inicio de sesión
-- El hash corresponde a la contraseña: "Admin2026!"
INSERT INTO usuarios (username, password_hash, rol) VALUES
('admin', '$2b$10$xxxxxxxxxxxxxxxxxxxxxxxxxxx', 'admin');

-- Usuario invitado por defecto
INSERT INTO usuarios (username, password_hash, rol) VALUES
('invitado', '$2b$10$xxxxxxxxxxxxxxxxxxxxxxxxxxx', 'invitado');
```

> **NOTA IMPORTANTE:** Los hashes de contraseña mostrados arriba son ejemplos. El sistema generará los hashes reales durante la configuración inicial (ver Sección 4.5).

---

# 4. CONFIGURACIÓN DEL ENTORNO — PASO A PASO

## 4.1 Requisitos previos

Antes de comenzar, verificar que se tiene instalado:

| Herramienta | Versión mínima | Verificación |
|---|---|---|
| Node.js | 18.x o superior | `node --version` |
| npm | 9.x o superior | `npm --version` |
| Git | 2.x | `git --version` |
| Cuenta GitHub | — | github.com |
| Cuenta Vercel | — | vercel.com (gratis) |
| Cuenta Turso | — | turso.tech (gratis) |

### Instalar Node.js (si no está instalado)

**Windows:**
1. Ir a https://nodejs.org
2. Descargar el instalador LTS (versión 20.x recomendada)
3. Ejecutar el instalador y seguir los pasos
4. Verificar: abrir CMD y ejecutar `node --version`

**Mac:**
```bash
# Con Homebrew (recomendado)
brew install node

# Verificar
node --version
npm --version
```

**Linux (Ubuntu/Debian):**
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version
```

## 4.2 Crear cuenta en Turso

Turso es el servicio de base de datos SQLite en la nube. Es gratuito para proyectos pequeños.

**Paso 1:** Ir a https://turso.tech y hacer clic en **"Get started for free"**

**Paso 2:** Registrarse con GitHub (recomendado) o con email

**Paso 3:** Instalar la CLI de Turso en tu computadora

**Windows (PowerShell como Administrador):**
```powershell
# Instalar Scoop si no lo tenés
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
irm get.scoop.sh | iex

# Instalar Turso CLI
scoop bucket add turso https://github.com/tursodatabase/scoop-turso
scoop install turso
```

**Mac:**
```bash
brew install tursodatabase/tap/turso
```

**Linux:**
```bash
curl -sSfL https://get.tur.so/install.sh | bash
```

**Paso 4:** Autenticar la CLI con tu cuenta Turso
```bash
turso auth login
# Se abrirá el navegador. Iniciar sesión con tu cuenta de Turso.
# Verificar que funcionó:
turso auth status
# Debe mostrar: Logged in as tu-usuario@email.com
```

## 4.3 Crear la base de datos en Turso

Ejecutar los siguientes comandos en orden:

**Paso 1:** Crear la base de datos
```bash
turso db create horarios-institucionales
# Esperar unos segundos. Debe mostrar:
# Created database horarios-institucionales in ...
```

**Paso 2:** Obtener la URL de la base de datos
```bash
turso db show horarios-institucionales
# Copiar el valor de "URL" — tiene el formato:
# libsql://horarios-institucionales-[tu-usuario].turso.io
```

**Paso 3:** Crear el token de autenticación
```bash
turso db tokens create horarios-institucionales
# Se mostrará un token largo. COPIARLO INMEDIATAMENTE.
# No se puede volver a ver este token. Si se pierde, generar uno nuevo.
```

**Paso 4:** Guardar credenciales en un lugar seguro
```
TURSO_URL=libsql://horarios-institucionales-[tu-usuario].turso.io
TURSO_TOKEN=[el token que copiaste en el paso anterior]
```

**Paso 5:** Probar la conexión
```bash
turso db shell horarios-institucionales
# Debe abrir una consola SQL. Probar:
.tables
# Debe mostrar una lista vacía (aún no hay tablas)
.quit
```

## 4.4 Configurar el proyecto local

**Paso 1:** Crear la carpeta del proyecto
```bash
mkdir sistema-horarios
cd sistema-horarios
git init
```

**Paso 2:** Crear el archivo de configuración
```bash
# Crear archivo config.js con las credenciales de Turso
# IMPORTANTE: Este archivo NO se sube a GitHub (ver paso de .gitignore)
```

Crear el archivo `config.js` con este contenido:
```javascript
// config.js — NUNCA subir a repositorio público
const CONFIG = {
    TURSO_URL: "libsql://horarios-institucionales-[tu-usuario].turso.io",
    TURSO_TOKEN: "[tu-token-aqui]",
    APP_VERSION: "1.0.0",
    SESSION_TIMEOUT: 28800000,  // 8 horas en milisegundos
    JWT_SECRET: "[cadena-aleatoria-de-al-menos-32-caracteres]"
};
```

**Paso 3:** Crear `.gitignore` para proteger credenciales
```bash
echo "config.js" >> .gitignore
echo "config.local.js" >> .gitignore
echo ".env" >> .gitignore
echo "node_modules/" >> .gitignore
```

**Paso 4:** Crear el esquema de base de datos
```bash
# Crear archivo schema.sql con el contenido completo de la Sección 3.1
# Luego ejecutarlo en Turso:
turso db shell horarios-institucionales < schema.sql
# Verificar que las tablas se crearon:
turso db shell horarios-institucionales
.tables
# Debe mostrar: aulas  asignaciones  comisiones  departamentos
#               docentes  materias  modulos_horario  usuarios
.quit
```

**Paso 5:** Cargar datos iniciales
```bash
turso db shell horarios-institucionales < seed.sql
# Verificar:
turso db shell horarios-institucionales
SELECT * FROM departamentos;
SELECT * FROM docentes;
SELECT * FROM modulos_horario;
.quit
```

**Paso 6:** Generar hashes de contraseñas iniciales

Crear el archivo `generate-passwords.js`:
```javascript
// generate-passwords.js — ejecutar una sola vez
const bcrypt = require('bcryptjs');

async function main() {
    const adminHash = await bcrypt.hash('Admin2026!', 10);
    const invitadoHash = await bcrypt.hash('Invitado2026!', 10);
    
    console.log('Admin hash:', adminHash);
    console.log('Invitado hash:', invitadoHash);
    
    console.log('\nSQL para ejecutar en Turso:');
    console.log(`UPDATE usuarios SET password_hash = '${adminHash}' WHERE username = 'admin';`);
    console.log(`UPDATE usuarios SET password_hash = '${invitadoHash}' WHERE username = 'invitado';`);
}
main();
```

```bash
npm install bcryptjs
node generate-passwords.js
# Copiar los UPDATE statements y ejecutarlos en Turso:
turso db shell horarios-institucionales
# Pegar los UPDATE statements
.quit
```

## 4.5 Desplegar en Vercel

**Paso 1:** Crear cuenta en Vercel
1. Ir a https://vercel.com
2. Hacer clic en "Sign Up"
3. Elegir "Continue with GitHub"
4. Autorizar Vercel para acceder a tu GitHub

**Paso 2:** Subir el proyecto a GitHub
```bash
# Dentro de la carpeta sistema-horarios:
git add .
git commit -m "Initial commit: sistema de horarios"

# Crear repositorio en GitHub (ir a github.com → New repository)
# Luego conectar:
git remote add origin https://github.com/[tu-usuario]/sistema-horarios.git
git push -u origin main
```

**Paso 3:** Importar el proyecto en Vercel
1. En Vercel, hacer clic en **"Add New... → Project"**
2. Seleccionar el repositorio `sistema-horarios` de la lista
3. En **"Framework Preset"** seleccionar: **Other**
4. En **"Root Directory"** dejar vacío (raíz del proyecto)
5. En **"Build & Output Settings"** NO modificar nada
6. Hacer clic en **"Deploy"**

**Paso 4:** Configurar variables de entorno en Vercel
> IMPORTANTE: En Vercel, NO se puede subir `config.js` ya que está en `.gitignore`. Las credenciales van como variables de entorno.

1. En el panel de Vercel, ir al proyecto → **Settings → Environment Variables**
2. Agregar las siguientes variables:

| Variable | Valor |
|---|---|
| `TURSO_URL` | `libsql://horarios-institucionales-[tu-usuario].turso.io` |
| `TURSO_TOKEN` | `[tu-token-de-turso]` |
| `JWT_SECRET` | `[cadena-aleatoria-32-chars]` |

3. Hacer clic en **"Save"**
4. Ir a **Deployments** → hacer clic en **"Redeploy"** para que tome las variables

**Paso 5:** Verificar el despliegue
1. Vercel asignará una URL del tipo: `https://sistema-horarios-[hash].vercel.app`
2. Ingresar a esa URL
3. Debe mostrar la pantalla de login
4. Probar con usuario `admin` / contraseña `Admin2026!`

**Paso 6 (Opcional):** Configurar dominio personalizado
1. En Vercel → Settings → Domains
2. Agregar dominio propio o usar el subdominio gratuito de Vercel

---

# 5. SISTEMA DE AUTENTICACIÓN Y ROLES

## 5.1 Pantalla de Login

La primera pantalla que ve cualquier usuario es el formulario de acceso.

**Campos:**
- Usuario (texto)
- Contraseña (texto oculto)
- Botón "Ingresar"

**Comportamiento:**
1. El usuario ingresa credenciales
2. El sistema consulta la tabla `usuarios` en Turso
3. Se compara la contraseña con `bcrypt.compare()`
4. Si es válido: se genera un JWT y se guarda en `sessionStorage`
5. Se redirige al Dashboard según el rol
6. Si es inválido: se muestra mensaje de error (sin detallar si el usuario o la contraseña es incorrecto, por seguridad)

## 5.2 Estructura del JWT

```javascript
// Payload del token JWT
{
    sub: "admin",           // username
    rol: "admin",           // rol del usuario
    iat: 1234567890,        // issued at (timestamp)
    exp: 1234567890 + 28800 // expira en 8 horas
}
```

## 5.3 Control de acceso por módulo

| Acción | Admin | Invitado |
|---|---|---|
| Ver Dashboard | ✅ | ✅ |
| Exportar reportes CSV | ✅ | ✅ |
| Imprimir grilla | ✅ | ✅ |
| Crear departamento/aula | ✅ | ❌ |
| Editar departamento/aula | ✅ | ❌ |
| Eliminar departamento/aula | ✅ | ❌ |
| Crear/editar docentes | ✅ | ❌ |
| Crear/editar módulos | ✅ | ❌ |
| Crear/editar comisiones | ✅ | ❌ |
| Editar horario (celdas) | ✅ | ❌ |
| Gestionar usuarios | ✅ | ❌ |

## 5.4 Gestión de usuarios (solo Admin)

El administrador puede:
- Ver la lista de usuarios registrados
- Crear nuevos usuarios (admin o invitado)
- Desactivar usuarios sin eliminarlos
- Cambiar contraseñas

**Procedimiento para crear un nuevo usuario:**
1. Ir a menú **Configuración → Usuarios**
2. Hacer clic en **"Nuevo Usuario"**
3. Completar: Username, Contraseña, Rol
4. Hacer clic en **"Guardar"**
5. El sistema hashea la contraseña automáticamente antes de guardarla

## 5.5 Política de contraseñas

- Mínimo 8 caracteres
- Al menos 1 mayúscula, 1 minúscula, 1 número
- Las contraseñas nunca se almacenan en texto plano
- Se recomienda cambiar las contraseñas iniciales en el primer uso

---

# 6. MÓDULO 1 — CRUD DEPARTAMENTOS Y AULAS

## 6.1 Propósito

Los departamentos son la unidad máxima de organización. Cada departamento tiene sus propias aulas y su propio horario. Actualmente se usan 3 departamentos pero el sistema soporta ilimitados.

## 6.2 Gestión de Departamentos

### Crear un departamento

1. Ir al menú lateral → **Departamentos**
2. Hacer clic en el botón **"+ Nuevo Departamento"**
3. Completar el formulario:
   - **Nombre:** Nombre completo (ej: "Tecnologías de la Información y Comunicación")
   - **Código:** Abreviatura única (ej: "TIC") — máximo 10 caracteres
   - **Descripción:** Opcional
4. Hacer clic en **"Guardar"**
5. El sistema verifica que el código no esté duplicado antes de guardar

### Editar un departamento

1. En la lista de departamentos, hacer clic en el ícono ✏️ del departamento a editar
2. Modificar los campos deseados
3. Hacer clic en **"Actualizar"**

### Eliminar un departamento

> ⚠️ **ATENCIÓN:** Solo se puede eliminar un departamento si NO tiene aulas con asignaciones activas.

1. En la lista de departamentos, hacer clic en el ícono 🗑️
2. El sistema verificará si hay asignaciones vinculadas
3. Si las hay, mostrará un mensaje: "No se puede eliminar: existen X asignaciones activas"
4. Para eliminar de todas formas: primero eliminar todas las asignaciones del departamento desde el Editor de Horario

### Desactivar un departamento (alternativa a eliminar)

Para ocultar un departamento sin eliminar su historial:
1. Editar el departamento
2. Desmarcar la casilla **"Activo"**
3. Guardar — el departamento ya no aparecerá en el Dashboard ni en el Editor

## 6.3 Gestión de Aulas

Las aulas pertenecen a un departamento específico.

### Crear un aula

1. En la lista de departamentos, hacer clic en el nombre del departamento
2. En la sección "Aulas del Departamento", hacer clic en **"+ Nueva Aula"**
3. Completar:
   - **Nombre:** (ej: "AULA 1", "AULA 3", "LAB INFORMÁTICA")
   - **Capacidad:** Número de alumnos (opcional)
4. Hacer clic en **"Guardar"**

### Reordenar aulas

Las aulas aparecen en el dashboard en el orden en que fueron creadas. Para cambiar el orden:
1. Editar el nombre del aula (ej: de "AULA 1" a "AULA 2")
2. El orden visual en el dashboard refleja el orden alfabético del nombre

---

# 7. MÓDULO 2 — CRUD DOCENTES

## 7.1 Propósito

Los docentes son los responsables asignados a cada comisión en cada módulo horario. Un docente puede aparecer en múltiples aulas y días, pero el sistema detecta conflictos si un mismo docente aparece en dos lugares a la vez.

## 7.2 Gestión de Docentes

### Crear un docente

1. Ir al menú lateral → **Docentes**
2. Hacer clic en **"+ Nuevo Docente"**
3. Completar el formulario:
   - **Apellido** (obligatorio): ej "SALVADOR"
   - **Nombre** (opcional): ej "María"
   - **Email** (opcional): para contacto
   - **Teléfono** (opcional)
4. Hacer clic en **"Guardar"**

### Editar un docente

1. En la lista, hacer clic en el ícono ✏️ del docente
2. Modificar los campos y hacer clic en **"Actualizar"**

> **Nota:** Al editar el apellido de un docente, el cambio se reflejará automáticamente en todas las asignaciones donde aparece ese docente, ya que se guardan por ID y no por nombre.

### Eliminar un docente

> ⚠️ Solo se puede eliminar si el docente no tiene asignaciones activas.

Si el docente tiene asignaciones:
- Opción A: Desactivar el docente (queda oculto pero el historial se conserva)
- Opción B: Reasignar sus módulos a otro docente desde el Editor de Horario, luego eliminarlo

### Vista por docente

Desde la lista de docentes, hacer clic en el nombre para ver:
- Todos los módulos asignados (día, hora, aula, comisión)
- Total de horas semanales
- Verificación visual de conflictos (módulos duplicados aparecen en rojo)

---

# 8. MÓDULO 3 — CRUD MÓDULOS HORARIOS

## 8.1 Propósito

Los módulos son las franjas de tiempo de 40 minutos en las que se organiza la jornada. Actualmente existen dos turnos:

- **Turno Mañana:** 7 módulos (7:45 a 12:50)
- **Turno Tarde:** 9 módulos (13:30 a 19:55)

## 8.2 Módulos actuales cargados en el sistema

### Turno Mañana

| N° | Inicio | Fin |
|---|---|---|
| 1° | 07:45 | 08:25 |
| 2° | 08:25 | 09:05 |
| 3° | 09:15 | 09:55 |
| 4° | 09:55 | 10:35 |
| 5° | 10:45 | 11:25 |
| 6° | 12:05 | 12:10 |
| 7° | 12:10 | 12:50 |

### Turno Tarde

| N° | Inicio | Fin |
|---|---|---|
| 1° | 13:30 | 14:10 |
| 2° | 14:10 | 14:50 |
| 3° | 15:00 | 15:40 |
| 4° | 15:40 | 16:20 |
| 5° | 16:30 | 17:10 |
| 6° | 17:10 | 17:50 |
| 7° | 17:55 | 18:35 |
| 8° | 18:35 | 19:15 |
| 9° | 19:15 | 19:55 |

## 8.3 Agregar un nuevo módulo

1. Ir al menú → **Configuración → Módulos Horarios**
2. Hacer clic en **"+ Nuevo Módulo"**
3. Completar:
   - **Número:** El número de orden dentro del turno (ej: 8 para agregar un 8° módulo en mañana)
   - **Hora de inicio:** Formato 24hs (ej: 13:30)
   - **Hora de fin:** Formato 24hs (ej: 14:10)
   - **Turno:** Mañana o Tarde
4. Hacer clic en **"Guardar"**

> **Regla de validación:** El sistema verificará que el nuevo módulo no se superponga con módulos existentes del mismo turno.

## 8.4 Editar un módulo existente

> ⚠️ Si el módulo ya tiene asignaciones, cambiar la hora mostrará una advertencia pero no bloqueará la edición.

1. En la lista de módulos, hacer clic en ✏️
2. Modificar hora de inicio y/o fin
3. Guardar

## 8.5 Eliminar un módulo

Solo se puede eliminar un módulo si no tiene asignaciones. De lo contrario, usar la opción de desactivar.

---

# 9. MÓDULO 4 — CRUD COMISIONES Y MATERIAS

## 9.1 Propósito

Las comisiones son los grupos de estudiantes. Cada comisión tiene un código único, está vinculada a una materia, y tiene asignado al menos un docente en el Editor de Horario.

**Nomenclatura de comisiones (del Excel):**
- `C1DM1` = Comisión 1, División D, Mañana, Grupo 1
- `C3AT2` = Comisión 3, División A, Tarde, Grupo 2
- `C4T1` = Comisión 4, Tarde, Grupo 1

## 9.2 Gestión de Materias

### Crear una materia

1. Ir a **Comisiones → Materias** (submenú)
2. Hacer clic en **"+ Nueva Materia"**
3. Completar:
   - **Nombre:** (ej: "Programación I")
   - **Código:** Abreviatura única (ej: "PROG1")
   - **Departamento:** Asociar al departamento correspondiente
4. Guardar

## 9.3 Gestión de Comisiones

### Crear una comisión

1. Ir al menú → **Comisiones**
2. Hacer clic en **"+ Nueva Comisión"**
3. Completar:
   - **Código:** Identificador único (ej: "C1DM1")
   - **Materia:** Seleccionar de la lista desplegable
   - **Turno:** Mañana o Tarde
4. Guardar

### Vincular comisión con materia

La vinculación se hace al crear la comisión. Para cambiarla:
1. Editar la comisión
2. Seleccionar la nueva materia en el desplegable
3. Guardar

> **Nota:** Un cambio de materia en la comisión no afecta las asignaciones ya creadas en el horario. Solo afecta los reportes futuros.

---

# 10. MÓDULO 5 — EDITOR DE HORARIO

## 10.1 Propósito

Es el módulo central del sistema. Permite asignar comisiones y docentes a cada celda del horario (combinación de aula + módulo + día + departamento).

## 10.2 Cómo funciona la grilla del editor

El editor muestra una tabla con:
- **Filas:** Módulos horarios (1° al 7° en mañana, 1° al 9° en tarde)
- **Columnas:** Días de la semana (Lunes a Viernes) × Aulas del departamento

Cada celda puede contener:
- **Línea 1:** Código de comisión (ej: C1DM1)
- **Línea 2:** Apellido del docente (ej: SALVADOR)

Las celdas vacías se muestran en gris claro.

## 10.3 Asignar una comisión y docente a una celda

1. Seleccionar el departamento en el menú desplegable superior
2. Seleccionar el turno (mañana/tarde)
3. Hacer clic en la celda deseada (intersección de módulo + día + aula)
4. Se abrirá un panel lateral con:
   - **Comisión:** Desplegable con todas las comisiones del turno seleccionado
   - **Docente:** Desplegable con todos los docentes activos
   - **Observaciones:** Campo de texto libre opcional
5. Seleccionar comisión y docente
6. Hacer clic en **"Guardar celda"**
7. La celda se actualiza visualmente en tiempo real

## 10.4 Editar una celda existente

1. Hacer clic sobre una celda que ya tiene asignación
2. El panel lateral muestra los valores actuales
3. Modificar comisión y/o docente
4. Hacer clic en **"Actualizar"**

## 10.5 Vaciar una celda (quitar asignación)

1. Hacer clic sobre la celda
2. En el panel lateral, hacer clic en **"Limpiar celda"**
3. Confirmar en el diálogo de confirmación

## 10.6 Detección de conflictos

El sistema verifica automáticamente antes de guardar:

**Conflicto tipo A — Docente duplicado:**
Un docente no puede estar en dos aulas diferentes en el mismo módulo y día.
- Mensaje: "⚠️ SALVADOR ya tiene asignado el módulo 3° del martes (AULA 2 - Depto. TIC)"

**Conflicto tipo B — Comisión duplicada:**
Una comisión no puede aparecer en dos aulas distintas al mismo tiempo.
- Mensaje: "⚠️ C1DM1 ya está asignada en este módulo (AULA 1)"

En ambos casos el sistema ofrece dos opciones:
- **"Cancelar"**: No guarda nada
- **"Forzar igualmente"**: Guarda con una marca de conflicto (la celda se muestra en rojo en el dashboard)

## 10.7 Copiar configuración de un día a otro

Para copiar todas las celdas de un día (ej: lunes) a otro (ej: jueves):
1. Hacer clic en el encabezado del día origen (ej: "LUNES")
2. Hacer clic en **"Copiar día"**
3. Seleccionar el día destino
4. Confirmar — el sistema copiará todas las celdas, respetando aulas y módulos

## 10.8 Historial de cambios

Cada vez que se modifica una celda, el sistema registra:
- Quién hizo el cambio (campo `updated_by` en la tabla `asignaciones`)
- Cuándo se hizo (campo `updated_at`)

Para ver el historial de una celda:
1. Hacer clic en la celda
2. En el panel lateral, hacer clic en **"Ver historial"**

---

# 11. MÓDULO 6 — DASHBOARD / VISTA GRILLA

## 11.1 Propósito

Replica visualmente la planilla Excel original. Es la vista principal para consultar el cronograma sin necesidad de editar nada.

## 11.2 Controles del dashboard

- **Departamento:** Selector para cambiar entre departamentos
- **Turno:** Mañana / Tarde / Ambos
- **Día:** Todos los días / Día específico

## 11.3 Lectura del dashboard

La grilla muestra:
- **Encabezado superior:** Días de la semana, divididos por aulas
- **Columna izquierda:** Número de módulo + hora de inicio
- **Celdas:** Comisión (arriba) + Docente (abajo)
- **Celdas vacías:** En gris claro
- **Celdas con conflicto:** En rojo

## 11.4 Imprimir el horario

1. En el dashboard, hacer clic en **"🖨️ Imprimir"**
2. El sistema aplica CSS de impresión que:
   - Oculta el menú lateral y los controles
   - Ajusta el tamaño de fuente para que entre en una hoja A4 horizontal
   - Agrega el nombre del departamento y la fecha de impresión como encabezado

---

# 12. MÓDULO 7 — REPORTES

## 12.1 Reportes disponibles

### Reporte 1: Por Docente

Muestra todos los módulos asignados a un docente específico.

**Columnas:** Día | Módulo | Hora | Departamento | Aula | Comisión | Materia

**Uso:**
1. Ir a **Reportes → Por Docente**
2. Seleccionar el docente del desplegable
3. La tabla se actualiza automáticamente
4. Hacer clic en **"Exportar CSV"** para descargar

### Reporte 2: Por Turno

Muestra todas las comisiones de un turno (mañana o tarde).

**Columnas:** Departamento | Día | Módulo | Aula | Comisión | Materia | Docente

### Reporte 3: Por Materia

Muestra todas las comisiones que corresponden a una materia.

**Columnas:** Comisión | Departamento | Día | Módulo | Aula | Docente

### Reporte 4: Por Departamento

Vista completa de un departamento con todos sus días, módulos, aulas, comisiones y docentes.

## 12.2 Exportar a CSV

Todo reporte puede exportarse a CSV:
1. Hacer clic en **"Exportar CSV"**
2. El browser descargará un archivo `.csv` con el nombre del reporte y la fecha
3. Compatible con Excel, LibreOffice Calc y Google Sheets

## 12.3 Imprimir reportes

1. Hacer clic en **"Imprimir"**
2. El sistema aplica estilos de impresión automáticamente

---

# 13. ESTRUCTURA DE ARCHIVOS DEL PROYECTO

```
sistema-horarios/
│
├── index.html              # Punto de entrada. Carga el login.
├── app.html                # Aplicación principal (post-login)
├── styles.css              # Estilos globales
├── config.js               # ⚠️ NO subir a GitHub. Credenciales Turso.
├── .gitignore              # Excluye config.js y node_modules
│
├── js/
│   ├── auth.js             # Login, JWT, control de sesión
│   ├── turso.js            # Wrapper para llamadas HTTP a Turso API
│   ├── router.js           # Navegación entre módulos (SPA)
│   ├── utils.js            # Funciones reutilizables
│   │
│   ├── departamentos.js    # CRUD departamentos y aulas
│   ├── docentes.js         # CRUD docentes
│   ├── modulos.js          # CRUD módulos horarios
│   ├── comisiones.js       # CRUD comisiones y materias
│   ├── editor.js           # Editor de horario (grilla interactiva)
│   ├── dashboard.js        # Vista grilla (solo lectura)
│   └── reportes.js         # Generación y exportación de reportes
│
├── css/
│   ├── login.css           # Estilos de la pantalla de login
│   ├── grilla.css          # Estilos de la tabla horario
│   ├── forms.css           # Estilos de formularios CRUD
│   └── print.css           # Estilos específicos para impresión
│
├── sql/
│   ├── schema.sql          # Definición de tablas (Sección 3.1)
│   └── seed.sql            # Datos iniciales (Sección 3.2)
│
└── README.md               # Instrucciones de instalación resumidas
```

---

# 14. FLUJO DE DATOS Y RELACIONES

## 14.1 Diagrama de relaciones entre entidades

```
departamentos
    │
    ├──► aulas (N aulas por departamento)
    │        │
    │        └──► asignaciones ◄──── modulos_horario
    │                  │
    │                  ├──► comisiones ◄──── materias
    │                  │                        │
    │                  └──► docentes            └──► departamentos
    │
    └──► materias (materias del depto)

usuarios (tabla independiente, no relacionada con el horario)
```

## 14.2 Consulta SQL del Dashboard

```sql
-- Consulta principal del dashboard para un departamento y turno
SELECT
    mh.numero           AS modulo_numero,
    mh.hora_inicio,
    mh.hora_fin,
    a.nombre            AS aula,
    a.dia_semana,
    c.codigo            AS comision,
    d.apellido          AS docente,
    mat.nombre          AS materia
FROM
    asignaciones a
    JOIN aulas au         ON a.aula_id = au.id
    JOIN modulos_horario mh ON a.modulo_id = mh.id
    LEFT JOIN comisiones c   ON a.comision_id = c.id
    LEFT JOIN docentes d     ON a.docente_id = d.id
    LEFT JOIN materias mat   ON c.materia_id = mat.id
WHERE
    a.departamento_id = ?    -- parámetro: ID del departamento
    AND mh.turno = ?         -- parámetro: 'mañana' o 'tarde'
ORDER BY
    mh.numero, a.dia_semana, au.nombre;
```

---

# 15. GESTIÓN DE CONFLICTOS MULTIUSUARIO

## 15.1 Escenario de conflicto

Cuando dos usuarios editan la misma celda simultáneamente:

```
Usuario A abre celda [Módulo 3, Lunes, AULA 1]
Usuario B abre celda [Módulo 3, Lunes, AULA 1]

Usuario A guarda → OK
Usuario B guarda → ¿Qué pasa?
```

## 15.2 Estrategia: Optimistic Locking con timestamp

El sistema usa la columna `updated_at` para detectar conflictos:

1. Al abrir una celda, el sistema registra el `updated_at` actual
2. Al guardar, verifica si el `updated_at` de la BD sigue siendo el mismo
3. Si cambió → alguien más editó esa celda entre el momento de abrir y guardar
4. Muestra el mensaje: **"⚠️ Esta celda fue modificada por [usuario] hace [X] segundos. ¿Desea sobrescribir o recargar?"**

## 15.3 Limitaciones conocidas

- No hay "bloqueo de celda" en tiempo real (como Google Docs)
- En casos extremos de edición simultánea, el último en guardar gana
- Para instalaciones con muchos usuarios concurrentes (más de 10), se recomienda migrar a PocketBase en un VPS

---

# 16. EXPORTACIÓN E IMPORTACIÓN DE DATOS

## 16.1 Exportar toda la base de datos

Para hacer un backup completo:

```bash
# En la terminal, con la CLI de Turso instalada:
turso db shell horarios-institucionales ".dump" > backup_$(date +%Y%m%d).sql
```

Este archivo SQL puede usarse para restaurar la base de datos en Turso o en cualquier SQLite local.

## 16.2 Importar datos desde el backup

```bash
# Restaurar desde backup
turso db shell horarios-institucionales < backup_20260311.sql
```

## 16.3 Exportar desde la interfaz web

Desde cualquier reporte, hacer clic en **"Exportar CSV"**. El archivo se descarga directamente al dispositivo del usuario.

## 16.4 Importar horario desde Excel

Actualmente no existe importación automática desde Excel. Para cargar datos masivos:
1. Convertir el Excel a CSV
2. Usar el script de importación: `node scripts/import-csv.js horario.csv`
3. El script valida y carga los datos en Turso

---

# 17. MANTENIMIENTO Y ACTUALIZACIONES

## 17.1 Actualizar el sistema

```bash
# Obtener últimos cambios del repositorio
git pull origin main

# Si hay cambios en el esquema SQL, aplicarlos:
turso db shell horarios-institucionales < sql/migrations/v1.1.sql

# Vercel redesplegará automáticamente al hacer push
```

## 17.2 Monitorear el uso de Turso

Plan gratuito de Turso:
- 500 bases de datos
- 9 GB de almacenamiento
- 1 mil millones de lecturas/mes
- 25 millones de escrituras/mes

Para verificar el uso actual:
```bash
turso db inspect horarios-institucionales
```

## 17.3 Renovar el token de Turso

Los tokens no vencen por defecto, pero si se necesita regenerar:
```bash
# Crear nuevo token
turso db tokens create horarios-institucionales

# Actualizar en Vercel:
# Settings → Environment Variables → TURSO_TOKEN → Edit → Save → Redeploy
```

## 17.4 Backup automático semanal recomendado

Crear un archivo `.github/workflows/backup.yml`:
```yaml
name: Weekly DB Backup
on:
  schedule:
    - cron: '0 3 * * 0'  # Cada domingo a las 3 AM UTC
jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Install Turso CLI
        run: curl -sSfL https://get.tur.so/install.sh | bash
      - name: Backup database
        run: |
          turso db shell ${{ secrets.TURSO_DB }} ".dump" > backup_$(date +%Y%m%d).sql
        env:
          TURSO_API_TOKEN: ${{ secrets.TURSO_API_TOKEN }}
```

---

# 18. SOLUCIÓN DE PROBLEMAS FRECUENTES

## Error: "Failed to fetch" al cargar el dashboard

**Causa:** El token de Turso expiró o es incorrecto.

**Solución:**
1. Verificar en Vercel → Settings → Environment Variables que `TURSO_TOKEN` esté correctamente copiado
2. Generar un nuevo token: `turso db tokens create horarios-institucionales`
3. Actualizar en Vercel y redesplegar

## Error: "UNIQUE constraint failed: asignaciones..."

**Causa:** Se intenta asignar dos comisiones a la misma celda.

**Solución:** La interfaz debería mostrar el conflicto antes de intentar guardar. Si ocurre de todas formas, verificar que el editor está validando correctamente antes del INSERT.

## El dashboard no muestra datos

**Causa posible A:** No hay datos en la base de datos.
- Verificar: `turso db shell horarios-institucionales "SELECT COUNT(*) FROM asignaciones;"`

**Causa posible B:** Error de CORS al hacer fetch a Turso.
- Turso soporta CORS por defecto. Verificar que la URL en config.js empieza con `https://`

## Login no funciona

**Causa probable:** El hash de contraseña en la BD no corresponde a bcrypt.

**Solución:**
```bash
node -e "const b=require('bcryptjs'); b.hash('Admin2026!',10).then(h=>console.log(h))"
# Copiar el hash y actualizar en Turso:
turso db shell horarios-institucionales
UPDATE usuarios SET password_hash = '[nuevo-hash]' WHERE username = 'admin';
```

## Vercel muestra error 404 en rutas

**Causa:** Vercel no sabe que es una SPA (Single Page Application).

**Solución:** Crear el archivo `vercel.json` en la raíz del proyecto:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

---

# 19. GLOSARIO

| Término | Definición |
|---|---|
| **Módulo** | Franja horaria de 40 minutos. Actualmente hay 7 módulos en turno mañana y 9 en turno tarde. |
| **Comisión** | Grupo de estudiantes identificado por un código (ej: C1DM1). Cada comisión corresponde a una materia. |
| **Asignación** | Registro que vincula una comisión y un docente con una celda del horario (aula + módulo + día). |
| **Turno** | Mañana (7:45 a 12:50) o Tarde (13:30 a 19:55). |
| **Aula** | Espacio físico dentro de un departamento donde se dictan clases. |
| **Departamento** | Unidad organizativa que agrupa aulas y horarios (ej: TIC). |
| **Docente** | Responsable de dictar una clase en una comisión específica. |
| **Materia** | Asignatura académica asociada a una o más comisiones. |
| **Conflicto** | Situación donde un docente o comisión aparece en dos lugares al mismo tiempo. |
| **Turso** | Servicio de base de datos SQLite en la nube usado como backend. |
| **JWT** | JSON Web Token. Mecanismo de autenticación sin sesión del lado del servidor. |
| **bcrypt** | Algoritmo de hashing de contraseñas. Las contraseñas nunca se guardan en texto plano. |
| **SPA** | Single Page Application. La aplicación carga una sola vez y navega sin recargar la página. |
| **CRUD** | Create, Read, Update, Delete. Las 4 operaciones básicas sobre datos. |
| **CSV** | Comma-Separated Values. Formato de exportación de datos compatible con Excel. |
| **CDN** | Content Delivery Network. Red de servidores que distribuye los archivos estáticos globalmente. |
| **WAL** | Write-Ahead Logging. Mecanismo de SQLite para garantizar integridad en escrituras concurrentes. |

---

*Documento generado el 11/03/2026 — Sistema de Gestión de Horarios Institucionales v1.0*
*Proyecto inicializado correctamente el 11/03/2026 por el asistente Antigravity.*
*Para soporte técnico o consultas sobre este documento, contactar al administrador del sistema.*
