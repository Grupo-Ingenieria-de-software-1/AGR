from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from app import models, schemas
from app.database import get_db
from datetime import datetime

router = APIRouter(
    prefix="/reservas",
    tags=["Reservas"]
)


@router.get("/", response_model=list[schemas.ReservaOut])
def listar_reservas(db: Session = Depends(get_db)):
    """Listar todas las reservas"""
    reservas = (
        db.query(models.Reserva)
        .options(joinedload(models.Reserva.mesa))
        .all()
    )
    return reservas


@router.get("/{reserva_id}", response_model=schemas.ReservaOut)
def obtener_reserva(reserva_id: int, db: Session = Depends(get_db)):
    """Obtener una reserva por ID"""
    reserva = (
        db.query(models.Reserva)
        .options(joinedload(models.Reserva.mesa))
        .filter(models.Reserva.id_reserva == reserva_id)
        .first()
    )
    
    if not reserva:
        raise HTTPException(status_code=404, detail="Reserva no encontrada")
    
    return reserva


@router.post("/", response_model=schemas.ReservaOut)
def crear_reserva(reserva: schemas.ReservaCreate, db: Session = Depends(get_db)):
    """Crear una nueva reserva"""
    
    # Validar que la mesa exista
    mesa = db.query(models.Mesa).filter(models.Mesa.id_mesa == reserva.id_mesa).first()
    if not mesa:
        raise HTTPException(status_code=404, detail="La mesa no existe")
    
    # Validar que la fecha de reserva sea futura
    if reserva.fecha_reserva <= datetime.now():
        raise HTTPException(
            status_code=400, 
            detail="La fecha de reserva debe ser futura"
        )
    
    # Verificar si ya existe una reserva activa para esa mesa en esa fecha/hora
    reserva_existente = (
        db.query(models.Reserva)
        .filter(
            models.Reserva.id_mesa == reserva.id_mesa,
            models.Reserva.fecha_reserva == reserva.fecha_reserva,
            models.Reserva.estado == "activa"
        )
        .first()
    )
    
    if reserva_existente:
        raise HTTPException(
            status_code=400,
            detail=f"La mesa {mesa.numero} ya tiene una reserva activa para esa fecha/hora"
        )
    
    # Crear la reserva
    nueva_reserva = models.Reserva(
        nombre_cliente=reserva.nombre_cliente,
        documento=reserva.documento,
        telefono=reserva.telefono,
        fecha_reserva=reserva.fecha_reserva,
        id_mesa=reserva.id_mesa
    )
    
    # Cambiar estado de la mesa a "reservada"
    mesa.estado = "reservada"
    
    db.add(nueva_reserva)
    db.commit()
    
    # Recargar con relaciones
    reserva_db = (
        db.query(models.Reserva)
        .options(joinedload(models.Reserva.mesa))
        .filter(models.Reserva.id_reserva == nueva_reserva.id_reserva)
        .first()
    )
    
    return reserva_db


@router.put("/{reserva_id}", response_model=schemas.ReservaOut)
def actualizar_reserva(
    reserva_id: int, 
    reserva_update: schemas.ReservaUpdate, 
    db: Session = Depends(get_db)
):
    """Actualizar una reserva existente"""
    
    reserva_db = db.query(models.Reserva).filter(models.Reserva.id_reserva == reserva_id).first()
    if not reserva_db:
        raise HTTPException(status_code=404, detail="Reserva no encontrada")
    
    # Actualizar campos si se proporcionan
    if reserva_update.nombre_cliente is not None:
        reserva_db.nombre_cliente = reserva_update.nombre_cliente
    
    if reserva_update.documento is not None:
        reserva_db.documento = reserva_update.documento
    
    if reserva_update.telefono is not None:
        reserva_db.telefono = reserva_update.telefono
    
    if reserva_update.fecha_reserva is not None:
        if reserva_update.fecha_reserva <= datetime.now():
            raise HTTPException(status_code=400, detail="La fecha debe ser futura")
        reserva_db.fecha_reserva = reserva_update.fecha_reserva
    
    if reserva_update.id_mesa is not None:
        mesa = db.query(models.Mesa).filter(models.Mesa.id_mesa == reserva_update.id_mesa).first()
        if not mesa:
            raise HTTPException(status_code=404, detail="La mesa no existe")
        reserva_db.id_mesa = reserva_update.id_mesa
    
    if reserva_update.estado is not None:
        estado_anterior = reserva_db.estado
        reserva_db.estado = reserva_update.estado
        
        # Si la reserva se cancela o se cumple, liberar la mesa
        if reserva_update.estado in ["cancelada", "cumplida"] and estado_anterior == "activa":
            mesa = db.query(models.Mesa).filter(models.Mesa.id_mesa == reserva_db.id_mesa).first()
            if mesa and mesa.estado == "reservada":
                # Verificar si hay otras reservas activas en esa mesa
                otras_reservas = (
                    db.query(models.Reserva)
                    .filter(
                        models.Reserva.id_mesa == reserva_db.id_mesa,
                        models.Reserva.id_reserva != reserva_id,
                        models.Reserva.estado == "activa"
                    )
                    .count()
                )
                if otras_reservas == 0:
                    mesa.estado = "libre"
    
    db.commit()
    
    # Recargar con relaciones
    reserva_actualizada = (
        db.query(models.Reserva)
        .options(joinedload(models.Reserva.mesa))
        .filter(models.Reserva.id_reserva == reserva_id)
        .first()
    )
    
    return reserva_actualizada


@router.delete("/{reserva_id}", response_model=dict)
def eliminar_reserva(reserva_id: int, db: Session = Depends(get_db)):
    """Eliminar una reserva"""
    
    reserva = db.query(models.Reserva).filter(models.Reserva.id_reserva == reserva_id).first()
    if not reserva:
        raise HTTPException(status_code=404, detail="Reserva no encontrada")
    
    # Obtener la mesa antes de eliminar
    mesa = db.query(models.Mesa).filter(models.Mesa.id_mesa == reserva.id_mesa).first()
    
    # Verificar si hay otras reservas activas en esa mesa
    otras_reservas = (
        db.query(models.Reserva)
        .filter(
            models.Reserva.id_mesa == reserva.id_mesa,
            models.Reserva.id_reserva != reserva_id,
            models.Reserva.estado == "activa"
        )
        .count()
    )
    
    db.delete(reserva)
    
    # Si no hay otras reservas activas, liberar la mesa
    if otras_reservas == 0 and mesa and mesa.estado == "reservada":
        mesa.estado = "libre"
    
    db.commit()
    
    return {"message": f"Reserva {reserva_id} eliminada correctamente"}


@router.get("/mesa/{numero_mesa}/activas", response_model=list[schemas.ReservaOut])
def obtener_reservas_activas_mesa(numero_mesa: int, db: Session = Depends(get_db)):
    """Obtener reservas activas de una mesa por su número"""
    
    # Buscar la mesa por número
    mesa = db.query(models.Mesa).filter(models.Mesa.numero == numero_mesa).first()
    if not mesa:
        raise HTTPException(status_code=404, detail=f"La mesa {numero_mesa} no existe")
    
    # Obtener reservas activas
    reservas = (
        db.query(models.Reserva)
        .options(joinedload(models.Reserva.mesa))
        .filter(
            models.Reserva.id_mesa == mesa.id_mesa,
            models.Reserva.estado == "activa"
        )
        .all()
    )
    
    return reservas