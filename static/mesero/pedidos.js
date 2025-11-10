//const API_URL = "http://127.0.0.1:8000";

const API_URL = window.auth.config.API_URL;
const FRONTEND_URL = window.auth.config.FRONTEND_URL;

let carrito = [];
let categoriaActual = null;
let mesaValidada = null; // Guarda el id_mesa
let numeroMesaActual = null; // Guarda el número de mesa

// ======================= 
// VALIDACIÓN DE MESA
// ======================= 
async function validarMesa(numeroMesa, accion) {
    try {
        const response = await fetch(`${API_URL}/pedidos/validar-mesa/${numeroMesa}`);
        
        if (!response.ok) {
            const error = await response.json();
            alert(`❌ ${error.detail}`);
            return null;
        }
        
        const resultado = await response.json();
        
        // Si la acción es crear pedido, validar que no tenga pedido activo
        if (accion === "crearPedido" && resultado.tiene_pedido_activo) {
            alert(`⚠️ La mesa ${resultado.numero_mesa} ya tiene un pedido activo (ID: ${resultado.id_pedido_activo}). Debe ser pagado antes de crear uno nuevo.`);
            return null;
        }
        
        // Si es editar o eliminar, debe tener un pedido activo
        if ((accion === "editarPedido" || accion === "eliminarPedido") && !resultado.tiene_pedido_activo) {
            alert(`⚠️ La mesa ${resultado.numero_mesa} no tiene pedidos activos.`);
            return null;
        }
        
        // Guardar el ID de la mesa y el número
        mesaValidada = resultado.id_mesa;
        numeroMesaActual = resultado.numero_mesa;
        return resultado;
        
    } catch (error) {
        alert("❌ Error al validar la mesa: " + error.message);
        return null;
    }
}

// ======================= 
// CAMBIO DE INTERFAZ 
// ======================= 
async function mostrarInterfaz(id) {
    // Listar productos y pedidos no requieren validación de mesa
    if (id === "listarProductos" || id === "listarPedidos") {
        document.querySelector(".menu-principal").style.display = "none";
        document.querySelectorAll(".interfaz").forEach(sec => sec.classList.add("oculto"));
        document.getElementById(id)?.classList.remove("oculto");
        
        if (id === "listarProductos") {
            cargarProductos();
        }
        
        if (id === "listarPedidos") {
            cargarListaPedidos();
        }
        return;
    }
    
    // Para crear, editar y eliminar pedido sí se requiere validar mesa
    const numeroMesa = document.getElementById("mesa").value.trim();
    
    if (!numeroMesa || parseInt(numeroMesa) <= 0) {
        alert("⚠️ Ingrese un número de mesa válido");
        return;
    }
    
    // Validar mesa antes de mostrar la interfaz
    const resultado = await validarMesa(parseInt(numeroMesa), id);
    
    if (!resultado) {
        return; // No continuar si la mesa no es válida
    }
    
    // Ocultar menú principal y mostrar interfaz solicitada
    document.querySelector(".menu-principal").style.display = "none";
    document.querySelectorAll(".interfaz").forEach(sec => sec.classList.add("oculto"));
    document.getElementById(id)?.classList.remove("oculto");
    
    if (id === "crearPedido") {
        mostrarVistaCategorias();
    }
    
    if (id === "editarPedido") {
        cargarPedidoParaEditar(numeroMesaActual);
    }
    
    if (id === "eliminarPedido") {
        cargarPedidoParaEliminar(numeroMesaActual);
    }
}

function volverMenu() {
    document.querySelectorAll(".interfaz").forEach(sec => sec.classList.add("oculto"));
    document.querySelector(".menu-principal").style.display = "flex";
    document.getElementById("mesa").value = "";
    mesaValidada = null;
    numeroMesaActual = null;
    carrito = [];
    actualizarCarrito();
}

// ======================= 
// VISTAS DE CATEGORÍAS Y PRODUCTOS 
// ======================= 
function mostrarVistaCategorias() {
    document.getElementById("vistaCategorias").classList.remove("oculto");
    document.getElementById("vistaProductos").classList.add("oculto");
}

function mostrarVistaProductos(categoria) {
    categoriaActual = categoria;
    document.getElementById("vistaCategorias").classList.add("oculto");
    document.getElementById("vistaProductos").classList.remove("oculto");
    document.getElementById("nombreCategoria").textContent = getNombreCategoria(categoria);
    cargarProductosCategoria(categoria);
}

function getNombreCategoria(categoria) {
    const nombres = {
        "entrada": "ENTRADAS",
        "fuerte": "FUERTES",
        "bebida": "BEBIDAS",
        "ensalada": "ENSALADAS",
        "postre": "POSTRES",
        "adicion": "ADICIONES"
    };
    return nombres[categoria] || categoria.toUpperCase();
}

