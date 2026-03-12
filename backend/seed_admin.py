# Script para poblar el usuario admin inicial en PostgreSQL
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from main import Usuario, Base
import datetime

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://horarios_user:horarios123@localhost/horarios")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def seed():
    # Crear tablas si no existen
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    # Verificar si el admin ya existe
    admin = db.query(Usuario).filter(Usuario.username == "admin").first()
    if not admin:
        print("Creando usuario administrador inicial...")
        new_admin = Usuario(
            username="admin",
            password_hash="PENDIENTE_BCRYPT", # Se actualizará luego
            rol="admin",
            activo=1
        )
        db.add(new_admin)
        db.commit()
        print("Admin creado con éxito.")
    else:
        print("El usuario admin ya existe.")
    db.close()

if __name__ == "__main__":
    seed()
 Aurora:
