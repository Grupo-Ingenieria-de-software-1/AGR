const API_URL = "http://127.0.0.1:8000";
let filtroActual = "todas";

// ======================= 
// NAVEGACIÓN
// ======================= 
function mostrarInterfaz(id) {
    document.querySelector(".menu-principal").style.display = "none";
    document.querySelectorAll(".interfaz").forEach(sec => sec.classList.add("oculto"));
    document.getElementById(id)?.classList.remove("oculto");
    
    if (id === "listarReservas") {
        cargarReservas();
    }
}

function volverMenu() {
    document.querySelectorAll(".interfaz").forEach(sec => sec.classList.add("oculto"));
    document.querySelector(".menu-principal").style.display = "flex";
    limpiarFormularios();
}

function limpiarFormularios() {
    document.getElementById("formCrearReserva")?.reset();
    document.getElementById("formEditarReserva")?.reset();
    document.getElementById("formEditarReserva")?.classList.add("oculto");
    document.getElementById("datosReservaCancelar")?.classList.add("oculto");
    document.getElementById("resultadosMesa")?.classList.add("oculto");
}

// ======================= 
// EVENTOS
// ======================= 
document.addEventListener("DOMContentLoaded", () => {
    // Botones del menú principal
    document.querySelectorAll(".opciones button").forEach(btn => {
        btn.addEventListener("click", () => {
            const id = btn.dataset.interfaz;
            mostrarInterfaz(id);
        });
    });

    // Botones volver
    document.getElementById("btnAtras")?.addEventListener("click", () => history.back());
    document.getElementById("btnVolverCrear")?.addEventListener("click", volverMenu);
    document.getElementById("btnVolverEditar")?.addEventListener("click", volverMenu);
    document.getElementById("btnVolverCancelar")?.addEventListener("click", volverMenu);
    document.getElementById("btnVolverLista")?.addEventListener("click", volverMenu);
    document.getElementById("btnVolverConsultar")?.addEventListener("click", volverMenu);

    // Formulario crear reserva
    document.getElementById("formCrearReserva")?.addEventListener("submit", crearReserva);

    // Formulario editar reserva
    document.getElementById("btnBuscarReserva")?.addEventListener("click", buscarReservaEditar);
    document.getElementById("formEditarReserva")?.addEventListener("submit", editarReserva);

    // Cancelar reserva
    document.getElementById("btnBuscarCancelar")?.addEventListener("click", buscarReservaCancelar);
    document.getElementById("btnConfirmarCancelar")?.addEventListener("click", cancelarReserva);

    // Consultar por mesa
    document.getElementById("btnConsultarMesa")?.addEventListener("click", consultarReservasMesa);

    // Filtros de lista
    document.querySelectorAll(".btn-filtro").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".btn-filtro").forEach(b => b.classList.remove("activo"));
            btn.classList.add("activo");
            filtroActual = btn.dataset.filtro;
            cargarReservas();
        });
    });
});

