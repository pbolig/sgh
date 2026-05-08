from sqlalchemy.orm import Session
from database import SessionLocal
import models
import datetime

def diagnose():
    db = SessionLocal()
    dias = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado']
    hoy = dias[datetime.datetime.now().weekday() + 1] if datetime.datetime.now().weekday() < 6 else dias[0]
    # weekday() returns 0 for Monday, so we adjust to match our list if needed.
    # Actually, Python's weekday: 0=Mon, 1=Tue, ..., 3=Thu, ..., 6=Sun.
    # Our list: 0=Dom, 1=Lun, ..., 4=Jue, ...
    hoy = dias[(datetime.datetime.now().weekday() + 1) % 7]
    
    print(f"Buscando asignaciones para HOY ({hoy}):")
    asigs = db.query(models.Asignacion).filter(models.Asignacion.dia_semana == hoy).all()
    
    print(f"Total encontradas: {len(asigs)}")
    for asig in asigs:
        m = db.query(models.ModuloHorario).filter(models.ModuloHorario.id == asig.modulo_id).first()
        c = db.query(models.Comision).filter(models.Comision.id == asig.comision_id).first()
        d = db.query(models.Docente).filter(models.Docente.id == asig.docente_id).first()
        print(f"Módulo: {m.hora_inicio if m else '?'}, Comisión: {c.codigo if c else '?'}, Docente: {d.apellido if d else '?'}")

    print("\nBuscando asignaciones para LUNES (lunes):")
    asigs_lun = db.query(models.Asignacion).filter(models.Asignacion.dia_semana == 'lunes').all()
    print(f"Total encontradas: {len(asigs_lun)}")

if __name__ == "__main__":
    diagnose()
