import psycopg2
import os
from urllib.parse import urlparse

def migrate():
    # Obtener la URL de la base de datos desde el entorno
    db_url = os.getenv("DATABASE_URL")
    
    if not db_url:
        print("Error: La variable de entorno DATABASE_URL no está configurada.")
        print("Ejemplo: $env:DATABASE_URL=\"postgresql://usuario:password@host:puerto/dbname\"")
        return

    print(f"Conectando a la base de datos para migración...")
    
    try:
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()
        
        # Lista de columnas a asegurar
        columns = [
            ("aula_id", "INTEGER REFERENCES aulas(id)"),
            ("comision_id", "INTEGER REFERENCES comisiones(id)"),
            ("modulo_id", "INTEGER REFERENCES modulos_horario(id)"),
            ("observaciones", "TEXT")
        ]
        
        for col_name, col_type in columns:
            print(f"Asegurando columna {col_name}...")
            cur.execute(f"ALTER TABLE cargo_horarios ADD COLUMN IF NOT EXISTS {col_name} {col_type};")
            
        conn.commit()
        print("✅ Migración completada exitosamente.")
        
    except Exception as e:
        print(f"❌ Error durante la migración: {e}")
    finally:
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    migrate()
