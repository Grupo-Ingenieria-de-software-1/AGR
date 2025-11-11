from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime, date
from decimal import Decimal


# ==========================================
# USUARIOS
# ==========================================
class Usuario(BaseModel):
    id_usuario: int
    nombre: str
    correo: str
    usuario: str 
    rol: str

    model_config = ConfigDict(from_attributes=True)


class UsuarioCreate(BaseModel):
    nombre: str
    correo: str
    usuario: str
    contraseña: str
    rol: str


# ==========================================
# MESAS
# ==========================================
class MesaAdd(BaseModel):
    numero: int
    tipo: str
    estado: str = "libre"


class MesaOut(BaseModel):
    id_mesa: int
    numero: int 
    tipo: str
    estado: str

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# PRODUCTOS
# ==========================================
class ProductoCreate(BaseModel):
    nombre: str
    precio: float
    categoria: str 
    disponible: Optional[bool] = True


class ProductoOut(BaseModel):
    id_producto: int
    nombre: str
    precio: float 
    categoria: str
    disponible: bool

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# PEDIDOS
# ==========================================
class ProductoDetalle(BaseModel):
    id_producto: int
    cantidad: int
    observaciones: Optional[str] = None


class PedidoCreate(BaseModel):
    id_mesa: int
    id_usuario: int 
    observaciones: Optional[str] = None
    detalles: List[ProductoDetalle]


class DetallePedidoOut(BaseModel):
    id_detalle: int
    id_pedido: int
    id_producto: int
    cantidad: int
    precio_unitario: float
    subtotal: float
    producto: Optional[ProductoOut] = None

    model_config = ConfigDict(from_attributes=True)


class PedidoOut(BaseModel):
    id_pedido: int
    id_mesa: int
    fecha: datetime
    id_usuario: int
    observaciones: Optional[str] = None
    estado: str
    detalle_pedido: List[DetallePedidoOut]
    mesa: Optional[MesaOut] = None
    
    model_config = ConfigDict(from_attributes=True)


# ==========================================
# RESERVAS
# ==========================================
class ReservaCreate(BaseModel):
    nombre_cliente: str
    documento: Optional[str] = None
    telefono: Optional[str] = None
    fecha_reserva: datetime
    id_mesa: int


class ReservaOut(BaseModel):
    id_reserva: int
    nombre_cliente: str
    documento: Optional[str] = None
    telefono: Optional[str] = None
    fecha_reserva: datetime
    id_mesa: int
    estado: str
    mesa: Optional[MesaOut] = None

    model_config = ConfigDict(from_attributes=True)


class ReservaUpdate(BaseModel):
    nombre_cliente: Optional[str] = None
    documento: Optional[str] = None
    telefono: Optional[str] = None
    fecha_reserva: Optional[datetime] = None
    id_mesa: Optional[int] = None
    estado: Optional[str] = None


# ==========================================
# PAGOS
# ==========================================
class PagoCreate(BaseModel):
    id_pedido: int
    monto: Decimal
    metodo_pago: str  # 'efectivo', 'tarjeta', 'trasferencia'
    cliente: Optional[str] = None


class PagoOut(BaseModel):
    id: int
    id_pedido: int
    monto: Decimal
    metodo_pago: str
    fecha: datetime
    cliente: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# VENTAS
# ==========================================
class VentaCreate(BaseModel):
    fecha: date
    total_dia: Decimal
    generado_por: Optional[int] = None


class VentaOut(BaseModel):
    id: int
    fecha: date
    total_dia: Decimal
    generado_por: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)


class VentaConUsuario(BaseModel):
    id: int
    fecha: date
    total_dia: Decimal
    generado_por: Optional[int] = None
    generador: Optional[Usuario] = None

    model_config = ConfigDict(from_attributes=True)