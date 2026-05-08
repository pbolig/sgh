from database import engine
from sqlalchemy import text

def check_dept(dept_id):
    with engine.connect() as conn:
        res = conn.execute(text(f"SELECT d.institucion_id, i.nombre FROM departamentos d JOIN instituciones i ON d.institucion_id = i.id WHERE d.id = {dept_id}")).fetchone()
        if res:
            print(f"Depto {dept_id} belongs to Inst {res[0]} ({res[1]})")
        else:
            print(f"Depto {dept_id} not found or no inst.")

if __name__ == "__main__":
    check_dept(1)
