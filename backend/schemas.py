from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

# Esquemas de Institución
class InstitucionBase(BaseModel):
    nombre: str
    codigo: str
    descripcion: Optional[str] = None
    logo_url: Optional[str] = None
    turnos_activos: Optional[str] = "mañana,tarde,noche"
    activo: Optional[int] = 1

class InstitucionCreate(InstitucionBase):
    pass

class InstitucionUpdate(BaseModel):
    nombre: Optional[str] = None
    codigo: Optional[str] = None
    descripcion: Optional[str] = None
    logo_url: Optional[str] = None
    turnos_activos: Optional[str] = None
    activo: Optional[int] = None

class Institucion(InstitucionBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    class Config:
        from_attributes = True

# Esquemas de RBAC
class RolBase(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    institucion_id: Optional[int] = None

class RolCreate(RolBase):
    institucion_id: int

class Rol(RolBase):
    id: int
    class Config:
        from_attributes = True

class ModuloBase(BaseModel):
    nombre: str
    etiqueta: str
    icono: Optional[str] = None

class ModuloCreate(ModuloBase):
    pass

class Modulo(ModuloBase):
    id: int
    class Config:
        from_attributes = True

class PermisoBase(BaseModel):
    rol_id: int
    modulo_id: int
    nivel: str # ninguno, lectura, edicion

class PermisoCreate(PermisoBase):
    pass

class Permiso(PermisoBase):
    id: int
    modulo: Optional[Modulo] = None
    class Config:
        from_attributes = True

class UsuarioBase(BaseModel):
    username: str
    rol: Optional[str] = None
    rol_id: Optional[int] = None
    activo: int
    institucion_id: Optional[int] = None
    email: Optional[str] = None

class UsuarioCreate(UsuarioBase):
    password: str
    nombre: Optional[str] = None
    apellido: Optional[str] = None
    crear_perfil: Optional[bool] = False

class UsuarioRegister(BaseModel):
    username: str
    password: str
    email: str
    nombre: str
    apellido: str
    institucion_id: int

class UsuarioAprobar(BaseModel):
    rol_id: int
    tipo_perfil: str # "docente" o "cargo"

class UsuarioUpdate(BaseModel):
    username: Optional[str] = None
    password: Optional[str] = None
    rol: Optional[str] = None
    rol_id: Optional[int] = None
    activo: Optional[int] = None
    institucion_id: Optional[int] = None

class Usuario(UsuarioBase):
    id: int
    rol_obj: Optional[Rol] = None
    created_at: datetime
    class Config:
        from_attributes = True

# Esquemas de Departamento
class DepartamentoBase(BaseModel):
    institucion_id: Optional[int] = None
    nombre: str
    codigo: str
    descripcion: Optional[str] = None
    activo: Optional[int] = 1

class DepartamentoCreate(DepartamentoBase):
    pass

class DepartamentoUpdate(BaseModel):
    nombre: Optional[str] = None
    codigo: Optional[str] = None
    descripcion: Optional[str] = None
    activo: Optional[int] = None

class Departamento(DepartamentoBase):
    id: int
    created_at: datetime
    updated_at: datetime
    class Config:
        from_attributes = True

# Esquemas de Carrera
class CarreraBase(BaseModel):
    institucion_id: int
    nombre: str
    codigo: str
    descripcion: Optional[str] = None
    activo: Optional[int] = 1

class CarreraCreate(CarreraBase):
    pass

class CarreraUpdate(BaseModel):
    nombre: Optional[str] = None
    codigo: Optional[str] = None
    descripcion: Optional[str] = None
    activo: Optional[int] = None

class Carrera(CarreraBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True

# Esquemas de Estudiante
class EstudianteBase(BaseModel):
    usuario_id: int
    carrera_id: int
    legajo: str
    nombre: str
    apellido: str
    email: Optional[str] = None
    telefono: Optional[str] = None
    anio_cursada: Optional[int] = 1
    comision_id: Optional[int] = None
    activo: Optional[int] = 1

class EstudianteCreate(EstudianteBase):
    password: str # Para crear el usuario vinculado

class EstudianteUpdate(BaseModel):
    nombre: Optional[str] = None
    apellido: Optional[str] = None
    email: Optional[str] = None
    telefono: Optional[str] = None
    anio_cursada: Optional[int] = None
    comision_id: Optional[int] = None
    activo: Optional[int] = None

class Estudiante(EstudianteBase):
    id: int
    created_at: datetime
    carrera: Optional[Carrera] = None
    class Config:
        from_attributes = True

# Esquemas de Docente
class DocenteBase(BaseModel):
    institucion_id: Optional[int] = None # Legacy
    institucion_ids: Optional[List[int]] = []
    departamento_ids: Optional[List[int]] = []
    carrera_ids: Optional[List[int]] = []
    apellido: str
    nombre: Optional[str] = None
    email: Optional[str] = None
    telefono: Optional[str] = None
    situacion_revista: Optional[str] = "interino"
    es_temporal: Optional[bool] = False
    usuario_id: Optional[int] = None
    activo: Optional[int] = 1

class DocenteCreate(DocenteBase):
    pass

class DocenteUpdate(BaseModel):
    institucion_ids: Optional[List[int]] = None
    departamento_ids: Optional[List[int]] = None
    carrera_ids: Optional[List[int]] = None
    apellido: Optional[str] = None
    nombre: Optional[str] = None
    email: Optional[str] = None
    telefono: Optional[str] = None
    situacion_revista: Optional[str] = None
    es_temporal: Optional[bool] = None
    usuario_id: Optional[int] = None
    activo: Optional[int] = None

class Docente(DocenteBase):
    id: int
    instituciones: List[Institucion] = []
    departamentos: List[Departamento] = []
    created_at: datetime
    updated_at: datetime
    class Config:
        from_attributes = True

# Esquemas de Materia
class MateriaBase(BaseModel):
    nombre: str
    codigo: str
    codigo_interno: Optional[str] = None
    departamento_id: Optional[int] = None
    carrera_id: Optional[int] = None
    anio: Optional[int] = 1 # Año/Nivel de la carrera
    carga_horaria_modulos: Optional[int] = 0
    correlativas: Optional[str] = None # JSON string
    activo: Optional[int] = 1

class MateriaCreate(MateriaBase):
    pass

class MateriaUpdate(BaseModel):
    codigo: Optional[str] = None
    codigo_interno: Optional[str] = None
    departamento_id: Optional[int] = None
    carrera_id: Optional[int] = None
    anio: Optional[int] = None
    carga_horaria_modulos: Optional[int] = None
    correlativas: Optional[str] = None
    activo: Optional[int] = None

class Materia(MateriaBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True

# Esquemas de Cargo
class CargoBase(BaseModel):
    nombre: str
    uso_multiple: Optional[str] = None
    activo: Optional[int] = 1

class CargoCreate(CargoBase):
    pass

class CargoUpdate(BaseModel):
    nombre: Optional[str] = None
    uso_multiple: Optional[str] = None
    activo: Optional[int] = None

class Cargo(CargoBase):
    id: int
    created_at: datetime
    updated_at: datetime
    class Config:
        from_attributes = True

# Esquemas de CargoHorario
class CargoHorarioBase(BaseModel):
    dia_semana: str
    hora_inicio: str
    hora_fin: str
    horas: float = 0
    aula_id: Optional[int] = None
    comision_id: Optional[int] = None
    modulo_id: Optional[int] = None
    observaciones: Optional[str] = None

class CargoHorarioCreate(CargoHorarioBase):
    pass



# Esquemas de Aula
class AulaBase(BaseModel):
    institucion_id: int
    nombre: str
    capacidad: Optional[int] = None
    activo: Optional[int] = 1
    departamento_ids: List[int] = []

class AulaCreate(AulaBase):
    pass

class AulaUpdate(BaseModel):
    institucion_id: Optional[int] = None
    departamento_ids: Optional[List[int]] = None
    nombre: Optional[str] = None
    capacidad: Optional[int] = None
    activo: Optional[int] = None

class Aula(AulaBase):
    id: int
    departamentos: List[Departamento] = []
    created_at: datetime
    class Config:
        from_attributes = True

# Esquemas de Comision
class ComisionBase(BaseModel):
    codigo: str
    materia_id: Optional[int] = None
    turno: str
    activo: Optional[int] = 1

class ComisionCreate(ComisionBase):
    pass

class Comision(ComisionBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    class Config:
        from_attributes = True

# Esquemas de ModuloHorario
class ModuloHorarioBase(BaseModel):
    numero: int
    hora_inicio: str
    hora_fin: str
    turno: str
    activo: Optional[int] = 1

class ModuloHorario(ModuloHorarioBase):
    id: int
    class Config:
        from_attributes = True

class CargoHorario(CargoHorarioBase):
    id: int
    asignacion_id: int
    comision: Optional[Comision] = None
    modulo: Optional[ModuloHorario] = None
    class Config:
        from_attributes = True

# Esquemas de CargoAsignacion
class CargoAsignacionBase(BaseModel):
    cargo_id: Optional[int] = None
    docente_id: Optional[int] = None
    departamento_id: int
    horas_lunes: float = 0
    horas_martes: float = 0
    horas_miercoles: float = 0
    horas_jueves: float = 0
    horas_viernes: float = 0
    horas_sabado: float = 0
    horas_domingo: float = 0
    total_horas: float = 0
    hora_inicio: Optional[str] = None
    hora_fin: Optional[str] = None
    activo: Optional[int] = 1
    horarios: List[CargoHorarioCreate] = []

class CargoAsignacionCreate(CargoAsignacionBase):
    pass

class CargoAsignacionUpdate(BaseModel):
    cargo_id: Optional[int] = None
    docente_id: Optional[int] = None
    departamento_id: Optional[int] = None
    horas_lunes: Optional[float] = None
    horas_martes: Optional[float] = None
    horas_miercoles: Optional[float] = None
    horas_jueves: Optional[float] = None
    horas_viernes: Optional[float] = None
    horas_sabado: Optional[float] = None
    horas_domingo: Optional[float] = None
    total_horas: Optional[float] = None
    hora_inicio: Optional[str] = None
    hora_fin: Optional[str] = None
    activo: Optional[int] = None
    horarios: Optional[List[CargoHorarioCreate]] = None


# --- ESQUEMAS DE LICENCIAS Y REEMPLAZOS ---

class MotivoLicenciaBase(BaseModel):
    nombre: str

class MotivoLicenciaCreate(MotivoLicenciaBase):
    pass

class MotivoLicencia(MotivoLicenciaBase):
    id: int
    class Config:
        from_attributes = True

class ReemplazoBase(BaseModel):
    reemplazante_id: int
    cargo_asignacion_id: Optional[int] = None
    asignacion_id: Optional[int] = None
    fecha_inicio: str
    fecha_fin: str

class ReemplazoCreate(ReemplazoBase):
    licencia_id: int

class Reemplazo(ReemplazoBase):
    id: int
    licencia_id: int
    reemplazante: Optional[Docente] = None
    created_at: datetime
    class Config:
        from_attributes = True

class LicenciaBase(BaseModel):
    docente_id: int
    motivo_id: int
    fecha_inicio: str
    fecha_fin: str
    observaciones: Optional[str] = None

class LicenciaCreate(LicenciaBase):
    pass

class Licencia(LicenciaBase):
    id: int
    motivo: Optional[MotivoLicencia] = None
    reemplazos: List[Reemplazo] = []
    created_at: datetime
    class Config:
        from_attributes = True

class CargoAsignacion(CargoAsignacionBase):
    id: int
    created_at: datetime
    updated_at: datetime
    cargo: Optional[Cargo] = None
    horarios: List[CargoHorario] = []
    reemplazo_activo: Optional[Reemplazo] = None
    
    class Config:
        from_attributes = True

# Esquemas de Asignacion
class AsignacionBase(BaseModel):
    departamento_id: Optional[int] = None
    carrera_id: Optional[int] = None
    aula_id: int
    modulo_id: int
    dia_semana: str
    comision_id: Optional[int] = None
    docente_id: Optional[int] = None
    observaciones: Optional[str] = None

class AsignacionCreate(AsignacionBase):
    pass

class Asignacion(AsignacionBase):
    id: int
    created_at: datetime
    updated_at: datetime
    updated_by: Optional[str] = None
    reemplazo_activo: Optional[dict] = None
    warning: Optional[str] = None
    class Config:
        from_attributes = True

# Esquemas de RecreoExcluido
class RecreoExcluidoBase(BaseModel):
    departamento_id: Optional[int] = None
    carrera_id: Optional[int] = None
    dia_semana: str
    modulo_id_anterior: int

class RecreoExcluidoCreate(RecreoExcluidoBase):
    pass

class RecreoExcluido(RecreoExcluidoBase):
    id: int
    class Config:
        from_attributes = True

# --- ESQUEMAS DE COMUNICACIÓN (CRM) ---

class ComunicacionMensajeBase(BaseModel):
    texto: str

class ComunicacionMensajeCreate(ComunicacionMensajeBase):
    comunicacion_id: int

class ComunicacionMensaje(ComunicacionMensajeBase):
    id: int
    comunicacion_id: int
    usuario_id: int
    usuario: Optional[Usuario] = None
    created_at: datetime
    class Config:
        from_attributes = True

# --- ESQUEMAS DE CONFIGURACIÓN ---
class ConfiguracionSistemaBase(BaseModel):
    entorno: str
    servicio: str
    config: dict
    activo: Optional[bool] = True

class ConfiguracionSistemaCreate(ConfiguracionSistemaBase):
    pass

class ConfiguracionSistemaUpdate(BaseModel):
    config: Optional[dict] = None
    activo: Optional[bool] = None

class ConfiguracionSistema(ConfiguracionSistemaBase):
    id: int
    created_at: datetime
    updated_at: datetime
    class Config:
        from_attributes = True


class ComunicacionBase(BaseModel):
    tipo: str # anuncio, ticket
    asunto: str
    categoria: Optional[str] = None
    estado: Optional[str] = "abierto"
    prioridad: Optional[str] = "normal"
    destinatario_id: Optional[int] = None         # Usuario destino (tiene cuenta)
    destinatario_docente_id: Optional[int] = None  # Docente destino (sin cuenta de usuario)
    filtro_audiencia: Optional[dict] = None
    estado_notificacion: Optional[dict] = None

class DestinatarioDocenteMinimo(BaseModel):
    id: int
    nombre: str
    apellido: str
    class Config:
        from_attributes = True

class DestinatarioUsuarioMinimo(BaseModel):
    id: int
    username: str
    rol: str
    class Config:
        from_attributes = True

class ComunicacionCreate(ComunicacionBase):
    mensaje_inicial: str
    destinatario_docente_id: Optional[int] = None  # Para tickets a docentes sin cuenta

class Comunicacion(ComunicacionBase):
    id: int
    remitente_id: int
    remitente: Optional[Usuario] = None
    destinatario: Optional[DestinatarioUsuarioMinimo] = None
    destinatario_docente: Optional[DestinatarioDocenteMinimo] = None
    created_at: datetime
    updated_at: datetime
    mensajes: List[ComunicacionMensaje] = []
    class Config:
        from_attributes = True

# Token
class Token(BaseModel):
    access_token: str
    token_type: str
    user: Usuario

class UsuarioDestinatario(BaseModel):
    id: Optional[int] = None  # El usuario_id (puede ser None si el docente no tiene cuenta)
    docente_id: Optional[int] = None  # docente_id directo (para docentes sin cuenta de usuario)
    nombre: str
    apellido: str
    rol: str
    email: Optional[str] = None
    entidad_id: Optional[int] = None # docente_id o estudiante_id
    info_extra: Optional[str] = None # "Carrera: X", "Materia: Y", etc.

class TokenData(BaseModel):
    username: Optional[str] = None
    rol: Optional[str] = None

# --- ESQUEMAS DE CALENDARIO ---

class CalendarioBase(BaseModel):
    institucion_id: Optional[int] = None
    departamento_id: Optional[int] = None
    carrera_id: Optional[int] = None
    nombre: str
    descripcion: Optional[str] = None

class CalendarioCreate(CalendarioBase):
    pass

class Calendario(CalendarioBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True

class CalendarioCategoriaBase(BaseModel):
    calendario_id: int
    nombre: str
    color: str

class CalendarioCategoriaCreate(CalendarioCategoriaBase):
    pass

class CalendarioCategoria(CalendarioCategoriaBase):
    id: int
    class Config:
        from_attributes = True

class CalendarioEventoBase(BaseModel):
    calendario_id: int
    departamento_id: Optional[int] = None
    carrera_id: Optional[int] = None
    fecha: str
    categoria_id: int
    descripcion: Optional[str] = None
    es_privado: Optional[bool] = False
    es_no_laborable: Optional[bool] = False

class CalendarioEventoCreate(CalendarioEventoBase):
    pass

class CalendarioEvento(CalendarioEventoBase):
    id: int
    categoria: Optional[CalendarioCategoria] = None
    departamento: Optional[Departamento] = None
    carrera: Optional[Carrera] = None
    class Config:
        from_attributes = True

class NotaAdhesivaBase(BaseModel):
    calendario_id: int
    texto: str
    color: Optional[str] = "#feff9c"

class NotaAdhesivaCreate(NotaAdhesivaBase):
    pass

class NotaAdhesiva(NotaAdhesivaBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True

# --- SCHEMAS PARA PLANIFICACION (PAD) ---

class PlanificacionBase(BaseModel):
    materia_id: int
    docente_id: Optional[int] = None
    comision_id: Optional[int] = None
    anio_lectivo: int
    jurisdiccion: Optional[str] = None
    instituto: Optional[str] = None
    carrera: Optional[str] = None
    anio_cursada: Optional[str] = None
    modalidad: Optional[str] = None
    carga_horaria: Optional[float] = None
    marco_curricular: Optional[str] = None
    correlatividades: Optional[str] = None
    normativa: Optional[str] = None
    unidades: Optional[str] = None
    fichas: Optional[str] = None
    cronograma: Optional[str] = None
    evaluacion: Optional[str] = None
    bibliografia: Optional[str] = None
    practica_profesionalizante: Optional[str] = None
    firmas: Optional[str] = None

class PlanificacionCreate(PlanificacionBase):
    pass

class Planificacion(PlanificacionBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Esquemas de Configuración de Turnos
class TurnoConfigBase(BaseModel):
    departamento_id: Optional[int] = None
    carrera_id: Optional[int] = None
    turno: str
    dia_semana: str
    hora_inicio: str
    desfase: int = 0
    secuencia: List[dict]

class TurnoConfigCreate(TurnoConfigBase):
    aplicar_a_toda_la_semana: bool = False

class TurnoConfig(TurnoConfigBase):
    id: int
    class Config:
        from_attributes = True

