import os
from sqlalchemy import create_engine, text

# Try to connect to localhost first
DATABASE_URL = "postgresql://horarios_user:horarios123@localhost:5432/horarios"

engine = create_engine(DATABASE_URL)

def check_structure():
    with engine.connect() as conn:
        with open("c:/DiscoD/Pato/Desarrollos/horarios/tmp/db_report.txt", "w") as f:
            f.write("--- COMISIONES COLUMNS ---\n")
            res = conn.execute(text("SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'comisiones'")).fetchall()
            for r in res:
                f.write(f"{r}\n")
            
            f.write("\n--- COMISIONES DATA SAMPLE ---\n")
            try:
                res = conn.execute(text("SELECT * FROM comisiones LIMIT 3")).fetchall()
                for r in res:
                    f.write(f"{r}\n")
            except Exception as e:
                f.write(f"Error reading data: {e}\n")

            f.write("\n--- MATERIAS COLUMNS ---\n")
            res = conn.execute(text("SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'materias'")).fetchall()
            for r in res:
                f.write(f"{r}\n")

if __name__ == "__main__":
    check_structure()
