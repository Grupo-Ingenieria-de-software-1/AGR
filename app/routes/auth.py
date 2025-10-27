from fastapi import APIRouter, Depends, HTTPException, Form, Request
from fastapi.responses import FileResponse, RedirectResponse
from sqlalchemy.orm import Session
from app import models, security
from ..database import get_db
from jose import jwt
from datetime import datetime, timedelta
import os

router = APIRouter(prefix="/auth", tags=["Autenticación"])

# Clave secreta para los tokens
SECRET_KEY = "tu_clave_secreta_segura"
ALGORITHM = "HS256"

# Ruta base al directorio actual del proyecto
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STATIC_DIR = os.path.join(BASE_DIR, "static")

@router.get("/login")
def mostrar_login():
    """Muestra el archivo login.html directamente desde static"""
    login_path = os.path.join(STATIC_DIR, "login.html")
    return FileResponse(login_path, media_type="text/html")

@router.post("/login")
def login(
    usuario: str = Form(...),
    contraseña: str = Form(...),
    db: Session = Depends(get_db)
):
    """Procesa el inicio de sesión"""
    user = db.query(models.Usuario).filter(models.Usuario.usuario == usuario).first()

    if not user:
        raise HTTPException(status_code=400, detail="Usuario no encontrado")

    if not security.verify_password(contraseña, user.contraseña):
        raise HTTPException(status_code=400, detail="Contraseña incorrecta")

    # Crear token JWT
    access_token = jwt.encode(
        {"sub": user.usuario, "rol": user.rol, "exp": datetime.utcnow() + timedelta(hours=1)},
        SECRET_KEY,
        algorithm=ALGORITHM
    )

    # Redirigir a la raíz por ahora
    response = RedirectResponse(url="/", status_code=303)
    response.set_cookie(key="access_token", value=access_token, httponly=True)
    return response
