from database import engine
from sqlalchemy import text

def check_all_asigs():
    with engine.connect() as conn:
        print("--- TOP 10 ASIGNACIONES ---")
        res = conn.execute(text("""
            SELECT a.id, a.departamento_id, d.nombre, d.institucion_id, i.nombre as inst_nombre
            FROM asignaciones a
            JOIN departamentos d ON a.departamento_id = d.id
            JOIN instituciones i ON d.institucion_id = i.id
            LIMIT 10
        """)).fetchall()
        for r in res:
            print(f"ID: {r[0]} | DeptoID: {r[1]} ({r[2]}) | InstID: {r[3]} ({r[4]})")

if __name__ == "__main__":
    check_all_asigs()
