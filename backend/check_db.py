import os
from sqlalchemy import create_engine, text

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://horarios_user:horarios123@db/horarios")
engine = create_engine(DATABASE_URL)

tables = ["usuarios", "departamentos", "docentes", "calendarios", "cargos", "cargo_asignaciones"]

def check_columns():
    with engine.connect() as conn:
        for table in tables:
            print(f"\n--- Columnas de {table} ---")
            res = conn.execute(text(f"SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '{table}'"))
            for col in res:
                print(f"{col[0]}: {col[1]}")

if __name__ == "__main__":
    check_columns()
