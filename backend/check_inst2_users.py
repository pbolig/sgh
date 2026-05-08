from database import engine
from sqlalchemy import text

def check_inst2_users():
    with engine.connect() as conn:
        print("--- USUARIOS INST 2 ---")
        res = conn.execute(text("SELECT username, rol FROM usuarios WHERE institucion_id = 2")).fetchall()
        for r in res:
            print(f"User: {r[0]} | Rol: {r[1]}")

if __name__ == "__main__":
    check_inst2_users()
