# verify_rbac.py
import requests
import json
import os

BASE_URL = "http://localhost:8000" # Asumiendo que el server corre aquí
# Para este test, como no tengo el server corriendo de fondo en un puerto accesible fácilmente 
# (o sí?), voy a probar directamente con la DB vía SQL si el server falla.

def test_db_content():
    from sqlalchemy import create_engine, text
    DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://horarios_user:horarios123@localhost:5432/horarios")
    engine = create_engine(DATABASE_URL)
    
    with engine.connect() as conn:
        print("\n--- Verificando Tablas RBAC ---")
        roles = conn.execute(text("SELECT * FROM roles")).fetchall()
        print(f"Roles encontrados: {[r[1] for r in roles]}")
        
        modulos = conn.execute(text("SELECT * FROM modulos")).fetchall()
        print(f"Módulos inicializados: {len(modulos)}")
        
        admin = conn.execute(text("SELECT username, rol, rol_id FROM usuarios WHERE username='admin'")).fetchone()
        print(f"Usuario Admin: {admin}")

if __name__ == "__main__":
    try:
        test_db_content()
        print("\n✅ Verificación de base de datos exitosa.")
    except Exception as e:
        print(f"\n❌ Error en verificación: {e}")
