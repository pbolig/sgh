from database import engine
from sqlalchemy import text

def check_materias():
    with engine.connect() as conn:
        print("--- MATERIAS ---")
        res = conn.execute(text("SELECT id, nombre, departamento_id, carrera_id FROM materias LIMIT 10")).fetchall()
        for r in res:
            print(f"ID: {r[0]} | Name: {r[1]} | DeptoID: {r[2]} | CarreraID: {r[3]}")

if __name__ == "__main__":
    check_materias()
