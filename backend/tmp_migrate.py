import os
import sys

# Agregar el directorio backend al path para poder importar los modelos
backend_path = os.path.join(os.getcwd(), "backend")
if backend_path not in sys.path:
    sys.path.append(backend_path)

try:
    from database import SessionLocal, engine
    import models
    # Asegurar que las tablas y columnas existan
    models.Base.metadata.create_all(bind=engine)
except ImportError as e:
    print(f"Error importando módulos: {e}")
    sys.exit(1)

def migrate():
    db = SessionLocal()
    try:
        # 1. Crear Institución por defecto
        default_inst = db.query(models.Institucion).filter(models.Institucion.codigo == "DEFAULT").first()
        if not default_inst:
            default_inst = models.Institucion(
                nombre="Institución General",
                codigo="DEFAULT",
                descripcion="Institución creada automáticamente para agrupar datos existentes."
            )
            db.add(default_inst)
            db.commit()
            db.refresh(default_inst)
            print(f"Created default institution ID: {default_inst.id}")
        else:
            print(f"Default institution already exists (ID: {default_inst.id})")
        
        # 2. Vincular Departamentos
        deptos = db.query(models.Departamento).filter(models.Departamento.institucion_id == None).all()
        for d in deptos:
            d.institucion_id = default_inst.id
            print(f"Linked depto {d.nombre} to institution {default_inst.id}")
        
        # 3. Vincular Docentes
        docentes = db.query(models.Docente).filter(models.Docente.institucion_id == None).all()
        for d in docentes:
            d.institucion_id = default_inst.id
            print(f"Linked docente {d.apellido} to institution {default_inst.id}")
            
        # 4. Vincular Usuarios
        usuarios = db.query(models.Usuario).filter(models.Usuario.institucion_id == None).all()
        for u in usuarios:
            u.institucion_id = default_inst.id
            print(f"Linked user {u.username} to institution {default_inst.id}")
            
        # 5. Vincular Calendarios al primer departamento si existe
        first_depto = db.query(models.Departamento).filter(models.Departamento.institucion_id == default_inst.id).first()
        if first_depto:
            cals = db.query(models.Calendario).filter(models.Calendario.departamento_id == None).all()
            for c in cals:
                c.departamento_id = first_depto.id
                print(f"Linked calendar {c.nombre} to depto {first_depto.nombre}")
        
        db.commit()
        print("Migration completed successfully.")
    except Exception as e:
        db.rollback()
        print(f"Migration failed: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    migrate()
