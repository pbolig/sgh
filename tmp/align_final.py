import os
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Add backend to path (to find models)
sys.path.append('c:/DiscoD/Pato/Desarrollos/horarios/backend')

import models

def align():
    # Force localhost connection for local run
    LOCAL_URL = "postgresql://horarios_user:horarios123@localhost:5432/horarios"
    engine = create_engine(LOCAL_URL)
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()
    
    try:
        # Rules:
        # SC (Inst 2) -> Dept 1 (TIC)
        # C1, C2, C3, C4 -> SC Dept 1
        # Materias SC: 146(1), 147(2), 148(3), 149(4)
        
        mats_map = {1: 146, 2: 147, 3: 148, 4: 149}
        
        coms = db.query(models.Comision).all()
        print(f"Aligning {len(coms)} commissions...")
        
        sc_moved = 0
        turno_moved = 0
        
        for c in coms:
            cod = c.codigo.upper()
            if any(cod.startswith(p) for p in ['C1', 'C2', 'C3', 'C4']):
                # Move to SC TIC
                anio_str = cod[1]
                if anio_str.isdigit():
                    anio = int(anio_str)
                    if anio in mats_map:
                        c.materia_id = mats_map[anio]
                        sc_moved += 1
                
                # Turnos
                if 'M' in cod:
                    c.turno = 'mañana'
                    turno_moved += 1
                elif 'T' in cod:
                    c.turno = 'tarde'
                    turno_moved += 1
                    
            else:
                # Every other commission stays for ISET 57.
                # If they were incorrectly in SC Dept 1, we could move them,
                # but based on the rules, non-C codes are ISET.
                # I'll check if they are in Dept 1 (TIC) and move them to Enfermeria (8) as fallback
                # if they don't have a valid ISET depto.
                
                # We can't really "guess" the ISET depto without more info, 
                # so we just ensure they aren't in SC's Depto 1 if they don't start with C.
                materia = db.query(models.Materia).filter(models.Materia.id == c.materia_id).first()
                if materia and materia.departamento_id == 1:
                    # It's a non-C commission in a SC Dept. We should move it back to an ISET dept.
                    # Fallback to Enfermeria (ID 8)
                    c.materia_id = 121 # Fallback to a valid ISET materia from previous research
        
        db.commit()
        print(f"Alignment successful: {sc_moved} moved to SC, {turno_moved} turnos updated.")
    except Exception as e:
        print(f"ALIGMENT FAILED: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    align()
