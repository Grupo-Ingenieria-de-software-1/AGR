
// Esperar a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', function() {
    // Seleccionar todos los botones del menú
    const menuButtons = document.querySelectorAll('.menu-button');
    
    // Agregar event listener a cada botón
    menuButtons.forEach(function(button) {
        button.addEventListener('click', handleButtonClick);
    });
});

// Función para manejar el clic en los botones
function handleButtonClick(event) {
    const option = event.target.getAttribute('data-option');
    
    console.log('Opción seleccionada:', option);
    
    // Aquí puedes agregar la lógica según la opción seleccionada
    switch(option) {
        case 'pedido':
            // Redirigir a la página de pedidos
             window.location.href = 'pedidos.html';
            break;
        case 'estado':
            // Redirigir a la página de estado de platos
            // window.location.href = 'estado.html';
            alert('Has seleccionado: ESTADO DE PLATOS');
            break;
        case 'reservas':
            // Redirigir a la página de reservas
            // window.location.href = 'reservas.html';
            alert('Has seleccionado: RESERVAS');
            break;
        case 'unirm':
            // Redirigir a la página de mesas
            // window.location.href = 'mesas.html';
            alert('Has seleccionado: UNIR MESAS');
            break;

        case 'separarm':
            // Redirigir a la página de mesas
            // window.location.href = 'mesas.html';
            alert('Has seleccionado: SEPARAR MESAS');
            break;

        default:
            console.error('Opción no reconocida');
    }
}

// Función adicional para feedback visual (opcional)
function addButtonFeedback() {
    const menuButtons = document.querySelectorAll('.menu-button');
    
    menuButtons.forEach(function(button) {
        button.addEventListener('mousedown', function() {
            this.style.transform = 'scale(0.95)';
        });
        
        button.addEventListener('mouseup', function() {
            this.style.transform = 'scale(1)';
        });
    });
}

// Llamar a la función de feedback cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', addButtonFeedback);