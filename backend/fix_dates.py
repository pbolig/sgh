import os
from sqlalchemy import create_engine, text

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://horarios_user:horarios123@db/horarios")
engine = create_engine(DATABASE_URL)

tables_with_dates = ["instituciones", "usuarios", "departamentos", "docentes", "materias", "aulas", "comisiones", "cargo_asignaciones"]

def fix_dates():
    with engine.connect() as conn:
        print("Iniciando corrección de fechas NULL...")
        for table in tables_with_dates:
            try:
                conn.execute(text(f"UPDATE {table} SET created_at = NOW() WHERE created_at IS NULL"))
                # Algunos no tienen updated_at (ej: materias, aulas, comisiones)
                res = conn.execute(text(f"SELECT column_name FROM information_schema.columns WHERE table_name = '{table}' AND column_name = 'updated_at'")).fetchone()
                if res:
                    conn.execute(text(f"UPDATE {table} SET updated_at = NOW() WHERE updated_at IS NULL"))
                conn.commit()
                print(f"Corregida tabla {table}")
            except Exception as e:
                print(f"Omitida tabla {table} (posiblemente no tiene las columnas): {e}")
        print("Corrección de fechas finalizada.")

if __name__ == "__main__":
    fix_dates()
