import sqlite3
import os

# Configuración simplificada para ejecución directa (asumiendo SQLite en el contenedor o local si es Turso)
# Dado que estamos en Docker, esto es un poco más complejo si queremos usar SQLAlchemy.
# Usaremos el motor de base de datos del proyecto.

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Base, ModuloHorario
import datetime

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./horarios.db")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def seed_modulos():
    db = SessionLocal()
    
    # Módulos turno mañana
    mañana = [
        (1, '07:45', '08:25'),
        (2, '08:25', '09:05'),
        (3, '09:15', '09:55'),
        (4, '09:55', '10:35'),
        (5, '10:45', '11:25'),
        (6, '11:25', '12:05'),
        (7, '12:10', '12:50')
    ]
    
    # Módulos turno tarde
    tarde = [
        (1, '13:30', '14:10'),
        (2, '14:10', '14:50'),
        (3, '15:00', '15:40'),
        (4, '15:40', '16:20'),
        (5, '16:30', '17:10'),
        (6, '17:10', '17:50'),
        (7, '17:55', '18:35'),
        (8, '18:35', '19:15'),
        (9, '19:15', '19:55')
    ]
    
    try:
        # Limpiar existentes si hay
        db.query(ModuloHorario).delete()
        
        for num, inicio, fin in mañana:
            db.add(ModuloHorario(numero=num, hora_inicio=inicio, hora_fin=fin, turno='mañana'))
            
        for num, inicio, fin in tarde:
            db.add(ModuloHorario(numero=num, hora_inicio=inicio, hora_fin=fin, turno='tarde'))
            
        db.commit()
        print("Módulos horarios cargados con éxito.")
    except Exception as e:
        print(f"Error al cargar módulos: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_modulos()
