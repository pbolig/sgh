from database import engine
from sqlalchemy import text

def list_all_deptos():
    with engine.connect() as conn:
        print("--- DEPARTAMENTOS Y SUS INSTITUCIONES ---")
        res = conn.execute(text("""
            SELECT d.id, d.nombre, d.institucion_id, i.nombre as inst_nombre 
            FROM departamentos d 
            JOIN instituciones i ON d.institucion_id = i.id
            ORDER BY d.id
        """)).fetchall()
        for r in res:
            print(f"Depto ID: {r[0]} | Depto: {r[1]} | Inst ID: {r[2]} | Inst: {r[3]}")

if __name__ == "__main__":
    list_all_deptos()
