import os
import sys
# Agregar el directorio actual al path para importar locales
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal
import models
import schemas
from pydantic import ValidationError

db = SessionLocal()

def verify():
    checks = [
        (models.Institucion, schemas.Institucion, "Instituciones"),
        (models.Departamento, schemas.Departamento, "Departamentos"),
        (models.Docente, schemas.Docente, "Docentes"),
        (models.Usuario, schemas.Usuario, "Usuarios"),
        (models.Calendario, schemas.Calendario, "Calendarios"),
        (models.Materia, schemas.Materia, "Materias"),
        (models.Aula, schemas.Aula, "Aulas"),
        (models.Comision, schemas.Comision, "Comisiones"),
    ]
    
    for model, schema, name in checks:
        print(f"--- Verificando {name} ---")
        items = db.query(model).all()
        for item in items:
            try:
                schema.from_orm(item)
            except ValidationError as e:
                print(f"ERROR en {name} ID {item.id}: {e}")
            except Exception as e:
                print(f"ERROR inesperado en {name} ID {item.id}: {e}")
        print(f"Total {name} verificados: {len(items)}")

if __name__ == "__main__":
    verify()
