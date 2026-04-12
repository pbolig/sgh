import os
os.environ['DATABASE_URL'] = 'postgresql://horarios_user:horarios123@localhost/horarios'
from database import SessionLocal
import models
from sqlalchemy import text

db = SessionLocal()
try:
    # Fix 'mañana' in modulos_horario
    # Use pattern matching to catch any corrupted middle char
    db.execute(text("UPDATE modulos_horario SET turno = 'mañana' WHERE turno ~ '^ma.*ana$'"))
    
    # Fix 'miércoles' and 'sábado' in all tables
    tables_days = [
        ('asignaciones', 'dia_semana'),
        ('recreos_excluidos', 'dia_semana'),
        ('cargo_horarios', 'dia_semana')
    ]
    
    for table, col in tables_days:
        db.execute(text(f"UPDATE {table} SET {col} = 'miércoles' WHERE {col} ~ '^mi.*rcoles$'"))
        db.execute(text(f"UPDATE {table} SET {col} = 'sábado' WHERE {col} ~ '^s.*bado$'"))
        db.execute(text(f"UPDATE {table} SET {col} = 'miércoles' WHERE {col} = 'miercoles'")) # Catch plain one too
    
    db.commit()
    print("Database encoding cleanup completed successfully.")
    
    # Verify counts
    res = db.execute(text("SELECT turno, COUNT(*) FROM modulos_horario GROUP BY turno")).fetchall()
    print(f"Post-fix turns count: {res}")
    
except Exception as e:
    print(f"Error fixing encoding: {e}")
    db.rollback()
finally:
    db.close()
