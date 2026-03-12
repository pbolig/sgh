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
