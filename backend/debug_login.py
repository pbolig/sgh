import main
import models
import schemas
import auth_utils
from database import SessionLocal

def debug_login():
    db = SessionLocal()
    username = "admin" # Cambiar si es necesario
    print(f"Buscando usuario: {username}")
    try:
        user = db.query(models.Usuario).filter(models.Usuario.username == username).first()
        if not user:
            print("Usuario no encontrado")
            return
        
        print("Usuario encontrado, validando esquema...")
        # Intentar validar el usuario con el esquema Pydantic
        user_schema = schemas.Usuario.from_orm(user)
        print("Esquema Usuario validado OK")
        
        # Intentar validar el Token completo
        token_data = {
            "access_token": "test_token",
            "token_type": "bearer",
            "user": user
        }
        token_schema = schemas.Token(**token_data)
        print("Esquema Token validado OK")
        print("Login logic test: SUCCESS")
        
    except Exception as e:
        print("\n--- ERROR DETECTADO ---")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    debug_login()
