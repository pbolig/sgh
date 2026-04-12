from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Float, UniqueConstraint
from sqlalchemy.orm import relationship
from database import Base
import datetime

class Institucion(Base):
    __tablename__ = "instituciones"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, index=True)
    codigo = Column(String, unique=True, index=True)
    descripcion = Column(Text, nullable=True)
    logo_url = Column(String, nullable=True)
    activo = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

class Rol(Base):
    __tablename__ = "roles"
    __table_args__ = (UniqueConstraint('institucion_id', 'nombre', name='uix_rol_inst_nombre'),)
    id = Column(Integer, primary_key=True, index=True)
    institucion_id = Column(Integer, ForeignKey("instituciones.id"), nullable=True) # Temporalmente nullable para migración
    nombre = Column(String, index=True)
    descripcion = Column(Text, nullable=True)

    institucion = relationship("Institucion")
    permisos = relationship("Permiso", back_populates="rol", cascade="all, delete-orphan")

class Modulo(Base):
    __tablename__ = "modulos"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, unique=True, index=True) # editor, docentes, materias, etc.
    etiqueta = Column(String) # Nombre legible para la UI
    icono = Column(String, nullable=True) # Emoji o clase de icono

    permisos = relationship("Permiso", back_populates="modulo", cascade="all, delete-orphan")

class Permiso(Base):
    __tablename__ = "permisos"
    id = Column(Integer, primary_key=True, index=True)
    rol_id = Column(Integer, ForeignKey("roles.id", ondelete="CASCADE"))
    modulo_id = Column(Integer, ForeignKey("modulos.id", ondelete="CASCADE"))
    nivel = Column(String) # ninguno, lectura, edicion

    rol = relationship("Rol", back_populates="permisos")
    modulo = relationship("Modulo", back_populates="permisos")

class Usuario(Base):
    __tablename__ = "usuarios"
    id = Column(Integer, primary_key=True, index=True)
    institucion_id = Column(Integer, ForeignKey("instituciones.id"), nullable=True)
    rol_id = Column(Integer, ForeignKey("roles.id"), nullable=True)
    username = Column(String, unique=True, index=True)
    password_hash = Column(String)
    rol = Column(String) # Legacy, mantener por ahora para compatibilidad en JWT
    activo = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    institucion = relationship("Institucion")
    rol_obj = relationship("Rol")

class Departamento(Base):
    __tablename__ = "departamentos"
    id = Column(Integer, primary_key=True, index=True)
    institucion_id = Column(Integer, ForeignKey("instituciones.id", ondelete="CASCADE"), nullable=True)
    nombre = Column(String, index=True)
    codigo = Column(String, unique=True, index=True)
    descripcion = Column(Text, nullable=True)
    activo = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    materias = relationship("Materia", back_populates="departamento", cascade="all, delete-orphan")
    aulas = relationship("Aula", secondary="aula_departamento", back_populates="departamentos")
    asignaciones = relationship("Asignacion", back_populates="departamento", cascade="all, delete-orphan")
    recreos_excluidos = relationship("RecreoExcluido", back_populates="departamento", cascade="all, delete-orphan")
    cargos_asignados = relationship("CargoAsignacion", back_populates="departamento", cascade="all, delete-orphan")

# Tablas de Asociación para Docentes (Muchos a Muchos)
class DocenteInstitucion(Base):
    __tablename__ = "docente_institucion"
    docente_id = Column(Integer, ForeignKey("docentes.id", ondelete="CASCADE"), primary_key=True)
    institucion_id = Column(Integer, ForeignKey("instituciones.id", ondelete="CASCADE"), primary_key=True)

class DocenteDepartamento(Base):
    __tablename__ = "docente_departamento"
    docente_id = Column(Integer, ForeignKey("docentes.id", ondelete="CASCADE"), primary_key=True)
    departamento_id = Column(Integer, ForeignKey("departamentos.id", ondelete="CASCADE"), primary_key=True)

class AulaDepartamento(Base):
    __tablename__ = "aula_departamento"
    aula_id = Column(Integer, ForeignKey("aulas.id", ondelete="CASCADE"), primary_key=True)
    departamento_id = Column(Integer, ForeignKey("departamentos.id", ondelete="CASCADE"), primary_key=True)

