from database import engine
from sqlalchemy import text

with engine.connect() as conn:
    print("Agregando columnas a la tabla docentes...")
    try:
        conn.execute(text("ALTER TABLE docentes ADD COLUMN IF NOT EXISTS situacion_revista VARCHAR DEFAULT 'interino'"))
        conn.execute(text("ALTER TABLE docentes ADD COLUMN IF NOT EXISTS es_temporal BOOLEAN DEFAULT FALSE"))
        conn.commit()
        print("Columnas agregadas exitosamente.")
    except Exception as e:
        print(f"Error o ya existían: {e}")
