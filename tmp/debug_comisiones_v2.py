import os
import sys
from sqlalchemy import create_engine, text

# Try to connect to localhost first
DATABASE_URL = "postgresql://horarios_user:horarios123@localhost:5432/horarios"

engine = create_engine(DATABASE_URL)

def check_structure():
    with engine.connect() as conn:
        print("--- COMISIONES ---")
        try:
            res = conn.execute(text("SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'comisiones'")).fetchall()
            for r in res:
                print(r)
            
            print("\n--- SAMPLE COMISIONES (Checking NULLs) ---")
            res = conn.execute(text("SELECT id, codigo, created_at, updated_at FROM comisiones LIMIT 5")).fetchall()
            for r in res:
                print(r)
        except Exception as e:
            print(f"Error checking comisiones: {e}")

        print("\n--- MATERIAS ---")
        try:
            res = conn.execute(text("SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'materias'")).fetchall()
            for r in res:
                print(r)
        except Exception as e:
            print(f"Error checking materias: {e}")

if __name__ == "__main__":
    check_structure()
