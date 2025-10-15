from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from app import models, schemas, database
from ..database import get_db


router=APIRouter(
    prefix="/pedidos",
    tags=["Pedidos"]
)

@router.get("/", response_model=list[schemas.PedidoOut])
def listar_pedidos(db: Session=Depends(get_db)):
    pedidos= (db.query(models.Pedido).options(joinedload(models.Pedido.detalle_pedido).joinedload(models.Detalle_Pedido.producto)).all())
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
    
    

   


    for item in pedido.detalles:
        producto = db.query(models.Producto).filter(models.Producto.id_producto == item.id_producto).first()
        if not producto:
            raise HTTPException(status_code=404, detail=f"El producto con id {item.id_producto} no existe")

        nuevo_detalle = models.Detalle_Pedido(
            id_pedido=nuevo_pedido.id_pedido,
            id_producto=item.id_producto,
            cantidad=item.cantidad,
            precio_unitario=producto.precio,
            
        )
        nuevo_pedido.detalle_pedido.append(nuevo_detalle)

        
        
    db.commit()


    pedido_db=(
        db.query(models.Pedido)
        .options(joinedload(models.Pedido.detalle_pedido))
        .filter(models.Pedido.id_pedido== nuevo_pedido.id_pedido)
        .first()
    )




    return nuevo_pedido

@router.get("/{pedido_id}", response_model=schemas.PedidoOut)
def obtener_pedido(pedido_id: int, db: Session = Depends(get_db)):
    # Buscar el pedido por su ID
    pedido = (
        db.query(models.Pedido)
        .options(joinedload(models.Pedido.detalle_pedido).joinedload(models.Detalle_Pedido.producto))
        .filter(models.Pedido.id_pedido == pedido_id)
        .first()
    )
    
    # Si no se encuentra, lanzar un error 404
    if not pedido:
        raise HTTPException(status_code=404, detail="El pedido no existe")

    return pedido


@router.put("/{pedido_id}", response_model=schemas.PedidoOut)
def actualizar_pedido(pedido_id: int, pedido: schemas.PedidoCreate, db: Session = Depends(get_db)):
    # Buscar el pedido
    pedido_db = db.query(models.Pedido).filter(models.Pedido.id_pedido == pedido_id).first()
    if not pedido_db:
        raise HTTPException(status_code=404, detail="El pedido no existe")

    # Validar mesa
    mesa = db.query(models.Mesa).filter(models.Mesa.id_mesa == pedido.id_mesa).first()
    if not mesa:
        raise HTTPException(status_code=404, detail="La mesa no existe")

    # Validar usuario
    usuario = db.query(models.Usuario).filter(models.Usuario.id_usuario == pedido.id_usuario).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="El usuario no existe")

    # Actualizar datos del pedido
    pedido_db.id_mesa = pedido.id_mesa
    pedido_db.id_usuario = pedido.id_usuario
    pedido_db.observaciones = pedido.observaciones

    # Eliminar los detalles actuales
    db.query(models.Detalle_Pedido).filter(models.Detalle_Pedido.id_pedido == pedido_id).delete()

    # Agregar los nuevos detalles
    for item in pedido.detalles:
        producto = db.query(models.Producto).filter(models.Producto.id_producto == item.id_producto).first()
        if not producto:
            raise HTTPException(status_code=404, detail=f"El producto con id {item.id_producto} no existe")

        nuevo_detalle = models.Detalle_Pedido(
            id_pedido=pedido_db.id_pedido,
            id_producto=item.id_producto,
            cantidad=item.cantidad,
            precio_unitario=producto.precio,
        )
        db.add(nuevo_detalle)

    db.commit()

    pedido_actualizado = (
        db.query(models.Pedido)
        .options(joinedload(models.Pedido.detalle_pedido))
        .filter(models.Pedido.id_pedido == pedido_id)
        .first()
    )

    return pedido_actualizado

@router.delete("/{pedido_id}", response_model=dict)
def eliminar_pedido(pedido_id: int, db: Session = Depends(get_db)):
    pedido = db.query(models.Pedido).filter(models.Pedido.id_pedido == pedido_id).first()
    if not pedido:
        raise HTTPException(status_code=404, detail="El pedido no existe")

    db.delete(pedido)
    db.commit()

    return {"message": f"Pedido {pedido_id} eliminado correctamente"}