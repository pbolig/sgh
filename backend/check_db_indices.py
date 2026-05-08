from database import engine
from sqlalchemy import text

def check():
    with engine.connect() as conn:
        print("--- INDICES ON 'comisiones' ---")
        res = conn.execute(text("SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'comisiones'")).fetchall()
        for r in res:
            print(f" - {r[0]}: {r[1]}")

if __name__ == "__main__":
    check()
