// Configuración de la API
//const API_URL = 'http://localhost:8000/productos';
const API_URL = window.auth.config.API_URL + '/productos';

// Variables globales
let productoAEliminar = null;

// ====== INICIALIZACIÓN ======
document.addEventListener('DOMContentLoaded', () => {
    inicializarEventos();
    mostrarSeccion('menu-principal');
});

// ====== GESTIÓN DE SECCIONES ======
function mostrarSeccion(seccion) {
    // Ocultar todas las secciones
    document.querySelectorAll('.menu-principal, .interfaz').forEach(el => {
        el.classList.add('oculto');
    });

    // Mostrar la sección solicitada
    if (seccion === 'menu-principal') {
        document.querySelector('.menu-principal').classList.remove('oculto');
    } else {
        const seccionElemento = document.getElementById(seccion);
        if (seccionElemento) {
            seccionElemento.classList.remove('oculto');
        }
    }
}

// ====== EVENTOS ======
function inicializarEventos() {
    // Botones del menú principal
    document.querySelectorAll('.opciones button').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const interfaz = e.target.dataset.interfaz;
            mostrarSeccion(interfaz);
            
            // Cargar datos si es necesario
            if (interfaz === 'listarProductos') {
                cargarProductos();
            }
        });
    });

    // Botones de navegación
    document.getElementById('btnAtras')?.addEventListener('click', () => {
        window.history.back();
    });

    document.getElementById('btnCerrarSesion')?.addEventListener('click', cerrarSesion);

    // CREAR PRODUCTO
    document.getElementById('btnVolverCrear')?.addEventListener('click', () => {
        limpiarFormularioCrear();
        mostrarSeccion('menu-principal');
    });

    document.getElementById('btnGuardarProducto')?.addEventListener('click', crearProducto);

    // BUSCAR PRODUCTO
    document.getElementById('btnBuscarProducto')?.addEventListener('click', buscarProducto);
    document.getElementById('btnVolverBuscar')?.addEventListener('click', () => {
        limpiarFormularioBuscar();
        mostrarSeccion('menu-principal');
    });

    // ELIMINAR PRODUCTO
    document.getElementById('btnBuscarEliminar')?.addEventListener('click', buscarProductoEliminar);
    document.getElementById('btnConfirmarEliminar')?.addEventListener('click', eliminarProducto);
    document.getElementById('btnCancelarEliminar')?.addEventListener('click', () => {
        document.getElementById('confirmacionEliminar').classList.add('oculto');
        productoAEliminar = null;
    });
    document.getElementById('btnVolverEliminar')?.addEventListener('click', () => {
        limpiarFormularioEliminar();
        mostrarSeccion('menu-principal');
    });

    // LISTAR PRODUCTOS
    document.getElementById('btnFiltrar')?.addEventListener('click', cargarProductos);
    document.getElementById('btnVolverLista')?.addEventListener('click', () => {
        mostrarSeccion('menu-principal');
    });
}

// ====== CREAR PRODUCTO ======
async function crearProducto() {
    const nombre = document.getElementById('nombreProducto').value.trim();
    const precio = parseFloat(document.getElementById('precioProducto').value);
    const categoria = document.getElementById('categoriaProducto').value;
    const disponible = document.getElementById('disponibleProducto').checked;

    // Validaciones
    if (!nombre) {
        mostrarMensaje('Por favor ingrese el nombre del producto', 'error', 'crearProducto');
        return;
    }

    if (isNaN(precio) || precio <= 0) {
        mostrarMensaje('Por favor ingrese un precio válido', 'error', 'crearProducto');
        return;
    }

    if (!categoria) {
        mostrarMensaje('Por favor seleccione una categoría', 'error', 'crearProducto');
        return;
    }

    const producto = {
        nombre,
        precio,
        categoria,
        disponible
    };

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(producto)
        });

        if (!response.ok) {
            throw new Error('Error al crear el producto');
        }

        const data = await response.json();
        mostrarMensaje(`Producto "${data.nombre}" creado exitosamente con ID: ${data.id_producto}`, 'exito', 'crearProducto');
        limpiarFormularioCrear();
    } catch (error) {
        console.error('Error:', error);
        mostrarMensaje('Error al crear el producto. Verifique su conexión.', 'error', 'crearProducto');
    }
}

