const API_URL = "http://127.0.0.1:8000";
let carrito = [];
let categoriaActual = null;

// ======================= 
// CAMBIO DE INTERFAZ 
// ======================= 
function mostrarInterfaz(id) {
    document.querySelector(".menu-principal").style.display = "none";
    document.querySelectorAll(".interfaz").forEach(sec => sec.classList.add("oculto"));
    document.getElementById(id)?.classList.remove("oculto");
    
    if (id === "listarProductos") {
        cargarProductos();
    }
    
    if (id === "crearPedido") {
        mostrarVistaCategorias();
    }
}

function volverMenu() {
    document.querySelectorAll(".interfaz").forEach(sec => sec.classList.add("oculto"));
    document.querySelector(".menu-principal").style.display = "flex";
    document.getElementById("mesa").value = "";
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
        "Entrada": "ENTRADAS",
        "Fuerte": "FUERTES",
        "Bebida": "BEBIDAS",
        "Ensalada": "ENSALADAS",
        "Postre": "POSTRES",
        "Adicion": "ADICIONES"
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

    // Validación de mesa
    const inputMesa = document.getElementById('mesa');
    const opciones = document.querySelectorAll('.opciones button');
    const confirmar = document.getElementById('btnConfirmarMesa');

    function validarMesa() {
        const valido = inputMesa.value.trim() !== '' && parseInt(inputMesa.value) > 0;
        opciones.forEach(btn => btn.disabled = !valido);
        confirmar.disabled = !valido;
    }

    inputMesa.addEventListener('input', validarMesa);
    validarMesa();

    // Botón atrás del menú principal
    document.getElementById("btnAtras").addEventListener("click", () => history.back());

    // Botón atrás desde la vista de categorías (vuelve al menú principal)
    document.getElementById("btnVolverMenuPrincipal")?.addEventListener("click", volverMenu);

    // Botones "Volver" en las interfaces
    document.getElementById("btnVolverEditar")?.addEventListener("click", volverMenu);
    document.getElementById("btnVolverEliminar")?.addEventListener("click", volverMenu);
    document.getElementById("btnVolverLista")?.addEventListener("click", volverMenu);
    document.getElementById("btnVolverListaPedidos")?.addEventListener("click", volverMenu);

    // Botón confirmar mesa
    document.getElementById("btnConfirmarMesa").addEventListener("click", () => {
        const mesa = document.getElementById("mesa").value.trim();
        if (mesa) {
            alert(`✅ Mesa ${mesa} registrada. Ahora puedes crear el pedido.`);
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
            const categoria = btn.dataset.categoria;
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
    const mesa = document.getElementById("mesa").value;
    if (!mesa) {
        alert("⚠️ Ingresa el número de mesa antes de confirmar el pedido.");
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
        id_mesa: parseInt(mesa),
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
            if (!res.ok) throw new Error("Error al crear pedido");
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
    if (confirm("¿Seguro que deseas cerrar sesión?")) {
        alert("Sesión cerrada");
        volverMenu();
    }
}

// ======================= 
// EDITAR PEDIDOS 
// ======================= 
document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("btnBuscarEditar")?.addEventListener("click", async () => {
        const id = document.getElementById("pedidoIdEditar").value.trim();
        if (!id) return alert("⚠️ Ingresa el ID del pedido.");
        try {
            const res = await fetch(`${API_URL}/pedidos/${id}`);
            if (!res.ok) throw new Error("Pedido no encontrado");
            const pedido = await res.json();

            document.getElementById("mesaEditar").value = pedido.id_mesa;
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
                    <p><strong>Precio:</strong> $${d.precio_unitario}</p>
                    <hr>
                </div>
            `
                )
                .join("");

            document.getElementById("datosPedido").classList.remove("oculto");

            document.getElementById("btnGuardarCambios").onclick = async () => {
                const nuevoPedido = {
                    id_mesa: parseInt(document.getElementById("mesaEditar").value),
                    id_usuario: parseInt(document.getElementById("usuarioEditar").value),
                    observaciones: document.getElementById("observacionesEditar").value,
                    detalles: pedido.detalle_pedido.map((d) => ({
                        id_producto: d.id_producto,
                        cantidad: parseInt(document.getElementById(`cant_${d.id_producto}`).value),
                    })),
                };

                try {
                    const resp = await fetch(`${API_URL}/pedidos/${id}`, {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify(nuevoPedido),
                    });
                    if (!resp.ok) throw new Error("Error al actualizar el pedido");
                    alert("✅ Pedido actualizado correctamente");
                    document.getElementById("datosPedido").classList.add("oculto");
                    document.getElementById("pedidoIdEditar").value = "";
                } catch (err) {
                    alert("❌ No se pudo actualizar: " + err.message);
                }
            };
        } catch (error) {
            alert("❌ No se pudo obtener el pedido: " + error.message);
        }
    });

    // ======================= 
    // ELIMINAR PEDIDOS 
    // ======================= 
    document.getElementById("btnBuscarPedidoEliminar")?.addEventListener("click", async () => {
        const id = document.getElementById("pedidoIdEliminar").value.trim();
        if (!id) return alert("⚠️ Ingresa el ID del pedido.");
        if (!confirm("¿Seguro que deseas eliminar este pedido?")) return;

        try {
            const res = await fetch(`${API_URL}/pedidos/${id}`, {
                method: "DELETE"
            });
            if (!res.ok) throw new Error("Error al eliminar pedido");
            alert("✅ Pedido eliminado correctamente");
            document.getElementById("pedidoIdEliminar").value = "";
        } catch (error) {
            alert("❌ No se pudo eliminar el pedido: " + error.message);
        }
    });

    // ======================= 
    // LISTAR PEDIDOS 
    // ======================= 
    document.querySelector('button[data-interfaz="listarPedidos"]')?.addEventListener("click", async () => {
        mostrarInterfaz("listarPedidos");
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
                    <p><strong>Mesa:</strong> ${pedido.id_mesa}</p>
                    <p><strong>Estado:</strong> ${pedido.estado}</p>
                    <p><strong>Observaciones:</strong> ${pedido.observaciones ?? "Ninguna"}</p>
                    <h4>Productos:</h4>
                    <ul class="productos-lista">
                        ${pedido.detalle_pedido.map(detalle => `
                            <li>
                                ${detalle.producto?.nombre || "Producto sin nombre"} - 
                                Cant: ${detalle.cantidad} - 
                                Precio: $${detalle.precio_unitario} - 
                                Subtotal: $${detalle.subtotal}
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
    });
});