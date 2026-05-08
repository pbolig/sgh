from database import engine
from sqlalchemy import text

def check_events():
    with engine.connect() as conn:
        for cal_id in [2, 3, 4]:
            print(f"--- EVENTOS CALENDARIO {cal_id} ---")
            res = conn.execute(text(f"SELECT COUNT(*), departamento_id FROM calendario_eventos WHERE calendario_id = {cal_id} GROUP BY departamento_id")).fetchall()
            for r in res:
                print(f"Count: {r[0]} | DeptoID: {r[1]}")

if __name__ == "__main__":
    check_events()
