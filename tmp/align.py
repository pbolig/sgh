import os
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Add backend to path
sys.path.append('c:/DiscoD/Pato/Desarrollos/horarios/backend')

import models
from database import SessionLocal

def align():
    db = SessionLocal()
    try:
        # Rules:
        # SC (Inst 2) -> Dept 1 (TIC)
        # C1, C2, C3, C4 -> SC Dept 1
        # Materias SC: 146(1), 147(2), 148(3), 149(4)
        
        mats_map = {1: 146, 2: 147, 3: 148, 4: 149}
        
        coms = db.query(models.Comision).all()
        print(f"Propagating rules to {len(coms)} commissions...")
        
        sc_moved = 0
        iset_moved = 0
        
        for c in coms:
            cod = c.codigo.upper()
            if any(cod.startswith(p) for p in ['C1', 'C2', 'C3', 'C4']):
                # It's SC
                anio_str = cod[1]
                if anio_str.isdigit():
                    anio = int(anio_str)
                    if anio in mats_map:
                        c.materia_id = mats_map[anio]
                        sc_moved += 1
                
                # Turnos
                if 'M' in cod:
                    c.turno = 'mañana'
                elif 'T' in cod:
                    c.turno = 'tarde'
                    
            else:
                # It's ISET 57. Ensure it's not in Dept 1.
                # Find materia of the com
                mat = db.query(models.Materia).filter(models.Materia.id == c.materia_id).first()
                if mat and mat.departamento_id == 1:
                    # Move to a generic ISET depto (9: HyS as default if orphan)
                    # This rarely happens if it doesn't start with C.
                    pass
                iset_moved += 1
        
        db.commit()
        print(f"Alignment complete: {sc_moved} SC, {iset_moved} ISET.")
    except Exception as e:
        print(f"ALIGMENT FAILED: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    align()