// ======================= 
// CREAR RESERVA
// ======================= 
async function crearReserva(e) {
    e.preventDefault();

    const nombreCliente = document.getElementById("nombreCliente").value.trim();
    const documento = document.getElementById("documento").value.trim();
    const telefono = document.getElementById("telefono").value.trim();
    const fechaReserva = document.getElementById("fechaReserva").value;
    const numeroMesa = parseInt(document.getElementById("numeroMesaCrear").value);

    if (!nombreCliente || !fechaReserva || !numeroMesa) {
        alert("⚠️ Complete todos los campos obligatorios");
        return;
    }

    // Validar que la fecha sea futura
    const fechaSeleccionada = new Date(fechaReserva);
    const ahora = new Date();
    
    if (fechaSeleccionada <= ahora) {
        alert("⚠️ La fecha de reserva debe ser futura");
        return;
    }

    try {
        // Primero validar que la mesa exista
        const mesaResponse = await fetch(`${API_URL}/mesas`);
        const mesas = await mesaResponse.json();
        const mesaExiste = mesas.find(m => m.numero === numeroMesa);

        if (!mesaExiste) {
            alert(`❌ La mesa ${numeroMesa} no existe`);
            return;
        }

        const reserva = {
            nombre_cliente: nombreCliente,
            documento: documento || null,
            telefono: telefono || null,
            fecha_reserva: fechaReserva,
            id_mesa: mesaExiste.id_mesa
        };

        const response = await fetch(`${API_URL}/reservas/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(reserva)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || "Error al crear reserva");
        }

        const resultado = await response.json();
        alert(`✅ Reserva creada exitosamente\nID: ${resultado.id_reserva}\nMesa: ${numeroMesa}`);
        document.getElementById("formCrearReserva").reset();
        volverMenu();

    } catch (error) {
        alert("❌ Error: " + error.message);
    }
}

// ======================= 
// BUSCAR Y EDITAR RESERVA
// ======================= 
async function buscarReservaEditar() {
    const idReserva = parseInt(document.getElementById("idReservaBuscar").value);

    if (!idReserva || idReserva <= 0) {
        alert("⚠️ Ingrese un ID válido");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/reservas/${idReserva}`);
        
        if (!response.ok) {
            throw new Error("Reserva no encontrada");
        }

        const reserva = await response.json();

        // Llenar el formulario de edición
        document.getElementById("idReservaEditar").value = reserva.id_reserva;
        document.getElementById("nombreClienteEditar").value = reserva.nombre_cliente;
        document.getElementById("documentoEditar").value = reserva.documento || "";
        document.getElementById("telefonoEditar").value = reserva.telefono || "";
        
        // Formatear fecha para input datetime-local
        const fecha = new Date(reserva.fecha_reserva);
        const fechaFormateada = fecha.toISOString().slice(0, 16);
        document.getElementById("fechaReservaEditar").value = fechaFormateada;
        
        document.getElementById("numeroMesaEditar").value = reserva.mesa?.numero || "";
        document.getElementById("estadoEditar").value = reserva.estado;

        document.getElementById("formEditarReserva").classList.remove("oculto");

    } catch (error) {
        alert("❌ " + error.message);
    }
}

async function editarReserva(e) {
    e.preventDefault();

    const idReserva = parseInt(document.getElementById("idReservaEditar").value);
    const nombreCliente = document.getElementById("nombreClienteEditar").value.trim();
    const documento = document.getElementById("documentoEditar").value.trim();
    const telefono = document.getElementById("telefonoEditar").value.trim();
    const fechaReserva = document.getElementById("fechaReservaEditar").value;
    const numeroMesa = parseInt(document.getElementById("numeroMesaEditar").value);
    const estado = document.getElementById("estadoEditar").value;

    try {
        // Obtener id_mesa del número de mesa
        const mesaResponse = await fetch(`${API_URL}/mesas`);
        const mesas = await mesaResponse.json();
        const mesaExiste = mesas.find(m => m.numero === numeroMesa);

        if (!mesaExiste) {
            alert(`❌ La mesa ${numeroMesa} no existe`);
            return;
        }

        const reservaActualizada = {
            nombre_cliente: nombreCliente,
            documento: documento || null,
            telefono: telefono || null,
            fecha_reserva: fechaReserva,
            id_mesa: mesaExiste.id_mesa,
            estado: estado
        };

        const response = await fetch(`${API_URL}/reservas/${idReserva}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(reservaActualizada)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || "Error al actualizar reserva");
        }

        alert("✅ Reserva actualizada correctamente");
        volverMenu();

    } catch (error) {
        alert("❌ Error: " + error.message);
    }
}

// ======================= 
// CANCELAR RESERVA
// ======================= 
async function buscarReservaCancelar() {
    const idReserva = parseInt(document.getElementById("idReservaCancelar").value);

    if (!idReserva || idReserva <= 0) {
        alert("⚠️ Ingrese un ID válido");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/reservas/${idReserva}`);
        
        if (!response.ok) {
            throw new Error("Reserva no encontrada");
        }

        const reserva = await response.json();

        // Mostrar información de la reserva
        const infoDiv = document.getElementById("infoReservaCancelar");
        const fecha = new Date(reserva.fecha_reserva).toLocaleString('es-ES');
        
        infoDiv.innerHTML = `
            <p><strong>ID:</strong> ${reserva.id_reserva}</p>
            <p><strong>Cliente:</strong> ${reserva.nombre_cliente}</p>
            <p><strong>Documento:</strong> ${reserva.documento || "N/A"}</p>
            <p><strong>Teléfono:</strong> ${reserva.telefono || "N/A"}</p>
            <p><strong>Fecha:</strong> ${fecha}</p>
            <p><strong>Mesa:</strong> ${reserva.mesa?.numero || "N/A"}</p>
            <p><strong>Estado:</strong> <span class="estado-badge estado-${reserva.estado}">${reserva.estado}</span></p>
        `;

        document.getElementById("datosReservaCancelar").classList.remove("oculto");
        
        // Guardar ID en el botón
        document.getElementById("btnConfirmarCancelar").dataset.idReserva = idReserva;

    } catch (error) {
        alert("❌ " + error.message);
    }
}

