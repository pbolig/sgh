import os, sys
sys.path.append('backend')
os.environ['DATABASE_URL'] = 'postgresql://horarios_user:horarios123@localhost/horarios'
from database import SessionLocal
from models import CargoAsignacion, CargoHorario, Docente, Cargo

db = SessionLocal()
try:
    print("--- DIAGNOSTICO DE SLOTS HUERFANOS (HORAS DIA = 0) ---")
    stale_slots = []
    
    asigs = db.query(CargoAsignacion).all()
    for asig in asigs:
        doc = db.query(Docente).get(asig.docente_id)
        cargo = db.query(Cargo).get(asig.cargo_id) if asig.cargo_id else None
        cargo_name = cargo.nombre if cargo else "Horas Cátedra"
        
        # Mapeo de campos de horas por día
        dias_map = {
            'lunes': asig.horas_lunes,
            'martes': asig.horas_martes,
            'miercoles': asig.horas_miercoles,
            'jueves': asig.horas_jueves,
            'viernes': asig.horas_viernes,
            'sabado': asig.horas_sabado,
            'domingo': asig.horas_domingo
        }
        
        for slot in asig.horarios:
            horas_dia = dias_map.get(slot.dia_semana.lower().replace('í','i').replace('á','a').replace('é','e').replace('ó','o').replace('ú','u'), 0)
            if horas_dia == 0:
                stale_slots.append({
                    'id': slot.id,
                    'asig_id': asig.id,
                    'docente': f"{doc.apellido if doc else '?'}, {doc.nombre if doc else '?'}",
                    'cargo': cargo_name,
                    'dia': slot.dia_semana,
                    'rango': f"{slot.hora_inicio}-{slot.hora_fin}"
                })

    if not stale_slots:
        print("No se encontraron slots huérfanos. ¡Todo limpio!")
    else:
        print(f"Se encontraron {len(stale_slots)} slots con 0 horas en la asignación principal:")
        print(f"{'ID':<5} | {'Docente':<25} | {'Cargo':<25} | {'Día':<10} | {'Rango':<15}")
        print("-" * 85)
        for s in stale_slots:
            print(f"{s['id']:<5} | {s['docente']:<25} | {s['cargo']:<25} | {s['dia']:<10} | {s['rango']:<15}")

except Exception as e:
    print(f"Error: {e}")
finally:
    db.close()
