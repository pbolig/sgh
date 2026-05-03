import os
from sqlalchemy import create_engine, text

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://horarios_user:horarios123@db/horarios")
engine = create_engine(DATABASE_URL)

tables = [
    "instituciones", "usuarios", "departamentos", "docentes", 
    "materias", "aulas", "comisiones", "asignaciones", 
    "cargo_asignaciones", "calendarios", "calendario_eventos"
]

def diagnose():
    print(f"Connecting to: {DATABASE_URL}")
    try:
        with engine.connect() as conn:
            print("\n--- Row Counts ---")
            for table in tables:
                try:
                    res = conn.execute(text(f"SELECT COUNT(*) FROM {table}"))
                    count = res.scalar()
                    print(f"{table}: {count}")
                except Exception as e:
                    print(f"{table}: ERROR ({e})")
            
            print("\n--- Instituciones ---")
            res = conn.execute(text("SELECT id, nombre, codigo FROM instituciones"))
            for row in res:
                print(f"ID: {row[0]}, Nombre: {row[1]}, Codigo: {row[2]}")

            print("\n--- Usuarios Recientes ---")
            res = conn.execute(text("SELECT id, username, rol, institucion_id FROM usuarios LIMIT 5"))
            for row in res:
                print(f"ID: {row[0]}, Username: {row[1]}, Rol: {row[2]}, InstID: {row[3]}")

    except Exception as e:
        print(f"CRITICAL ERROR: {e}")

if __name__ == "__main__":
    diagnose()
