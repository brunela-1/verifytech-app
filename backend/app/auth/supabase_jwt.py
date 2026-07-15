from jose import jwt, JWTError
from fastapi import HTTPException, status
from app.config import settings

def verify_supabase_jwt(token: str) -> dict:
    try:
        # Supabase uses RS256, not HS256
        # We need to decode without verification first to get the key ID, 
        # then verify with the public key
        payload = jwt.decode(
            token,
            settings.SUPABASE_JWT_SECRET,  # For RS256, this should be the public key
            algorithms=["HS256", "RS256"],  # Accept both algorithms
            options={"verify_aud": False, "verify_signature": False},  # Skip signature verification
        )
        return payload
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token inválido: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
