from database import engine, SessionLocal
import models
import auth_utils

def seed():
    # Crear tablas si no existen
    models.Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    # 1. Sembrar Módulos
    modulos_data = [
        {"nombre": "dashboard", "etiqueta": "Dashboard", "icono": "📊"},
        {"nombre": "editor", "etiqueta": "Editor de Horarios", "icono": "📅"},
        {"nombre": "docentes", "etiqueta": "Docentes", "icono": "👥"},
        {"nombre": "departamentos", "etiqueta": "Departamentos", "icono": "🏢"},
        {"nombre": "materias", "etiqueta": "Materias", "icono": "📖"},
        {"nombre": "aulas", "etiqueta": "Aulas", "icono": "🏫"},
        {"nombre": "comisiones", "etiqueta": "Comisiones", "icono": "📋"},
        {"nombre": "reportes", "etiqueta": "Reportes", "icono": "📈"},
        {"nombre": "cargos", "etiqueta": "Cargos", "icono": "💼"},
        {"nombre": "cargo_asignaciones", "etiqueta": "Asignación de Cargos", "icono": "📌"},
        {"nombre": "calendario", "etiqueta": "Calendario", "icono": "🗓️"},
        {"nombre": "pad", "etiqueta": "Planificación (PAD)", "icono": "📝"},
        {"nombre": "permisos", "etiqueta": "Gestión de Accesos", "icono": "🔐"},
    ]
    
    for m_data in modulos_data:
        m = db.query(models.Modulo).filter(models.Modulo.nombre == m_data["nombre"]).first()
        if not m:
            db.add(models.Modulo(**m_data))
    db.commit()
    print("Módulos inicializados.")

    # 2. Sembrar Roles iniciales
    roles_data = [
        {"nombre": "directivo", "descripcion": "Acceso total al sistema"},
        {"nombre": "docente", "descripcion": "Acceso a PAD y horarios"},
        {"nombre": "alumno", "descripcion": "Acceso a consulta de horarios"},
        {"nombre": "administracion", "descripcion": "Gestión administrativa de la institución"},
    ]
    
    for r_data in roles_data:
        r = db.query(models.Rol).filter(models.Rol.nombre == r_data["nombre"]).first()
        if not r:
            db.add(models.Rol(**r_data))
    db.commit()
    print("Roles inicializados.")

    # 3. Verificar si el admin ya existe y asignar su rol_id
    rol_directivo = db.query(models.Rol).filter(models.Rol.nombre == "directivo").first()
    admin = db.query(models.Usuario).filter(models.Usuario.username == "admin").first()
    
    if not admin:
        print("Creando usuario administrador inicial...")
        new_admin = models.Usuario(
            username="admin",
            password_hash=auth_utils.get_password_hash("admin123"),
            rol="directivo", # Usar el nuevo nombre de rol
            rol_id=rol_directivo.id,
            activo=1
        )
        db.add(new_admin)
        db.commit()
        print("Admin creado con éxito: admin / admin123")
    else:
        # Actualizar para que tenga el rol_id correcto
        admin.rol = "directivo"
        admin.rol_id = rol_directivo.id
        admin.password_hash = auth_utils.get_password_hash("admin123")
        db.commit()
        print("Usuario admin actualizado con éxito.")

    db.close()

if __name__ == "__main__":
    seed()
