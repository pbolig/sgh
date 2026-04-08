import os
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Asegurar que el path del backend esté disponible
sys.path.append(os.getcwd())

import models
from database import DATABASE_URL as ORIG_URL

# URL ajustada para local (localhost:5432)
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://horarios_user:horarios123@localhost:5432/horarios")

print(f"Conectando a {DATABASE_URL} para ALINEACIÓN FINAL...")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def alignment():
    db = SessionLocal()
    try:
        # IDs DEFINITIVOS (basados en investigación previa)
        INST_SC = 2
        INST_ISET = 1
        
        DEPT_TIC = 1 # Superior de Comercio
        
        # Materias TIC (para vincular C1-C4)
        MATS_TIC = {
            1: 146, # Inf 1
            2: 147, # Inf 2
            3: 148, # Inf 3
            4: 149  # Inf 4
        }
        
        # Departamentos ISET (para "todo lo demás")
        # 8: Enfermería, 9: Higiene, 10: Digitales
        
        comisiones = db.query(models.Comision).all()
        print(f"PROCESANDO {len(comisiones)} COMISIONES...")
        
        stats = {"SC": 0, "ISET": 0, "TURNOS_MODIFICADOS": 0}
        
        for com in comisiones:
            codigo = com.codigo.upper()
            
            # REGLA 1: SUPERIOR DE COMERCIO (C1, C2, C3, C4)
            if any(codigo.startswith(p) for p in ['C1', 'C2', 'C3', 'C4']):
                anio_str = codigo[1] # El número después de la C
                anio = int(anio_str) if anio_str.isdigit() else None
                
                # Asignar materia si el año coincide
                if anio in MATS_TIC:
                    com.materia_id = MATS_TIC[anio]
                
                # Asignar Turno (M o T)
                # Ejemplo: C1DM1 -> M en posición 3? No, busquemos 'M' o 'T'
                if 'M' in codigo:
                    com.turno = 'mañana'
                    stats["TURNOS_MODIFICADOS"] += 1
                elif 'T' in codigo:
                    com.turno = 'tarde'
                    stats["TURNOS_MODIFICADOS"] += 1
                
                stats["SC"] += 1
                
            # REGLA 2: ISET 57 (Todo lo demás)
            else:
                # Si la comisión no tiene materia o tiene una del depto TIC, 
                # pero no es código C, entonces está en el lugar equivocado.
                # Mantendremos su materia actual si ya es de ISET (8, 9, 10).
                materia = db.query(models.Materia).filter(models.Materia.id == com.materia_id).first()
                if not materia or materia.departamento_id not in [8, 9, 10]:
                    print(f"AVISO: Comisión {codigo} (ID {com.id}) parece de ISET pero no tiene materia válida.")
                
                stats["ISET"] += 1
        
        db.commit()
        print("\nRESUMEN DE ALINEACIÓN:")
        print(f"- Asignadas a Superior de Comercio (TIC): {stats['SC']}")
        print(f"- Mantendidas/Revisadas en ISET 57: {stats['ISET']}")
        print(f"- Turnos actualizados: {stats['TURNOS_MODIFICADOS']}")
        
    except Exception as e:
        print(f"Error crítico: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    alignment()
