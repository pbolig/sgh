from database import engine
from sqlalchemy import text

def list_cals():
    with engine.connect() as conn:
        print("--- CALENDARIOS INST 1 ---")
        res = conn.execute(text("SELECT id, nombre, institucion_id FROM calendarios WHERE institucion_id = 1")).fetchall()
        for r in res:
            print(f"ID: {r[0]} | Nombre: {r[1]} | InstID: {r[2]}")

if __name__ == "__main__":
    list_cals()
