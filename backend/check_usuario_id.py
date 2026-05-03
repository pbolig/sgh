import models
from database import engine
from sqlalchemy import inspect

def check_columns():
    inspector = inspect(engine)
    columns = [c["name"] for c in inspector.get_columns("docentes")]
    print(f"Columnas en docentes: {columns}")
    if "usuario_id" in columns:
        print("RESULT: usuario_id EXISTE")
    else:
        print("RESULT: usuario_id NO EXISTE")

if __name__ == "__main__":
    check_columns()
