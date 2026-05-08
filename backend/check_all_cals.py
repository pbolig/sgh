from database import engine
from sqlalchemy import text

def check_all():
    with engine.connect() as conn:
        print("--- ALL CALENDARS AND EVENT COUNTS ---")
        res = conn.execute(text("""
            SELECT c.id, c.nombre, c.departamento_id, d.nombre as depto_nombre, COUNT(e.id) as event_count
            FROM calendarios c
            LEFT JOIN departamentos d ON c.departamento_id = d.id
            LEFT JOIN calendario_eventos e ON c.id = e.calendario_id
            GROUP BY c.id, c.nombre, c.departamento_id, d.nombre
            ORDER BY event_count DESC
        """)).fetchall()
        for r in res:
            print(f"ID: {r[0]} | Name: {r[1]} | Depto: {r[3]} (ID {r[2]}) | Events: {r[4]}")

if __name__ == "__main__":
    check_all()
