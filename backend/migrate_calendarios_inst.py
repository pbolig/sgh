from database import engine
from sqlalchemy import text

def migrate():
    with engine.connect() as conn:
        print("Adding column institucion_id to calendarios...")
        conn.execute(text("ALTER TABLE calendarios ADD COLUMN IF NOT EXISTS institucion_id INTEGER REFERENCES instituciones(id) ON DELETE CASCADE"))
        
        print("Populating institucion_id based on departments...")
        conn.execute(text("""
            UPDATE calendarios 
            SET institucion_id = d.institucion_id 
            FROM departamentos d 
            WHERE calendarios.departamento_id = d.id 
            AND calendarios.institucion_id IS NULL
        """))
        
        print("Populating institucion_id based on careers...")
        conn.execute(text("""
            UPDATE calendarios 
            SET institucion_id = c.institucion_id 
            FROM carreras c 
            WHERE calendarios.carrera_id = c.id 
            AND calendarios.institucion_id IS NULL
        """))
        
        conn.commit()
        print("Done.")

if __name__ == "__main__":
    migrate()
