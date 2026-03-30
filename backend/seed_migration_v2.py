import os
from sqlalchemy import create_engine, text

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://horarios_user:horarios123@db/horarios")
engine = create_engine(DATABASE_URL)

def seed_data():
    with engine.connect() as conn:
        print("Iniciando vinculación de datos...")
        
        # 1. Crear institución por defecto
        conn.execute(text("INSERT INTO instituciones (nombre, codigo, descripcion, activo) VALUES ('Sede Central', 'SC', 'Institución principal', 1) ON CONFLICT (codigo) DO NOTHING"))
        conn.commit()
        
        res = conn.execute(text("SELECT id FROM instituciones WHERE codigo = 'SC'")).fetchone()
        inst_id = res[0]
        print(f"ID Institución 'Sede Central': {inst_id}")
        
        # 2. Vincular Usuarios, Departamentos y Docentes a la Sede Central
        conn.execute(text(f"UPDATE usuarios SET institucion_id = {inst_id} WHERE institucion_id IS NULL"))
        conn.execute(text(f"UPDATE departamentos SET institucion_id = {inst_id} WHERE institucion_id IS NULL"))
        conn.execute(text(f"UPDATE docentes SET institucion_id = {inst_id} WHERE institucion_id IS NULL"))
        conn.commit()
        
        # 3. Vincular Calendarios a un departamento (el primero que encontremos si no hay)
        res_dept = conn.execute(text("SELECT id FROM departamentos LIMIT 1")).fetchone()
        if res_dept:
            dept_id = res_dept[0]
            conn.execute(text(f"UPDATE calendarios SET departamento_id = {dept_id} WHERE departamento_id IS NULL"))
            conn.execute(text(f"UPDATE cargos SET departamento_id = {dept_id} WHERE departamento_id IS NULL"))
            conn.execute(text(f"UPDATE cargo_asignaciones SET departamento_id = {dept_id} WHERE departamento_id IS NULL"))
            conn.commit()
            print(f"Vinculados registros huérfanos al departamento ID: {dept_id}")
            
        print("Vinculación finalizada.")

if __name__ == "__main__":
    seed_data()
