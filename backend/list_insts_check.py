from database import engine
from sqlalchemy import text

def list_insts():
    with engine.connect() as conn:
        print("--- INSTITUCIONES ---")
        res = conn.execute(text("SELECT id, nombre FROM instituciones")).fetchall()
        for r in res:
            print(f"ID: {r[0]} | Nombre: {r[1]}")

if __name__ == "__main__":
    list_insts()
