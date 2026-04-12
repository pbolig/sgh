import os
os.environ['DATABASE_URL'] = 'postgresql://horarios_user:horarios123@localhost/horarios'
from database import SessionLocal
import models
from sqlalchemy import text

db = SessionLocal()
try:
    # Fix 'mañana' in modulos_horario
    db.execute(text("UPDATE modulos_horario SET turno = 'mañana' WHERE turno LIKE 'ma%ana'"))
    
    # Fix 'miércoles' in all tables
    tables = ['asignaciones', 'recreos_excluidos', 'cargo_horarios']
    for table in tables:
        db.execute(text(f"UPDATE {table} SET dia_semana = 'miércoles' WHERE dia_semana LIKE 'mi%rcoles'"))
    
    db.commit()
    print("Database encoding fix successfully applied.")
    
    # Verify
    mod_turns = db.execute(text("SELECT DISTINCT turno FROM modulos_horario")).fetchall()
    print(f"Verified turns: {mod_turns}")
    
    asig_days = db.execute(text("SELECT DISTINCT dia_semana FROM asignaciones")).fetchall()
    print(f"Verified assignment days: {asig_days}")

finally:
    db.close()
