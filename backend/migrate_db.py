import os
from sqlalchemy import create_engine, text

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://horarios_user:horarios123@db/horarios")
engine = create_engine(DATABASE_URL)

queries = [
    "ALTER TABLE recreos_excluidos ADD COLUMN IF NOT EXISTS carrera_id INTEGER REFERENCES carreras(id) ON DELETE CASCADE;",
    "ALTER TABLE calendarios ADD COLUMN IF NOT EXISTS carrera_id INTEGER REFERENCES carreras(id) ON DELETE CASCADE;",
    # También asegurar que departamento_id sea nullable si es necesario
    "ALTER TABLE recreos_excluidos ALTER COLUMN departamento_id DROP NOT NULL;",
    "ALTER TABLE calendarios ALTER COLUMN departamento_id DROP NOT NULL;"
]

with engine.connect() as conn:
    for q in queries:
        try:
            conn.execute(text(q))
            print(f"Executed: {q}")
        except Exception as e:
            print(f"Error executing {q}: {e}")
    conn.commit()
