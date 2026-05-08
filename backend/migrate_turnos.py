from database import engine
from sqlalchemy import text

def migrate():
    with engine.connect() as conn:
        print("Adding column turnos_activos to instituciones...")
        conn.execute(text("ALTER TABLE instituciones ADD COLUMN IF NOT EXISTS turnos_activos VARCHAR DEFAULT 'mañana,tarde,noche'"))
        conn.commit()
        print("Done.")

if __name__ == "__main__":
    migrate()
