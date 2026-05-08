from database import engine
from sqlalchemy import text

def count_evts():
    with engine.connect() as conn:
        res = conn.execute(text("SELECT COUNT(*) FROM calendario_eventos")).fetchone()
        print(f"Total Eventos en DB: {res[0]}")

if __name__ == "__main__":
    count_evts()
