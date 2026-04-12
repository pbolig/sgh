import os
os.environ['DATABASE_URL'] = 'postgresql://horarios_user:horarios123@localhost/horarios'
from database import SessionLocal
from sqlalchemy import text

db = SessionLocal()
try:
    # Fix Modulos turns by ID (The most reliable way)
    db.execute(text("UPDATE modulos_horario SET turno = 'mañana' WHERE id IN (1,2,3,4,5,6,7)"))
    db.execute(text("UPDATE modulos_horario SET turno = 'tarde' WHERE id IN (8,9,10,11,12,13,14,15,16)"))
    db.execute(text("UPDATE modulos_horario SET turno = 'noche' WHERE id IN (17,18,19,20,21,22)"))
    
    # Fix Assignments and other tables based on pattern
    for table, col in [('asignaciones', 'dia_semana'), ('recreos_excluidos', 'dia_semana'), ('cargo_horarios', 'dia_semana')]:
        db.execute(text(f"UPDATE {table} SET {col} = 'miércoles' WHERE {col} LIKE 'mi%rcoles'"))
        db.execute(text(f"UPDATE {table} SET {col} = 'miércoles' WHERE {col} = 'miercoles'"))
        db.execute(text(f"UPDATE {table} SET {col} = 'sábado' WHERE {col} LIKE 's%bado'"))
        db.execute(text(f"UPDATE {table} SET {col} = 'sábado' WHERE {col} = 'sabado'"))

    db.commit()
    print("Database finalized successfully.")
    
    # Verify
    res = db.execute(text("SELECT DISTINCT turno FROM modulos_horario")).fetchall()
    print(f"Verified turns: {res}")
    
finally:
    db.close()
