create database if not exists db_restaurante;
use db_restaurante;


create table if not exists mesero_demo (
    id_mesero int auto_increment primary key,
    nombre varchar(100) not null
);


create table if not exists usuarios (
id_usuario int auto_increment primary key,
nombre varchar(100) not null,
correo varchar(100) not null unique,
usuario varchar(50) not null,
contraseña varchar(255) not null,
rol Enum('administrador', 'cajero', 'mesero') not null
)engine=InnoDB;

create table if not exists mesas(
id_mesa int auto_increment primary key,    
numero int not null,
tipo varchar(100) not null,   -- regular o grande(para poder unir solo dos mesas y sea mas sencillo
estado  Enum('libre', 'ocupada', 'reservada') default 'libre'
)engine=InnoDB;

create table if not exists mesas_unidas (
id int auto_increment primary key,
mesa_principal int not null,
mesa_secundaria int not null,
estado enum('activa','cerrada') default 'activa',
foreign key (mesa_principal) references mesas(id_mesa),
foreign key (mesa_secundaria) references mesas(id_mesa)
)engine=InnoDB;


create table if not exists productos(
id_producto int auto_increment primary key,
nombre varchar(100) not null, 
precio decimal(10,2) not null,
categoria enum('comida', 'bebida', 'postre', 'otro') not null,
disponible boolean default true 
)engine=InnoDB;

create table if not exists descuentos (
    id int auto_increment primary key,
    tipo enum('hora_feliz','cupon','convenio') not null,
    valor DECIMAL(10,2) NOT NULL,
    condiciones TEXT,
    fecha_inicio DATETIME,
    fecha_fin DATETIME
)engine=InnoDB;

create table if not exists clientes (
id_cliente int auto_increment primary key,
documento varchar(50) unique, -- cedula o din por si un cliente web o presencial se registra en la pagina web o en el restaurante encuentre la coincidencia y los relacione (hay que crear un campo en la pagina para registro)
nombre varchar(100) not null,
correo varchar(100) ,
unique (correo),
id_descuento int,
foreign key(id_descuento) references descuentos(id)

)engine=InnoDB;

create table if not exists pedidos(
id_pedido int auto_increment primary key,
id_mesa int not null, 
fecha timestamp default current_timestamp,
id_usuario int not null, -- el del mesero
observaciones text,
estado enum('recibido-pendiente', 'servido', 'pagado') default 'recibido-pendiente',
foreign key (id_usuario) references usuarios(id_usuario),
foreign key (id_mesa) references mesas(id_mesa)
)engine=InnoDB;


create table if not exists detalle_pedido(
id_detalle int auto_increment primary key,
id_pedido int not null,
id_producto  int not null,
cantidad int not null default 1,
precio_unitario decimal(10,2) not null,
subtotal decimal(10,2),
foreign key (id_pedido)references pedidos(id_pedido),
foreign key (id_producto) references productos(id_producto)
)engine=InnoDB;

delimiter $$
 create trigger antes_de_detalle
 before insert on detalle_pedido
 for each row 
 begin set new.subtotal=new.cantidad*new.precio_unitario; 
 
 end$$ 
 -- para calcular subtotal al actualizar
 create trigger calcular_sub
 before update on detalle_pedido 
 for each row 
 begin 
 set new.subtotal= new.cantidad * new.precio_unitario; 
 
 end$$
 
 delimiter ; 

create table if not exists reservas(
id_reserva int auto_increment primary key,
nombre_cliente varchar(100) not null,
documento varchar(50) ,                              -- Cualquiera puede hacer una reservacion, si es un cliente en resgistrado
telefono varchar(15),                                      -- bien sea en la web o presencial tiene prioriadad o descuentos? hay que hacer que coincida
fecha_reserva datetime not null,                           -- por si detecta que un cliente registrado quiere hacer una reservacion
id_mesa int not null,
estado enum('activa', 'cumplida', 'cancelada') default 'activa',
foreign key (id_mesa) references mesas(id_mesa)
)engine=InnoDB;



create table if not exists parqueadero (
id int auto_increment primary key,
capacidad_total int not null,
capacidad_ocupada int not null default 0

)engine=InnoDB;

create table if not exists pagos(
id int auto_increment primary key,
id_pedido int not null,
monto decimal(10,2) not null,  -- se calcula en la app
metodo_pago enum('efectivo', 'tajeta', 'trasferencia') not null,
fecha datetime default current_timestamp,
cliente varchar(100),
foreign key (id_pedido) references pedidos(id_pedido)

)engine=InnoDB;


create table if not exists ventas (
id int auto_increment primary key,
fecha date not null, 
total_dia decimal(12,2) not null, 
generado_por int,
foreign key (generado_por) references usuarios(id_usuario)
)engine=InnoDB;

ALTER TABLE usuarios
MODIFY correo VARCHAR(100) NOT NULL;

ALTER TABLE productos 
MODIFY COLUMN categoria 
ENUM('entrada', 'fuerte', 'bebida', 'ensalada', 'postre', 'adicion', 'otro') 
NOT NULL;

select * from usuarios;