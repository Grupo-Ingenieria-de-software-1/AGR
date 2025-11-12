from fastapi import APIRouter, Depends, HTTPException, Form, status
from fastapi.responses import JSONResponse
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from jose import jwt, JWTError
from datetime import datetime, timedelta
from app import models, security
from ..database import get_db
import os

router = APIRouter(prefix="/auth", tags=["Autenticación"])

# Configuración JWT
SECRET_KEY = os.getenv("SECRET_KEY", "AGR_SK_FT")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 480  # 8 horas

# OAuth2
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


def create_access_token(data: dict):
    """Crear un token JWT"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def verify_token(token: str):
    """Verificar y decodificar el token"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        usuario: str = payload.get("sub")
        rol: str = payload.get("rol")
        if usuario is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token inválido"
            )
        return {"usuario": usuario, "rol": rol}
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado"
        )


async def get_current_user(token: str = Depends(oauth2_scheme)):
    """Dependencia para obtener el usuario actual desde el token"""
    return verify_token(token)


@router.post("/login")
async def login(
    usuario: str = Form(...),
    contraseña: str = Form(...),
    db: Session = Depends(get_db)
):
    """Iniciar sesión con usuario y contraseña"""
    user = db.query(models.Usuario).filter(models.Usuario.usuario == usuario).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario o contraseña incorrectos"
        )

    if not security.verify_password(contraseña, user.contraseña):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario o contraseña incorrectos"
        )

    # Crear token JWT
    access_token = create_access_token(
        data={
            "sub": user.usuario,
            "rol": user.rol,
            "id_usuario": user.id_usuario,
            "nombre": user.nombre
        }
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "usuario": {
            "id_usuario": user.id_usuario,
            "nombre": user.nombre,
            "usuario": user.usuario,
            "correo": user.correo,
            "rol": user.rol
        }
    }


@router.post("/google-login")
async def google_login(
    google_token: str = Form(...),
    db: Session = Depends(get_db)
):
    """
    Iniciar sesión con Google OAuth
    Recibe el ID token de Google y lo valida
    """
    
    # IMPORTANTE: Reemplaza con tu CLIENT_ID real de Google Cloud
    GOOGLE_CLIENT_ID = "653463547593-d0norqa1bjd4a531qals7rn1kggqki0u.apps.googleusercontent.com"
    
    try:
        # Importar librerías de Google
        try:
            from google.oauth2 import id_token
            from google.auth.transport import requests
        except ImportError:
            raise HTTPException(
                status_code=status.HTTP_501_NOT_IMPLEMENTED,
                detail="Google OAuth no está configurado. Instale: pip install google-auth google-auth-oauthlib"
            )

        # Verificar el token de Google
        idinfo = id_token.verify_oauth2_token(
            google_token, 
            requests.Request(), 
            GOOGLE_CLIENT_ID
        )

        # Obtener información del usuario de Google
        email = idinfo.get("email")
        nombre = idinfo.get("name")
        google_id = idinfo.get("sub")
        
        print(f"✅ Usuario de Google autenticado: {email}")
        
        if not email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No se pudo obtener el email de Google"
            )

        # Buscar o crear usuario en la base de datos
        user = db.query(models.Usuario).filter(models.Usuario.correo == email).first()
        
        if not user:
            print(f"📝 Creando nuevo usuario: {email}")
            # Crear nuevo usuario con datos de Google
            user = models.Usuario(
                nombre=nombre,
                correo=email,
                usuario=email.split("@")[0],  # Usar parte antes del @ como usuario
                contraseña=security.hash_password("google_oauth_no_password"),  # ✅ CORREGIDO: usar hash_password
                rol="mesero"  # Rol por defecto
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            print(f"✅ Usuario creado: {user.usuario}")
        else:
            print(f"✅ Usuario existente encontrado: {user.usuario}")

        # Crear token JWT
        access_token = create_access_token(
            data={
                "sub": user.usuario,
                "rol": user.rol,
                "id_usuario": user.id_usuario,
                "nombre": user.nombre
            }
        )

        return {
            "access_token": access_token,
            "token_type": "bearer",
            "usuario": {
                "id_usuario": user.id_usuario,
                "nombre": user.nombre,
                "usuario": user.usuario,
                "correo": user.correo,
                "rol": user.rol
            }
        }

    except ValueError as e:
        # Error al verificar el token de Google
        print(f"❌ Error de validación de Google: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token de Google inválido: {str(e)}"
        )
    except HTTPException:
        # Re-lanzar HTTPException sin modificar
        raise
    except Exception as e:
        # Cualquier otro error
        print(f"❌ Error interno: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error interno: {str(e)}"
        )


@router.post("/verify")
async def verify_token_endpoint(current_user: dict = Depends(get_current_user)):
    """Verificar si el token es válido"""
    return {
        "valid": True,
        "usuario": current_user
    }


@router.post("/logout")
async def logout():
    """Cerrar sesión (el frontend debe eliminar el token)"""
    return {"message": "Sesión cerrada correctamente"}