class Docente(Base):
    __tablename__ = "docentes"
    id = Column(Integer, primary_key=True, index=True)
    institucion_id = Column(Integer, ForeignKey("instituciones.id", ondelete="CASCADE"), nullable=True) # Legacy, migrar a M2M
    apellido = Column(String, index=True)
    nombre = Column(String, index=True)
    email = Column(String, nullable=True)
    telefono = Column(String, nullable=True)
    activo = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    instituciones = relationship("Institucion", secondary="docente_institucion")
    departamentos = relationship("Departamento", secondary="docente_departamento")
    cargos_asignados = relationship("CargoAsignacion", back_populates="docente")

class Materia(Base):
    __tablename__ = "materias"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, index=True)
    codigo = Column(String, index=True)
    codigo_interno = Column(String, nullable=True, index=True)
    departamento_id = Column(Integer, ForeignKey("departamentos.id", ondelete="CASCADE"))
    anio = Column(Integer, default=1) # Año/Nivel de la carrera
    carga_horaria_modulos = Column(Integer, default=0) # Módulos de 40 min
    correlativas = Column(Text, nullable=True) # JSON array de códigos internos
    activo = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    departamento = relationship("Departamento", back_populates="materias")
    comisiones = relationship("Comision", back_populates="materia")

class Aula(Base):
    __tablename__ = "aulas"
    id = Column(Integer, primary_key=True, index=True)
    institucion_id = Column(Integer, ForeignKey("instituciones.id", ondelete="CASCADE"), nullable=True)
    nombre = Column(String, index=True)
    capacidad = Column(Integer, nullable=True)
    activo = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    institucion = relationship("Institucion")
    departamentos = relationship("Departamento", secondary="aula_departamento", back_populates="aulas")

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
    cargo_id = Column(Integer, ForeignKey("cargos.id"), nullable=True)
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
    departamento_id = Column(Integer, ForeignKey("departamentos.id", ondelete="CASCADE"), nullable=True)
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
    departamento_id = Column(Integer, ForeignKey("departamentos.id", ondelete="CASCADE"), nullable=True) # NULL = Institucional
    fecha = Column(String, index=True) # Formato YYYY-MM-DD
    categoria_id = Column(Integer, ForeignKey("calendario_categorias.id"))
    descripcion = Column(Text, nullable=True)
    es_privado = Column(Boolean, default=False)
    es_no_laborable = Column(Boolean, default=False)

    categoria = relationship("CalendarioCategoria")
    departamento = relationship("Departamento")

class NotaAdhesiva(Base):
    __tablename__ = "notas_adhesivas"
    id = Column(Integer, primary_key=True, index=True)
    calendario_id = Column(Integer, ForeignKey("calendarios.id"))
    texto = Column(Text)
    color = Column(String, default="#feff9c")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Planificacion(Base):
    __tablename__ = "planificaciones"
    id = Column(Integer, primary_key=True, index=True)
    materia_id = Column(Integer, ForeignKey("materias.id", ondelete="CASCADE"))
    docente_id = Column(Integer, ForeignKey("docentes.id"), nullable=True)
    comision_id = Column(Integer, ForeignKey("comisiones.id"), nullable=True)
    anio_lectivo = Column(Integer, index=True)
    
    # Datos de encabezado (planos para fácil búsqueda)
    jurisdiccion = Column(String, nullable=True)
    instituto = Column(String, nullable=True)
    carrera = Column(String, nullable=True)
    anio_cursada = Column(String, nullable=True)
    modalidad = Column(String, nullable=True)
    carga_horaria = Column(Float, nullable=True)
    
    # Bloques de contenido (JSON)
    marco_curricular = Column(Text, nullable=True) # JSON: objgen, competencias, perfil, metodologia
    correlatividades = Column(Text, nullable=True) # JSON: cursar, final, simult, plan_url
    normativa = Column(Text, nullable=True)      # JSON: ram, aprob
    unidades = Column(Text, nullable=True)       # JSON array: [{unidad, titulo, duracion, ...}]
    fichas = Column(Text, nullable=True)         # JSON array: [{unidad, titulo, ...}]
    cronograma = Column(Text, nullable=True)     # JSON array: [{fecha, tema, ...}]
    evaluacion = Column(Text, nullable=True)     # JSON: criterios, instrumentos, ponderaciones
    bibliografia = Column(Text, nullable=True)   # JSON: ob, comp
    practica_profesionalizante = Column(Text, nullable=True) # JSON full block
    firmas = Column(Text, nullable=True)         # JSON: docente, coord

    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    materia = relationship("Materia")
    docente = relationship("Docente")
    comision = relationship("Comision")
