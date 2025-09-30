const API = "http://127.0.0.1:8000";

async function poblarSelects(){
  // cargar mesas
  try {
    const resMesas = await fetch(`${API}/mesas/`);
    const mesas = await resMesas.json();
    const selMesa = document.getElementById("selectMesa");
    selMesa.innerHTML = "";
    mesas.forEach(m => {
      const opt = document.createElement("option");
      opt.value = m.id_mesa;
      opt.textContent = `ID:${m.id_mesa} - Nº:${m.numero} (${m.estado})`;
      selMesa.appendChild(opt);
    });
  } catch (err) {
    alert("Error cargando mesas: " + err);
  }

  // cargar usuarios (meseros)
  try {
    const resUsers = await fetch(`${API}/usuario/`);
    const users = await resUsers.json();
    const selUser = document.getElementById("selectUsuario");
    selUser.innerHTML = "";
    // opcion: filtrar por rol 'mesero' si quieres
    users.forEach(u => {
      const opt = document.createElement("option");
      opt.value = u.id_usuario;
      opt.textContent = `ID:${u.id_usuario} - ${u.nombre} (${u.rol})`;
      selUser.appendChild(opt);
    });
  } catch (err) {
    alert("Error cargando usuarios: " + err);
  }
}

document.getElementById("formPedido").addEventListener("submit", async (e) => {
  e.preventDefault();
  const payload = {
    id_mesa: parseInt(document.getElementById("selectMesa").value, 10),
    id_usuario: parseInt(document.getElementById("selectUsuario").value, 10),
    observaciones: document.getElementById("observaciones").value || null
  };
  try {
    const res = await fetch(`${API}/pedidos/`, {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify(payload)
    });
    if(!res.ok){
      const err = await res.json();
      alert("Error creando pedido: " + (err.detail || JSON.stringify(err)));
      return;
    }
    alert("Pedido creado ✅");
    cargarPedidos();
    e.target.reset();
  } catch(err){
    alert("Error de conexión: " + err);
  }
});

// cargar pedidos
async function cargarPedidos(){
  try {
    const res = await fetch(`${API}/pedidos/`);
    if(!res.ok) throw new Error("No se pudieron obtener pedidos");
    const lista = document.getElementById("listaPedidos");
    const pedidos = await res.json();
    lista.innerHTML = "";
    pedidos.forEach(p => {
      const li = document.createElement("li");
      li.textContent = `ID:${p.id_pedido} — Mesa:${p.id_mesa} — Usuario:${p.id_usuario} — ${p.estado} — ${p.observaciones || ""}`;
      lista.appendChild(li);
    });
  } catch(err){
    alert("Error al cargar pedidos: " + err);
  }
}

document.getElementById("btnCargarPedidos").addEventListener("click", cargarPedidos);

// inicializar selects y lista al cargar la página
poblarSelects();
cargarPedidos();