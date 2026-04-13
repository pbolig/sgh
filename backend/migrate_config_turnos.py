import os
os.environ['DATABASE_URL'] = 'postgresql://horarios_user:horarios123@localhost/horarios'
from database import SessionLocal
from sqlalchemy import text

db = SessionLocal()
try:
    print("Creating config_turnos table...")
    db.execute(text("""
        CREATE TABLE IF NOT EXISTS config_turnos (
            id SERIAL PRIMARY KEY,
            departamento_id INTEGER NOT NULL REFERENCES departamentos(id) ON DELETE CASCADE,
            turno VARCHAR(50) NOT NULL,
            dia_semana VARCHAR(50) NOT NULL,
            hora_inicio VARCHAR(10) NOT NULL,
            secuencia JSONB NOT NULL,
            UNIQUE(departamento_id, turno, dia_semana)
        )
    """))
    db.commit()
    print("Migration successful.")
except Exception as e:
    print(f"Error: {e}")
    db.rollback()
finally:
    db.close()
