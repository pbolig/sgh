from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Float
from sqlalchemy.orm import relationship
from database import Base
import datetime

class Usuario(Base):
    __tablename__ = "usuarios"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    password_hash = Column(String)
    rol = Column(String)
    activo = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

class Departamento(Base):
    __tablename__ = "departamentos"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, unique=True, index=True)
    codigo = Column(String, unique=True, index=True)
    descripcion = Column(Text, nullable=True)
    activo = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    materias = relationship("Materia", back_populates="departamento", cascade="all, delete-orphan")
    aulas = relationship("Aula", back_populates="departamento", cascade="all, delete-orphan")
    asignaciones = relationship("Asignacion", back_populates="departamento", cascade="all, delete-orphan")
    recreos_excluidos = relationship("RecreoExcluido", back_populates="departamento", cascade="all, delete-orphan")
    cargos_asignados = relationship("CargoAsignacion", back_populates="departamento", cascade="all, delete-orphan")

class Docente(Base):
    __tablename__ = "docentes"
    id = Column(Integer, primary_key=True, index=True)
    apellido = Column(String, index=True)
    nombre = Column(String, index=True)
    email = Column(String, nullable=True)
    telefono = Column(String, nullable=True)
    activo = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    cargos_asignados = relationship("CargoAsignacion", back_populates="docente")

class Materia(Base):
    __tablename__ = "materias"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, index=True)
    codigo = Column(String, unique=True, index=True)
    departamento_id = Column(Integer, ForeignKey("departamentos.id", ondelete="CASCADE"))
    activo = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    departamento = relationship("Departamento", back_populates="materias")
    comisiones = relationship("Comision", back_populates="materia")

class Aula(Base):
    __tablename__ = "aulas"
    id = Column(Integer, primary_key=True, index=True)
    departamento_id = Column(Integer, ForeignKey("departamentos.id", ondelete="CASCADE"))
    nombre = Column(String, index=True)
    capacidad = Column(Integer, nullable=True)
    activo = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    departamento = relationship("Departamento")

class Comision(Base):
    __tablename__ = "comisiones"
    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String, unique=True, index=True)
    materia_id = Column(Integer, ForeignKey("materias.id"))
    turno = Column(String) # 'mañana' o 'tarde'
    activo = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    materia = relationship("Materia", back_populates="comisiones")
    asignaciones = relationship("Asignacion", back_populates="comision")

class ModuloHorario(Base):
    __tablename__ = "modulos_horario"
    id = Column(Integer, primary_key=True, index=True)
    numero = Column(Integer)
    hora_inicio = Column(String)
    hora_fin = Column(String)
    turno = Column(String)
    activo = Column(Integer, default=1)

class Asignacion(Base):
    __tablename__ = "asignaciones"
    id = Column(Integer, primary_key=True, index=True)
    departamento_id = Column(Integer, ForeignKey("departamentos.id", ondelete="CASCADE"))
    aula_id = Column(Integer, ForeignKey("aulas.id"))
    modulo_id = Column(Integer, ForeignKey("modulos_horario.id"))
    dia_semana = Column(String)
    comision_id = Column(Integer, ForeignKey("comisiones.id"), nullable=True)
    docente_id = Column(Integer, ForeignKey("docentes.id"), nullable=True)
    observaciones = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    updated_by = Column(String, nullable=True)

    comision = relationship("Comision", back_populates="asignaciones")
    departamento = relationship("Departamento", back_populates="asignaciones")
    docente = relationship("Docente")
    modulo = relationship("ModuloHorario")

class RecreoExcluido(Base):
    __tablename__ = "recreos_excluidos"
    id = Column(Integer, primary_key=True, index=True)
    departamento_id = Column(Integer, ForeignKey("departamentos.id", ondelete="CASCADE"))
    dia_semana = Column(String) # 'lunes', 'martes', etc.
    modulo_id_anterior = Column(Integer, ForeignKey("modulos_horario.id")) # El módulo tras el cual viene el recreo

    departamento = relationship("Departamento")
    modulo_anterior = relationship("ModuloHorario")

class Cargo(Base):
    __tablename__ = "cargos"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, index=True)
    uso_multiple = Column(Text, nullable=True)
    activo = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    asignaciones = relationship("CargoAsignacion", back_populates="cargo")

class CargoAsignacion(Base):
    __tablename__ = "cargo_asignaciones"
    id = Column(Integer, primary_key=True, index=True)
    cargo_id = Column(Integer, ForeignKey("cargos.id"))
    docente_id = Column(Integer, ForeignKey("docentes.id"), nullable=True)
    departamento_id = Column(Integer, ForeignKey("departamentos.id", ondelete="CASCADE"))
    
    # Horas por día (60 min)
    horas_lunes = Column(Float, default=0)
    horas_martes = Column(Float, default=0)
    horas_miercoles = Column(Float, default=0)
    horas_jueves = Column(Float, default=0)
    horas_viernes = Column(Float, default=0)
    horas_sabado = Column(Float, default=0)
    horas_domingo = Column(Float, default=0)
    
    total_horas = Column(Float, default=0)
    
    # Horarios para Dashboard
    hora_inicio = Column(String, nullable=True) # ej: "08:00"
    hora_fin = Column(String, nullable=True)    # ej: "12:00"
    
    activo = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    cargo = relationship("Cargo", back_populates="asignaciones")
    departamento = relationship("Departamento")
    docente = relationship("Docente", back_populates="cargos_asignados")
    horarios = relationship("CargoHorario", back_populates="asignacion", cascade="all, delete-orphan")

class CargoHorario(Base):
    __tablename__ = "cargo_horarios"
    id = Column(Integer, primary_key=True, index=True)
    asignacion_id = Column(Integer, ForeignKey("cargo_asignaciones.id"))
    
    dia_semana = Column(String) # lunes, martes, ...
    hora_inicio = Column(String) # "08:00"
    hora_fin = Column(String)    # "09:00"
    horas = Column(Float, default=0) # Cantidad de horas (60 min) en este slot
    
    asignacion = relationship("CargoAsignacion", back_populates="horarios")

# --- MODELOS DE CALENDARIO ---

class Calendario(Base):
    __tablename__ = "calendarios"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, index=True)
    descripcion = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class CalendarioCategoria(Base):
    __tablename__ = "calendario_categorias"
    id = Column(Integer, primary_key=True, index=True)
    calendario_id = Column(Integer, ForeignKey("calendarios.id"))
    nombre = Column(String, index=True)
    color = Column(String)

class CalendarioEvento(Base):
    __tablename__ = "calendario_eventos"
    id = Column(Integer, primary_key=True, index=True)
    calendario_id = Column(Integer, ForeignKey("calendarios.id"))
    fecha = Column(String, index=True) # Formato YYYY-MM-DD
    categoria_id = Column(Integer, ForeignKey("calendario_categorias.id"))
    descripcion = Column(Text, nullable=True)

    categoria = relationship("CalendarioCategoria")

class NotaAdhesiva(Base):
    __tablename__ = "notas_adhesivas"
    id = Column(Integer, primary_key=True, index=True)
    calendario_id = Column(Integer, ForeignKey("calendarios.id"))
    texto = Column(Text)
    color = Column(String, default="#feff9c")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
