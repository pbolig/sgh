from database import engine
from sqlalchemy import text

def move_data_to_iset():
    with engine.connect() as conn:
        print("--- MOVIENDO DATOS DE INST 2 (Comercio) A INST 1 (ISET 57) ---")
        
        # 1. Mover Departamentos
        conn.execute(text("UPDATE departamentos SET institucion_id = 1 WHERE institucion_id = 2"))
        
        # 2. Mover Carreras
        conn.execute(text("UPDATE carreras SET institucion_id = 1 WHERE institucion_id = 2"))
        
        # 3. Mover Docentes (relación directa)
        conn.execute(text("UPDATE docentes SET institucion_id = 1 WHERE institucion_id = 2"))
        
        # 4. Mover Docentes (relación M2M)
        conn.execute(text("UPDATE docente_institucion SET institucion_id = 1 WHERE institucion_id = 2"))
        
        # 5. Mover Calendarios
        conn.execute(text("UPDATE calendarios SET institucion_id = 1 WHERE institucion_id = 2"))
        
        # 6. Mover Aulas (si las hay vinculadas a la institucion)
        conn.execute(text("UPDATE aulas SET institucion_id = 1 WHERE institucion_id = 2"))

        conn.commit()
        print("--- DATOS MOVIDOS CON EXITO ---")

if __name__ == "__main__":
    move_data_to_iset()