function limpiarFormularioCrear() {
    document.getElementById('nombreProducto').value = '';
    document.getElementById('precioProducto').value = '';
    document.getElementById('categoriaProducto').value = '';
    document.getElementById('disponibleProducto').checked = true;
    eliminarMensajes('crearProducto');
}

// ====== BUSCAR PRODUCTO ======
async function buscarProducto() {
    const nombre = document.getElementById('nombreProductoBuscar').value.trim();

    if (!nombre || nombre.length < 2) {
        mostrarMensaje('Por favor ingrese al menos 2 caracteres para buscar', 'error', 'buscarProducto');
        return;
    }

    try {
        // Usar el parámetro de búsqueda en la URL
        const response = await fetch(`${API_URL}?nombre=${encodeURIComponent(nombre)}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Error al buscar productos');
        }

        const productos = await response.json();
        
        // Verificar que sea un array
        if (!Array.isArray(productos)) {
            console.error('La respuesta no es un array:', productos);
            throw new Error('Respuesta inválida del servidor');
        }

        if (productos.length === 0) {
            mostrarMensaje('No se encontraron productos con ese nombre', 'error', 'buscarProducto');
            document.getElementById('resultadoBusqueda').classList.add('oculto');
            return;
        }

        mostrarResultadosBusqueda(productos);
        eliminarMensajes('buscarProducto');
    } catch (error) {
        console.error('Error:', error);
        mostrarMensaje('Error al buscar productos. Verifique su conexión.', 'error', 'buscarProducto');
        document.getElementById('resultadoBusqueda').classList.add('oculto');
    }
}

function mostrarResultadosBusqueda(productos) {
    const contenedor = document.getElementById('listaResultados');
    contenedor.innerHTML = '';

    productos.forEach(producto => {
        const card = document.createElement('div');
        card.className = 'resultado-card';
        
        const estadoClase = producto.disponible ? 'estado-disponible' : 'estado-no-disponible';
        const estadoTexto = producto.disponible ? 'Disponible' : 'No disponible';

        card.innerHTML = `
            <h4>${producto.nombre}</h4>
            <div class="producto-detalle">
                <div class="detalle-item">
                    <span class="label">ID:</span>
                    <span>${producto.id_producto}</span>
                </div>
                <div class="detalle-item">
                    <span class="label">Precio:</span>
                    <span>${producto.precio.toFixed(2)}</span>
                </div>
                <div class="detalle-item">
                    <span class="label">Categoría:</span>
                    <span>${formatearCategoria(producto.categoria)}</span>
                </div>
                <div class="detalle-item">
                    <span class="label">Estado:</span>
                    <span class="${estadoClase}">${estadoTexto}</span>
                </div>
            </div>
        `;
        
        contenedor.appendChild(card);
    });
    
    document.getElementById('resultadoBusqueda').classList.remove('oculto');
}

function limpiarFormularioBuscar() {
    document.getElementById('nombreProductoBuscar').value = '';
    document.getElementById('resultadoBusqueda').classList.add('oculto');
    eliminarMensajes('buscarProducto');
}

// ====== ELIMINAR PRODUCTO ======
async function buscarProductoEliminar() {
    const id = document.getElementById('idProductoEliminar').value.trim();

    if (!id || parseInt(id) <= 0) {
        mostrarMensaje('Por favor ingrese un ID válido', 'error', 'eliminarProducto');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('Producto no encontrado');
            }
            throw new Error('Error al buscar el producto');
        }

        const producto = await response.json();
        productoAEliminar = producto;
        mostrarConfirmacionEliminar(producto);
        eliminarMensajes('eliminarProducto');
    } catch (error) {
        console.error('Error:', error);
        mostrarMensaje(error.message, 'error', 'eliminarProducto');
        document.getElementById('confirmacionEliminar').classList.add('oculto');
    }
}

function mostrarConfirmacionEliminar(producto) {
    document.getElementById('eliminarId').textContent = producto.id_producto;
    document.getElementById('eliminarNombre').textContent = producto.nombre;
    document.getElementById('eliminarPrecio').textContent = `$${producto.precio.toFixed(2)}`;
    document.getElementById('eliminarCategoria').textContent = formatearCategoria(producto.categoria);
    
    document.getElementById('confirmacionEliminar').classList.remove('oculto');
}

async function eliminarProducto() {
    if (!productoAEliminar) return;

    try {
        const response = await fetch(`${API_URL}/${productoAEliminar.id_producto}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Error al eliminar el producto');
        }

        mostrarMensaje(`Producto "${productoAEliminar.nombre}" eliminado exitosamente`, 'exito', 'eliminarProducto');
        document.getElementById('confirmacionEliminar').classList.add('oculto');
        document.getElementById('idProductoEliminar').value = '';
        productoAEliminar = null;
    } catch (error) {
        console.error('Error:', error);
        mostrarMensaje('Error al eliminar el producto. Verifique su conexión.', 'error', 'eliminarProducto');
    }
}

