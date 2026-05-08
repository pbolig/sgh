from database import engine
from sqlalchemy import text

def final_alignment():
    with engine.connect() as conn:
        print("--- INICIANDO ALINEACION FINAL PARA PRODUCCION ---")
        
        # 1. FUSION DE CALENDARIOS (Asegurar que ISET tenga solo uno con datos)
        print("Fusing calendars...")
        conn.execute(text("UPDATE calendarios SET institucion_id = 1 WHERE id IN (1, 3)"))
        conn.execute(text("UPDATE calendario_eventos SET calendario_id = 1 WHERE calendario_id = 3"))
        conn.execute(text("DELETE FROM calendarios WHERE id = 3"))

        # 2. LIMPIEZA DE CATEGORIAS
        print("Deduplicating categories...")
        res_cats = conn.execute(text("SELECT nombre, ARRAY_AGG(id) FROM calendario_categorias WHERE calendario_id = 1 GROUP BY nombre")).fetchall()
        for nombre, ids in res_cats:
            if len(ids) > 1:
                survivor_id = ids[0]
                for red_id in ids[1:]:
                    conn.execute(text(f"UPDATE calendario_eventos SET categoria_id = {survivor_id} WHERE categoria_id = {red_id}"))
                    conn.execute(text(f"DELETE FROM calendario_categorias WHERE id = {red_id}"))

        # 3. ORGANIZACION DE AULAS
        print("Organizing classrooms...")
        conn.execute(text("UPDATE aulas SET institucion_id = 2 WHERE nombre IN ('Aula 1', 'Aula 2', 'Aula 3')"))
        conn.execute(text("UPDATE aulas SET institucion_id = 1 WHERE nombre NOT IN ('Aula 1', 'Aula 2', 'Aula 3')"))

        # 4. ORGANIZACION DE DOCENTES (Bolig, Baro, Genovesi)
        print("Organizing teachers...")
        conn.execute(text("DELETE FROM docente_institucion"))
        docentes_iset = conn.execute(text("SELECT id FROM docentes WHERE apellido ILIKE '%Bolig%' OR apellido ILIKE '%Baro%' OR apellido ILIKE '%Genovesi%'")).fetchall()
        for (d_id,) in docentes_iset:
            conn.execute(text(f"INSERT INTO docente_institucion (docente_id, institucion_id) VALUES ({d_id}, 1)"))
            conn.execute(text(f"UPDATE docentes SET institucion_id = 1 WHERE id = {d_id}"))
            conn.execute(text(f"UPDATE cargo_asignaciones SET departamento_id = 10 WHERE docente_id = {d_id} AND departamento_id = 1"))

        # El resto de docentes a la Inst 2
        docentes_com = conn.execute(text("SELECT id FROM docentes WHERE institucion_id != 1 OR institucion_id IS NULL")).fetchall()
        for (d_id,) in docentes_com:
            conn.execute(text(f"INSERT INTO docente_institucion (docente_id, institucion_id) VALUES ({d_id}, 2)"))
            conn.execute(text(f"UPDATE docentes SET institucion_id = 2 WHERE id = {d_id}"))

        # 5. PRIVACIDAD DE DEPARTAMENTOS
        print("Setting department privacy...")
        conn.execute(text("UPDATE departamentos SET institucion_id = 1 WHERE id IN (8, 9, 10)"))
        conn.execute(text("UPDATE departamentos SET institucion_id = 2 WHERE id = 1"))

        conn.commit()
        print("--- ALINEACION FINAL COMPLETADA CON EXITO ---")

if __name__ == "__main__":
    final_alignment()
