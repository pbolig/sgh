from database import engine
from sqlalchemy import text

def total_migration():
    with engine.connect() as conn:
        print("--- INICIANDO MIGRACION TOTAL A ISET 57 (Inst 1) ---")
        
        # Mover Departamentos
        conn.execute(text("UPDATE departamentos SET institucion_id = 1 WHERE institucion_id = 2"))
        
        # Mover Carreras
        conn.execute(text("UPDATE carreras SET institucion_id = 1 WHERE institucion_id = 2"))
        
        # Mover Docentes
        conn.execute(text("UPDATE docentes SET institucion_id = 1 WHERE institucion_id = 2"))
        conn.execute(text("UPDATE docente_institucion SET institucion_id = 1 WHERE institucion_id = 2"))
        
        # Mover Calendarios
        conn.execute(text("UPDATE calendarios SET institucion_id = 1 WHERE institucion_id = 2"))
        
        # Mover Usuarios (para que todos los que estaban en Comercio ahora sean de ISET)
        conn.execute(text("UPDATE usuarios SET institucion_id = 1 WHERE institucion_id = 2"))
        
        # Mover Aulas
        conn.execute(text("UPDATE aulas SET institucion_id = 1 WHERE institucion_id = 2"))
        
        # Mover materias (por si hay alguna huerfana con institucion_id directo, aunque se rigen por depto)
        # conn.execute(text("UPDATE materias SET institucion_id = 1 WHERE institucion_id = 2")) # Si existiera la columna

        conn.commit()
        print("--- MIGRACION TOTAL COMPLETADA: ISET 57 ES AHORA EL DUEÑO DE TODO ---")

if __name__ == "__main__":
    total_migration()
