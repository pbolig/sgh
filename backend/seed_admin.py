from database import engine, SessionLocal
import models
import auth_utils

def seed():
    # Crear tablas si no existen
    models.Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    # Verificar si el admin ya existe
    admin = db.query(models.Usuario).filter(models.Usuario.username == "admin").first()
    if not admin:
        print("Creando usuario administrador inicial...")
        new_admin = models.Usuario(
            username="admin",
            password_hash=auth_utils.get_password_hash("admin123"),
            rol="admin",
            activo=1
        )
        db.add(new_admin)
        db.commit()
        print("Admin creado con éxito: admin / admin123")
    else:
        # Actualizar password para asegurar que el hash sea correcto
        admin.password_hash = auth_utils.get_password_hash("admin123")
        db.commit()
        print("Password de admin sincronizada.")
    db.close()

if __name__ == "__main__":
    seed()
