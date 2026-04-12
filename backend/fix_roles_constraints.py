# backend/fix_roles_constraints.py
from sqlalchemy import text
from database import engine, SessionLocal
import os

def migrate():
    db = SessionLocal()
    try:
        # 1. Intentar identificar el índice único antiguo en postgreSQL
        # El nombre suele ser ix_roles_nombre pero podría variar
        print("Buscando índices únicos en 'roles.nombre'...")
        
        # Eliminar el índice único global si existe
        db.execute(text("DROP INDEX IF EXISTS ix_roles_nombre"))
        db.execute(text("ALTER TABLE roles DROP CONSTRAINT IF EXISTS roles_nombre_key"))
        db.commit()
        print("Índices antiguos eliminados.")

        # 2. Asegurar que institucion_id no tenga nulos (deberían haber sido migrados)
        # 3. Crear el nuevo índice compuesto
        print("Creando índice único compuesto (institucion_id, nombre)...")
        db.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS uix_rol_inst_nombre ON roles (institucion_id, nombre)"))
        db.commit()
        
        print("Migración de restricciones completada con éxito.")

    except Exception as e:
        db.rollback()
        print(f"Error durante la migración: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    migrate()
