from database import engine
from sqlalchemy import text

def count_dept1():
    with engine.connect() as conn:
        res = conn.execute(text("SELECT COUNT(*) FROM asignaciones WHERE departamento_id = 1")).fetchone()
        print(f"Asignaciones Dept 1: {res[0]}")
        res2 = conn.execute(text("SELECT COUNT(*) FROM cargo_asignaciones WHERE departamento_id = 1")).fetchone()
        print(f"Cargos Dept 1: {res2[0]}")

if __name__ == "__main__":
    count_dept1()
