//const API = "http://127.0.0.1:8000";
const API_URL = window.auth.config.API_URL;
const FRONTEND_URL = window.auth.config.FRONTEND_URL;

// Crear mesa
document.getElementById("formMesa").addEventListener("submit", async (e) => {
  e.preventDefault();
  const payload = {
    numero: parseInt(document.getElementById("numero").value, 10),
    tipo: document.getElementById("tipo").value,
    estado: document.getElementById("estado").value
  };
  try {
    const res = await fetch(`${API}/mesas/`, {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify(payload)
    });
    if(!res.ok){
      const err = await res.json();
      alert("Error: " + (err.detail || JSON.stringify(err)));
      return;
    }
    alert("Mesa creada ✅");
    cargarMesas();
    e.target.reset();
  } catch(err) {
    alert("Error de conexión: " + err);
  }
});

// Cargar mesas
async function cargarMesas(){
  try {
    const res = await fetch(`${API}/mesas/`);
    if(!res.ok) throw new Error("No se pudieron cargar mesas");
    const mesas = await res.json();
    const ul = document.getElementById("listaMesas");
    ul.innerHTML = "";
    mesas.forEach(m => {
      const li = document.createElement("li");
      li.textContent = `ID:${m.id_mesa} — Nº:${m.numero} — ${m.tipo} — ${m.estado}`;
      ul.appendChild(li);
    });
  } catch(err){
    alert("Error al cargar mesas: " + err);
  }
}

document.getElementById("btnCargarMesas").addEventListener("click", cargarMesas);
cargarMesas();

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("btnAtras").addEventListener("click", () => {
        window.location.href = "admin.html";
    });
});