// ======================= 
// EVENTOS DE BOTONES 
// ======================= 
document.addEventListener("DOMContentLoaded", () => {
    // Botones del menú principal
    document.querySelectorAll(".opciones button").forEach(btn => {
        btn.addEventListener("click", () => {
            const id = btn.dataset.interfaz;
            mostrarInterfaz(id);
        });
    });

    // Validación de mesa en tiempo real
    const inputMesa = document.getElementById('mesa');
    const opcionesConMesa = document.querySelectorAll('.opciones button[data-interfaz="crearPedido"], .opciones button[data-interfaz="editarPedido"], .opciones button[data-interfaz="eliminarPedido"]');
    const opcionesSinMesa = document.querySelectorAll('.opciones button[data-interfaz="listarProductos"], .opciones button[data-interfaz="listarPedidos"]');
    const confirmar = document.getElementById('btnConfirmarMesa');

    function validarInput() {
        const valido = inputMesa.value.trim() !== '' && parseInt(inputMesa.value) > 0;
        // Solo deshabilitar las opciones que requieren mesa
        opcionesConMesa.forEach(btn => btn.disabled = !valido);
        confirmar.disabled = !valido;
        // Las opciones de listar siempre están habilitadas
        opcionesSinMesa.forEach(btn => btn.disabled = false);
    }

    inputMesa.addEventListener('input', validarInput);
    validarInput();

    // Botón atrás del menú principal
    document.getElementById("btnAtras").addEventListener("click", () => history.back());

    // Botón atrás desde la vista de categorías (vuelve al menú principal)
    document.getElementById("btnVolverMenuPrincipal")?.addEventListener("click", volverMenu);

    // Botones "Volver" en las interfaces
    document.getElementById("btnVolverEditar")?.addEventListener("click", volverMenu);
    document.getElementById("btnVolverEliminar")?.addEventListener("click", volverMenu);
    document.getElementById("btnVolverLista")?.addEventListener("click", volverMenu);
    document.getElementById("btnVolverListaPedidos")?.addEventListener("click", volverMenu);

    // Botón confirmar mesa (opcional, solo informativo)
    document.getElementById("btnConfirmarMesa").addEventListener("click", () => {
        const mesa = document.getElementById("mesa").value.trim();
        if (mesa) {
            alert(`✅ Mesa ${mesa} lista. Seleccione una opción del menú.`);
        }
    });

    // Botones confirmar pedido
    document.getElementById("btnConfirmarPedido").addEventListener("click", confirmarPedido);
    document.getElementById("btnConfirmarInferior").addEventListener("click", confirmarPedido);

    // Botón cerrar sesión
    document.getElementById("btnCerrarSesion").addEventListener("click", cerrarSesion);

    // Botones de categorías
    document.querySelectorAll("#categoriasMenu button").forEach(btn => {
        btn.addEventListener("click", () => {
            const categoria = btn.dataset.categoria.toLowerCase();
            mostrarVistaProductos(categoria);
        });
    });

    // Botón volver a categorías
    document.getElementById("btnVolverCategorias").addEventListener("click", mostrarVistaCategorias);
});

// ======================= 
// CARGAR PRODUCTOS DE CATEGORÍA 
// ======================= 
function cargarProductosCategoria(categoria) {
    const contenedor = document.getElementById("productosGrid");
    
    if (!contenedor) {
        console.error("No se encontró el elemento productosGrid");
        return;
    }
    
    contenedor.innerHTML = "<p>Cargando productos...</p>";

    fetch(`${API_URL}/productos?categoria=${categoria}`)
        .then(res => {
            if (!res.ok) throw new Error("Error al obtener productos");
            return res.json();
        })
        .then(productos => {
            if (productos.length === 0) {
                contenedor.innerHTML = "<p>No hay productos en esta categoría.</p>";
                return;
            }

            contenedor.innerHTML = "";
            productos.forEach(p => {
                const btn = document.createElement("button");
                btn.className = "producto-card";
                btn.textContent = p.nombre;
                btn.addEventListener("click", () => {
                    agregarAlCarrito(p.id_producto, p.nombre, p.precio);
                });
                contenedor.appendChild(btn);
            });
        })
        .catch(err => {
            console.error(err);
            contenedor.innerHTML = "<p>Error al cargar productos.</p>";
        });
}

// ======================= 
// CARRITO 
// ======================= 
function agregarAlCarrito(id, nombre, precio) {
    const item = carrito.find(p => p.id_producto === id);
    if (item) {
        item.cantidad += 1;
    } else {
        carrito.push({
            id_producto: id,
            nombre,
            precio,
            cantidad: 1
        });
    }
    actualizarCarrito();
}

