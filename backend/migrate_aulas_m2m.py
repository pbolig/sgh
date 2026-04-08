import os
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Intenta obtener la URL de la base de datos
# Ajustamos para que use localhost en vez de 'db' si se corre desde afuera de Docker
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://horarios_user:horarios123@localhost:5432/horarios")

print(f"Conectando a {DATABASE_URL}...")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def migrate():
    db = SessionLocal()
    try:
        # 1. Crear la tabla de asociación aula_departamento if not exists
        print("Creando tabla aula_departamento...")
        db.execute(text("""
            CREATE TABLE IF NOT EXISTS aula_departamento (
                aula_id INTEGER NOT NULL REFERENCES aulas(id) ON DELETE CASCADE,
                departamento_id INTEGER NOT NULL REFERENCES departamentos(id) ON DELETE CASCADE,
                PRIMARY KEY (aula_id, departamento_id)
            )
        """))

        # 2. Agregar columna institucion_id a aulas if not exists
        print("Agregando columna institucion_id a aulas...")
        try:
            db.execute(text("ALTER TABLE aulas ADD COLUMN institucion_id INTEGER REFERENCES instituciones(id) ON DELETE CASCADE"))
        except Exception as e:
            print(f"Nota: institucion_id ya podría existir o hubo un error: {e}")
            db.rollback()
        
        # 3. Eliminar restricción UNIQUE antigua (departamento_id, nombre)
        print("Eliminando restricción UNIQUE antigua...")
        try:
            # Intentar encontrar el nombre de la restricción UNIQUE en (departamento_id, nombre)
            # Primero buscamos por nombre común en Postgres
            db.execute(text("ALTER TABLE aulas DROP CONSTRAINT IF EXISTS aulas_departamento_id_nombre_key"))
            # O intentar por tabla/columnas
            res = db.execute(text("""
                SELECT conname 
                FROM pg_constraint 
                WHERE conrelid = 'aulas'::regclass AND contype = 'u';
            """)).fetchall()
            for r in res:
                print(f"Eliminando restricción: {r[0]}")
                db.execute(text(f"ALTER TABLE aulas DROP CONSTRAINT IF EXISTS {r[0]}"))
        except Exception as e:
            print(f"Nota: No se pudo eliminar la restricción UNIQUE o no existe: {e}")
            db.rollback()

        # 4. Migrar datos: Copiar departamento_id actual a la tabla M2M y asignar institucion_id
        print("Migrando datos de aulas...")
        try:
            aulas = db.execute(text("SELECT id, departamento_id FROM aulas")).fetchall()
            
            for aula_id, old_dept_id in aulas:
                if old_dept_id:
                    print(f"  Aula {aula_id} -> Depto {old_dept_id}")
                    # Insertar en M2M
                    db.execute(text("INSERT INTO aula_departamento (aula_id, departamento_id) VALUES (:aid, :did) ON CONFLICT DO NOTHING"), 
                               {"aid": aula_id, "did": old_dept_id})
                    
                    # Buscar institucion_id del departamento
                    inst = db.execute(text("SELECT institucion_id FROM departamentos WHERE id = :did"), {"did": old_dept_id}).fetchone()
                    if inst and inst[0]:
                        db.execute(text("UPDATE aulas SET institucion_id = :iid WHERE id = :aid"), {"iid": inst[0], "aid": aula_id})
        except Exception as e:
            print(f"Nota: Error al migrar datos (tal vez ya se migró o departamento_id no existe): {e}")
            db.rollback()

        # 5. Hacer que departamento_id pueda ser NULL o eliminarlo
        print("Opcional: Permitiendo departamento_id NULL en aulas...")
        try:
            db.execute(text("ALTER TABLE aulas ALTER COLUMN departamento_id DROP NOT NULL"))
        except:
            db.rollback()
        
        db.commit()
        print("Migración completada exitosamente.")
    except Exception as e:
        print(f"Error crítico durante la migración: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    migrate()
