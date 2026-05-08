from database import engine
from sqlalchemy import text

def list_carreras(inst_id):
    with engine.connect() as conn:
        print(f"--- CARRERAS INST {inst_id} ---")
        res = conn.execute(text(f"SELECT id, nombre FROM carreras WHERE institucion_id = {inst_id}")).fetchall()
        for r in res:
            print(f"ID: {r[0]} | Nombre: {r[1]}")

if __name__ == "__main__":
    list_carreras(2)
