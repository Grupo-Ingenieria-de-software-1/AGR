from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from app import models, schemas
from app.database import get_db
from datetime import date, datetime
from decimal import Decimal

router = APIRouter(
    prefix="/ventas",
    tags=["Ventas"]
)


@router.get("/", response_model=list[schemas.VentaConUsuario])
def listar_ventas(db: Session = Depends(get_db)):
    """Listar todas las ventas"""
    ventas = (
        db.query(models.Venta)
        .options(joinedload(models.Venta.generador))
        .all()
    )
    return ventas


@router.get("/{venta_id}", response_model=schemas.VentaConUsuario)
def obtener_venta(venta_id: int, db: Session = Depends(get_db)):
    """Obtener una venta por ID"""
    venta = (
        db.query(models.Venta)
        .options(joinedload(models.Venta.generador))
        .filter(models.Venta.id == venta_id)
        .first()
    )
    
    if not venta:
        raise HTTPException(status_code=404, detail="Venta no encontrada")
    
    return venta


@router.post("/", response_model=schemas.VentaOut)
def crear_venta(venta: schemas.VentaCreate, db: Session = Depends(get_db)):
    """Crear un registro de venta manualmente"""
    
    # Validar que el usuario exista si se proporciona
    if venta.generado_por:
        usuario = db.query(models.Usuario).filter(
            models.Usuario.id_usuario == venta.generado_por
        ).first()
        if not usuario:
            raise HTTPException(status_code=404, detail="El usuario no existe")
    
    # Verificar si ya existe una venta para esa fecha
    venta_existente = db.query(models.Venta).filter(
        models.Venta.fecha == venta.fecha
    ).first()
    
    if venta_existente:
        raise HTTPException(
            status_code=400,
            detail=f"Ya existe un registro de ventas para la fecha {venta.fecha}"
        )
    
    # Crear la venta
    nueva_venta = models.Venta(
        fecha=venta.fecha,
        total_dia=venta.total_dia,
        generado_por=venta.generado_por
    )
    
    db.add(nueva_venta)
    db.commit()
    db.refresh(nueva_venta)
    
    return nueva_venta


@router.post("/generar/{fecha}", response_model=schemas.VentaOut)
def generar_venta_automatica(
    fecha: date,
    usuario_id: int,
    db: Session = Depends(get_db)
):
    """
    Generar automáticamente el reporte de ventas del día.
    Calcula el total sumando todos los pagos de pedidos de esa fecha.
    """
    
    # Validar que el usuario exista
    usuario = db.query(models.Usuario).filter(
        models.Usuario.id_usuario == usuario_id
    ).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="El usuario no existe")
    
    # Verificar si ya existe una venta para esa fecha
    venta_existente = db.query(models.Venta).filter(
        models.Venta.fecha == fecha
    ).first()
    
    if venta_existente:
        raise HTTPException(
            status_code=400,
            detail=f"Ya existe un reporte de ventas para la fecha {fecha}. ID: {venta_existente.id}"
        )
    
    # Calcular el total del día sumando todos los pagos de pedidos de esa fecha
    total_dia = (
        db.query(func.sum(models.Pago.monto))
        .join(models.Pedido, models.Pago.id_pedido == models.Pedido.id_pedido)
        .filter(func.date(models.Pedido.fecha) == fecha)
        .scalar()
    )
    
    if total_dia is None:
        total_dia = Decimal('0.00')
    
    # Crear el registro de venta
    nueva_venta = models.Venta(
        fecha=fecha,
        total_dia=total_dia,
        generado_por=usuario_id
    )
    
    db.add(nueva_venta)
    db.commit()
    db.refresh(nueva_venta)
    
    return nueva_venta


@router.get("/fecha/{fecha}", response_model=schemas.VentaConUsuario)
def obtener_venta_por_fecha(fecha: date, db: Session = Depends(get_db)):
    """Obtener el reporte de ventas de una fecha específica"""
    
    venta = (
        db.query(models.Venta)
        .options(joinedload(models.Venta.generador))
        .filter(models.Venta.fecha == fecha)
        .first()
    )
    
    if not venta:
        raise HTTPException(
            status_code=404,
            detail=f"No se encontró reporte de ventas para la fecha {fecha}"
        )
    
    return venta


@router.get("/rango/{fecha_inicio}/{fecha_fin}", response_model=list[schemas.VentaConUsuario])
def obtener_ventas_por_rango(
    fecha_inicio: date,
    fecha_fin: date,
    db: Session = Depends(get_db)
):
    """Obtener reportes de ventas en un rango de fechas"""
    
    if fecha_inicio > fecha_fin:
        raise HTTPException(
            status_code=400,
            detail="La fecha de inicio debe ser anterior a la fecha de fin"
        )
    
    ventas = (
        db.query(models.Venta)
        .options(joinedload(models.Venta.generador))
        .filter(
            models.Venta.fecha >= fecha_inicio,
            models.Venta.fecha <= fecha_fin
        )
        .order_by(models.Venta.fecha)
        .all()
    )
    
    return ventas


@router.put("/{venta_id}", response_model=schemas.VentaOut)
def actualizar_venta(
    venta_id: int,
    venta_update: schemas.VentaCreate,
    db: Session = Depends(get_db)
):
    """Actualizar un registro de venta"""
    
    venta_db = db.query(models.Venta).filter(models.Venta.id == venta_id).first()
    if not venta_db:
        raise HTTPException(status_code=404, detail="Venta no encontrada")
    
    # Validar usuario si se proporciona
    if venta_update.generado_por:
        usuario = db.query(models.Usuario).filter(
            models.Usuario.id_usuario == venta_update.generado_por
        ).first()
        if not usuario:
            raise HTTPException(status_code=404, detail="El usuario no existe")
    
    venta_db.fecha = venta_update.fecha
    venta_db.total_dia = venta_update.total_dia
    venta_db.generado_por = venta_update.generado_por
    
    db.commit()
    db.refresh(venta_db)
    
    return venta_db


@router.delete("/{venta_id}", response_model=dict)
def eliminar_venta(venta_id: int, db: Session = Depends(get_db)):
    """Eliminar un registro de venta"""
    
    venta = db.query(models.Venta).filter(models.Venta.id == venta_id).first()
    if not venta:
        raise HTTPException(status_code=404, detail="Venta no encontrada")
    
    db.delete(venta)
    db.commit()
    
    return {"message": f"Venta {venta_id} eliminada correctamente"}