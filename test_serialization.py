# test_serialization.py
import pydantic
from typing import List, Optional

class Modulo(pydantic.BaseModel):
    id: int
    nombre: str
    class Config:
        from_attributes = True

class Permiso(pydantic.BaseModel):
    id: int # Mandatory
    rol_id: int
    modulo_id: int
    nivel: str
    modulo: Optional[Modulo] = None
    class Config:
        from_attributes = True

# Simulate what main.py does
try:
    # This represents a models.Permiso object without id
    class FakeModel:
        def __init__(self, **kwargs):
            for k, v in kwargs.items():
                setattr(self, k, v)
            self.id = None # Simulating new model not yet in DB
    
    m = FakeModel(id=1, nombre="dashboard")
    p = FakeModel(rol_id=1, modulo_id=1, nivel="edicion", modulo=m)
    
    # Try to validate
    Permiso.from_orm(p)
    print("Success")
except Exception as e:
    print(f"Error: {e}")
