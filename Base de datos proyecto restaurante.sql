create database db_restaurante;
use db_restaurante;


create table usuarios (
id_usuario int auto_increment primary key,
nombre varchar(100) not null,
correo varchar(100) unique,
usuario varchar(50) not null unique,
contraseña varchar(255) not null unique,
rol Enum('administrador', 'cajero', 'mesero') not null
);

create table mesas(
id_mesa int auto_increment primary key,    
numero int not null,
tipo varchar(100) not null,   -- regular o grande(para poder unir solo dos mesas y sea mas sencillo
estado  Enum('libre', 'ocupada', 'reservada') default 'libre'
);

create table mesas_unidas (
id int auto_increment primary key,
mesa_principal int not null,
mesa_secundaria int not null,
estado enum('activa','cerrada') default 'activa',
foreign key (mesa_principal) references mesas(id_mesa),
foreign key (mesa_secundaria) references mesas(id_mesa)
);


create table productos(
id_producto int auto_increment primary key,
nombre varchar(100) not null, 
precio decimal(10,2) not null,
categoria enum('comida', 'bebida', 'postre', 'otro') not null,
disponible boolean default true 
);

create table descuentos (
    id int auto_increment primary key,
    tipo enum('hora_feliz','cupon','convenio') not null,
    valor DECIMAL(10,2) NOT NULL,
    condiciones TEXT,
    fecha_inicio DATETIME,
    fecha_fin DATETIME
);

create table clientes (
id_cliente int auto_increment primary key,
documento varchar(50) unique, -- cedula o din por si un cliente web o presencial se registra en la pagina web o en el restaurante encuentre la coincidencia y los relacione (hay que crear un campo en la pagina para registro)
nombre varchar(100) not null,
correo varchar(100) ,
unique (correo),
id_descuento int,
foreign key(id_descuento) references descuentos(id)

);

create table pedidos(
id_pedido int auto_increment primary key,
id_mesa int not null, 
fecha timestamp default current_timestamp,
id_usuario int not null, -- el del mesero
observaciones text,
estado enum('recibido-pendiente', 'servido', 'pagado') default 'recibido-pendiente',
foreign key (id_usuario) references usuarios(id_usuario),
foreign key (id_mesa) references mesas(id_mesa)
);


create table detalle_pedido(
id_detalle int auto_increment primary key,
id_pedido int not null,
id_producto  int not null,
cantidad int not null default 1,
precio_unitario decimal(10,2) not null,
subtotal decimal(10,2) generated always as (cantidad * precio_unitario) stored,
foreign key (id_pedido)references pedidos(id_pedido),
foreign key (id_producto) references productos(id_producto)
);


create table reservas(
id_reserva int auto_increment primary key,
nombre_cliente varchar(100) not null,
documento varchar(50) ,                              -- Cualquiera puede hacer una reservacion, si es un cliente en resgistrado
telefono varchar(15),                                      -- bien sea en la web o presencial tiene prioriadad o descuentos? hay que hacer que coincida
fecha_reserva datetime not null,                           -- por si detecta que un cliente registrado quiere hacer una reservacion
id_mesa int not null,
estado enum('activa', 'cumplida', 'cancelada') default 'activa',
foreign key (id_mesa) references mesas(id_mesa)
);



create table parqueadero (
id int auto_increment primary key,
capacidad_total int not null,
capacidad_ocupada int not null default 0

);

create table pagos(
id int auto_increment primary key,
id_pedido int not null,
monto decimal(10,2) not null,  -- se calcula en la app
metodo_pago enum('efectivo', 'tajeta', 'trasferencia') not null,
fecha datetime default current_timestamp,
cliente varchar(100),
foreign key (id_pedido) references pedidos(id_pedido)

);


create table ventas (
id int auto_increment primary key,
fecha date not null, 
total_dia decimal(12,2) not null, 
generado_por int,
foreign key (generado_por) references usuarios(id_usuarios)
);
