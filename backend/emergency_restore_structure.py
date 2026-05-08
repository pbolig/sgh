from database import engine
from sqlalchemy import text

def restore_structure():
    with engine.connect() as conn:
        print("--- RESTAURANDO ESTRUCTURA ORIGINAL (Manteniendo Calendarios en ISET) ---")
        
        # 1. Devolver Departamentos que no son de ISET (8, 9, 10) a la Inst 2
        conn.execute(text("UPDATE departamentos SET institucion_id = 2 WHERE id NOT IN (8, 9, 10)"))
        
        # 2. Devolver Carreras a la Inst 2 (ISET no tiene carreras segun vimos, solo deptos)
        conn.execute(text("UPDATE carreras SET institucion_id = 2"))
        
        # 3. Devolver Usuarios originales a la Inst 2 (Excepto Javier Rambaldo)
        # Buscamos a Javier por su username para dejarlo en la 1
        conn.execute(text("UPDATE usuarios SET institucion_id = 2 WHERE username != 'javierrambaldo'"))
        
        # 4. Devolver Docentes a la Inst 2
        # (ISET 57 tiene sus propios docentes, pero la mayoria estaban en la 2)
        conn.execute(text("UPDATE docentes SET institucion_id = 2"))
        conn.execute(text("UPDATE docente_institucion SET institucion_id = 2"))
        
        # 5. Mantenemos el CALENDARIO en la Inst 1 (ISET 57)
        # Pero limpiamos la vinculacion de los eventos con el Depto 1 (que ahora vuelve a la Inst 2)
        conn.execute(text("UPDATE calendario_eventos SET departamento_id = NULL WHERE departamento_id = 1"))
        
        # 6. Devolver Aulas a la Inst 2
        conn.execute(text("UPDATE aulas SET institucion_id = 2"))

        conn.commit()
        print("--- ESTRUCTURA RESTAURADA ---")

if __name__ == "__main__":
    restore_structure()
