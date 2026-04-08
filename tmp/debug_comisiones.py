import sys
import os

# Añadir el directorio backend al path
sys.path.append('c:/DiscoD/Pato/Desarrollos/horarios/backend')

from database import SessionLocal
import models

def test_query():
    db = SessionLocal()
    try:
        departamento_id = 1 # Usar un ID de depto existente o None
        anio = 1 # Usar un año existente o None
        
        query = db.query(models.Comision).join(models.Materia)
        if departamento_id:
            query = query.filter(models.Materia.departamento_id == departamento_id)
        if anio:
            query = query.filter(models.Materia.anio == anio)
        
        results = query.all()
        print(f"Encontradas {len(results)} comisiones")
        for res in results:
            print(f"ID: {res.id}, Codigo: {res.codigo}")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    test_query()
