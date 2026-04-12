# diagnostic_jwt.py
import sys
import os
sys.path.append(os.path.join(os.getcwd(), 'backend'))

import auth_utils
import datetime
from jose import jwt, JWTError

def test_token():
    print(f"SECRET_KEY default: {auth_utils.SECRET_KEY}")
    print(f"ALGORITHM: {auth_utils.ALGORITHM}")
    
    data = {"sub": "admin", "rol": "directivo"}
    # Test with explicit expiration
    expire_8h = datetime.timedelta(minutes=480)
    token = auth_utils.create_access_token(data=data, expires_delta=expire_8h)
    print(f"Token (8h): {token[:20]}...")
    
    try:
        payload = jwt.decode(token, auth_utils.SECRET_KEY, algorithms=[auth_utils.ALGORITHM])
        print(f"Decoded Successfully: {payload}")
        
        # Check exp
        exp = payload.get("exp")
        exp_dt = datetime.datetime.fromtimestamp(exp)
        print(f"Expires at (UTC): {exp_dt}")
        now_dt = datetime.datetime.utcnow()
        print(f"Current time (UTC): {now_dt}")
        
        if exp_dt > now_dt:
            print("Status: VALID")
        else:
            print("Status: EXPIRED")
            
    except JWTError as e:
        print(f"Decode Failed: {e}")

if __name__ == "__main__":
    test_token()
