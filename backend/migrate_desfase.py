import sqlalchemy
from sqlalchemy import create_engine, text
import os

# Intentar usar la URL de la base de datos local
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://horarios_user:horarios123@localhost:5432/horarios")
engine = create_engine(DATABASE_URL)

print(f"Conectando a {DATABASE_URL}...")

try:
    with engine.connect() as conn:
        # PostgreSQL syntax to add column if not exists
        sql = """
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                           WHERE table_name='config_turnos' AND column_name='desfase') THEN
                ALTER TABLE config_turnos ADD COLUMN desfase INTEGER DEFAULT 0;
            END IF;
        END $$;
        """
        conn.execute(text(sql))
        conn.commit()
        print("Migración completada exitosamente.")
except Exception as e:
    print(f"Error crítico durante la migración: {e}")
