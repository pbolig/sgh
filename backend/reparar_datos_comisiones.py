import os
from sqlalchemy import create_engine, text
import datetime

# URL ajustada para local (localhost:5432)
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://horarios_user:horarios123@localhost:5432/horarios")

print(f"Conectando a {DATABASE_URL} para reparación de datos...")
engine = create_engine(DATABASE_URL)

def repair_data():
    with engine.connect() as conn:
        print("Reparando fechas en comisiones...")
        now = datetime.datetime.utcnow()
        try:
            # 1. Reparar updated_at y created_at nulos en todas las tablas críticas
            tables = ["comisiones", "materias", "asignaciones", "docentes", "aulas"]
            for table in tables:
                res = conn.execute(text(f"UPDATE {table} SET created_at = :now WHERE created_at IS NULL"), {"now": now})
                print(f"  {table}: {res.rowcount} filas con created_at NULL reparadas.")
                
                # Solo tablas que tienen updated_at en el modelo
                if table in ["comisiones", "asignaciones", "docentes", "cargos", "cargo_asignaciones"]:
                    try:
                        res = conn.execute(text(f"UPDATE {table} SET updated_at = :now WHERE updated_at IS NULL"), {"now": now})
                        print(f"  {table}: {res.rowcount} filas con updated_at NULL reparadas.")
                    except:
                        pass
            
            # 2. Reparar materia_id nulo en comisiones
            # Primero buscamos una materia válida para usar de fallback
            res = conn.execute(text("SELECT id FROM materias LIMIT 1")).fetchone()
            if res:
                fallback_materia_id = res[0]
                print(f"Usando Materia ID {fallback_materia_id} como fallback para comisiones huérfanas.")
                res = conn.execute(text("UPDATE comisiones SET materia_id = :mid WHERE materia_id IS NULL"), {"mid": fallback_materia_id})
                print(f"  comisiones: {res.rowcount} filas con materia_id NULL reparadas.")
            else:
                print("ADVERTENCIA: No se encontró ninguna materia para usar como fallback.")

            conn.commit()
            print("\nReparación de datos finalizada con éxito.")
        except Exception as e:
            print(f"Error durante la reparación: {e}")

if __name__ == "__main__":
    repair_data()
