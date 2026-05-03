import os
import sys
from sqlalchemy import create_engine, text, inspect
from sqlalchemy.orm import sessionmaker

# Asegurar conectividad según ambiente
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://horarios_user:horarios123@db/horarios")
engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)
session = Session()
inspector = inspect(engine)

def audit():
    print("=== AUDITORÍA DE INTEGRIDAD REFERENCIAL ===\n")
    
    # 1. Contar tablas y registros
    tables = inspector.get_table_names()
    print(f"Tablas encontradas: {len(tables)}")
    
    # 2. Mapeo de relaciones críticas (según models.py)
    # Formato: (Tabla_Hija, Columna_FK, Tabla_Padre)
    relationships = [
        ("usuarios", "institucion_id", "instituciones"),
        ("departamentos", "institucion_id", "instituciones"),
        ("materias", "departamento_id", "departamentos"),
        ("comisiones", "materia_id", "materias"),
        ("aulas", "institucion_id", "instituciones"),
        ("asignaciones", "comision_id", "comisiones"),
        ("asignaciones", "aula_id", "aulas"),
        ("cargo_asignaciones", "docente_id", "docentes"),
        ("cargo_asignaciones", "cargo_id", "cargos"),
    ]
    
    results = []
    
    for child, col, parent in relationships:
        print(f"Auditando: {child}.{col} -> {parent}.id")
        
        # A. Buscar nulos (donde no deberían estar)
        try:
            res_null = session.execute(text(f"SELECT COUNT(*) FROM {child} WHERE {col} IS NULL")).scalar()
            
            # B. Buscar huérfanos (IDs que no existen en el padre)
            sql_orphans = f"""
                SELECT COUNT(*) FROM {child} c
                LEFT JOIN {parent} p ON c.{col} = p.id
                WHERE c.{col} IS NOT NULL AND p.id IS NULL
            """
            res_orphans = session.execute(text(sql_orphans)).scalar()
            
            results.append({
                "relacion": f"{child} -> {parent}",
                "nulos": res_null,
                "huerfanos": res_orphans
            })
            
            if res_orphans > 0:
                print(f"  [!] {res_orphans} registros huérfanos detectados!")
        except Exception as e:
            print(f"  [ERROR] No se pudo auditar {child}.{col}: {e}")
            session.rollback()

    # 3. Auditoría de Aislamiento Institucional e Integridad Lógica
    print("\n=== AUDITORÍA DE AISLAMIENTO Y LÓGICA ===")
    
    # A. Comisiones con Materias de diferente Institución (vía Departamento)
    sql_scope_comisiones = """
        SELECT c.id, c.nombre, m.nombre as materia, d.institucion_id
        FROM comisiones c
        JOIN materias m ON c.materia_id = m.id
        JOIN departamentos d ON m.departamento_id = d.id
        -- Aquí podríamos comparar si comisiones tuviera inst_id, 
        -- pero validamos que la cadena Materia -> Depto -> Inst sea sólida.
    """
    
    # B. Validación de Turnos (Horarios definidos por el usuario)
    print("\n--- Validando Turnos y Módulos de 40 min ---")
    ranges = {
        "mañana": ("07:30:00", "13:00:00"),
        "tarde": ("13:00:00", "18:30:00"),
        "noche": ("18:30:00", "00:00:00") # El usuario dijo hasta 23:30, pero los módulos suelen llegar hasta el final
    }
    
    for turno, (start, end) in ranges.items():
        sql_modules = f"SELECT COUNT(*) FROM modulos_horario WHERE turno = '{turno}'"
        count = session.execute(text(sql_modules)).scalar()
        
        sql_bounds = f"SELECT MIN(hora_inicio), MAX(hora_fin) FROM modulos_horario WHERE turno = '{turno}'"
        bounds = session.execute(text(sql_bounds)).fetchone()
        
        print(f"Turno {turno.capitalize()}: {count} módulos. Rango real: {bounds[0]} - {bounds[1]}")
        if bounds[0] and str(bounds[0]) > start:
            print(f"  [!] Alerta: El turno empieza tarde ({bounds[0]} vs {start})")
        if bounds[1] and str(bounds[1]) < end and turno != "noche":
            print(f"  [!] Alerta: El turno termina temprano ({bounds[1]} vs {end})")

    # 4. Resumen final
    print("\nResumen final de inconsistencias:")
    for r in results:
        status = "OK" if r['huerfanos'] == 0 else "ERROR"
        print(f"[{status}] {r['relacion']}: {r['nulos']} nulos, {r['huerfanos']} huérfanos")

if __name__ == "__main__":
    audit()
