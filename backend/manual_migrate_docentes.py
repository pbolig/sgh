import os
from sqlalchemy import create_engine, text

# Detectar URL de base de datos
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://horarios_user:horarios123@localhost/horarios")
# Si falla localhost, podrías intentar con el host "db" si estás en docker, pero aquí probamos localhost primero
engine = create_engine(DATABASE_URL)

def migrate():
    with engine.connect() as conn:
        print("Verificando tabla docentes...")
        # Verificar si la columna ya existe
        check_query = text("SELECT column_name FROM information_schema.columns WHERE table_name='docentes' AND column_name='usuario_id'")
        result = conn.execute(check_query).fetchone()
        
        if not result:
            print("Añadiendo columna usuario_id a docentes...")
            try:
                conn.execute(text("ALTER TABLE docentes ADD COLUMN usuario_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL"))
                conn.commit()
                print("Migración completada con éxito.")
            except Exception as e:
                print(f"Error durante la migración: {e}")
        else:
            print("La columna usuario_id ya existe.")

if __name__ == "__main__":
    migrate()
