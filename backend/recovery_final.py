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

print(f"Conectando a {DATABASE_URL} para reparación final...")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def recovery_final():
    db = SessionLocal()
    try:
        # Depto objetivo: 1 (Tecnología de la Información)
        # 146 -> Informática 1
        # 147 -> Informática 2
        # 148 -> Informática 3
        # 149 -> Informática 4
        
        mats_depto1 = {
            1: 146,
            2: 147,
            3: 148,
            4: 149
        }
        
        comisiones = db.query(models.Comision).all()
        print(f"Comisiones analizadas: {len(comisiones)}")
        
        movidas = 0
        
        for com in comisiones:
            codigo = com.codigo.upper()
            
            anio_com = None
            if codigo.startswith('C1'): anio_com = 1
            elif codigo.startswith('C2'): anio_com = 2
            elif codigo.startswith('C3'): anio_com = 3
            elif codigo.startswith('C4'): anio_com = 4
            
            if anio_com and anio_com in mats_depto1:
                target_materia_id = mats_depto1[anio_com]
                
                # Solo la movemos si no está ya en el depto 1
                materia_actual = db.query(models.Materia).filter(models.Materia.id == com.materia_id).first()
                if not materia_actual or materia_actual.departamento_id != 1:
                    print(f"MOVIENDO: Comisión {codigo} (ID {com.id}) -> Materia ID {target_materia_id}")
                    try:
                        # Usar una subtransacción o commit parcial si es necesario, pero aquí solo actualizamos el objeto
                        com.materia_id = target_materia_id
                        db.flush() # Sincronizar con DB para ver si hay error
                        movidas += 1
                    except Exception as e:
                        print(f"  Fallo al mover {codigo}: {e}")
                        db.rollback()
                        # Re-instanciar el objeto si el rollback limpia la sesión
                        com = db.query(models.Comision).filter(models.Comision.id == com.id).first()
        
        db.commit()
        print(f"\nÉXITO: Se han recuperado {movidas} comisiones para el departamento de Tecnología.")
        
    except Exception as e:
        print(f"Error crítico en reparación: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    recovery_final()
