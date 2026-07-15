from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.auth.supabase_jwt import verify_supabase_jwt
from app.models.user import User
from app.database import get_db

bearer_scheme = HTTPBearer(auto_error=False)

def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> dict:
    # Allow OPTIONS requests to pass through
    if request.method == "OPTIONS":
        return {"user_id": "", "role": "client", "user_metadata": {}}
    
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No authorization header provided",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    payload = verify_supabase_jwt(credentials.credentials)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token sin user_id",
        )
    
    # Get role from database, create user if not exists
    user = db.query(User).filter(User.user_id == user_id).first()
    email = payload.get("email") or payload.get("user_metadata", {}).get("email", "")
    is_admin_email = email in ["admin@tecnicoconfianza.com", "admin@verifytech.com"]
    
    if not user:
        # Try to get role from JWT metadata first, default to "client"
        role = "admin" if is_admin_email else payload.get("user_metadata", {}).get("role", "client")
        user = User(user_id=user_id, role=role)
        db.add(user)
        try:
            db.commit()
        except:
            db.rollback()
            # If commit fails, try to fetch again
            user = db.query(User).filter(User.user_id == user_id).first()
    elif is_admin_email and user.role != "admin":
        user.role = "admin"
        db.add(user)
        try:
            db.commit()
        except:
            db.rollback()
    
    role = user.role if user else "client"
    user_metadata = payload.get("user_metadata", {})
    return {"user_id": user_id, "role": role, "user_metadata": user_metadata}

def require_role(required_role: str):
    def checker(current_user: dict = Depends(get_current_user)):
        if current_user["user_id"] == "" and current_user["role"] == "client":
            # This is an OPTIONS request, allow it through
            return current_user
        if current_user["role"] != required_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Se requiere rol '{required_role}'",
            )
        return current_user
    return checker

require_client = require_role("client")
require_tech   = require_role("tech")
require_admin  = require_role("admin")
