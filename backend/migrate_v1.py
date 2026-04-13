import os
os.environ['DATABASE_URL'] = 'postgresql://horarios_user:horarios123@localhost/horarios'
from database import SessionLocal
from sqlalchemy import text

db = SessionLocal()
try:
    # 1. Add aula_id to cargo_horarios
    print("Adding aula_id to cargo_horarios...")
    db.execute(text("ALTER TABLE cargo_horarios ADD COLUMN IF NOT EXISTS aula_id INTEGER REFERENCES aulas(id)"))
    
    # 2. Adjust shifts for Inst 57 (Noche starts at 18:30)
    print("Adjusting shifts for modules 15 and 16 to 'noche'...")
    db.execute(text("UPDATE modulos_horario SET turno = 'noche' WHERE id IN (15, 16)"))
    
    db.commit()
    print("Database migration and shift adjustment successful.")
except Exception as e:
    print(f"Error during migration: {e}")
    db.rollback()
finally:
    db.close()
