from database import engine
from sqlalchemy import text

def migrate():
    with engine.connect() as conn:
        print("Ensuring turnos_activos is set for all institutions...")
        conn.execute(text("UPDATE instituciones SET turnos_activos = 'mañana,tarde,noche' WHERE turnos_activos IS NULL"))
        conn.commit()
        print("Done.")

if __name__ == "__main__":
    migrate()
