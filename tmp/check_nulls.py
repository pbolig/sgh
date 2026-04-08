import os
from sqlalchemy import create_engine, text

# Try to connect to localhost first
DATABASE_URL = "postgresql://horarios_user:horarios123@localhost:5432/horarios"

engine = create_engine(DATABASE_URL)

def check_invalid_records():
    with engine.connect() as conn:
        with open("c:/DiscoD/Pato/Desarrollos/horarios/tmp/invalid_records.txt", "w") as f:
            f.write("--- CHECKING COMISIONES FOR NULLS IN REQUIRED FIELDS ---\n")
            # Requieren: codigo, materia_id, turno, created_at, updated_at
            res = conn.execute(text("""
                SELECT id, codigo, materia_id, turno, created_at, updated_at 
                FROM comisiones 
                WHERE codigo IS NULL 
                   OR materia_id IS NULL 
                   OR turno IS NULL 
                   OR created_at IS NULL 
                   OR updated_at IS NULL
            """)).fetchall()
            
            if not res:
                f.write("No comisiones with NULLs in required fields.\n")
            else:
                f.write(f"Found {len(res)} invalid comisiones:\n")
                for r in res:
                    f.write(f"{r}\n")
            
            f.write("\n--- CHECKING MATERIAS FOR NULLS ---\n")
            # Requieren: nombre, codigo, departamento_id
            res = conn.execute(text("""
                SELECT id, nombre, codigo, departamento_id 
                FROM materias 
                WHERE nombre IS NULL 
                   OR codigo IS NULL 
                   OR departamento_id IS NULL
            """)).fetchall()
            
            if not res:
                f.write("No materias with NULLs in required fields.\n")
            else:
                f.write(f"Found {len(res)} invalid materias:\n")
                for r in res:
                    f.write(f"{r}\n")

if __name__ == "__main__":
    check_invalid_records()
