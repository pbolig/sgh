from database import engine
from sqlalchemy import text

def deep_search_iset():
    with engine.connect() as conn:
        print("--- BUSQUEDA EXHAUSTIVA ISET 57 (Depts 8, 9, 10) ---")
        
        # 1. Buscar Asignaciones (Horarios)
        res_asig = conn.execute(text("SELECT COUNT(*) FROM asignaciones WHERE departamento_id IN (8, 9, 10)")).fetchone()
        print(f"Asignaciones encontradas: {res_asig[0]}")
        
        # 2. Buscar Eventos de Calendario (de cualquier año)
        res_ev = conn.execute(text("SELECT COUNT(*) FROM calendario_eventos WHERE departamento_id IN (8, 9, 10)")).fetchone()
        print(f"Eventos de calendario encontrados: {res_ev[0]}")
        
        # 3. Buscar Materias
        res_mat = conn.execute(text("SELECT COUNT(*) FROM materias WHERE departamento_id IN (8, 9, 10)")).fetchone()
        print(f"Materias encontradas: {res_mat[0]}")

        # 4. Buscar Docentes vinculados
        res_doc = conn.execute(text("SELECT COUNT(*) FROM docente_departamento WHERE departamento_id IN (8, 9, 10)")).fetchone()
        print(f"Docentes vinculados: {res_doc[0]}")

if __name__ == "__main__":
    deep_search_iset()
