from database import SessionLocal
import models
import schemas
from typing import List

def debug_cargos():
    db = SessionLocal()
    try:
        departamento_id = 1
        query = db.query(models.Cargo)
        if departamento_id:
            query = query.filter(models.Cargo.departamento_id == departamento_id)
        
        cargos = query.all()
        print(f"Found {len(cargos)} cargos")
        
        # Try to serialize
        for c in cargos:
            print(f"Serializing cargo: {c.nombre}")
            # This mimics what FastAPI does with response_model=List[schemas.Cargo]
            s = schemas.Cargo.from_orm(c)
            print(f"  Serialized OK: {s.id}")
            for asig in c.asignaciones:
                print(f"    Serializing asig: {asig.id}")
                sasig = schemas.CargoAsignacion.from_orm(asig)
                print(f"      OK")
                
    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    debug_cargos()
