import os
from sqlalchemy import create_engine, text

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://horarios_user:horarios123@localhost/horarios")
engine = create_engine(DATABASE_URL)

def restore_admin():
    try:
        with engine.connect() as conn:
            print("Restaurando rol global al usuario admin...")
            conn.execute(text("UPDATE usuarios SET rol = 'admin', institucion_id = NULL WHERE username = 'admin'"))
            conn.commit()
            print("¡Hecho! El usuario admin ahora tiene acceso global.")
            
            # Verificación final
            user = conn.execute(text("SELECT username, rol, institucion_id FROM usuarios WHERE username = 'admin'")).fetchone()
            print(f"Estado final -> Usuario: {user[0]}, Rol: {user[1]}, Inst_ID: {user[2]}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    restore_admin()
