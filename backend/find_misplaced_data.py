from database import engine
from sqlalchemy import text

def find_misplaced_data():
    with engine.connect() as conn:
        print("--- BUSCANDO MATERIAS POR NOMBRE ---")
        # Buscar materias que suenen a las carreras de ISET 57
        res = conn.execute(text("""
            SELECT m.id, m.nombre, d.nombre as depto, i.nombre as inst, i.id as inst_id
            FROM materias m
            LEFT JOIN departamentos d ON m.departamento_id = d.id
            LEFT JOIN instituciones i ON d.institucion_id = i.id
            WHERE m.nombre ILIKE '%ENFERMERIA%' 
               OR m.nombre ILIKE '%HIGIENE%' 
               OR m.nombre ILIKE '%DIGITALES%'
               OR m.nombre ILIKE '%SUJETO%'
               OR m.nombre ILIKE '%SALUD%'
        """)).fetchall()
        for r in res:
            print(f"Materia: {r[1]} | Depto: {r[2]} | Inst: {r[3]} (ID {r[4]})")

if __name__ == "__main__":
    find_misplaced_data()
