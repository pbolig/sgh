from database import engine
from sqlalchemy import text

def list_users():
    with engine.connect() as conn:
        print("--- USUARIOS ---")
        res = conn.execute(text("SELECT username, institucion_id, rol FROM usuarios")).fetchall()
        for r in res:
            print(f"User: {r[0]} | InstID: {r[1]} | Rol: {r[2]}")

if __name__ == "__main__":
    list_users()
