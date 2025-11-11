from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from app import models, schemas
from app.database import get_db
from decimal import Decimal

router = APIRouter(
    prefix="/pagos",
    tags=["Pagos"]
)


@router.get("/", response_model=list[schemas.PagoOut])
def listar_pagos(db: Session = Depends(get_db)):
    """Listar todos los pagos"""
    pagos = db.query(models.Pago).all()
    return pagos


@router.get("/{pago_id}", response_model=schemas.PagoOut)
def obtener_pago(pago_id: int, db: Session = Depends(get_db)):
    """Obtener un pago por ID"""
    pago = db.query(models.Pago).filter(models.Pago.id == pago_id).first()
    
    if not pago:
        raise HTTPException(status_code=404, detail="Pago no encontrado")
    
    return pago


@router.post("/", response_model=schemas.PagoOut)
def crear_pago(pago: schemas.PagoCreate, db: Session = Depends(get_db)):
    """
    Crear un nuevo pago para un pedido.
    Automáticamente cambia el estado del pedido a 'pagado' y libera la mesa.
    """
    
    # Validar que el pedido exista
    pedido = (
        db.query(models.Pedido)
        .options(joinedload(models.Pedido.mesa))
        .filter(models.Pedido.id_pedido == pago.id_pedido)
        .first()
    )
    
    if not pedido:
        raise HTTPException(status_code=404, detail="El pedido no existe")
    
    # Validar que el pedido no esté ya pagado
    if pedido.estado == "pagado":
        raise HTTPException(
            status_code=400, 
            detail=f"El pedido {pago.id_pedido} ya está pagado"
        )
    
    # Verificar que no exista ya un pago para este pedido
    pago_existente = db.query(models.Pago).filter(models.Pago.id_pedido == pago.id_pedido).first()
    if pago_existente:
        raise HTTPException(
            status_code=400,
            detail=f"El pedido {pago.id_pedido} ya tiene un pago registrado"
        )
    
    # Validar método de pago
    metodos_validos = ['efectivo', 'tarjeta', 'trasferencia']
    if pago.metodo_pago not in metodos_validos:
        raise HTTPException(
            status_code=400,
            detail=f"Método de pago inválido. Valores permitidos: {', '.join(metodos_validos)}"
        )
    
    # Calcular el monto total del pedido
    monto_calculado = sum(
        float(detalle.subtotal) for detalle in pedido.detalle_pedido
    )
    
    # Verificar que el monto proporcionado coincida con el total
    if float(pago.monto) != monto_calculado:
        raise HTTPException(
            status_code=400,
            detail=f"El monto proporcionado ({pago.monto}) no coincide con el total del pedido ({monto_calculado})"
        )
    
    # Crear el pago
    nuevo_pago = models.Pago(
        id_pedido=pago.id_pedido,
        monto=pago.monto,
        metodo_pago=pago.metodo_pago,
        cliente=pago.cliente
    )
    
    db.add(nuevo_pago)
    
    # Cambiar estado del pedido a 'pagado'
    pedido.estado = "pagado"
    
    # Liberar la mesa si no hay otros pedidos activos
    otros_pedidos_activos = (
        db.query(models.Pedido)
        .filter(
            models.Pedido.id_mesa == pedido.id_mesa,
            models.Pedido.id_pedido != pago.id_pedido,
            models.Pedido.estado != "pagado"
        )
        .count()
    )
    
    if otros_pedidos_activos == 0 and pedido.mesa:
        pedido.mesa.estado = "libre"
    
    db.commit()
    db.refresh(nuevo_pago)
    
    return nuevo_pago


@router.get("/pedido/{pedido_id}", response_model=schemas.PagoOut)
def obtener_pago_por_pedido(pedido_id: int, db: Session = Depends(get_db)):
    """Obtener el pago asociado a un pedido"""
    
    pago = db.query(models.Pago).filter(models.Pago.id_pedido == pedido_id).first()
    
    if not pago:
        raise HTTPException(
            status_code=404, 
            detail=f"No se encontró pago para el pedido {pedido_id}"
        )
    
    return pago


@router.delete("/{pago_id}", response_model=dict)
def eliminar_pago(pago_id: int, db: Session = Depends(get_db)):
    """
    Eliminar un pago (revertir el pago).
    Cambia el estado del pedido de vuelta a 'servido'.
    """
    
    pago = db.query(models.Pago).filter(models.Pago.id == pago_id).first()
    if not pago:
        raise HTTPException(status_code=404, detail="Pago no encontrado")
    
    # Obtener el pedido asociado
    pedido = db.query(models.Pedido).filter(models.Pedido.id_pedido == pago.id_pedido).first()
    
    if pedido:
        # Cambiar estado del pedido de vuelta a 'servido'
        pedido.estado = "servido"
        
        # Cambiar estado de la mesa a 'ocupada' si estaba libre
        mesa = db.query(models.Mesa).filter(models.Mesa.id_mesa == pedido.id_mesa).first()
        if mesa and mesa.estado == "libre":
            mesa.estado = "ocupada"
    
    db.delete(pago)
    db.commit()
    
    return {"message": f"Pago {pago_id} eliminado correctamente. Pedido revertido a estado 'servido'."}