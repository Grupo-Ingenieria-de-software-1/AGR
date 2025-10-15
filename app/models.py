from sqlalchemy import Column, Integer, String, ForeignKey, Text, Enum, Boolean, Numeric, TIMESTAMP, func
from sqlalchemy.orm import  relationship
from app.database import Base




class Usuario(Base):
    __tablename__="usuarios"
    id_usuario= Column(Integer, primary_key=True, index=True)
    nombre= Column(String(100), nullable=False)
    correo= Column(String(100), unique= False )
    usuario= Column(String(100), nullable=False, unique=True)
    contraseña= Column(String(100), nullable=False, unique=True)
    rol=Column(Enum('administrador', 'cajero', 'mesero', name="rol_usuario"), nullable=False)

    pedidos= relationship("Pedido", back_populates= "usuario")
    
class Mesa(Base):
    __tablename__="mesas"
    id_mesa= Column(Integer, primary_key=True, index=True, autoincrement=True)
    numero= Column(Integer, unique=True, nullable=False)
    tipo= Column(String(100), nullable=False)
    estado= Column(Enum('libre', 'ocupada', 'reservada'), nullable=False, default="libre")
    
    pedidos= relationship("Pedido", back_populates="mesa")

class Pedido(Base):
    __tablename__ = "pedidos"   

    id_pedido = Column(Integer, primary_key=True, index=True)
    id_mesa = Column(Integer, ForeignKey("mesas.id_mesa"), nullable=False)
    fecha = Column(TIMESTAMP, server_default=func.now())
    id_usuario = Column(Integer, ForeignKey("usuarios.id_usuario"), nullable=False)  # mesero
    observaciones = Column(Text, nullable=True)
    estado = Column(Enum("recibido-pendiente", "servido", "pagado", name="estado_pedido"), 
                    nullable=False, 
                    server_default="recibido-pendiente")

    # Relaciones
    usuario = relationship("Usuario", back_populates="pedidos")   # se asocia con el mesero que hizo el pedido
    mesa= relationship("Mesa", back_populates="pedidos")
    detalle_pedido = relationship("Detalle_Pedido", back_populates="pedido", cascade="all, delete-orphan")


class Detalle_Pedido(Base):
        __tablename__= "detalle_pedido"

        id_detalle= Column(Integer, primary_key=True, index=True)
        id_pedido= Column(Integer, ForeignKey("pedidos.id_pedido"), nullable=False)
        id_producto= Column(Integer, ForeignKey("productos.id_producto"), nullable= False)
        cantidad= Column(Integer, default=1, nullable=False)
        precio_unitario= Column(Numeric(10,2), nullable=False) 
        subtotal= Column(Numeric(10,2), nullable=False, server_default="0.00")
        
        pedido = relationship("Pedido", back_populates= "detalle_pedido")
        producto =relationship("Producto", back_populates="detalle_pedido")

class Producto(Base): 
    __tablename__= "productos"

    id_producto=Column(Integer, primary_key=True, index=True)
    nombre=Column(String(100), nullable=False)
    precio=Column(Numeric(10,2), nullable=False)
    categoria=Column(Enum('entrada', 'fuerte', 'bebida', 'ensalada', 'postre', 'adicion', 'otro'), nullable=False)
    disponible=Column(Boolean, default=True)

    detalle_pedido= relationship("Detalle_Pedido", back_populates="producto")
