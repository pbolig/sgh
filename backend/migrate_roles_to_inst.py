# backend/migrate_roles_to_inst.py
from sqlalchemy import create_engine, text, Column, Integer, ForeignKey
from database import engine, SessionLocal
import models
import os

def migrate():
    # 1. Asegurar que la columna existe (via metadata o SQL directo)
    # models.Base.metadata.create_all(bind=engine) # Esto suele funcionar si SQLAlchemy ve el cambio
    
    db = SessionLocal()
    try:
        # Intentar agregar columna via SQL por si el metadata no lo hace automático en este entorno
        try:
            db.execute(text("ALTER TABLE roles ADD COLUMN institucion_id INTEGER REFERENCES instituciones(id)"))
            db.commit()
            print("Columna 'institucion_id' añadida con éxito.")
        except Exception as e:
            db.rollback()
            print(f"La columna probablemente ya existe: {e}")

        # 2. Obtener la primera institución
        first_inst = db.execute(text("SELECT id FROM instituciones LIMIT 1")).fetchone()
        if not first_inst:
            print("⚠️ No hay instituciones en la base de datos. Sembrando una por defecto...")
            db.execute(text("INSERT INTO instituciones (nombre, codigo, activo) VALUES ('Institución Inicial', 'INIT01', 1)"))
            db.commit()
            first_inst = db.execute(text("SELECT id FROM instituciones LIMIT 1")).fetchone()

        inst_id = first_inst[0]

        # 3. Asignar todos los roles huérfanos a esta institución
        result = db.execute(text("UPDATE roles SET institucion_id = :inst_id WHERE institucion_id IS NULL"), {"inst_id": inst_id})
        db.commit()
        print(f"Migración completada. {result.rowcount} roles asociados a la institución ID: {inst_id}")

    finally:
        db.close()

if __name__ == "__main__":
    migrate()
