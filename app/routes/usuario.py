from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session 
from app import models, schemas 
from ..database import get_db

router=APIRouter(prefix="/usuario", tags=["Usuarios"])

@router.get("/", response_model=list[schemas.Usuario])
def listar_usuarios(db: Session=Depends(get_db)):
    usuarios= db.query(models.Usuario).all()
    return usuarios

@router.post("/", response_model=schemas.Usuario)
def crear_usuario(usuario: schemas.UsuarioCreate, db: Session= Depends(get_db)):
   
   # validaciones del rol aqui, si el rol no coincide con el enum.
   if usuario.rol not in ['administrador', 'cajero', 'mesero']:
       raise HTTPException(status_code=400, detail="El rol de usuario no es valido rey/reina.")
 
   db_usuario=models.Usuario(
       nombre=usuario.nombre,
       correo=usuario.correo,
       usuario=usuario.usuario,
       contraseña=usuario.contraseña,
       rol=usuario.rol 
   )
   db.add(db_usuario)
   db.commit()
   db.refresh(db_usuario)
   return db_usuario