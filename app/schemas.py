from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime 


#Para la respuesta de la api.
class Usuario(BaseModel):
    id_usuario: int
    nombre: str
    correo: str
    usuario: str 
    rol: str

    class Config:
     from_attributes=True

class UsuarioCreate(BaseModel):
    nombre: str
    correo: str
    usuario: str
    contraseña: str
    rol: str

class MesaAdd(BaseModel):
     numero: int
     tipo: str
     estado: str = "libre"

class MesaOut(BaseModel):
    id_mesa: int
    numero: int 
    tipo: str
    estado: str

    class Config:
        from_attributes= True


class ProductoCreate(BaseModel):
    nombre:str
    precio:float
    categoria: str 
    disponible: Optional[bool]=True

class ProductoOut(BaseModel):
    id_producto: int
    nombre: str
    precio: float 
    categoria: str
    disponible: bool

    class Config:
        from_attributes= True


#producto dentro de un detalle
class ProductoDetalle(BaseModel):
    id_producto: int
    cantidad:int
    observaciones: Optional[str]= None



#El imput al crear un pedido
class PedidoCreate(BaseModel):
    id_mesa:int
    id_usuario: int 
    observaciones: Optional[str]=None
    detalles: list[ProductoDetalle]


class DetallePedidoOut(BaseModel):
    id_detalle: int
    id_pedido: int
    id_producto: int
    cantidad: int
    precio_unitario: float
    subtotal: float
    producto: Optional[ProductoOut]

    class Config:
        from_attributes=True


class PedidoOut(BaseModel):
    id_pedido: int
    id_mesa: int
    fecha: datetime
    id_usuario: int
    observaciones: Optional[str]
    estado:str
    detalle_pedido: List[DetallePedidoOut]
    
    class Config:
        from_attributes=True




