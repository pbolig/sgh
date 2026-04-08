import os
import sys
from sqlalchemy import create_engine, text, inspect
from sqlalchemy.orm import sessionmaker
import datetime

# Asegurar que el path del backend esté disponible
sys.path.append(os.getcwd())

import models
from database import DATABASE_URL as ORIG_URL

# URL ajustada para local (localhost:5432)
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://horarios_user:horarios123@localhost:5432/horarios")

print(f"Conectando a {DATABASE_URL} para sincronización...")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def sync_schema():
    inspector = inspect(engine)
    db = SessionLocal()
    
    try:
        # Analizar todas las clases en el modelo
        for table_name, table_obj in models.Base.metadata.tables.items():
            print(f"Inspeccionando tabla: {table_name}")
            
            # Obtener columnas actuales en la DB
            existing_columns = {col['name']: col for col in inspector.get_columns(table_name)}
            
            # Comparar con las columnas definidas en el modelo SQLAlchemy
            for col_name, col_obj in table_obj.columns.items():
                if col_name not in existing_columns:
                    print(f"  FALTA COLUMNA: {col_name} en {table_name}")
                    
                    # Determinar el tipo SQL y el default
                    type_str = str(col_obj.type)
                    if "DATETIME" in type_str.upper() or "TIMESTAMP" in type_str.upper():
                        type_str = "TIMESTAMP"
                        default_val = "DEFAULT CURRENT_TIMESTAMP"
                    elif "INTEGER" in type_str.upper():
                        type_str = "INTEGER"
                        # Si tiene un default en el modelo, intentar usarlo
                        default_val = f"DEFAULT {col_obj.default.arg}" if col_obj.default else "DEFAULT NULL"
                    elif "VARCHAR" in type_str.upper() or "STRING" in type_str.upper():
                        type_str = "VARCHAR"
                        default_val = "DEFAULT NULL"
                    else:
                        type_str = "TEXT"
                        default_val = "DEFAULT NULL"
                    
                    # Ejecutar ALTER TABLE
                    sql = f"ALTER TABLE {table_name} ADD COLUMN {col_name} {type_str} {default_val}"
                    print(f"  Ejecutando: {sql}")
                    try:
                        db.execute(text(sql))
                        db.commit()
                        print(f"  ÉXITO: Columna {col_name} añadida.")
                    except Exception as e:
                        print(f"  ERROR al añadir columna {col_name}: {e}")
                        db.rollback()
                else:
                    # Opcional: Podríamos verificar cambios de tipo, pero por ahora solo faltantes.
                    pass

        print("\nSincronización de esquema finalizada.")
    except Exception as e:
        print(f"Error crítico durante la sincronización: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    sync_schema()
