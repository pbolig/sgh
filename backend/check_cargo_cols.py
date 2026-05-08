from database import engine
from sqlalchemy import text

def check():
    with engine.connect() as conn:
        print("--- COLUMNS ON 'cargo_asignaciones' ---")
        res = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'cargo_asignaciones'")).fetchall()
        for r in res:
            print(f" - {r[0]}")

if __name__ == "__main__":
    check()
