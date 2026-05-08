from database import engine
from sqlalchemy import text

def surgical_fix():
    with engine.connect() as conn:
        print("--- INICIANDO AJUSTE QUIRURGICO DE DATOS (V2) ---")
        
        # 1. Mover Aulas (Excepto Aula 1, 2, 3) al ISET 57 (Inst 1)
        conn.execute(text("""
            UPDATE aulas 
            SET institucion_id = 1 
            WHERE nombre NOT IN ('Aula 1', 'Aula 2', 'Aula 3')
        """))
        
        # 2. Mover Docentes específicos al ISET 57
        docentes_iset = ['Bolig', 'Baro', 'Genovesi']
        for doc in docentes_iset:
            conn.execute(text(f"UPDATE docentes SET institucion_id = 1 WHERE apellido ILIKE '%{doc}%'"))
            # Tambien en la tabla de relacion
            conn.execute(text(f"""
                UPDATE docente_institucion 
                SET institucion_id = 1 
                WHERE docente_id IN (SELECT id FROM docentes WHERE apellido ILIKE '%{doc}%')
            """))

        # 3. Asegurar que sus Cargos esten en departamentos de ISET (8, 9 o 10)
        # Si estaban en el Depto 1 (Tecnologia), los movemos al 10 (Tecnicas Digitales) por ejemplo
        conn.execute(text(f"""
            UPDATE cargo_asignaciones 
            SET departamento_id = 10 
            WHERE departamento_id = 1 
            AND docente_id IN (SELECT id FROM docentes WHERE apellido ILIKE '%Bolig%' OR apellido ILIKE '%Baro%' OR apellido ILIKE '%Genovesi%')
        """))

        conn.commit()
        print("--- AJUSTE COMPLETADO ---")

if __name__ == "__main__":
    surgical_fix()
