import os
from sqlalchemy import create_engine, text

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://horarios_user:horarios123@localhost/horarios")
engine = create_engine(DATABASE_URL)

def check_visibility():
    try:
        with engine.connect() as conn:
            print("--- CHEQUEO DE VINCULACIÓN ---")
            
            # Ver instituciones
            insts = conn.execute(text("SELECT id, nombre FROM instituciones")).fetchall()
            print(f"Instituciones encontradas ({len(insts)}):")
            for i in insts:
                print(f"  - ID {i[0]}: {i[1]}")
            
            # Ver usuario actual
            user = conn.execute(text("SELECT id, username, rol, institucion_id FROM usuarios")).fetchone()
            if user:
                print(f"Usuario actual: ID {user[0]}, Username: {user[1]}, Rol: {user[2]}, Vinculado a Inst: {user[3]}")
                
                # Ver si hay datos en esa institución específica
                if user[3]:
                    doc_count = conn.execute(text(f"SELECT count(*) FROM docentes WHERE institucion_id = {user[3]}")).scalar()
                    print(f"Docentes en tu institución vinculada: {doc_count}")
                else:
                    print("AVISO: Tu usuario no tiene institucion_id asignada (es nula).")
            else:
                print("ERROR: No se encontró ningún usuario.")
                
            print("--- FIN DEL CHEQUEO ---")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_visibility()
