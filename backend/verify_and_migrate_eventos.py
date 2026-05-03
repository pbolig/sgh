import os
from sqlalchemy import create_engine, text, inspect
from sqlalchemy.orm import sessionmaker

# URL para conectar (Ajustar si se corre desde Windows o Docker)
# Si corres desde Windows con Docker activo, usa localhost:5432
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://horarios_user:horarios123@localhost/horarios")
engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)

def migrate_and_audit():
    try:
        with engine.connect() as conn:
            print("--- Iniciando Proceso de Migración y Auditoría de Eventos ---")
            
            # 1. Verificar si la columna carrera_id existe en calendario_eventos
            inspector = inspect(engine)
            columns = [c['name'] for c in inspector.get_columns('calendario_eventos')]
            
            if 'carrera_id' not in columns:
                print("Añadiendo columna 'carrera_id' a 'calendario_eventos'...")
                conn.execute(text("ALTER TABLE calendario_eventos ADD COLUMN carrera_id INTEGER REFERENCES carreras(id) ON DELETE CASCADE"))
                conn.commit()
                print("Columna añadida con éxito.")
            else:
                print("La columna 'carrera_id' ya existe en 'calendario_eventos'.")

            # 2. Conteo previo
            total_eventos = conn.execute(text("SELECT COUNT(*) FROM calendario_eventos")).scalar()
            print(f"Total de eventos en la tabla: {total_eventos}")

            # 3. Proceso de Auditoría y Poblamiento
            print("Auditando y alineando eventos con sus carreras parentales...")
            
            # UPDATE basado en el carrera_id del calendario padre
            sql_update = """
                UPDATE calendario_eventos ce
                SET carrera_id = c.carrera_id
                FROM calendarios c
                WHERE ce.calendario_id = c.id
                AND ce.carrera_id IS NULL
                AND c.carrera_id IS NOT NULL
            """
            result = conn.execute(text(sql_update))
            conn.commit()
            
            print(f"Resultado: {result.rowcount} eventos fueron alineados con su Carrera correctamente.")

            # 4. Verificación final
            huerfanos = conn.execute(text("SELECT COUNT(*) FROM calendario_eventos WHERE carrera_id IS NULL AND departamento_id IS NOT NULL")).scalar()
            institucionales = conn.execute(text("SELECT COUNT(*) FROM calendario_eventos WHERE carrera_id IS NULL AND departamento_id IS NULL")).scalar()
            
            print(f"Eventos Institucionales (sin Depto ni Carrera): {institucionales}")
            if huerfanos > 0:
                print(f"AVISO: Quedan {huerfanos} eventos vinculados a un Departamento pero sin Carrera asignada.")
            
            print("\n--- Proceso completado con éxito ---")
            
    except Exception as e:
        print(f"ERROR durante la migración: {e}")

if __name__ == "__main__":
    migrate_and_audit()
