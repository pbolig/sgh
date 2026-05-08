from database import engine
from sqlalchemy import text

def check():
    with engine.connect() as conn:
        print("--- INDICES ON 'cargo_asignaciones' ---")
        res = conn.execute(text("SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'cargo_asignaciones'")).fetchall()
        for r in res:
            print(f" - {r[0]}: {r[1]}")

if __name__ == "__main__":
    check()
