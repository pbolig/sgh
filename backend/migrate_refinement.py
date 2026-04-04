from sqlalchemy import create_engine, text
import os

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://horarios_user:horarios123@localhost/horarios")

engine = create_engine(DATABASE_URL)

def migrate():
    with engine.connect() as conn:
        try:
            # 1. Crear tablas de asociación
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS docente_institucion (
                    docente_id INTEGER REFERENCES docentes(id) ON DELETE CASCADE,
                    institucion_id INTEGER REFERENCES instituciones(id) ON DELETE CASCADE,
                    PRIMARY KEY (docente_id, institucion_id)
                )
            """))
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS docente_departamento (
                    docente_id INTEGER REFERENCES docentes(id) ON DELETE CASCADE,
                    departamento_id INTEGER REFERENCES departamentos(id) ON DELETE CASCADE,
                    PRIMARY KEY (docente_id, departamento_id)
                )
            """))

            # 2. Agregar columnas a Materias
            conn.execute(text("ALTER TABLE materias ADD COLUMN IF NOT EXISTS codigo_interno VARCHAR"))
            conn.execute(text("ALTER TABLE materias ADD COLUMN IF NOT EXISTS carga_horaria_modulos INTEGER DEFAULT 0"))
            conn.execute(text("ALTER TABLE materias ADD COLUMN IF NOT EXISTS correlativas TEXT"))

            # 3. Agregar columna a CalendarioEvento
            conn.execute(text("ALTER TABLE calendario_eventos ADD COLUMN IF NOT EXISTS departamento_id INTEGER REFERENCES departamentos(id) ON DELETE CASCADE"))

            # 4. Migrar datos de Docentes (Legacy a M2M)
            # Solo si no se ha migrado antes (basado en si docente_institucion está vacía pero docentes tiene datos)
            count_m2m = conn.execute(text("SELECT count(*) FROM docente_institucion")).scalar()
            if count_m2m == 0:
                conn.execute(text("""
                    INSERT INTO docente_institucion (docente_id, institucion_id)
                    SELECT id, institucion_id FROM docentes WHERE institucion_id IS NOT NULL
                """))
                print("Datos de docentes migrados a tabla de asociación Institución.")

            conn.commit()
            print("Migración de base de datos completada exitosamente.")
        except Exception as e:
            conn.rollback()
            print(f"Error durante la migración: {e}")

if __name__ == "__main__":
    migrate()
