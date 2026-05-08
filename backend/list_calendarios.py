from database import engine
from sqlalchemy import text

def list_cals():
    with engine.connect() as conn:
        print("--- CALENDARIOS ---")
        res = conn.execute(text("SELECT id, nombre, departamento_id, carrera_id FROM calendarios")).fetchall()
        for r in res:
            print(f"ID: {r[0]} | Nombre: {r[1]} | Depto: {r[2]} | Carrera: {r[3]}")

if __name__ == "__main__":
    list_cals()
