from database import engine
from sqlalchemy import text

def count_iset_asigs():
    with engine.connect() as conn:
        res = conn.execute(text("SELECT COUNT(*) FROM asignaciones WHERE departamento_id IN (8, 9, 10)")).fetchone()
        print(f"Total Asignaciones ISET 57 (Depts 8, 9, 10): {res[0]}")

if __name__ == "__main__":
    count_iset_asigs()
