import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import sys

# Add backend to path
sys.path.append('c:/DiscoD/Pato/Desarrollos/horarios/backend')

import models
import schemas
from database import SessionLocal
from pydantic import ValidationError

def test_serialization():
    db = SessionLocal()
    try:
        comisiones = db.query(models.Comision).all()
        print(f"Total comisiones in DB: {len(comisiones)}")
        
        errors = 0
        for com in comisiones:
            try:
                # Try to convert to Pydantic schema
                schemas.Comision.from_orm(com)
            except ValidationError as ve:
                print(f"ERROR SERIALIZING COMISION ID {com.id}: {ve}")
                errors += 1
            except Exception as e:
                print(f"UNEXPECTED ERROR ON ID {com.id}: {e}")
                errors += 1
        
        if errors == 0:
            print("All comisiones serialized successfully!")
        else:
            print(f"Found {errors} comisiones with serialization errors.")
            
    finally:
        db.close()

if __name__ == "__main__":
    test_serialization()
