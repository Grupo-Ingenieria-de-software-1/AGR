/**
 * MIDDLEWARE DE AUTENTICACIÓN - VERSIÓN NO BLOQUEANTE
 * Para usar con Live Server en puerto 5500
 */

const API_URL = "http://127.0.0.1:8000";
const FRONTEND_URL = "http://127.0.0.1:5500";

// Verificar autenticación SOLO si no hay sesión (NO BLOQUEANTE)
(function verificarAutenticacion() {
    const token = localStorage.getItem("token");
    const usuario = localStorage.getItem("usuario");

    // Si no hay token NI usuario, redirigir al login
    if (!token || !usuario) {
        console.warn("⚠️ No hay sesión activa, redirigiendo al login...");
        
        // Dar tiempo para que los scripts se carguen antes de redirigir
        setTimeout(() => {
            alert("⚠️ Debe iniciar sesión para acceder a esta página");
            window.location.href = `${FRONTEND_URL}/login.html`;
        }, 100);
        
        return;
    }

    // Si hay token y usuario, permitir el uso de la aplicación
    console.log("✅ Sesión activa:", JSON.parse(usuario));

    // Verificar token en segundo plano (opcional, no bloqueante)
    verificarTokenEnBackground();
})();

/**
 * Verificar el token con el backend en segundo plano
 */
function verificarTokenEnBackground() {
    const token = localStorage.getItem("token");
    
    if (!token) return;

    fetch(`${API_URL}/auth/verify`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        }
    })
    .then(response => {
        if (!response.ok) {
            console.warn("⚠️ Token inválido o expirado");
            mostrarAdvertenciaToken();
        }
        return response.json();
    })
    .then(data => {
        console.log("✅ Token verificado:", data);
    })
    .catch(error => {
        console.error("Error al verificar token:", error);
    });
}

/**
 * Mostrar advertencia de token expirado sin bloquear
 */
function mostrarAdvertenciaToken() {
    if (sessionStorage.getItem('tokenWarningShown')) return;
    
    sessionStorage.setItem('tokenWarningShown', 'true');
    
    const warning = document.createElement('div');
    warning.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #ff9800;
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        z-index: 10000;
        font-size: 14px;
        max-width: 300px;
    `;
    warning.innerHTML = `
        ⚠️ Su sesión está por expirar.
        <button onclick="this.parentElement.remove()" style="
            background: white;
            color: #ff9800;
            border: none;
            padding: 5px 10px;
            margin-left: 10px;
            border-radius: 4px;
            cursor: pointer;
        ">OK</button>
    `;
    document.body.appendChild(warning);
    
    setTimeout(() => warning.remove(), 10000);
}

function getToken() {
    return localStorage.getItem("token");
}

function getUsuarioActual() {
    const usuario = localStorage.getItem("usuario");
    return usuario ? JSON.parse(usuario) : null;
}

function tieneRol(rolRequerido) {
    const usuario = getUsuarioActual();
    return usuario && usuario.rol === rolRequerido;
}

function tieneAlgunRol(rolesPermitidos) {
    const usuario = getUsuarioActual();
    return usuario && rolesPermitidos.includes(usuario.rol);
}

function cerrarSesion() {
    if (confirm("¿Está seguro que desea cerrar sesión?")) {
        localStorage.removeItem("token");
        localStorage.removeItem("usuario");
        sessionStorage.clear();
        window.location.href = `${FRONTEND_URL}/login.html`;
    }
}

async function fetchAuth(url, options = {}) {
    const token = getToken();
    
    if (!token) {
        console.error("⚠️ No hay sesión activa");
        alert("⚠️ Su sesión ha expirado. Por favor inicie sesión nuevamente.");
        cerrarSesion();
        throw new Error("No hay sesión activa");
    }

    const headers = {
        ...options.headers,
        "Authorization": `Bearer ${token}`
    };

    const response = await fetch(url, {
        ...options,
        headers
    });

    if (response.status === 401) {
        console.error("⚠️ Token inválido");
        alert("⚠️ Su sesión ha expirado. Por favor inicie sesión nuevamente.");
        localStorage.removeItem("token");
        localStorage.removeItem("usuario");
        window.location.href = `${FRONTEND_URL}/login.html`;
        throw new Error("Sesión expirada");
    }

    return response;
}

function mostrarInfoUsuario(elementoId = "infoUsuario") {
    const usuario = getUsuarioActual();
    const elemento = document.getElementById(elementoId);
    
    if (elemento && usuario) {
        elemento.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <span>👤 ${usuario.nombre}</span>
                <span class="rol-badge" style="
                    background: #9b6330;
                    color: white;
                    padding: 3px 10px;
                    border-radius: 12px;
                    font-size: 12px;
                    font-weight: bold;
                ">${usuario.rol.toUpperCase()}</span>
                <button onclick="auth.cerrarSesion()" style="
                    background: #d32f2f;
                    color: white;
                    border: none;
                    padding: 5px 15px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 12px;
                ">Cerrar Sesión</button>
            </div>
        `;
    }
}

function protegerAccion(callback) {
    return function(...args) {
        const token = getToken();
        if (!token) {
            alert("⚠️ Debe iniciar sesión para realizar esta acción");
            window.location.href = `${FRONTEND_URL}/login.html`;
            return;
        }
        return callback.apply(this, args);
    };
}

// Exportar funciones para uso global
window.auth = {
    getToken,
    getUsuarioActual,
    tieneRol,
    tieneAlgunRol,
    cerrarSesion,
    fetchAuth,
    mostrarInfoUsuario,
    protegerAccion
};

console.log("🔒 Middleware de autenticación cargado");
console.log("📦 Usuario actual:", getUsuarioActual());