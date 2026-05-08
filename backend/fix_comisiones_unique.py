import os
from sqlalchemy import create_engine, text

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://horarios_user:horarios123@localhost/horarios")
engine = create_engine(DATABASE_URL)

def run_migration():
    with engine.connect() as conn:
        print("Eliminando restricción de unicidad global en comisiones.codigo...")
        # Intentar eliminar el índice único si existe
        conn.execute(text("DROP INDEX IF EXISTS ix_comisiones_codigo CASCADE;"))
        conn.execute(text("ALTER TABLE comisiones DROP CONSTRAINT IF EXISTS comisiones_codigo_key CASCADE;"))
        
        print("Creando nueva restricción de unicidad (materia_id, codigo)...")
        # Asegurarse de que no haya duplicados que impidan crear el índice (limpiar si es necesario, aunque en este caso el usuario dice que no los ve)
        
        # Crear el nuevo índice único
        conn.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS uix_comision_codigo_materia ON comisiones (materia_id, codigo);"))
        
        conn.commit()
        print("Migración completada.")

if __name__ == "__main__":
    run_migration()
