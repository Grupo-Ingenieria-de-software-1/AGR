from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import models, schemas
from app.database import get_db


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
def listar_productos(db: Session = Depends(get_db)):
    return db.query(models.Producto).all()


#buscar un producto por id:

@router.get("/{id_producto}", response_model=schemas.ProductoOut)
def obtener_producto(id_producto: int, db: Session = Depends(get_db)):
    producto = db.query(models.Producto).filter(models.Producto.id_producto == id_producto).first()
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return producto