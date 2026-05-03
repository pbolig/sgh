import os
from sqlalchemy import create_engine, text

# URL para conectar desde Windows al puerto mapeado por Docker
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://horarios_user:horarios123@localhost/horarios")
engine = create_engine(DATABASE_URL)

def diagnostic():
    try:
        with engine.connect() as conn:
            print("--- DIAGNÓSTICO DE EMERGENCIA ---")
            tables = ['usuarios', 'docentes', 'instituciones', 'materias', 'comisiones', 'comunicaciones']
            for table in tables:
                try:
                    count = conn.execute(text(f"SELECT count(*) FROM {table}")).scalar()
                    print(f"Tabla '{table}': {count} registros")
                except Exception as e:
                    print(f"Error en tabla '{table}': {e}")
            print("--- FIN DEL DIAGNÓSTICO ---")
    except Exception as e:
        print(f"No se pudo conectar a la base de datos: {e}")

if __name__ == "__main__":
    diagnostic()
