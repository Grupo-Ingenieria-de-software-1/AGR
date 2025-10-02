// Mostrar interfaz según opción
function mostrarInterfaz(id) {
  document.querySelector(".menu-principal").style.display = "none";
  document.querySelectorAll(".interfaz").forEach(sec => sec.style.display = "none");
  document.getElementById(id).style.display = "block";

  if (id === "listarProductos") {
    cargarProductos();
  }
}

// Volver al menú principal
function volverMenu() {
  document.querySelectorAll(".interfaz").forEach(sec => sec.style.display = "none");
  document.querySelector(".menu-principal").style.display = "block";
}

// Simulación de productos (esto luego se conecta al backend)
async function cargarProductos() {
  const lista = document.getElementById("listaProductos");
  lista.innerHTML = '<li class="loading">Cargando productos...</li>';

  try {
    const response = await fetch("http://127.0.0.1:8000/productos"); // URL de tu API
    if (!response.ok) throw new Error("Error al obtener productos");

    const productos = await response.json();
     lista.innerHTML = ""; // limpiar mensaje

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