async function cancelarReserva() {
    const idReserva = parseInt(document.getElementById("btnConfirmarCancelar").dataset.idReserva);

    if (!confirm("¿Está seguro que desea cancelar esta reserva?")) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/reservas/${idReserva}`, {
            method: "DELETE"
        });

        if (!response.ok) {
            throw new Error("Error al cancelar reserva");
        }

        alert("✅ Reserva cancelada correctamente");
        volverMenu();

    } catch (error) {
        alert("❌ Error: " + error.message);
    }
}

// ======================= 
// LISTAR RESERVAS
// ======================= 
async function cargarReservas() {
    const lista = document.getElementById("listaReservas");
    lista.innerHTML = "<p style='text-align: center; padding: 20px;'>Cargando reservas...</p>";

    try {
        const response = await fetch(`${API_URL}/reservas/`);
        
        if (!response.ok) {
            throw new Error("Error al obtener reservas");
        }

        let reservas = await response.json();

        // Aplicar filtro
        if (filtroActual !== "todas") {
            reservas = reservas.filter(r => r.estado === filtroActual);
        }

        lista.innerHTML = "";

        if (reservas.length === 0) {
            lista.innerHTML = "<p style='text-align: center; padding: 20px;'>No hay reservas registradas.</p>";
            return;
        }

        // Ordenar por fecha (más recientes primero)
        reservas.sort((a, b) => new Date(b.fecha_reserva) - new Date(a.fecha_reserva));

        reservas.forEach(reserva => {
            const li = document.createElement("li");
            li.classList.add("reserva-item");
            
            const fecha = new Date(reserva.fecha_reserva).toLocaleString('es-ES');
            
            li.innerHTML = `
                <h3>📅 Reserva #${reserva.id_reserva}</h3>
                <p><strong>Cliente:</strong> ${reserva.nombre_cliente}</p>
                <p><strong>Documento:</strong> ${reserva.documento || "N/A"}</p>
                <p><strong>Teléfono:</strong> ${reserva.telefono || "N/A"}</p>
                <p><strong>Fecha:</strong> ${fecha}</p>
                <p><strong>Mesa:</strong> ${reserva.mesa?.numero || "N/A"}</p>
                <p><strong>Estado:</strong> <span class="estado-badge estado-${reserva.estado}">${reserva.estado}</span></p>
            `;
            
            lista.appendChild(li);
        });

    } catch (error) {
        lista.innerHTML = `<p style='text-align: center; padding: 20px; color: red;'>Error al cargar reservas: ${error.message}</p>`;
    }
}

// ======================= 
// CONSULTAR POR MESA
// ======================= 
async function consultarReservasMesa() {
    const numeroMesa = parseInt(document.getElementById("numeroMesaConsultar").value);

    if (!numeroMesa || numeroMesa <= 0) {
        alert("⚠️ Ingrese un número de mesa válido");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/reservas/mesa/${numeroMesa}/activas`);
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || "Error al consultar reservas");
        }

        const reservas = await response.json();
        
        document.getElementById("numeroMesaMostrar").textContent = numeroMesa;
        const lista = document.getElementById("listaReservasMesa");
        lista.innerHTML = "";

        if (reservas.length === 0) {
            lista.innerHTML = "<p style='text-align: center; padding: 20px;'>No hay reservas activas para esta mesa.</p>";
        } else {
            reservas.forEach(reserva => {
                const li = document.createElement("li");
                li.classList.add("reserva-item");
                
                const fecha = new Date(reserva.fecha_reserva).toLocaleString('es-ES');
                
                li.innerHTML = `
                    <h3>📅 Reserva #${reserva.id_reserva}</h3>
                    <p><strong>Cliente:</strong> ${reserva.nombre_cliente}</p>
                    <p><strong>Documento:</strong> ${reserva.documento || "N/A"}</p>
                    <p><strong>Teléfono:</strong> ${reserva.telefono || "N/A"}</p>
                    <p><strong>Fecha:</strong> ${fecha}</p>
                    <p><strong>Estado:</strong> <span class="estado-badge estado-${reserva.estado}">${reserva.estado}</span></p>
                `;
                
                lista.appendChild(li);
            });
        }

        document.getElementById("resultadosMesa").classList.remove("oculto");

    } catch (error) {
        alert("❌ " + error.message);
    }
}