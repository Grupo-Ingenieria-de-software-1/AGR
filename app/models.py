from sqlalchemy import Column, Integer, String, ForeignKey, Text, Enum, Boolean, Numeric, TIMESTAMP, DateTime, Date, func
from sqlalchemy.orm import relationship
from app.database import Base


class Usuario(Base):
    __tablename__ = "usuarios"
    id_usuario = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    correo = Column(String(100), unique=True, nullable=False)
    usuario = Column(String(100), nullable=False)
    contraseña = Column(String(100), nullable=False)
    rol = Column(Enum('administrador', 'cajero', 'mesero', name="rol_usuario"), nullable=False)

    pedidos = relationship("Pedido", back_populates="usuario")
    ventas_generadas = relationship("Venta", back_populates="generador")


class Mesa(Base):
    __tablename__ = "mesas"
    id_mesa = Column(Integer, primary_key=True, index=True, autoincrement=True)
    numero = Column(Integer, unique=True, nullable=False)
    tipo = Column(String(100), nullable=False)
    estado = Column(Enum('libre', 'ocupada', 'reservada'), nullable=False, default="libre")
    
    pedidos = relationship("Pedido", back_populates="mesa")
    reservas = relationship("Reserva", back_populates="mesa")


class Pedido(Base):
    __tablename__ = "pedidos"   

    id_pedido = Column(Integer, primary_key=True, index=True)
    id_mesa = Column(Integer, ForeignKey("mesas.id_mesa"), nullable=False)
    fecha = Column(TIMESTAMP, server_default=func.now())
    id_usuario = Column(Integer, ForeignKey("usuarios.id_usuario"), nullable=False)
    observaciones = Column(Text, nullable=True)
    estado = Column(
        Enum("recibido-pendiente", "servido", "pagado", name="estado_pedido"), 
        nullable=False, 
        server_default="recibido-pendiente"
    )

    usuario = relationship("Usuario", back_populates="pedidos")
    mesa = relationship("Mesa", back_populates="pedidos")
    detalle_pedido = relationship("Detalle_Pedido", back_populates="pedido", cascade="all, delete-orphan")
    pago = relationship("Pago", back_populates="pedido", uselist=False)  # Un pedido tiene un pago


class Detalle_Pedido(Base):
    __tablename__ = "detalle_pedido"

    id_detalle = Column(Integer, primary_key=True, index=True)
    id_pedido = Column(Integer, ForeignKey("pedidos.id_pedido"), nullable=False)
    id_producto = Column(Integer, ForeignKey("productos.id_producto"), nullable=False)
    cantidad = Column(Integer, default=1, nullable=False)
    precio_unitario = Column(Numeric(10, 2), nullable=False) 
    subtotal = Column(Numeric(10, 2), nullable=False, server_default="0.00")
    
    pedido = relationship("Pedido", back_populates="detalle_pedido")
    producto = relationship("Producto", back_populates="detalle_pedido")


class Producto(Base): 
    __tablename__ = "productos"

    id_producto = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    precio = Column(Numeric(10, 2), nullable=False)
    categoria = Column(
        Enum('entrada', 'fuerte', 'bebida', 'ensalada', 'postre', 'adicion', 'otro'), 
        nullable=False
    )
    disponible = Column(Boolean, default=True)

    detalle_pedido = relationship("Detalle_Pedido", back_populates="producto")


# ==========================================
# NUEVAS TABLAS
# ==========================================

class Reserva(Base):
    __tablename__ = "reservas"
    
    id_reserva = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nombre_cliente = Column(String(100), nullable=False)
    documento = Column(String(50), nullable=True)
    telefono = Column(String(15), nullable=True)
    fecha_reserva = Column(DateTime, nullable=False)
    id_mesa = Column(Integer, ForeignKey("mesas.id_mesa"), nullable=False)
    estado = Column(
        Enum('activa', 'cumplida', 'cancelada', name="estado_reserva"),
        nullable=False,
        default='activa'
    )
    
    mesa = relationship("Mesa", back_populates="reservas")


class Pago(Base):
    __tablename__ = "pagos"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    id_pedido = Column(Integer, ForeignKey("pedidos.id_pedido"), nullable=False)
    monto = Column(Numeric(10, 2), nullable=False)
    metodo_pago = Column(
        Enum('efectivo', 'tajeta', 'trasferencia', name="metodo_pago"),
        nullable=False
    )
    fecha = Column(DateTime, server_default=func.now())
    cliente = Column(String(100), nullable=True)
    
    pedido = relationship("Pedido", back_populates="pago")


class Venta(Base):
    __tablename__ = "ventas"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    fecha = Column(Date, nullable=False)
    total_dia = Column(Numeric(12, 2), nullable=False)
    generado_por = Column(Integer, ForeignKey("usuarios.id_usuario"), nullable=True)
    
    generador = relationship("Usuario", back_populates="ventas_generadas")