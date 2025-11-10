const API_URL = window.auth.config.API_URL;
const FRONTEND_URL = window.auth.config.FRONTEND_URL;

let mesaValidada = null;
let pedidoActual = null;

// =======================
// VOLVER AL MENÚ PRINCIPAL
// =======================
function volverMenu() {
    document.getElementById("mesa").value = "";
    document.getElementById("tablaDetalles").innerHTML = "";
    document.getElementById("detallesPedido").classList.add("oculto");
    document.getElementById("seccionQR").classList.add("oculto");
    document.getElementById("totalPedido").innerText = "";
    deshabilitarBotonPago();

    mesaValidada = null;
    pedidoActual = null;

    alert("↩️ Has vuelto al inicio. Puedes validar otra mesa.");
}

// =======================
// VALIDAR MESA Y CARGAR PEDIDO ACTIVO
// =======================
async function validarMesa() {
    const numeroMesa = document.getElementById("mesa").value.trim();

    if (!numeroMesa || parseInt(numeroMesa) <= 0) {
        alert("⚠️ Ingrese un número de mesa válido.");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/pedidos/validar-mesa/${numeroMesa}`);
        
        if (!response.ok) {
            const error = await response.json();
            alert(`❌ ${error.detail}`);
            deshabilitarBotonPago();
            return;
        }

        const resultado = await response.json();

        if (!resultado.tiene_pedido_activo) {
            alert(`⚠️ La mesa ${resultado.numero_mesa} no tiene pedidos activos. No hay nada para pagar.`);
            deshabilitarBotonPago();
            return;
        }

        mesaValidada = resultado.id_mesa;
        alert(`✅ Mesa ${resultado.numero_mesa} validada correctamente. Cargando pedido...`);

        await cargarPedidoActivo(resultado.numero_mesa);

    } catch (error) {
        alert("❌ Error al validar la mesa: " + error.message);
        deshabilitarBotonPago();
    }
}

// =======================
// CARGAR DETALLES DEL PEDIDO ACTIVO
// =======================
async function cargarPedidoActivo(numeroMesa) {
    const tabla = document.getElementById("tablaDetalles");
    const detallesDiv = document.getElementById("detallesPedido");
    const totalEl = document.getElementById("totalPedido");

    tabla.innerHTML = "<tr><td colspan='3'>Cargando pedido...</td></tr>";
    detallesDiv.classList.add("oculto");
    deshabilitarBotonPago();

    try {
        const res = await fetch(`${API_URL}/pedidos/mesa/${numeroMesa}/pedido`);
        if (!res.ok) throw new Error("No hay pedido activo para esta mesa");

        const pedido = await res.json();
        pedidoActual = pedido;

        if (!pedido.detalle_pedido || pedido.detalle_pedido.length === 0) {
            tabla.innerHTML = "<tr><td colspan='3'>No hay detalles de pedido</td></tr>";
            return;
        }

        tabla.innerHTML = pedido.detalle_pedido.map(d => `
            <tr>
                <td>${d.producto?.nombre || 'Producto'}</td>
                <td>${d.cantidad}</td>
                <td>$${parseFloat(d.subtotal).toFixed(2)}</td>
            </tr>
        `).join("");

        const total = calcularTotalPedido(pedido);
        totalEl.innerText = `TOTAL: $${total}`;
        detallesDiv.classList.remove("oculto");

        // 🆕 GENERAR Y MOSTRAR EL QR
        await cargarCodigoQR(pedido.id_pedido);

        habilitarBotonPago();
    } catch (error) {
        tabla.innerHTML = `<tr><td colspan='3'>${error.message}</td></tr>`;
    }
}

// =======================
// 🆕 CARGAR CÓDIGO QR (CON IMAGEN LOCAL)
// =======================
async function cargarCodigoQR(idPedido) {
    const seccionQR = document.getElementById("seccionQR");
    const imagenQR = document.getElementById("imagenQR");

    try {
        // 👇 Ruta a tu imagen QR de Nequi
        const qrUrl = "./assets/qr-nequi.png";
        
        // Asignar URL como fuente de la imagen
        imagenQR.src = qrUrl;
        
        // Mostrar la sección del QR
        seccionQR.classList.remove("oculto");
        
        // Actualizar el texto con información del pedido
        const infoPago = document.createElement("div");
        infoPago.style.cssText = "text-align: center; margin-top: 15px; font-weight: bold; color: #333;";
        infoPago.innerHTML = `
            
            <p>Referencia: Pedido #${idPedido}</p>
        `;
        
        // Agregar info si no existe
        if (!document.getElementById("infoPagoQR")) {
            infoPago.id = "infoPagoQR";
            seccionQR.appendChild(infoPago);
        }
        
        console.log("✅ Código QR cargado correctamente");
    } catch (error) {
        console.error("❌ Error al cargar el código QR:", error);
        alert("⚠️ No se pudo cargar el código QR.");
    }
}

// =======================
// CALCULAR TOTAL DEL PEDIDO
// =======================
function calcularTotalPedido(pedido) {
    if (!pedido.detalle_pedido) return 0;
    return pedido.detalle_pedido
        .reduce((sum, d) => sum + parseFloat(d.subtotal || 0), 0)
        .toFixed(2);
}

// =======================
// CONFIRMAR PAGO POR TRANSFERENCIA
// =======================
async function confirmarPago() {
    if (!pedidoActual) {
        alert("⚠️ No hay un pedido activo para esta mesa.");
        return;
    }

    const cliente = document.getElementById("nombreCliente").value.trim() || "Cliente sin nombre";
    const monto = calcularTotalPedido(pedidoActual);

    const confirmacion = confirm(
        `¿Confirmar que el cliente realizó la transferencia de $${monto}?\n\n` +
        `Pedido: #${pedidoActual.id_pedido}\n` +
        `Cliente: ${cliente}`
    );

    if (!confirmacion) return;

    const nuevoPago = {
        id_pedido: pedidoActual.id_pedido,
        monto: parseFloat(monto),
        metodo_pago: "trasferencia",
        cliente: cliente
    };

    try {
        const res = await fetch(`${API_URL}/pagos/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(nuevoPago)
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.detail || "Error al registrar el pago.");
        }

        alert(`✅ Pago registrado correctamente.\nPedido #${pedidoActual.id_pedido} pagado por transferencia.`);
        window.location.href = "cajero.html";
    } catch (error) {
        alert("❌ No se pudo registrar el pago: " + error.message);
    }
}

// =======================
// UTILIDADES
// =======================
function habilitarBotonPago() {
    const btn = document.getElementById("btnConfirmarPago");
    btn.classList.remove("deshabilitado");
    btn.classList.add("habilitado");
    btn.disabled = false;
}

function deshabilitarBotonPago() {
    const btn = document.getElementById("btnConfirmarPago");
    btn.classList.add("deshabilitado");
    btn.classList.remove("habilitado");
    btn.disabled = true;
}

// =======================
// EVENTOS
// =======================
document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("btnValidar").addEventListener("click", validarMesa);
    document.getElementById("btnConfirmarPago").addEventListener("click", confirmarPago);
    document.getElementById("btnAtras").addEventListener("click", () => {
        window.location.href = "cajero.html";
    });
});