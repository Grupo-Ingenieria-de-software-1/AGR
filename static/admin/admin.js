//const API_URL = "http://127.0.0.1:8000";

const API_URL = window.auth.config.API_URL;
const FRONTEND_URL = window.auth.config.FRONTEND_URL;

// Esperar a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', function() {
    const menuButtons = document.querySelectorAll('.menu-button');

    // Diccionario de rutas para cada opción
    const routes = {
        usuarios: 'usuarios.html',
        mesas: 'mesas.html',
        productos: 'productos.html'
    };

    // Asignar comportamiento a cada botón
    menuButtons.forEach(button => {
        // Redirección o alerta según la opción
        button.addEventListener('click', event => {
            const option = event.target.dataset.option;
            const destination = routes[option];

            console.log('Opción seleccionada:', option);

            if (destination) {
                window.location.href = destination;
            } else {
                alert(`Has seleccionado: ${option.toUpperCase()}`);
            }
        });

        // Efecto visual de clic
        button.addEventListener('mousedown', () => button.style.transform = 'scale(0.95)');
        button.addEventListener('mouseup', () => button.style.transform = 'scale(1)');
    });
});

document.getElementById("btnCerrarSesion").addEventListener("click", cerrarSesion);

// ======================= 
// CERRAR SESIÓN 
// ======================= 
function cerrarSesion() {

    window.authLogout();
}