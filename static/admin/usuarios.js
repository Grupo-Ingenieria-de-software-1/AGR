 //const API_URL = "http://127.0.0.1:8000"; // tu backend FastAPI

const API_URL = window.auth.config.API_URL;
const FRONTEND_URL = window.auth.config.FRONTEND_URL;

// Capturar el formulario y crear usuario; busca el elemento detro del html que tiene el id formUsuario
// En este caso el <form> de la pagina, asigna un escuchador de eventos al formulario para que se ejecute 
//cuando el usuario intente eviar el formulario en este caso al hacer clic en crear.

document.getElementById("formUsuario").addEventListener("submit", async (e) => { //async es una funcion asincronica
    //que se va a ejecutar cuando el evento ocurra en este caso el crear, asincronica
    //quiere decir que no para la ejecucion del programa hasta que se termine de ejecutar sino que  
    //sigue ejecutando o respondiendo otros eventos.


  e.preventDefault(); //esto es un metodo del evento, hace que la pagina no se recargue cuando se envie el
  //formulario, para js pueda manejar la solicitud de forma asincronica.

  const data = {  //Aqui se crea un objeto para almacenar la informacion del form

    nombre: document.getElementById("nombre").value, //Busca el campo del form con el id "nombre", toma el valor que se ingreso; ".value" y se lo asigna
    //a la propiedad nombre del objeto data.
    correo: document.getElementById("correo").value,
    usuario: document.getElementById("usuario").value,
    contraseña: document.getElementById("contraseña").value,
    rol: document.getElementById("rol").value
  };

  const resp = await fetch(`${API_URL}/usuario/`, { //Aqui se envia una solicitud fetch o de traer,
    //para obtener un recurso del servidor o en este caso la api usando la api fetch integrada a js para la
    //promesa de solicitud en este caso post de forma asincronica, el await lo que hace es que
    //la funcion espere a que la respuesta del servidor llegue.
    //${API_URL}/usuario  Usa una plantilla de cadena de texto para construir la URL completa de la API
    // En este caso, se convierte en `https://www.google.com/search?q=http://127.0.0.1:8000/usuario/`.
    method: "POST", //Indicamos que la solicitud al server es para hacer un post
    headers: { "Content-Type": "application/json" }, //Le dice al servidor que el cuerpo de la solicitud 
    //es (el body) esta en formato json 
    body: JSON.stringify(data) //Convierte el objeto Js (data) en una cadena de texto json
    // esa es la cadena que se envia al backend
  });

  if (resp.ok) {
    alert("Usuario creado con éxito ✅");
    cargarUsuarios(); // refresca lista
  } else {
    const error = await resp.json();
    alert("Error ❌: " + error.detail);
  }
});

// Función para cargar usuarios
async function cargarUsuarios() { //Aqui se define una funcion asincronica para obtener la lista de usuarios
  const resp = await fetch(`${API_URL}/usuario/`); //Aqui se envia una solicitud get al endpoint /usuario/
  //que esta declarado en la ruta de usuario. aunque no se especifica que es un get el fetch usa el get por defecto.


  const usuarios = await resp.json(); //Lee el cuerpo de la respuesta y 
  //lo convierte de json a un array de js. usuarios va a contener el listado de todos los usuarios.

  const lista = document.getElementById("listaUsuarios"); //Aqui se obtiene la lista desordenada del html <ul> que creamos
  //anteriormente en el html.
  lista.innerHTML = ""; //Se limpia el contenido de la lista para evitar que los usuarios se dupliquen
  //cuando se actualice.
  usuarios.forEach(u => { //itera sobre cada usuario u en la lista 

    const li = document.createElement("li"); //se crea un elemento de lista li en el doc

    li.textContent = `${u.id_usuario} - ${u.nombre} (${u.rol})`;// asigna el texto de la lista usando 
    //los daotos del usuario u
    lista.appendChild(li); //Añade el nuevo elemento (li) al final de la lista ul en la pagina
  });
}
document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("btnAtras").addEventListener("click", () => {
        window.location.href = "admin.html";
    });
});