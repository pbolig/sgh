from database import engine
from sqlalchemy import text

def check_mismatched_events():
    with engine.connect() as conn:
        print("--- EVENTS IN ISET 57 DEPARTMENTS (8, 9, 10) ---")
        res = conn.execute(text("SELECT id, calendario_id, departamento_id, fecha, descripcion FROM calendario_eventos WHERE departamento_id IN (8, 9, 10)")).fetchall()
        for r in res:
            print(f"ID: {r[0]} | CalID: {r[1]} | DeptoID: {r[2]} | Date: {r[3]} | Desc: {r[4]}")

if __name__ == "__main__":
    check_mismatched_events()
