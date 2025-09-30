from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session 
from app import models, schemas, database 
from ..database import get_db


router=APIRouter(
    prefix="/pedidos",
    tags=["Pedidos"]
)

@router.get("/", response_model=list[schemas.PedidoOut])
def listar_pedidos(db: Session=Depends(get_db)):
    pedidos= db.query(models.Pedido).all()
    return pedidos


@router.post("/", response_model=schemas.PedidoOut)
def crear_pedido(pedido: schemas.PedidoCreate, db: Session= Depends(get_db)):

    #Aqui lo que se hace es validar que la mesa exista pq aja
    mesa=db.query(models.Mesa).filter(models.Mesa.id_mesa== pedido.id_mesa).first()
    if not mesa:
        raise HTTPException(status_code=404, detail= "La mesa no existe")


    #Aqui otra validacion pero para el usuario
    usuario = db.query(models.Usuario).filter(models.Usuario.id_usuario == pedido.id_usuario).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="El usuario no existe")
   
    #Ahora si viene lo chido, aqui se crea el pedido, despues de las validaciones anteriores.
    nuevo_pedido=models.Pedido(
        id_mesa=pedido.id_mesa,
        id_usuario=pedido.id_usuario,
        observaciones=pedido.observaciones
    )

    db.add(nuevo_pedido)
    db.commit()
    db.refresh(nuevo_pedido)
    return nuevo_pedido