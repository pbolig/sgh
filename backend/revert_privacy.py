from database import engine
from sqlalchemy import text

def revert_privacy():
    with engine.connect() as conn:
        print("--- RESTAURANDO PRIVACIDAD: MOVIENDO TECNOLOGIA A INST 2 ---")
        
        # 1. Devolver el Departamento 1 (Tecnología) a la Institución 2
        conn.execute(text("UPDATE departamentos SET institucion_id = 2 WHERE id = 1"))
        
        # 2. Devolver Calendarios asociados al Depto 1
        conn.execute(text("UPDATE calendarios SET institucion_id = 2 WHERE departamento_id = 1"))
        
        # 3. Devolver Carreras de la Institucion 2 (si las movi por error)
        # (Voy a revisar si hay carreras que no sean de ISET 57)
        
        conn.commit()
        print("--- PRIVACIDAD RESTAURADA ---")

if __name__ == "__main__":
    revert_privacy()
