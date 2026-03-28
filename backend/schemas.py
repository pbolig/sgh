from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

# Esquemas de Usuario
class UsuarioBase(BaseModel):
    username: str
    rol: str
    activo: int

class UsuarioCreate(UsuarioBase):
    password: str

class Usuario(UsuarioBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True

# Esquemas de Departamento
class DepartamentoBase(BaseModel):
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

# Esquemas de Docente
class DocenteBase(BaseModel):
    apellido: str
    nombre: Optional[str] = None
    email: Optional[str] = None
    telefono: Optional[str] = None
    activo: Optional[int] = 1

class DocenteCreate(DocenteBase):
    pass

class DocenteUpdate(BaseModel):
    apellido: Optional[str] = None
    nombre: Optional[str] = None
    email: Optional[str] = None
    telefono: Optional[str] = None
    activo: Optional[int] = None

class Docente(DocenteBase):
    id: int
    created_at: datetime
    updated_at: datetime
    class Config:
        from_attributes = True

# Esquemas de Materia
class MateriaBase(BaseModel):
    nombre: str
    codigo: str
    departamento_id: int
    activo: Optional[int] = 1

class MateriaCreate(MateriaBase):
    pass

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

class CargoHorarioCreate(CargoHorarioBase):
    pass

class CargoHorario(CargoHorarioBase):
    id: int
    asignacion_id: int
    class Config:
        from_attributes = True

# Esquemas de CargoAsignacion
class CargoAsignacionBase(BaseModel):
    cargo_id: int
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
    horarios: List[CargoHorario] = []

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

class CargoAsignacion(CargoAsignacionBase):
    id: int
    created_at: datetime
    updated_at: datetime
    class Config:
        from_attributes = True

# Esquemas de Aula
class AulaBase(BaseModel):
    departamento_id: int
    nombre: str
    capacidad: Optional[int] = None
    activo: Optional[int] = 1

class AulaCreate(AulaBase):
    pass

class AulaUpdate(BaseModel):
    departamento_id: Optional[int] = None
    nombre: Optional[str] = None
    capacidad: Optional[int] = None
    activo: Optional[int] = None

class Aula(AulaBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True

# Esquemas de Comision
class ComisionBase(BaseModel):
    codigo: str
    materia_id: int
    turno: str
    activo: Optional[int] = 1

class ComisionCreate(ComisionBase):
    pass

class Comision(ComisionBase):
    id: int
    created_at: datetime
    updated_at: datetime
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

# Esquemas de Asignacion
class AsignacionBase(BaseModel):
    departamento_id: int
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
    class Config:
        from_attributes = True

# Esquemas de RecreoExcluido
class RecreoExcluidoBase(BaseModel):
    departamento_id: int
    dia_semana: str
    modulo_id_anterior: int

class RecreoExcluidoCreate(RecreoExcluidoBase):
    pass

class RecreoExcluido(RecreoExcluidoBase):
    id: int
    class Config:
        from_attributes = True

# Token
class Token(BaseModel):
    access_token: str
    token_type: str
    user: Usuario

class TokenData(BaseModel):
    username: Optional[str] = None
    rol: Optional[str] = None

# --- ESQUEMAS DE CALENDARIO ---

class CalendarioBase(BaseModel):
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
    fecha: str
    categoria_id: int
    descripcion: Optional[str] = None

class CalendarioEventoCreate(CalendarioEventoBase):
    pass

class CalendarioEvento(CalendarioEventoBase):
    id: int
    categoria: Optional[CalendarioCategoria] = None
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
