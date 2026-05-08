from sqlalchemy.orm import Session
from database import SessionLocal
import models

def diagnose():
    db = SessionLocal()
    target_comms = ['1ING1-A', '1INCOM-A']
    
    for code in target_comms:
        comm = db.query(models.Comision).filter(models.Comision.codigo == code).first()
        if not comm:
            print(f"Comisión {code} no encontrada.")
            continue
            
        asigs = db.query(models.Asignacion).filter(models.Asignacion.comision_id == comm.id).all()
        print(f"Asignaciones para {code} (ID: {comm.id}):")
        for asig in asigs:
            print(f"  ID: {asig.id}, Día: {asig.dia_semana}, Módulo: {asig.modulo_id}")

if __name__ == "__main__":
    diagnose()
