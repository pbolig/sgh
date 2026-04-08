import os
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# URL de la base de datos para ejecución local
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://horarios_user:horarios123@localhost:5432/horarios")

print(f"Conectando a {DATABASE_URL}...")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def migrate():
    db = SessionLocal()
    try:
        # 1. Agregar columna anio a materias if not exists
        print("Verificando columna 'anio' en materias...")
        try:
            db.execute(text("ALTER TABLE materias ADD COLUMN anio INTEGER DEFAULT 1"))
            db.commit()
            print("  Columna 'anio' agregada con éxito.")
        except Exception as e:
            print(f"  Nota: 'anio' ya podría existir o hubo un error: {e}")
            db.rollback()

        # 2. Agregar columnas auditoría a comisiones if not exists
        print("Verificando columnas de auditoría en comisiones...")
        for col in [("created_at", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP"), ("updated_at", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")]:
            try:
                db.execute(text(f"ALTER TABLE comisiones ADD COLUMN {col[0]} {col[1]}"))
                db.commit()
                print(f"  Columna '{col[0]}' agregada con éxito.")
            except Exception as e:
                print(f"  Nota: '{col[0]}' ya podría existir o hubo un error: {e}")
                db.rollback()

        # 3. Asegurar que las materias existentes tengan un depto_id si es posible (limpieza opcional)
        
        db.commit()
        print("Migración de esquema completada.")
    except Exception as e:
        print(f"Error crítico durante la migración: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    migrate()
