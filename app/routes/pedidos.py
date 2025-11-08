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
    pedidos= (
        db.query(models.Pedido)
        .options(
            joinedload(models.Pedido.detalle_pedido).joinedload(models.Detalle_Pedido.producto),
            joinedload(models.Pedido.mesa)  # Cargar relación con mesa
        )
        .all()
    )
    return pedidos


@router.post("/", response_model=schemas.PedidoOut)
def crear_pedido(pedido: schemas.PedidoCreate, db: Session= Depends(get_db)):

    # Validar que la mesa exista
    mesa=db.query(models.Mesa).filter(models.Mesa.id_mesa== pedido.id_mesa).first()
    if not mesa:
        raise HTTPException(status_code=404, detail= "La mesa no existe")

    # Validar que no exista un pedido activo en esa mesa
    pedido_activo = (
        db.query(models.Pedido)
        .filter(
            models.Pedido.id_mesa == pedido.id_mesa,
            models.Pedido.estado != "pagado"
        )
        .first()
    )
    
    if pedido_activo:
        raise HTTPException(
            status_code=400, 
            detail=f"La mesa {mesa.numero} ya tiene un pedido activo (ID: {pedido_activo.id_pedido}). Debe ser pagado antes de crear uno nuevo."
        )

    # Validar que el usuario exista
    usuario = db.query(models.Usuario).filter(models.Usuario.id_usuario == pedido.id_usuario).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="El usuario no existe")
   
    # Crear el pedido
    nuevo_pedido=models.Pedido(
        id_mesa=pedido.id_mesa,
        id_usuario=pedido.id_usuario,
        observaciones=pedido.observaciones
    )

    db.add(nuevo_pedido)
    db.flush()  # Para obtener el id_pedido

    # Agregar detalles del pedido
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

    # Recargar el pedido con sus relaciones
    pedido_db=(
        db.query(models.Pedido)
        .options(
            joinedload(models.Pedido.detalle_pedido).joinedload(models.Detalle_Pedido.producto),
            joinedload(models.Pedido.mesa)  # Cargar relación con mesa
        )
        .filter(models.Pedido.id_pedido== nuevo_pedido.id_pedido)
        .first()
    )

    return pedido_db


# Endpoint para validar mesa por número
@router.get("/validar-mesa/{numero_mesa}")
def validar_mesa(numero_mesa: int, db: Session = Depends(get_db)):
    """Valida si una mesa existe por su número y si tiene pedidos activos"""
    
    # Buscar por número de mesa
    mesa = db.query(models.Mesa).filter(models.Mesa.numero == numero_mesa).first()
    
    if not mesa:
        # Obtener todas las mesas disponibles para ayudar al usuario
        mesas_disponibles = db.query(models.Mesa).all()
        info_mesas = [f"Mesa #{m.numero}" for m in mesas_disponibles]
        raise HTTPException(
            status_code=404, 
            detail=f"La mesa {numero_mesa} no existe. Mesas disponibles: {', '.join(info_mesas)}"
        )
    
    # Verificar si tiene pedidos activos
    pedido_activo = (
        db.query(models.Pedido)
        .filter(
            models.Pedido.id_mesa == mesa.id_mesa,
            models.Pedido.estado != "pagado"
        )
        .first()
    )
    
    return {
        "existe": True,
        "id_mesa": mesa.id_mesa,
        "numero_mesa": mesa.numero,
        "tiene_pedido_activo": pedido_activo is not None,
        "id_pedido_activo": pedido_activo.id_pedido if pedido_activo else None,
        "estado_pedido": pedido_activo.estado if pedido_activo else None,
        "estado_mesa": mesa.estado
    }


# Endpoint para obtener pedido por número de mesa
@router.get("/mesa/{numero_mesa}/pedido")
def obtener_pedido_por_mesa(numero_mesa: int, db: Session = Depends(get_db)):
    """Obtiene el pedido activo de una mesa por su número"""
    
    # Buscar la mesa por número
    mesa = db.query(models.Mesa).filter(models.Mesa.numero == numero_mesa).first()
    if not mesa:
        raise HTTPException(status_code=404, detail=f"La mesa {numero_mesa} no existe")
    
    # Buscar pedido activo de esa mesa
    pedido = (
        db.query(models.Pedido)
        .options(joinedload(models.Pedido.detalle_pedido).joinedload(models.Detalle_Pedido.producto))
        .filter(
            models.Pedido.id_mesa == mesa.id_mesa,
            models.Pedido.estado != "pagado"
        )
        .first()
    )
    
    if not pedido:
        raise HTTPException(
            status_code=404, 
            detail=f"La mesa {numero_mesa} no tiene pedidos activos"
        )
    
    return pedido


@router.get("/{pedido_id}", response_model=schemas.PedidoOut)
def obtener_pedido(pedido_id: int, db: Session = Depends(get_db)):
    pedido = (
        db.query(models.Pedido)
        .options(
            joinedload(models.Pedido.detalle_pedido).joinedload(models.Detalle_Pedido.producto),
            joinedload(models.Pedido.mesa)  # Cargar relación con mesa
        )
        .filter(models.Pedido.id_pedido == pedido_id)
        .first()
    )
    
    if not pedido:
        raise HTTPException(status_code=404, detail="El pedido no existe")

    return pedido


@router.put("/{pedido_id}", response_model=schemas.PedidoOut)
def actualizar_pedido(pedido_id: int, pedido: schemas.PedidoCreate, db: Session = Depends(get_db)):
    pedido_db = db.query(models.Pedido).filter(models.Pedido.id_pedido == pedido_id).first()
    if not pedido_db:
        raise HTTPException(status_code=404, detail="El pedido no existe")

    mesa = db.query(models.Mesa).filter(models.Mesa.id_mesa == pedido.id_mesa).first()
    if not mesa:
        raise HTTPException(status_code=404, detail="La mesa no existe")

    usuario = db.query(models.Usuario).filter(models.Usuario.id_usuario == pedido.id_usuario).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="El usuario no existe")

    pedido_db.id_mesa = pedido.id_mesa
    pedido_db.id_usuario = pedido.id_usuario
    pedido_db.observaciones = pedido.observaciones

    db.query(models.Detalle_Pedido).filter(models.Detalle_Pedido.id_pedido == pedido_id).delete()

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
        .options(
            joinedload(models.Pedido.detalle_pedido).joinedload(models.Detalle_Pedido.producto),
            joinedload(models.Pedido.mesa)  # Cargar relación con mesa
        )
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