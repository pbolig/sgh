from backend.database import SessionLocal
from backend import models

db = SessionLocal()
excluidos = db.query(models.RecreoExcluido).all()
print("ID | Depto | Día | Modulo Anterior")
print("-" * 40)
for e in excluidos:
    print(f"{e.id} | {e.departamento_id} | {e.dia_semana} | {e.modulo_id_anterior}")
db.close()
