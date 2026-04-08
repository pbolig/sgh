import os
import sys
from sqlalchemy import create_engine, text

def reorganizar():
    # URL de conexión local
    DATABASE_URL = "postgresql://horarios_user:horarios123@localhost:5432/horarios"
    engine = create_engine(DATABASE_URL)
    
    with engine.connect() as conn:
        print("Iniciando reorganización estructural por SQL...")
        
        # 1. Asignar comisiones C1 a Informática 1 (ID 146)
        conn.execute(text("UPDATE comisiones SET materia_id = 146 WHERE UPPER(codigo) LIKE 'C1%'"))
        print("  C1 -> Materia 146 vinculada.")
        
        # 2. Asignar comisiones C2 a Informática 2 (ID 148)
        conn.execute(text("UPDATE comisiones SET materia_id = 148 WHERE UPPER(codigo) LIKE 'C2%'"))
        print("  C2 -> Materia 148 vinculada.")
        
        # 3. Asignar comisiones C3 a Informática 3 (ID 149)
        conn.execute(text("UPDATE comisiones SET materia_id = 149 WHERE UPPER(codigo) LIKE 'C3%'"))
        print("  C3 -> Materia 149 vinculada.")
        
        # 4. Asignar comisiones C4 a Informática 4 (ID 150)
        conn.execute(text("UPDATE comisiones SET materia_id = 150 WHERE UPPER(codigo) LIKE 'C4%'"))
        print("  C4 -> Materia 150 vinculada.")
        
        # 5. Corregir turnos (Mañana si tiene M, Tarde si tiene T)
        conn.execute(text("UPDATE comisiones SET turno = 'mañana' WHERE UPPER(codigo) LIKE 'C%M%'"))
        print("  Turnos Mañana 'M' actualizados.")
        
        conn.execute(text("UPDATE comisiones SET turno = 'tarde' WHERE UPPER(codigo) LIKE 'C%T%'"))
        print("  Turnos Tarde 'T' actualizados.")
        
        # 6. Mover cualquier comisión que no sea "C" fuera del departamento TIC (ID 1)
        # Por defecto la movemos a una materia de ISET 57 (ej: ID 121 que es de Enfermería)
        conn.execute(text("""
            UPDATE comisiones SET materia_id = 121 
            WHERE NOT (UPPER(codigo) LIKE 'C1%' OR UPPER(codigo) LIKE 'C2%' OR UPPER(codigo) LIKE 'C3%' OR UPPER(codigo) LIKE 'C4%')
            AND materia_id IN (SELECT id FROM materias WHERE departamento_id = 1)
        """))
        print("  Limpieza de comisiones no-C en departamento TIC completada.")
        
        conn.commit()
        print("\nREORGANIZACIÓN FINALIZADA CON ÉXITO.")

if __name__ == "__main__":
    reorganizar()
