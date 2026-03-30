import os
from sqlalchemy import create_engine, text
from sqlalchemy.exc import InternalError, ProgrammingError

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://horarios_user:horarios123@db/horarios")
# Si falla por "db" no resoluble (fuera de docker), intentar localhost si el puerto está mapeado
# Pero lo ideal es que el usuario lo corra dentro del contenedor o yo lo corra si tengo acceso.

engine = create_engine(DATABASE_URL)

migrations = [
    # Tabla usuarios: institucion_id
    "ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS institucion_id INTEGER REFERENCES instituciones(id) ON DELETE SET NULL",
    
    # Tabla departamentos: institucion_id
    "ALTER TABLE departamentos ADD COLUMN IF NOT EXISTS institucion_id INTEGER REFERENCES instituciones(id) ON DELETE CASCADE",
    
    # Tabla docentes: institucion_id
    "ALTER TABLE docentes ADD COLUMN IF NOT EXISTS institucion_id INTEGER REFERENCES instituciones(id) ON DELETE CASCADE",
    
    # Tabla calendarios: departamento_id (si no existía)
    "ALTER TABLE calendarios ADD COLUMN IF NOT EXISTS departamento_id INTEGER REFERENCES departamentos(id) ON DELETE CASCADE",
    
    # Tabla cargos: departamento_id (No estaba en models.py al principio, pero lo agregué)
    "ALTER TABLE cargos ADD COLUMN IF NOT EXISTS departamento_id INTEGER REFERENCES departamentos(id) ON DELETE CASCADE",
    
    # Tabla cargo_asignaciones: departamento_id
    "ALTER TABLE cargo_asignaciones ADD COLUMN IF NOT EXISTS departamento_id INTEGER REFERENCES departamentos(id) ON DELETE CASCADE",

    # Tabla recreos_excluidos: departamento_id
    "ALTER TABLE recreos_excluidos ADD COLUMN IF NOT EXISTS departamento_id INTEGER REFERENCES departamentos(id) ON DELETE CASCADE",
    
    # Tabla materias: departamento_id (ya debería estar, pero por las dudas)
    "ALTER TABLE materias ADD COLUMN IF NOT EXISTS departamento_id INTEGER REFERENCES departamentos(id) ON DELETE CASCADE",

    # Tabla aulas: departamento_id
    "ALTER TABLE aulas ADD COLUMN IF NOT EXISTS departamento_id INTEGER REFERENCES departamentos(id) ON DELETE CASCADE",
]

def run_migrations():
    with engine.connect() as conn:
        print("Iniciando migraciones manuales...")
        for m in migrations:
            try:
                conn.execute(text(m))
                conn.commit()
                print(f"Ejecutado: {m}")
            except Exception as e:
                print(f"Error en {m}: {e}")
        print("Migraciones finalizadas.")

if __name__ == "__main__":
    run_migrations()
