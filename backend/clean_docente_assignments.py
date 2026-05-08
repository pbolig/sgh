from database import engine
from sqlalchemy import text

def clean_docentes():
    with engine.connect() as conn:
        print("--- LIMPIANDO VINCULACIONES DE DOCENTES ---")
        
        # 1. Borrar todas las vinculaciones actuales para empezar de cero y limpio
        conn.execute(text("DELETE FROM docente_institucion"))
        
        # 2. Asignar Bolig, Baro y Genovesi al ISET 57 (Inst 1)
        docentes_iset = conn.execute(text("SELECT id FROM docentes WHERE apellido ILIKE '%Bolig%' OR apellido ILIKE '%Baro%' OR apellido ILIKE '%Genovesi%'")).fetchall()
        for (d_id,) in docentes_iset:
            conn.execute(text(f"INSERT INTO docente_institucion (docente_id, institucion_id) VALUES ({d_id}, 1)"))
            conn.execute(text(f"UPDATE docentes SET institucion_id = 1 WHERE id = {d_id}"))
            print(f"Docente ID {d_id} asignado a ISET 57")

        # 3. Asignar el RESTO de los docentes al Superior de Comercio (Inst 2)
        docentes_comercio = conn.execute(text("SELECT id FROM docentes WHERE id NOT IN (SELECT id FROM docentes WHERE apellido ILIKE '%Bolig%' OR apellido ILIKE '%Baro%' OR apellido ILIKE '%Genovesi%')")).fetchall()
        for (d_id,) in docentes_comercio:
            conn.execute(text(f"INSERT INTO docente_institucion (docente_id, institucion_id) VALUES ({d_id}, 2)"))
            conn.execute(text(f"UPDATE docentes SET institucion_id = 2 WHERE id = {d_id}"))
            print(f"Docente ID {d_id} asignado a Superior de Comercio")

        conn.commit()
        print("--- LIMPIEZA COMPLETADA ---")

if __name__ == "__main__":
    clean_docentes()