function eliminarDelCarrito(id) {
    carrito = carrito.filter(p => p.id_producto !== id);
    actualizarCarrito();
}

function actualizarCarrito() {
    const lista = document.getElementById("listaCarrito");
    if (carrito.length === 0) {
        lista.innerHTML = '<li class="carrito-vacio">Carrito vacío.</li>';
        return;
    }

    lista.innerHTML = "";
    carrito.forEach(p => {
        const li = document.createElement("li");
        li.className = "item-carrito";
        li.innerHTML = `
            <span>${p.nombre} x${p.cantidad}</span>
            <button class="eliminar" data-id="${p.id_producto}">✖</button>
        `;
        lista.appendChild(li);
    });

    // Agregar eventos a los botones "✖"
    document.querySelectorAll(".eliminar").forEach(btn => {
        btn.addEventListener("click", () => {
            const id = parseInt(btn.dataset.id);
            eliminarDelCarrito(id);
        });
    });
}

// ======================= 
// CONFIRMAR PEDIDO 
// ======================= 
function confirmarPedido() {
    if (!mesaValidada) {
        alert("⚠️ No hay una mesa validada.");
        return;
    }
    
    if (carrito.length === 0) {
        alert("⚠️ El carrito está vacío.");
        return;
    }

    const id_usuario = 1;
    const detalles = carrito.map(p => ({
        id_producto: p.id_producto,
        cantidad: p.cantidad,
        observaciones: ""
    }));

    const pedido = {
        id_mesa: mesaValidada,
        id_usuario,
        observaciones: "",
        detalles
    };

    fetch(`${API_URL}/pedidos/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(pedido)
        })
        .then(res => {
            if (!res.ok) {
                return res.json().then(err => {
                    throw new Error(err.detail || "Error al crear pedido");
                });
            }
            return res.json();
        })
        .then(() => {
            alert("✅ Pedido creado correctamente");
            carrito = [];
            actualizarCarrito();
            volverMenu();
        })
        .catch(err => alert("❌ Error al crear pedido: " + err.message));
}

// ======================= 
// LISTAR PRODUCTOS 
// ======================= 
async function cargarProductos() {
    const lista = document.getElementById("listaProductos");
    lista.innerHTML = '<li class="loading">Cargando productos...</li>';
    try {
        const response = await fetch(`${API_URL}/productos`);
        if (!response.ok) throw new Error("Error al obtener productos");
        const productos = await response.json();
        lista.innerHTML = "";
        productos.forEach(p => {
            const li = document.createElement("li");
            li.textContent = `${p.id_producto} - ${p.nombre} ($${p.precio})`;
            lista.appendChild(li);
        });
    } catch (error) {
        console.error(error);
        lista.innerHTML = "<li>No se pudieron cargar los productos.</li>";
    }
}

// ======================= 
// CERRAR SESIÓN 
// ======================= 
function cerrarSesion() {

    window.authLogout();
}

// ======================= 
// EDITAR PEDIDOS 
// ======================= 
async function cargarPedidoParaEditar(numeroMesa) {
    try {
        const res = await fetch(`${API_URL}/pedidos/mesa/${numeroMesa}/pedido`);
        if (!res.ok) {
            const error = await res.json();
            alert(`❌ ${error.detail}`);
            volverMenu();
            return;
        }
        
        const pedido = await res.json();

        // Ocultar el formulario de búsqueda y mostrar directamente los datos
        document.querySelector("#editarPedido .formulario").style.display = "none";
        document.getElementById("pedidoIdEditar").value = pedido.id_pedido;
        
        // Mostrar el número de mesa en lugar del id_mesa
        document.getElementById("mesaEditar").value = numeroMesa;
        document.getElementById("usuarioEditar").value = pedido.id_usuario;
        document.getElementById("observacionesEditar").value = pedido.observaciones || "";

        const lista = document.getElementById("listaProductosEditar");
        lista.innerHTML = pedido.detalle_pedido
            .map(
                (d) => `
            <div class="detalle-item">
                <p><strong>Producto:</strong> ${d.producto?.nombre || "Sin nombre"} (ID: ${d.id_producto})</p>
                <label>Cantidad:</label>
                <input type="number" id="cant_${d.id_producto}" value="${d.cantidad}" min="1" />
                <p><strong>Precio:</strong> ${d.precio_unitario}</p>
                <hr>
            </div>
        `
            )
            .join("");

        document.getElementById("datosPedido").classList.remove("oculto");

        // Configurar el botón de guardar cambios
        document.getElementById("btnGuardarCambios").onclick = async () => {
            const nuevoPedido = {
                id_mesa: pedido.id_mesa, // Usar el id_mesa original del pedido
                id_usuario: parseInt(document.getElementById("usuarioEditar").value),
                observaciones: document.getElementById("observacionesEditar").value,
                detalles: pedido.detalle_pedido.map((d) => ({
                    id_producto: d.id_producto,
                    cantidad: parseInt(document.getElementById(`cant_${d.id_producto}`).value),
                })),
            };

            try {
                const resp = await fetch(`${API_URL}/pedidos/${pedido.id_pedido}`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(nuevoPedido),
                });
                if (!resp.ok) throw new Error("Error al actualizar el pedido");
                alert("✅ Pedido actualizado correctamente");
                volverMenu();
            } catch (err) {
                alert("❌ No se pudo actualizar: " + err.message);
            }
        };
    } catch (error) {
        alert("❌ No se pudo obtener el pedido: " + error.message);
        volverMenu();
    }
}

// ======================= 
// ELIMINAR PEDIDOS 
// ======================= 
async function cargarPedidoParaEliminar(numeroMesa) {
    try {
        const res = await fetch(`${API_URL}/pedidos/mesa/${numeroMesa}/pedido`);
        if (!res.ok) {
            const error = await res.json();
            alert(`❌ ${error.detail}`);
            volverMenu();
            return;
        }
        
        const pedido = await res.json();

        // Ocultar el formulario de búsqueda y mostrar directamente los datos
        document.querySelector("#eliminarPedido .formulario").style.display = "none";
        
        const infoPedido = document.getElementById("infoPedidoEliminar");
        infoPedido.innerHTML = `
            <p><strong>ID Pedido:</strong> ${pedido.id_pedido}</p>
            <p><strong>Mesa:</strong> ${numeroMesa}</p>
            <p><strong>Estado:</strong> ${pedido.estado}</p>
            <p><strong>Observaciones:</strong> ${pedido.observaciones || "Ninguna"}</p>
            <h4>Productos:</h4>
            <ul>
                ${pedido.detalle_pedido.map(d => `
                    <li>${d.producto?.nombre || "Sin nombre"} - Cant: ${d.cantidad} - ${d.precio_unitario}</li>
                `).join("")}
            </ul>
        `;
        
        document.getElementById("datosPedidoEliminar").classList.remove("oculto");
        
        // Configurar el botón de eliminar
        document.getElementById("btnEliminarPedido").onclick = async () => {
            if (!confirm("¿Está seguro que desea eliminar este pedido?")) return;
            
            try {
                const resp = await fetch(`${API_URL}/pedidos/${pedido.id_pedido}`, {
                    method: "DELETE"
                });
                if (!resp.ok) throw new Error("Error al eliminar pedido");
                alert("✅ Pedido eliminado correctamente");
                volverMenu();
            } catch (error) {
                alert("❌ No se pudo eliminar el pedido: " + error.message);
            }
        };
    } catch (error) {
        alert("❌ No se pudo obtener el pedido: " + error.message);
        volverMenu();
    }
}

// ======================= 
// LISTAR PEDIDOS 
// ======================= 
async function cargarListaPedidos() {
    const lista = document.getElementById("listaPedidos");
    lista.innerHTML = "<p>Cargando pedidos...</p>";

    try {
        const res = await fetch(`${API_URL}/pedidos/`);
        if (!res.ok) throw new Error("No se pudieron obtener los pedidos");
        const pedidos = await res.json();
        lista.innerHTML = "";

        if (pedidos.length === 0) {
            lista.innerHTML = "<p>No hay pedidos registrados.</p>";
            return;
        }

        pedidos.forEach((pedido) => {
            const li = document.createElement("li");
            li.classList.add("pedido-item");
            li.innerHTML = `
                <h3>🧾 Pedido #${pedido.id_pedido}</h3>
                <p><strong>Mesa:</strong> ${pedido.mesa?.numero || pedido.id_mesa}</p>
                <p><strong>Estado:</strong> ${pedido.estado}</p>
                <p><strong>Observaciones:</strong> ${pedido.observaciones || "Ninguna"}</p>
                <h4>Productos:</h4>
                <ul class="productos-lista">
                    ${pedido.detalle_pedido.map(detalle => `
                        <li>
                            ${detalle.producto?.nombre || "Producto sin nombre"} - 
                            Cant: ${detalle.cantidad} - 
                            Precio: ${detalle.precio_unitario} - 
                            Subtotal: ${detalle.subtotal}
                        </li>
                    `).join("")}
                </ul>
            `;
            lista.appendChild(li);
        });
    } catch (error) {
        console.error(error);
        lista.innerHTML = `<p>Error al cargar pedidos: ${error.message}</p>`;
    }
}