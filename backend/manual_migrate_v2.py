import os
from sqlalchemy import create_engine, text

# URL para conectar desde Windows al puerto mapeado por Docker
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://horarios_user:horarios123@localhost/horarios")
engine = create_engine(DATABASE_URL)

def migrate():
    with engine.connect() as conn:
        print("--- Iniciando migración de esquema ---")
        
        # 1. Añadir email a usuarios
        print("Verificando tabla usuarios...")
        check_user = text("SELECT column_name FROM information_schema.columns WHERE table_name='usuarios' AND column_name='email'")
        if not conn.execute(check_user).fetchone():
            print("Añadiendo columna email a usuarios...")
            conn.execute(text("ALTER TABLE usuarios ADD COLUMN email VARCHAR(255)"))
            conn.commit()
        else:
            print("Columna email ya existe en usuarios.")

        # 2. Añadir usuario_id a docentes
        print("Verificando tabla docentes...")
        check_docente = text("SELECT column_name FROM information_schema.columns WHERE table_name='docentes' AND column_name='usuario_id'")
        if not conn.execute(check_docente).fetchone():
            print("Añadiendo columna usuario_id a docentes...")
            conn.execute(text("ALTER TABLE docentes ADD COLUMN usuario_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL"))
            conn.commit()
        else:
            print("Columna usuario_id ya existe en docentes.")

        print("--- Migración completada con éxito ---")

if __name__ == "__main__":
    migrate()
