from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import models, schemas
from app.database import get_db
from typing import Optional


router=APIRouter(
    prefix="/productos", tags=["Productos"]
)


@router.post("/", response_model=schemas.ProductoOut)
             
def crear_producto(producto: schemas.ProductoCreate, db: Session= Depends(get_db)):
    nuevo_producto= models.Producto(
        nombre= producto.nombre,
        precio=producto.precio,
        categoria=producto.categoria,
        disponible=producto.disponible
    )

    db.add(nuevo_producto)
    db.commit()
    db.refresh(nuevo_producto)
    return nuevo_producto



#para listar los productos
@router.get("/", response_model=list[schemas.ProductoOut])
def listar_productos(categoria: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(models.Producto)
    if categoria:
        query = query.filter(models.Producto.categoria == categoria)
    return query.all()


#buscar un producto por id:

@router.get("/{id_producto}", response_model=schemas.ProductoOut)
def obtener_producto(id_producto: int, db: Session = Depends(get_db)):
    producto = db.query(models.Producto).filter(models.Producto.id_producto == id_producto).first()
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return producto


# eliminar un producto por id
@router.delete("/{id_producto}", status_code=204)
def eliminar_producto(id_producto: int, db: Session = Depends(get_db)):
    producto = db.query(models.Producto).filter(models.Producto.id_producto == id_producto).first()
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
    db.delete(producto)
    db.commit()
    return {"message": f"Producto con ID {id_producto} eliminado correctamente"}