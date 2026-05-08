from database import engine
from sqlalchemy import text

def inspect_events():
    with engine.connect() as conn:
        print("--- TOP 10 EVENTS CALENDAR 1 ---")
        res = conn.execute(text("SELECT fecha, descripcion FROM calendario_eventos WHERE calendario_id = 1 LIMIT 10")).fetchall()
        for r in res:
            print(f"Date: {r[0]} | Desc: {r[1]}")

if __name__ == "__main__":
    inspect_events()
