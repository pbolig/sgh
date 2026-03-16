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
