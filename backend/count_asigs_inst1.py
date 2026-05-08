from database import engine
from sqlalchemy import text

def count_asigs(inst_id):
    with engine.connect() as conn:
        res = conn.execute(text(f"""
            SELECT COUNT(*) 
            FROM asignaciones a 
            JOIN comisiones c ON a.comision_id = c.id 
            JOIN materias m ON c.materia_id = m.id 
            WHERE m.institucion_id = {inst_id}
        """)).fetchone()
        print(f"Total Asignaciones Inst {inst_id}: {res[0]}")

if __name__ == "__main__":
    count_asigs(1)
