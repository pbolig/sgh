from database import engine
from sqlalchemy import text

def check():
    with engine.connect() as conn:
        for cid in [1, 3]:
            res = conn.execute(text(f"SELECT COUNT(*) FROM calendario_eventos WHERE calendario_id = {cid}")).fetchone()
            print(f"Cal ID {cid}: {res[0]} events")

if __name__ == "__main__":
    check()
