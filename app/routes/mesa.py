from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session 
from app import models, schemas 
from ..database import get_db

router=APIRouter(prefix="/mesas", tags=["Mesas"])

@router.get("/", response_model=list[schemas.MesaOut])
def listar_mesas(db: Session= Depends(get_db)):
    mesas= db.query(models.Mesa).all()
    return mesas

@router.post("/", response_model=schemas.MesaOut)
def añadir_mesa(mesa: schemas.MesaAdd, db: Session= Depends(get_db)):
    #Se valida que no se repita el numero
    existente = db.query(models.Mesa).filter(models.Mesa.numero == mesa.numero).first()
    if existente:
        raise HTTPException(status_code=400, detail="Ya existe una mesa con ese número")

    nueva_mesa = models.Mesa(**mesa.model_dump()) #toma los datos del objeto mesa y los pasa al constructor de la clase models.Mesa
    db.add(nueva_mesa)
    db.commit()
    db.refresh(nueva_mesa)
    return nueva_mesa