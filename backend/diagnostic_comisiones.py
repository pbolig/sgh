from sqlalchemy.orm import Session
from database import SessionLocal
import models

def diagnose():
    db = SessionLocal()
    target_code = '1ING1-A'
    comms = db.query(models.Comision).filter(models.Comision.codigo == target_code).all()
    
    print(f"Found {len(comms)} commissions with code '{target_code}':")
    for c in comms:
        materia = db.query(models.Materia).filter(models.Materia.id == c.materia_id).first()
        dept = db.query(models.Departamento).filter(models.Departamento.id == materia.departamento_id).first() if materia else None
        inst = db.query(models.Institucion).filter(models.Institucion.id == dept.institucion_id).first() if dept else None
        
        print(f"ID: {c.id}, Materia: {materia.nombre if materia else 'N/A'}, Dept: {dept.nombre if dept else 'N/A'}, Inst: {inst.nombre if inst else 'N/A'}, Activo: {c.activo}")

if __name__ == "__main__":
    diagnose()
