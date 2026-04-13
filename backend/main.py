from fastapi import FastAPI, Depends, HTTPException, status, Form
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import IntegrityError
from typing import List, Optional
import datetime

from database import engine, get_db, Base
import models
import schemas
import auth_utils

# Crear tablas (en desarrollo Docker se hace vía seed o al iniciar)
models.Base.metadata.create_all(bind=engine)

from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt

app = FastAPI(title="SGH Backend")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/login")

# --- DEPENDENCIAS DE SEGURIDAD ---

from fastapi import Request

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/login")

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudo validar el token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise credentials_exception
        
    try:
        payload = jwt.decode(token, auth_utils.SECRET_KEY, algorithms=[auth_utils.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    except Exception:
        raise credentials_exception
        
    user = db.query(models.Usuario).filter(models.Usuario.username == username).first()
    if user is None:
        raise credentials_exception
    return user

def check_permission(modulo: str, nivel_requerido: str):
    async def permission_dependency(user: models.Usuario = Depends(get_current_user), db: Session = Depends(get_db)):
        # El rol 'directivo' siempre tiene acceso total
        if user.rol == "directivo" or user.rol == "admin":
            return True
            
        # Buscar permiso específico para el rol del usuario
        permiso = db.query(models.Permiso).join(models.Modulo).filter(
            models.Permiso.rol_id == user.rol_id,
            models.Modulo.nombre == modulo
        ).first()
        
        if not permiso:
            raise HTTPException(status_code=403, detail=f"No tiene permisos para el módulo {modulo}")
            
        # Niveles: ninguno < lectura < edicion
        niveles = {"ninguno": 0, "lectura": 1, "edicion": 2}
        if niveles.get(permiso.nivel, 0) < niveles.get(nivel_requerido, 0):
            raise HTTPException(status_code=403, detail=f"Nivel de acceso insuficiente para {modulo}")
            
        return True
    return Depends(permission_dependency)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "Horarios Backend Running", "database": "PostgreSQL"}

# --- AUTENTICACIÓN ---

@app.post("/login", response_model=schemas.Token)
async def login(
    username: str = Form(...), 
    password: str = Form(...), 
    db: Session = Depends(get_db)
):
    user = db.query(models.Usuario).filter(models.Usuario.username == username).first()
    
    if not user or not auth_utils.verify_password(password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.activo:
        raise HTTPException(status_code=403, detail="Cuenta desactivada")

    access_token_expires = datetime.timedelta(minutes=auth_utils.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth_utils.create_access_token(
        data={"sub": user.username, "rol": user.rol},
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user": user
    }

# --- ROLES Y PERMISOS (RBAC) ---

@app.get("/roles", response_model=List[schemas.Rol])
async def get_roles(institucion_id: Optional[int] = None, db: Session = Depends(get_db), current_user: models.Usuario = Depends(get_current_user)):
    query = db.query(models.Rol)
    if institucion_id:
        query = query.filter(models.Rol.institucion_id == institucion_id)
    return query.all()

@app.post("/roles", response_model=schemas.Rol)
async def create_rol(rol: schemas.RolCreate, db: Session = Depends(get_db), current_user: models.Usuario = Depends(get_current_user)):
    if current_user.rol not in ["admin", "directivo"]:
        raise HTTPException(status_code=403, detail="No tiene permisos")
    db_rol = models.Rol(**rol.dict())
    db.add(db_rol)
    db.commit()
    db.refresh(db_rol)
    return db_rol

@app.get("/modulos-sistema", response_model=List[schemas.Modulo])
async def get_modulos_sistema(db: Session = Depends(get_db), current_user: models.Usuario = Depends(get_current_user)):
    return db.query(models.Modulo).all()

@app.get("/permisos", response_model=List[schemas.Permiso])
async def get_all_permisos(rol_id: Optional[int] = None, db: Session = Depends(get_db), current_user: models.Usuario = Depends(get_current_user)):
    if current_user.rol not in ["admin", "directivo"]:
         raise HTTPException(status_code=403, detail="No tiene permisos")
    query = db.query(models.Permiso)
    if rol_id:
        query = query.filter(models.Permiso.rol_id == rol_id)
    return query.all()

@app.post("/permisos")
async def save_permisos(permisos: List[schemas.PermisoCreate], db: Session = Depends(get_db), current_user: models.Usuario = Depends(get_current_user)):
    if current_user.rol not in ["admin", "directivo"]:
        raise HTTPException(status_code=403, detail="No tiene permisos")
        
    for p in permisos:
        existing = db.query(models.Permiso).filter(
            models.Permiso.rol_id == p.rol_id,
            models.Permiso.modulo_id == p.modulo_id
        ).first()
        if existing:
            existing.nivel = p.nivel
        else:
            db.add(models.Permiso(**p.dict()))
            
    db.commit()
    return {"message": "Permisos actualizados correctamente"}

@app.get("/mis-permisos", response_model=List[schemas.Permiso])
async def get_mis_permisos(user: models.Usuario = Depends(get_current_user), db: Session = Depends(get_db)):
    # Si es admin o directivo, devolvemos permiso total para todos los módulos
    if user.rol in ["admin", "directivo"]:
        modulos = db.query(models.Modulo).all()
        # Devolver diccionarios con ID para evitar ValidationError en Pydantic
        return [
            {
                "id": m.id, 
                "rol_id": user.rol_id or 0, 
                "modulo_id": m.id, 
                "nivel": "edicion", 
                "modulo": m
            }
            for m in modulos
        ]
    
    return db.query(models.Permiso).filter(models.Permiso.rol_id == user.rol_id).all()

# --- GESTIÓN DE USUARIOS ---

@app.get("/usuarios", response_model=List[schemas.Usuario])
async def get_usuarios(db: Session = Depends(get_db), current_user: models.Usuario = Depends(get_current_user)):
    if current_user.rol not in ["admin", "directivo"]:
        raise HTTPException(status_code=403, detail="No tiene permisos")
    return db.query(models.Usuario).all()

@app.post("/usuarios", response_model=schemas.Usuario)
async def create_usuario(user: schemas.UsuarioCreate, db: Session = Depends(get_db), current_user: models.Usuario = Depends(get_current_user)):
    if current_user.rol not in ["admin", "directivo"]:
        raise HTTPException(status_code=403, detail="No tiene permisos")
    
    db_user = db.query(models.Usuario).filter(models.Usuario.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="El nombre de usuario ya existe")
    
    # Si se asigna un rol_id, asegurar que el campo 'rol' (string) esté sincronizado
    rol_str = user.rol
    if user.rol_id:
        rol_obj = db.query(models.Rol).filter(models.Rol.id == user.rol_id).first()
        if rol_obj:
            rol_str = rol_obj.nombre
            
    new_user = models.Usuario(
        username=user.username,
        password_hash=auth_utils.get_password_hash(user.password),
        rol=rol_str,
        rol_id=user.rol_id,
        activo=user.activo,
        institucion_id=user.institucion_id
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.put("/usuarios/{id}", response_model=schemas.Usuario)
async def update_usuario(id: int, user_update: schemas.UsuarioUpdate, db: Session = Depends(get_db), current_user: models.Usuario = Depends(get_current_user)):
    if current_user.rol not in ["admin", "directivo"]:
        raise HTTPException(status_code=403, detail="No tiene permisos")
    
    db_user = db.query(models.Usuario).filter(models.Usuario.id == id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    update_data = user_update.dict(exclude_unset=True)
    
    if "password" in update_data:
        db_user.password_hash = auth_utils.get_password_hash(update_data.pop("password"))
    
    # Sincronizar rol (string) si se actualiza rol_id
    if "rol_id" in update_data:
        rol_obj = db.query(models.Rol).filter(models.Rol.id == update_data["rol_id"]).first()
        if rol_obj:
            db_user.rol = rol_obj.nombre
            
    for key, value in update_data.items():
        setattr(db_user, key, value)
    
    db.commit()
    db.refresh(db_user)
    return db_user

@app.delete("/usuarios/{id}")
async def delete_usuario(id: int, db: Session = Depends(get_db), current_user: models.Usuario = Depends(get_current_user)):
    if current_user.rol not in ["admin", "directivo"]:
        raise HTTPException(status_code=403, detail="No tiene permisos")
    
    if id == current_user.id:
        raise HTTPException(status_code=400, detail="No puede eliminarse a sí mismo")
        
    db_user = db.query(models.Usuario).filter(models.Usuario.id == id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    db.delete(db_user)
    db.commit()
    return {"message": "Usuario eliminado correctamente"}

# --- INSTITUCIONES ---

@app.get("/instituciones", response_model=List[schemas.Institucion])
async def get_instituciones(db: Session = Depends(get_db)):
    return db.query(models.Institucion).all()

@app.post("/instituciones", response_model=schemas.Institucion)
async def create_institucion(inst: schemas.InstitucionCreate, db: Session = Depends(get_db)):
    db_inst = db.query(models.Institucion).filter(models.Institucion.codigo == inst.codigo).first()
    if db_inst:
        raise HTTPException(status_code=400, detail="El código de institución ya existe")
    
    new_inst = models.Institucion(**inst.dict())
    db.add(new_inst)
    db.commit()
    db.refresh(new_inst)
    return new_inst

@app.put("/instituciones/{id}", response_model=schemas.Institucion)
async def update_institucion(id: int, inst: schemas.InstitucionUpdate, db: Session = Depends(get_db)):
    db_inst = db.query(models.Institucion).filter(models.Institucion.id == id).first()
    if not db_inst:
        raise HTTPException(status_code=404, detail="Institución no encontrada")
    
    for key, value in inst.dict(exclude_unset=True).items():
        setattr(db_inst, key, value)
    
    db.commit()
    db.refresh(db_inst)
    return db_inst

@app.delete("/instituciones/{id}")
async def delete_institucion(id: int, db: Session = Depends(get_db)):
    db_inst = db.query(models.Institucion).filter(models.Institucion.id == id).first()
    if not db_inst:
        raise HTTPException(status_code=404, detail="Institución no encontrada")
    
    db.delete(db_inst)
    db.commit()
    return {"message": "Institución eliminada correctamente"}

# --- DEPARTAMENTOS ---

@app.get("/departamentos", response_model=List[schemas.Departamento])
async def get_departamentos(institucion_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(models.Departamento)
    if institucion_id:
        query = query.filter(models.Departamento.institucion_id == institucion_id)
    return query.all()

@app.post("/departamentos", response_model=schemas.Departamento)
async def create_departamento(depto: schemas.DepartamentoCreate, db: Session = Depends(get_db)):
    db_depto = db.query(models.Departamento).filter(models.Departamento.codigo == depto.codigo).first()
    if db_depto:
        raise HTTPException(status_code=400, detail="El código de departamento ya existe")
    
    new_depto = models.Departamento(**depto.dict())
    db.add(new_depto)
    db.commit()
    db.refresh(new_depto)
    return new_depto

@app.put("/departamentos/{id}", response_model=schemas.Departamento)
async def update_departamento(id: int, depto: schemas.DepartamentoUpdate, db: Session = Depends(get_db)):
    db_depto = db.query(models.Departamento).filter(models.Departamento.id == id).first()
    if not db_depto:
        raise HTTPException(status_code=404, detail="Departamento no encontrado")
    
    for key, value in depto.dict(exclude_unset=True).items():
        setattr(db_depto, key, value)
    
    db.commit()
    db.refresh(db_depto)
    return db_depto

@app.delete("/departamentos/{id}")
async def delete_departamento(id: int, db: Session = Depends(get_db)):
    db_depto = db.query(models.Departamento).filter(models.Departamento.id == id).first()
    if not db_depto:
        raise HTTPException(status_code=404, detail="Departamento no encontrado")
    
    db.delete(db_depto)
    db.commit()
    return {"message": "Departamento eliminado correctamente"}

# --- DOCENTES ---

@app.get("/docentes", response_model=List[schemas.Docente])
async def get_docentes(institucion_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(models.Docente)
    if institucion_id:
        # Filtrar buscando en la tabla de asociación
        query = query.join(models.DocenteInstitucion).filter(models.DocenteInstitucion.institucion_id == institucion_id)
    return query.all()

@app.post("/docentes", response_model=schemas.Docente)
async def create_docente(docente: schemas.DocenteCreate, db: Session = Depends(get_db)):
    data = docente.dict()
    inst_ids = data.pop("institucion_ids", [])
    dept_ids = data.pop("departamento_ids", [])
    
    new_docente = models.Docente(**data)
    
    if inst_ids:
        new_docente.instituciones = db.query(models.Institucion).filter(models.Institucion.id.in_(inst_ids)).all()
    if dept_ids:
        new_docente.departamentos = db.query(models.Departamento).filter(models.Departamento.id.in_(dept_ids)).all()
        
    db.add(new_docente)
    db.commit()
    db.refresh(new_docente)
    return new_docente

@app.put("/docentes/{id}", response_model=schemas.Docente)
async def update_docente(id: int, docente: schemas.DocenteUpdate, db: Session = Depends(get_db)):
    db_docente = db.query(models.Docente).filter(models.Docente.id == id).first()
    if not db_docente:
        raise HTTPException(status_code=404, detail="Docente no encontrado")
    
    data = docente.dict(exclude_unset=True)
    inst_ids = data.pop("institucion_ids", None)
    dept_ids = data.pop("departamento_ids", None)
    
    for key, value in data.items():
        setattr(db_docente, key, value)
        
    if inst_ids is not None:
        db_docente.instituciones = db.query(models.Institucion).filter(models.Institucion.id.in_(inst_ids)).all()
    if dept_ids is not None:
        db_docente.departamentos = db.query(models.Departamento).filter(models.Departamento.id.in_(dept_ids)).all()
    
    db.commit()
    db.refresh(db_docente)
    return db_docente

@app.delete("/docentes/{id}")
async def delete_docente(id: int, db: Session = Depends(get_db)):
    db_docente = db.query(models.Docente).filter(models.Docente.id == id).first()
    if not db_docente:
        raise HTTPException(status_code=404, detail="Docente no encontrado")
    
    db.delete(db_docente)
    db.commit()
    return {"message": "Docente eliminado correctamente"}

# --- MATERIAS ---

@app.get("/materias", response_model=List[schemas.Materia])
async def get_materias(institucion_id: Optional[int] = None, departamento_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(models.Materia)
    if institucion_id:
        query = query.join(models.Departamento).filter(models.Departamento.institucion_id == institucion_id)
    if departamento_id:
        query = query.filter(models.Materia.departamento_id == departamento_id)
    return query.all()

@app.post("/materias", response_model=schemas.Materia)
async def create_materia(materia: schemas.MateriaCreate, db: Session = Depends(get_db)):
    db_materia = db.query(models.Materia).filter(models.Materia.codigo == materia.codigo).first()
    if db_materia:
        raise HTTPException(status_code=400, detail="El código de materia ya existe")
    
    new_materia = models.Materia(**materia.dict())
    db.add(new_materia)
    db.commit()
    db.refresh(new_materia)
    return new_materia

@app.put("/materias/{id}", response_model=schemas.Materia)
async def update_materia(id: int, materia: schemas.MateriaUpdate, db: Session = Depends(get_db)):
    db_materia = db.query(models.Materia).filter(models.Materia.id == id).first()
    if not db_materia:
        raise HTTPException(status_code=404, detail="Materia no encontrada")
    
    for key, value in materia.dict(exclude_unset=True).items():
        setattr(db_materia, key, value)
    
    db.commit()
    db.refresh(db_materia)
    return db_materia

@app.delete("/materias/{id}")
async def delete_materia(id: int, db: Session = Depends(get_db)):
    db_materia = db.query(models.Materia).filter(models.Materia.id == id).first()
    if not db_materia:
        raise HTTPException(status_code=404, detail="Materia no encontrada")
    
    db.delete(db_materia)
    db.commit()
    return {"message": "Materia eliminada correctamente"}

# --- AULAS ---

@app.get("/aulas")
async def get_aulas(institucion_id: Optional[int] = None, departamento_id: Optional[int] = None, db: Session = Depends(get_db)):
    try:
        query = db.query(models.Aula)
        if institucion_id:
            query = query.filter(models.Aula.institucion_id == institucion_id)
        if departamento_id:
            query = query.join(models.Aula.departamentos).filter(models.Departamento.id == departamento_id)
        
        aulas = query.all()
        result = []
        for a in aulas:
            # Población manual de departamento_ids para el frontend
            dept_ids = [d.id for d in a.departamentos]
            result.append({
                "id": a.id,
                "institucion_id": a.institucion_id,
                "nombre": a.nombre,
                "capacidad": a.capacidad,
                "activo": a.activo,
                "created_at": a.created_at.isoformat() if a.created_at else None,
                "departamento_ids": dept_ids
            })
        return result
    except Exception as e:
        print(f"Error en GET /aulas: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/aulas", response_model=schemas.Aula)
async def create_aula(aula: schemas.AulaCreate, db: Session = Depends(get_db)):
    data = aula.dict()
    dept_ids = data.pop("departamento_ids", [])
    
    new_aula = models.Aula(**data)
    if dept_ids:
        new_aula.departamentos = db.query(models.Departamento).filter(models.Departamento.id.in_(dept_ids)).all()
        
    db.add(new_aula)
    db.commit()
    db.refresh(new_aula)
    return new_aula

@app.put("/aulas/{id}", response_model=schemas.Aula)
async def update_aula(id: int, aula: schemas.AulaUpdate, db: Session = Depends(get_db)):
    db_aula = db.query(models.Aula).filter(models.Aula.id == id).first()
    if not db_aula:
        raise HTTPException(status_code=404, detail="Aula no encontrada")
    
    data = aula.dict(exclude_unset=True)
    dept_ids = data.pop("departamento_ids", None)
    
    for key, value in data.items():
        setattr(db_aula, key, value)
    
    if dept_ids is not None:
        db_aula.departamentos = db.query(models.Departamento).filter(models.Departamento.id.in_(dept_ids)).all()
    
    db.commit()
    db.refresh(db_aula)
    return db_aula

@app.delete("/aulas/{id}")
async def delete_aula(id: int, db: Session = Depends(get_db)):
    db_aula = db.query(models.Aula).filter(models.Aula.id == id).first()
    if not db_aula:
        raise HTTPException(status_code=404, detail="Aula no encontrada")
    
    db.delete(db_aula)
    db.commit()
    return {"message": "Aula eliminada correctamente"}

# --- COMISIONES ---

@app.get("/comisiones")
async def get_comisiones(institucion_id: Optional[int] = None, departamento_id: Optional[int] = None, anio: Optional[int] = None, db: Session = Depends(get_db)):
    try:
        # Nota: Las comisiones están vinculadas a materias, y las materias a departamentos.
        query = db.query(models.Comision)
        
        if institucion_id or departamento_id or anio:
            query = query.join(models.Materia)
            
        if institucion_id:
            query = query.join(models.Materia.departamento).filter(models.Departamento.institucion_id == institucion_id)
        if departamento_id:
            query = query.filter(models.Materia.departamento_id == departamento_id)
        if anio:
            query = query.filter(models.Materia.anio == anio)
            
        comisiones = query.all()
        
        # Serialización manual ultra-resiliente para evitar Error 500 de Pydantic
        result = []
        for c in comisiones:
            try:
                result.append({
                    "id": c.id,
                    "codigo": str(c.codigo) if c.codigo else "",
                    "materia_id": c.materia_id,
                    "turno": str(c.turno) if c.turno else "",
                    "activo": int(c.activo) if c.activo is not None else 1,
                    "created_at": c.created_at.isoformat() if c.created_at else None,
                    "updated_at": c.updated_at.isoformat() if c.updated_at else None
                })
            except Exception as e:
                print(f"Error serializando comisión {c.id}: {e}")
                continue # Si una falla, no bloqueamos el resto
        
        return result
    except Exception as e:
        print(f"ERROR EN GET /comisiones: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")

@app.post("/comisiones")
async def create_comision(comision: schemas.ComisionCreate, db: Session = Depends(get_db)):
    try:
        new_comision = models.Comision(**comision.dict())
        db.add(new_comision)
        db.commit()
        db.refresh(new_comision)
        
        return {
            "id": new_comision.id,
            "codigo": new_comision.codigo,
            "materia_id": new_comision.materia_id,
            "turno": new_comision.turno,
            "activo": new_comision.activo,
            "created_at": new_comision.created_at.isoformat() if new_comision.created_at else None,
            "updated_at": new_comision.updated_at.isoformat() if new_comision.updated_at else None
        }
    except IntegrityError as e:
        db.rollback()
        error_msg = str(e.orig)
        if "ix_comisiones_codigo" in error_msg or "duplicate key" in error_msg:
            raise HTTPException(status_code=400, detail=f"El código de comisión '{comision.codigo}' ya está en uso. Por favor, elige otro.")
        raise HTTPException(status_code=400, detail=f"Error de integridad en la base de datos: {error_msg}")
    except Exception as e:
        db.rollback()
        print(f"ERROR EN POST /comisiones: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error en creación: {str(e)}")

@app.put("/comisiones/{id}")
async def update_comision(id: int, comision: schemas.ComisionBase, db: Session = Depends(get_db)):
    try:
        db_comision = db.query(models.Comision).filter(models.Comision.id == id).first()
        if not db_comision:
            raise HTTPException(status_code=404, detail="Comisión no encontrada")
        for key, value in comision.dict(exclude_unset=True).items():
            setattr(db_comision, key, value)
        db.commit()
        db.refresh(db_comision)
        
        return {
            "id": db_comision.id,
            "codigo": db_comision.codigo,
            "materia_id": db_comision.materia_id,
            "turno": db_comision.turno,
            "activo": db_comision.activo,
            "created_at": db_comision.created_at.isoformat() if db_comision.created_at else None,
            "updated_at": db_comision.updated_at.isoformat() if db_comision.updated_at else None
        }
    except IntegrityError as e:
        db.rollback()
        error_msg = str(e.orig)
        if "ix_comisiones_codigo" in error_msg or "duplicate key" in error_msg:
            raise HTTPException(status_code=400, detail=f"El código de comisión '{comision.codigo}' ya está en uso. Por favor, elige otro.")
        raise HTTPException(status_code=400, detail=f"Error de integridad en la base de datos: {error_msg}")
    except Exception as e:
        db.rollback()
        print(f"ERROR EN PUT /comisiones: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error en actualización: {str(e)}")

@app.delete("/comisiones/{id}")
async def delete_comision(id: int, db: Session = Depends(get_db)):
    db_comision = db.query(models.Comision).filter(models.Comision.id == id).first()
    if not db_comision:
        raise HTTPException(status_code=404, detail="Comisión no encontrada")
    db.delete(db_comision)
    db.commit()
    return {"message": "Comisión eliminada correctamente"}

# --- CARGOS ---

@app.get("/cargos", response_model=List[schemas.Cargo])
async def get_cargos(db: Session = Depends(get_db)):
    return db.query(models.Cargo).all()

@app.post("/cargos", response_model=schemas.Cargo)
async def create_cargo(cargo: schemas.CargoCreate, db: Session = Depends(get_db)):
    new_cargo = models.Cargo(**cargo.dict())
    db.add(new_cargo)
    db.commit()
    db.refresh(new_cargo)
    return new_cargo

@app.put("/cargos/{id}", response_model=schemas.Cargo)
async def update_cargo(id: int, cargo: schemas.CargoUpdate, db: Session = Depends(get_db)):
    db_cargo = db.query(models.Cargo).filter(models.Cargo.id == id).first()
    if not db_cargo:
        raise HTTPException(status_code=404, detail="Cargo no encontrado")
    
    for key, value in cargo.dict(exclude_unset=True).items():
        setattr(db_cargo, key, value)
    
    db.commit()
    db.refresh(db_cargo)
    return db_cargo

@app.delete("/cargos/{id}")
async def delete_cargo(id: int, db: Session = Depends(get_db)):
    db_cargo = db.query(models.Cargo).filter(models.Cargo.id == id).first()
    if not db_cargo:
        raise HTTPException(status_code=404, detail="Cargo no encontrado")
    
    db.delete(db_cargo)
    db.commit()
    return {"message": "Cargo eliminado correctamente"}

# --- CARGO ASIGNACIONES ---

@app.get("/cargo-asignaciones", response_model=List[schemas.CargoAsignacion])
async def get_cargo_asignaciones(depto_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(models.CargoAsignacion).options(
        joinedload(models.CargoAsignacion.cargo),
        joinedload(models.CargoAsignacion.horarios).joinedload(models.CargoHorario.comision).joinedload(models.Comision.materia),
        joinedload(models.CargoAsignacion.horarios).joinedload(models.CargoHorario.modulo)
    )
    if depto_id:
        query = query.filter(models.CargoAsignacion.departamento_id == depto_id)
    
    results = query.all()
    # Inyectar reemplazos activos
    for res in results:
        if res.docente_id:
            reem = get_active_replacement(db, res.docente_id, cargo_id=res.id)
            if reem:
                # Añadir atributo dinámico para el esquema (Pydantic lo ignorará si no está definido, 
                # pero lo usaremos en la serialización manual si es necesario o actualizando el esquema)
                res.reemplazo_activo = reem
                
    return results

@app.post("/cargo-asignaciones", response_model=schemas.CargoAsignacion)
async def create_cargo_asignacion(asig: schemas.CargoAsignacionCreate, db: Session = Depends(get_db)):
    data = asig.dict()
    horarios_data = data.pop('horarios', [])
    
    # Calcular total automáticamente desde los slots si existen, sino usar las columnas viejas
    if horarios_data:
        data['total_horas'] = sum([h.get('horas', 0) for h in horarios_data])
    else:
        data['total_horas'] = sum([
            data.get(f'horas_{d}', 0) for d in ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo']
        ])

    new_asig = models.CargoAsignacion(**data)
    db.add(new_asig)
    db.commit()
    db.refresh(new_asig)
    
    # Crear los slots horarios con los campos unificados
    for h_data in horarios_data:
        comision_id = h_data.pop('comision_id', None)
        modulo_id = h_data.pop('modulo_id', None)
        observaciones = h_data.pop('observaciones', None)
        
        db_h = models.CargoHorario(
            **h_data, 
            asignacion_id=new_asig.id,
            comision_id=comision_id,
            modulo_id=modulo_id,
            observaciones=observaciones
        )
        db.add(db_h)
    
    db.commit()
    db.refresh(new_asig)
    return new_asig

@app.put("/cargo-asignaciones/{id}", response_model=schemas.CargoAsignacion)
async def update_cargo_asignacion(id: int, asig: schemas.CargoAsignacionUpdate, db: Session = Depends(get_db)):
    db_asig = db.query(models.CargoAsignacion).filter(models.CargoAsignacion.id == id).first()
    if not db_asig:
        raise HTTPException(status_code=404, detail="Asignación no encontrada")
    
    update_data = asig.dict(exclude_unset=True)
    horarios_data = update_data.pop('horarios', None)
    
    # Actualizar campos básicos
    for key, value in update_data.items():
        setattr(db_asig, key, value)
    
    # Si se envían horarios, reemplazar los anteriores
    if horarios_data is not None:
        # Borrar anteriores
        db.query(models.CargoHorario).filter(models.CargoHorario.asignacion_id == id).delete()
        # Insertar nuevos (solo si el día tiene horas > 0 o si no se especifican horas_dia)
        for h_data in horarios_data:
            # Extraer campos para evitar duplicados al usar **h_data
            comision_id = h_data.pop('comision_id', None)
            modulo_id = h_data.pop('modulo_id', None)
            observaciones = h_data.pop('observaciones', None)
            
            dia = h_data.get('dia_semana', '').lower()
            dia_map = dia.replace('í','i').replace('á','a').replace('é','e').replace('ó','o').replace('ú','u')
            horas_dia = getattr(db_asig, f'horas_{dia_map}', 1)
            
            if horas_dia > 0:
                db_h = models.CargoHorario(
                    **h_data, 
                    asignacion_id=id,
                    comision_id=comision_id,
                    modulo_id=modulo_id,
                    observaciones=observaciones
                )
                db.add(db_h)
        # Recalcular total desde slots
        db_asig.total_horas = sum([h.get('horas', 0) for h in horarios_data])
    else:
        # Recalcular total desde columnas viejas
        db_asig.total_horas = sum([
            getattr(db_asig, f'horas_{d}', 0) for d in ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo']
        ])
    
    db.commit()
    db.refresh(db_asig)
    return db_asig

@app.delete("/cargo-asignaciones/{id}")
async def delete_cargo_asignacion(id: int, db: Session = Depends(get_db)):
    db_asig = db.query(models.CargoAsignacion).filter(models.CargoAsignacion.id == id).first()
    if not db_asig:
        raise HTTPException(status_code=404, detail="Asignación no encontrada")
    
    db.delete(db_asig)
    db.commit()
    return {"message": "Asignación eliminada correctamente"}

# --- EDITOR / ASIGNACIONES ---

@app.get("/modulos", response_model=List[schemas.ModuloHorario])
async def get_modulos(db: Session = Depends(get_db)):
    return db.query(models.ModuloHorario).order_by(models.ModuloHorario.turno, models.ModuloHorario.numero).all()

@app.get("/asignaciones", response_model=List[schemas.Asignacion])
async def get_asignaciones(institucion_id: Optional[int] = None, departamento_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(models.Asignacion)
    if institucion_id:
        query = query.join(models.Departamento).filter(models.Departamento.institucion_id == institucion_id)
    if departamento_id:
        query = query.filter(models.Asignacion.departamento_id == departamento_id)
        
    results = query.all()
    # Inyectar reemplazos activos
    for a in results:
        if a.docente_id:
            reem = get_active_replacement(db, a.docente_id, asig_id=a.id)
            if reem:
                a.reemplazo_activo = {
                    "id": reem.id,
                    "reemplazante_id": reem.reemplazante_id,
                    "reemplazante_nombre": f"{reem.reemplazante.apellido}, {reem.reemplazante.nombre}" if reem.reemplazante else "S/D"
                }
    return results

@app.post("/asignaciones", response_model=schemas.Asignacion)
async def create_asignacion(asignacion: schemas.AsignacionCreate, db: Session = Depends(get_db)):
    # Eliminar asignación previa en el mismo aula/modulo/dia si existe (el UNIQUE lo previene, pero mejor manejarlo)
    existing = db.query(models.Asignacion).filter(
        models.Asignacion.aula_id == asignacion.aula_id,
        models.Asignacion.modulo_id == asignacion.modulo_id,
        models.Asignacion.dia_semana == asignacion.dia_semana
    ).first()
    if existing:
        db.delete(existing)
    
    new_asignacion = models.Asignacion(**asignacion.dict())
    db.add(new_asignacion)
    db.commit()
    db.refresh(new_asignacion)
    return new_asignacion

# --- RECREOS EXCLUIDOS ---

@app.get("/recreos_excluidos", response_model=List[schemas.RecreoExcluido])
async def get_recreos_excluidos(institucion_id: Optional[int] = None, departamento_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(models.RecreoExcluido)
    if institucion_id:
        query = query.join(models.Departamento).filter(models.Departamento.institucion_id == institucion_id)
    if departamento_id:
        query = query.filter(models.RecreoExcluido.departamento_id == departamento_id)
    return query.all()

@app.post("/recreos_excluidos")
async def create_recreo_excluido(recreo: schemas.RecreoExcluidoCreate, db: Session = Depends(get_db)):
    db.add(models.RecreoExcluido(**recreo.dict()))
    db.commit()
    return {"message": "Recreo excluido correctamente"}

# --- CONFIGURACION DE TURNOS (DYNAMIC TIMELINE) ---

@app.get("/config-turnos/{departamento_id}/{dia}/{turno}", response_model=Optional[schemas.TurnoConfig])
async def get_config_turno(departamento_id: int, dia: str, turno: str, db: Session = Depends(get_db)):
    return db.query(models.TurnoConfig).filter(
        models.TurnoConfig.departamento_id == departamento_id,
        models.TurnoConfig.dia_semana == dia,
        models.TurnoConfig.turno == turno
    ).first()

@app.post("/config-turnos", response_model=schemas.TurnoConfig)
async def upsert_config_turno(config: schemas.TurnoConfigCreate, db: Session = Depends(get_db)):
    existing = db.query(models.TurnoConfig).filter(
        models.TurnoConfig.departamento_id == config.departamento_id,
        models.TurnoConfig.dia_semana == config.dia_semana,
        models.TurnoConfig.turno == config.turno
    ).first()
    
    if existing:
        existing.hora_inicio = config.hora_inicio
        existing.secuencia = config.secuencia
        db.commit()
        db.refresh(existing)
        return existing
    
    new_config = models.TurnoConfig(**config.dict())
    db.add(new_config)
    db.commit()
    db.refresh(new_config)
    return new_config

@app.post("/recreos_excluidos_toggle")
async def toggle_recreo_excluido(recreo: schemas.RecreoExcluidoCreate, db: Session = Depends(get_db)):
    existing = db.query(models.RecreoExcluido).filter(
        models.RecreoExcluido.departamento_id == recreo.departamento_id,
        models.RecreoExcluido.dia_semana == recreo.dia_semana,
        models.RecreoExcluido.modulo_id_anterior == recreo.modulo_id_anterior
    ).first()
    
    if existing:
        db.delete(existing)
        message = "Recreo habilitado (exclusión eliminada)"
    else:
        new_excl = models.RecreoExcluido(**recreo.dict())
        db.add(new_excl)
        message = "Recreo excluido correctamente"
    
    db.commit()
    return {"message": message, "is_excluded": not existing}

# --- CALENDARIOS ---

@app.get("/calendarios", response_model=List[schemas.Calendario])
async def get_calendarios(institucion_id: Optional[int] = None, departamento_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(models.Calendario)
    if institucion_id:
        query = query.join(models.Departamento).filter(models.Departamento.institucion_id == institucion_id)
    if departamento_id:
        query = query.filter(models.Calendario.departamento_id == departamento_id)
    
    cals = query.all()
    if not cals:
        # Si no hay calendarios y se pasó un departamento, creamos uno por defecto para ese depto
        if departamento_id:
            default_cal = models.Calendario(
                nombre="Calendario Institucional", 
                descripcion="Planificación académica general",
                departamento_id=departamento_id
            )
            db.add(default_cal)
            db.commit()
            db.refresh(default_cal)
            return [default_cal]
    return cals

@app.post("/calendarios", response_model=schemas.Calendario)
async def create_calendario(cal: schemas.CalendarioCreate, db: Session = Depends(get_db)):
    new_cal = models.Calendario(**cal.dict())
    db.add(new_cal)
    db.commit()
    db.refresh(new_cal)
    return new_cal

# --- CATEGORIAS CALENDARIO ---

@app.get("/calendario_categorias", response_model=List[schemas.CalendarioCategoria])
async def get_calendario_categorias(calendario_id: int, db: Session = Depends(get_db)):
    cats = db.query(models.CalendarioCategoria).filter(models.CalendarioCategoria.calendario_id == calendario_id).all()
    if not cats:
        # Inyectar categorías por defecto
        defaults = [
            {"nombre": "Feriado", "color": "#ef4444"},
            {"nombre": "Asueto", "color": "#f59e0b"},
            {"nombre": "Exámenes", "color": "#3b82f6"},
            {"nombre": "Evento Especial", "color": "#10b981"}
        ]
        for d in defaults:
            db.add(models.CalendarioCategoria(calendario_id=calendario_id, **d))
        db.commit()
        return db.query(models.CalendarioCategoria).filter(models.CalendarioCategoria.calendario_id == calendario_id).all()
    return cats

@app.post("/calendario_categorias", response_model=schemas.CalendarioCategoria)
async def create_calendario_categoria(cat: schemas.CalendarioCategoriaCreate, db: Session = Depends(get_db)):
    new_cat = models.CalendarioCategoria(**cat.dict())
    db.add(new_cat)
    db.commit()
    db.refresh(new_cat)
    return new_cat
@app.put("/calendario_categorias/{id}", response_model=schemas.CalendarioCategoria)
async def update_calendario_categoria(id: int, cat: schemas.CalendarioCategoriaCreate, db: Session = Depends(get_db)):
    db_cat = db.query(models.CalendarioCategoria).filter(models.CalendarioCategoria.id == id).first()
    if not db_cat:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    
    db_cat.nombre = cat.nombre
    db_cat.color = cat.color
    db.commit()
    db.refresh(db_cat)
    return db_cat

@app.delete("/calendario_categorias/{id}")
async def delete_calendario_categoria(id: int, db: Session = Depends(get_db)):
    db_cat = db.query(models.CalendarioCategoria).filter(models.CalendarioCategoria.id == id).first()
    if not db_cat:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    
    # Verificar si hay eventos usando esta categoría
    events_count = db.query(models.CalendarioEvento).filter(models.CalendarioEvento.categoria_id == id).count()
    if events_count > 0:
        raise HTTPException(status_code=400, detail="No se puede eliminar una categoría que tiene eventos asociados")

    db.delete(db_cat)
    db.commit()
    return {"message": "Categoría eliminada correctamente"}

# --- EVENTOS CALENDARIO ---

@app.get("/calendario_eventos", response_model=List[schemas.CalendarioEvento])
async def get_calendario_eventos(calendario_id: int, departamento_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(models.CalendarioEvento).filter(models.CalendarioEvento.calendario_id == calendario_id)
    if departamento_id:
        # Retornar eventos del departamento O institucionales (departamento_id IS NULL)
        query = query.filter((models.CalendarioEvento.departamento_id == departamento_id) | (models.CalendarioEvento.departamento_id == None))
    return query.all()

@app.post("/calendario_eventos", response_model=schemas.CalendarioEvento)
async def create_calendario_evento(evt: schemas.CalendarioEventoCreate, db: Session = Depends(get_db)):
    # Se eliminó la lógica de borrado de duplicados para permitir múltiples eventos por día
    new_evt = models.CalendarioEvento(**evt.dict())
    db.add(new_evt)
    db.commit()
    db.refresh(new_evt)
    return new_evt

@app.delete("/calendario_eventos/{id}")
async def delete_calendario_evento(id: int, db: Session = Depends(get_db)):
    db_evt = db.query(models.CalendarioEvento).filter(models.CalendarioEvento.id == id).first()
    if not db_evt:
        raise HTTPException(status_code=404, detail="Evento no encontrado")
    db.delete(db_evt)
    db.commit()
    return {"message": "Evento eliminado correctamente"}

# --- NOTAS ADHESIVAS ---

@app.get("/notas_adhesivas", response_model=List[schemas.NotaAdhesiva])
async def get_notas_adhesivas(calendario_id: int, db: Session = Depends(get_db)):
    return db.query(models.NotaAdhesiva).filter(models.NotaAdhesiva.calendario_id == calendario_id).all()

@app.post("/notas_adhesivas", response_model=schemas.NotaAdhesiva)
async def create_nota_adhesiva(nota: schemas.NotaAdhesivaCreate, db: Session = Depends(get_db)):
    new_nota = models.NotaAdhesiva(**nota.dict())
    db.add(new_nota)
    db.commit()
    db.refresh(new_nota)
    return new_nota

@app.delete("/notas_adhesivas/{id}")
async def delete_nota_adhesiva(id: int, db: Session = Depends(get_db)):
    db_nota = db.query(models.NotaAdhesiva).filter(models.NotaAdhesiva.id == id).first()
    if not db_nota:
        raise HTTPException(status_code=404, detail="Nota no encontrada")
    db.delete(db_nota)
    db.commit()
    return {"message": "Nota eliminada correctamente"}

# --- PLANIFICACIONES (PAD) ---

@app.get("/planificaciones", response_model=List[schemas.Planificacion])
async def get_planificaciones(materia_id: Optional[int] = None, anio_lectivo: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(models.Planificacion)
    if materia_id:
        query = query.filter(models.Planificacion.materia_id == materia_id)
    if anio_lectivo:
        query = query.filter(models.Planificacion.anio_lectivo == anio_lectivo)
    return query.all()

@app.get("/planificaciones/{id}", response_model=schemas.Planificacion)
async def get_planificacion(id: int, db: Session = Depends(get_db)):
    db_plan = db.query(models.Planificacion).filter(models.Planificacion.id == id).first()
    if not db_plan:
        raise HTTPException(status_code=404, detail="Planificación no encontrada")
    return db_plan

@app.post("/planificaciones", response_model=schemas.Planificacion)
async def create_planificacion(plan: schemas.PlanificacionCreate, db: Session = Depends(get_db)):
    new_plan = models.Planificacion(**plan.dict())
    db.add(new_plan)
    db.commit()
    db.refresh(new_plan)
    return new_plan

@app.put("/planificaciones/{id}", response_model=schemas.Planificacion)
async def update_planificacion(id: int, plan: schemas.PlanificacionCreate, db: Session = Depends(get_db)):
    db_plan = db.query(models.Planificacion).filter(models.Planificacion.id == id).first()
    if not db_plan:
        raise HTTPException(status_code=404, detail="Planificación no encontrada")
    
    update_data = plan.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_plan, key, value)
    
    db.commit()
    db.refresh(db_plan)
    return db_plan

@app.delete("/planificaciones/{id}")
async def delete_planificacion(id: int, db: Session = Depends(get_db)):
    db_plan = db.query(models.Planificacion).filter(models.Planificacion.id == id).first()
    if not db_plan:
        raise HTTPException(status_code=404, detail="Planificación no encontrada")
    db.delete(db_plan)
    db.commit()
    return {"message": "Planificación eliminada correctamente"}

# --- MOTIVOS DE LICENCIA ---

@app.get("/motivos-licencia", response_model=List[schemas.MotivoLicencia])
async def get_motivos_licencia(db: Session = Depends(get_db)):
    return db.query(models.MotivoLicencia).all()

@app.post("/motivos-licencia", response_model=schemas.MotivoLicencia)
async def create_motivo_licencia(motivo: schemas.MotivoLicenciaCreate, db: Session = Depends(get_db)):
    db_motivo = models.MotivoLicencia(**motivo.dict())
    db.add(db_motivo)
    try:
        db.commit()
        db.refresh(db_motivo)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="El motivo ya existe")
    return db_motivo

@app.delete("/motivos-licencia/{id}")
async def delete_motivo_licencia(id: int, db: Session = Depends(get_db)):
    db_motivo = db.query(models.MotivoLicencia).filter(models.MotivoLicencia.id == id).first()
    if not db_motivo:
        raise HTTPException(status_code=404, detail="Motivo no encontrado")
    db.delete(db_motivo)
    db.commit()
    return {"message": "Motivo eliminado"}

# --- LICENCIAS Y REEMPLAZOS ---

@app.get("/licencias", response_model=List[schemas.Licencia])
async def get_licencias(docente_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(models.Licencia).options(joinedload(models.Licencia.motivo), joinedload(models.Licencia.reemplazos).joinedload(models.Reemplazo.reemplazante))
    if docente_id:
        query = query.filter(models.Licencia.docente_id == docente_id)
    return query.all()

@app.post("/licencias", response_model=schemas.Licencia)
async def create_licencia(lic: schemas.LicenciaCreate, db: Session = Depends(get_db)):
    db_lic = models.Licencia(**lic.dict())
    db.add(db_lic)
    db.commit()
    db.refresh(db_lic)
    return db_lic

@app.delete("/licencias/{id}")
async def delete_licencia(id: int, db: Session = Depends(get_db)):
    db_lic = db.query(models.Licencia).filter(models.Licencia.id == id).first()
    if not db_lic:
        raise HTTPException(status_code=404, detail="Licencia no encontrada")
    db.delete(db_lic)
    db.commit()
    return {"message": "Licencia eliminada"}

@app.post("/reemplazos", response_model=schemas.Reemplazo)
async def create_reemplazo(reem: schemas.ReemplazoCreate, db: Session = Depends(get_db)):
    db_reem = models.Reemplazo(**reem.dict())
    db.add(db_reem)
    db.commit()
    db.refresh(db_reem)
    return db_reem

@app.delete("/reemplazos/{id}")
async def delete_reemplazo(id: int, db: Session = Depends(get_db)):
    db_reem = db.query(models.Reemplazo).filter(models.Reemplazo.id == id).first()
    if not db_reem:
        raise HTTPException(status_code=404, detail="Reemplazo no encontrado")
    db.delete(db_reem)
    db.commit()
    return {"message": "Reemplazo eliminado"}

# --- INYECCIÓN DE REEMPLAZOS EN ASIGNACIONES ---

def get_active_replacement(db: Session, docente_id: int, cargo_id: int = None, asig_id: int = None):
    today = datetime.date.today().isoformat()
    # Buscar una licencia activa para el docente titular
    licencias_activas = db.query(models.Licencia).filter(
        models.Licencia.docente_id == docente_id,
        models.Licencia.fecha_inicio <= today,
        models.Licencia.fecha_fin >= today
    ).all()
    
    if not licencias_activas:
        return None
        
    lic_ids = [l.id for l in licencias_activas]
    
    # Buscar si hay un reemplazo específico para este cargo/asignación
    query_reem = db.query(models.Reemplazo).options(joinedload(models.Reemplazo.reemplazante)).filter(
        models.Reemplazo.licencia_id.in_(lic_ids),
        models.Reemplazo.fecha_inicio <= today,
        models.Reemplazo.fecha_fin >= today
    )
    
    if cargo_id:
        reem = query_reem.filter(models.Reemplazo.cargo_asignacion_id == cargo_id).first()
        if reem: return reem
        
    if asig_id:
        reem = query_reem.filter(models.Reemplazo.asignacion_id == asig_id).first()
        if reem: return reem
        
    # Si hay una licencia activa pero no hay reemplazo específico configurado aún en esta tabla,
    # podríamos devolver 'vacante' o simplemente dejar al titular si no se asignó suplente aún.
    # Por ahora devolvemos el primer reemplazo que cubra esta licencia si no es específico.
    return query_reem.first()