function limpiarFormularioEliminar() {
    document.getElementById('idProductoEliminar').value = '';
    document.getElementById('confirmacionEliminar').classList.add('oculto');
    productoAEliminar = null;
    eliminarMensajes('eliminarProducto');
}

// ====== LISTAR PRODUCTOS ======
async function cargarProductos() {
    const categoria = document.getElementById('filtroCategoria').value;
    let url = API_URL;

    if (categoria) {
        url += `?categoria=${categoria}`;
    }

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Error al cargar los productos');
        }

        const productos = await response.json();
        
        // Verificar que sea un array
        if (!Array.isArray(productos)) {
            console.error('La respuesta no es un array:', productos);
            throw new Error('Respuesta inválida del servidor');
        }
        
        mostrarTablaProductos(productos);
        eliminarMensajes('listarProductos');
    } catch (error) {
        console.error('Error:', error);
        mostrarMensaje('Error al cargar los productos. Verifique su conexión.', 'error', 'listarProductos');
    }
}

function mostrarTablaProductos(productos) {
    const contenedor = document.getElementById('tablaProductos');
    contenedor.innerHTML = '';

    if (productos.length === 0) {
        contenedor.innerHTML = '<p style="text-align: center; padding: 20px; color: #999;">No hay productos para mostrar</p>';
        return;
    }

    // Crear encabezado
    const header = document.createElement('div');
    header.className = 'tabla-header';
    header.innerHTML = `
        <div>ID</div>
        <div>NOMBRE</div>
        <div>PRECIO</div>
        <div>CATEGORÍA</div>
        <div>ESTADO</div>
    `;
    contenedor.appendChild(header);

    // Crear filas
    productos.forEach(producto => {
        const item = document.createElement('div');
        item.className = 'producto-item';
        
        const estadoClase = producto.disponible ? 'estado-disponible' : 'estado-no-disponible';
        const estadoTexto = producto.disponible ? 'Disponible' : 'No disponible';

        item.innerHTML = `
            <div>${producto.id_producto}</div>
            <div>${producto.nombre}</div>
            <div>$${producto.precio.toFixed(2)}</div>
            <div>${formatearCategoria(producto.categoria)}</div>
            <div class="${estadoClase}">${estadoTexto}</div>
        `;
        
        contenedor.appendChild(item);
    });
}

// ====== UTILIDADES ======
function formatearCategoria(categoria) {
    const categorias = {
        'entrada': 'Entrada',
        'fuerte': 'Fuerte',
        'bebida': 'Bebida',
        'ensalada': 'Ensalada',
        'postre': 'Postre',
        'adicion': 'Adición'
    };
    return categorias[categoria] || categoria;
}

function mostrarMensaje(mensaje, tipo, seccion) {
    eliminarMensajes(seccion);
    
    const div = document.createElement('div');
    div.className = tipo === 'error' ? 'mensaje-error' : 'mensaje-exito';
    div.textContent = mensaje;
    
    const seccionElemento = document.getElementById(seccion);
    const h2 = seccionElemento.querySelector('h2');
    h2.insertAdjacentElement('afterend', div);
}

function eliminarMensajes(seccion) {
    const seccionElemento = document.getElementById(seccion);
    seccionElemento.querySelectorAll('.mensaje-error, .mensaje-exito').forEach(el => el.remove());
}

function cerrarSesion() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    window.location.href = '../login.html';
}