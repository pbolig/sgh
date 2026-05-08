from database import engine
from sqlalchemy import text

def check():
    with engine.connect() as conn:
        print("--- CONSTRAINTS ON 'comisiones' ---")
        res = conn.execute(text("SELECT conname FROM pg_constraint WHERE conrelid = 'comisiones'::regclass")).fetchall()
        for r in res:
            print(f" - {r[0]}")
            
        print("\n--- COLUMNS ON 'instituciones' ---")
        res = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'instituciones'")).fetchall()
        for r in res:
            print(f" - {r[0]}")

if __name__ == "__main__":
    check()
