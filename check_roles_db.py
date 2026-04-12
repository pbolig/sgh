# check_roles_db.py
from sqlalchemy import text
from database import SessionLocal

def check():
    db = SessionLocal()
    try:
        print("--- Estructura de la tabla roles ---")
        cols = db.execute(text("SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'roles'")).fetchall()
        for c in cols:
            print(c)
            
        print("\n--- Índices y Constraints ---")
        indexes = db.execute(text("SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'roles'")).fetchall()
        for i in indexes:
            print(i)
            
    finally:
        db.close()

if __name__ == "__main__":
    check()
