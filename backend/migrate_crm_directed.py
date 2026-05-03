import os
from sqlalchemy import create_engine, text

# URL para conectar desde Windows al puerto mapeado por Docker
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://horarios_user:horarios123@localhost/horarios")
engine = create_engine(DATABASE_URL)

def migrate():
    with engine.connect() as conn:
        print("Verificando tabla comunicaciones...")
        check_query = text("SELECT column_name FROM information_schema.columns WHERE table_name='comunicaciones' AND column_name='destinatario_id'")
        result = conn.execute(check_query).fetchone()
        
        if not result:
            print("Añadiendo columna destinatario_id a comunicaciones...")
            try:
                conn.execute(text("ALTER TABLE comunicaciones ADD COLUMN destinatario_id INTEGER REFERENCES usuarios(id)"))
                conn.commit()
                print("Columna añadida con éxito.")
            except Exception as e:
                print(f"Error: {e}")
        else:
            print("La columna destinatario_id ya existe.")

if __name__ == "__main__":
    migrate()
