import os
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Asegurar que el path del backend esté disponible
sys.path.append(os.getcwd())

import models
from database import DATABASE_URL as ORIG_URL

# URL ajustada para local (localhost:5432)
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://horarios_user:horarios123@localhost:5432/horarios")

print(f"Conectando a {DATABASE_URL} para recuperación de comisiones...")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def recovery():
    db = SessionLocal()
    try:
        # 1. Obtener todas las materias y sus códigos/nombres
        materias = db.query(models.Materia).all()
        mat_map = {m.codigo.upper(): m for m in materias if m.codigo}
        mat_name_map = {m.nombre.upper(): m for m in materias if m.nombre}
        
        print(f"Materias cargadas: {len(materias)}")
        
        # 2. Obtener todas las comisiones
        comisiones = db.query(models.Comision).all()
        print(f"Comisiones encontradas: {len(comisiones)}")
        
        recuperadas = 0
        ya_bien = 0
        
        for com in comisiones:
            # Si ya tiene una materia asignada que no es el fallback (ID 1 suele ser el fallback si lo usamos así)
            # O si el usuario dice que no ve ninguna en su depto, mejor revisamos todas.
            
            codigo_com = com.codigo.upper()
            
            # Intentar encontrar materia por código exacto o contenido
            best_match = None
            
            # Estrategia A: El código de la comisión contiene el código de la materia
            # Ej: '1INF3' contiene 'INF3' (si el código fuera INF3)
            # Ej: 'C1DM1' -> materia 'DM1' ?
            
            # Buscamos en el mapa de códigos
            for mat_code, mat_obj in mat_map.items():
                if mat_code in codigo_com:
                    best_match = mat_obj
                    break
            
            # Estrategia B: Por nombre de materia
            if not best_match:
                for mat_name, mat_obj in mat_name_map.items():
                    if mat_name in codigo_com:
                        best_match = mat_obj
                        break
            
            if best_match:
                if com.materia_id != best_match.id:
                    print(f"RECUPERADA: Comisión {codigo_com} (ID {com.id}) -> Materia {best_match.nombre} (ID {best_match.id}, Depto {best_match.departamento_id})")
                    com.materia_id = best_match.id
                    recuperadas += 1
                else:
                    ya_bien += 1
            else:
                # print(f"  No se encontró coincidencia para: {codigo_com}")
                pass
        
        db.commit()
        print(f"\nRESUMEN:")
        print(f"- Comisiones que ya estaban bien: {ya_bien}")
        print(f"- Comisiones recuperadas/re-asociadas: {recuperadas}")
        print(f"- Comisiones que siguen sin coincidencia: {len(comisiones) - ya_bien - recuperadas}")
        
    except Exception as e:
        print(f"Error durante la recuperación: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    recovery()
