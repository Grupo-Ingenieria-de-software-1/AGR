from pydantic import BaseModel
from typing import Optional
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


#El imput al crear un pedido
class PedidoCreate(BaseModel):
    id_mesa:int
    id_usuario: int 
    observaciones: Optional[str]=None

class PedidoOut(BaseModel):
    id_pedido: int
    id_mesa: int
    fecha: datetime
    id_usuario: int
    observaciones: Optional[str]
    estado:str
    
    class Config:
        from_attributes=True