from sqlalchemy.orm import Session
from database import SessionLocal
import models
import datetime

def diagnose():
    db = SessionLocal()
    dias = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado']
    # Python weekday(): 0=Mon, 1=Tue, 2=Wed, 3=Thu, 4=Fri, 5=Sat, 6=Sun
    # Map to our list
    idx = (datetime.datetime.now().weekday() + 1) % 7
    hoy = dias[idx]
    
    print(f"Buscando CARGO-ASIGNACIONES para HOY ({hoy}):")
    cas = db.query(models.CargoAsignacion).all()
    
    found = 0
    for ca in cas:
        # Los horarios están en la tabla CargoHorario vinculada
        # O en ca.horarios si es un relationship
        horarios = db.query(models.CargoHorario).filter(models.CargoHorario.asignacion_id == ca.id).all()
        for h in horarios:
            if h.dia_semana == hoy:
                doc = db.query(models.Docente).filter(models.Docente.id == ca.docente_id).first()
                aula = db.query(models.Aula).filter(models.Aula.id == h.aula_id).first()
                print(f"ID: {ca.id}, Docente: {doc.apellido if doc else '?'}, Aula: {aula.nombre if aula else 'VIRTUAL'}, Horario: {h.hora_inicio}-{h.hora_fin}")
                found += 1
    
    print(f"Total slots de cargo hoy: {found}")

if __name__ == "__main__":
    diagnose()
