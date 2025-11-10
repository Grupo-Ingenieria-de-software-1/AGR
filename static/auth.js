/**
 * MIDDLEWARE DE AUTENTICACIÓN - VERSIÓN MEJORADA SIN CONFLICTOS
 * Bloquea el acceso si no hay sesión activa
 */

// Usar un namespace único para evitar conflictos
const AUTH_CONFIG = {
    API_URL: "http://127.0.0.1:8000",
    FRONTEND_URL: "http://127.0.0.1:5500"
};

// ⚠️ BLOQUEO INMEDIATO - Se ejecuta ANTES de cargar cualquier cosa
(function verificarAutenticacionInmediata() {
    const token = localStorage.getItem("token");
    const usuario = localStorage.getItem("usuario");

    // Si no hay token NI usuario, BLOQUEAR INMEDIATAMENTE
    if (!token || !usuario) {
        console.error("🚫 ACCESO DENEGADO: No hay sesión activa");
        
        // Bloquear la página visualmente
        document.addEventListener('DOMContentLoaded', function() {
            document.body.innerHTML = `
                <div style="
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0,0,0,0.9);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 999999;
                    color: white;
                    font-family: Arial, sans-serif;
                    text-align: center;
                ">
                    <div>
                        <h1 style="font-size: 48px; margin-bottom: 20px;">🔒</h1>
                        <h2>Acceso Denegado</h2>
                        <p style="margin: 20px 0;">Debe iniciar sesión para acceder a esta página</p>
                        <button onclick="window.location.href='${AUTH_CONFIG.FRONTEND_URL}/login.html'" style="
                            background: #9b6330;
                            color: white;
                            border: none;
                            padding: 12px 30px;
                            font-size: 16px;
                            border-radius: 8px;
                            cursor: pointer;
                            margin-top: 20px;
                        ">Ir al Login</button>
                    </div>
                </div>
            `;
        });
        
        // Redirigir después de 2 segundos
        setTimeout(() => {
            window.location.href = `${AUTH_CONFIG.FRONTEND_URL}/login.html`;
        }, 2000);
        
        // Detener la ejecución de otros scripts
        throw new Error("Acceso denegado: No hay sesión activa");
    }

    // ✅ Si hay sesión, continuar normalmente
    console.log("✅ Sesión activa:", JSON.parse(usuario));
    
    // Verificar token en segundo plano
    setTimeout(() => verificarTokenEnBackground(), 500);
})();

/**
 * Verificar el token con el backend en segundo plano
 */
function verificarTokenEnBackground() {
    const token = localStorage.getItem("token");
    
    if (!token) return;

    fetch(`${AUTH_CONFIG.API_URL}/auth/verify`, {
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
        console.log("✅ Token verificado con el backend:", data);
    })
    .catch(error => {
        console.error("❌ Error al verificar token:", error);
    });
}

/**
 * Mostrar advertencia de token expirado
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
        ⚠️ Su sesión está por expirar. Por favor, inicie sesión nuevamente.
        <button onclick="this.parentElement.remove(); window.location.href='${AUTH_CONFIG.FRONTEND_URL}/login.html'" style="
            background: white;
            color: #ff9800;
            border: none;
            padding: 5px 10px;
            margin-left: 10px;
            border-radius: 4px;
            cursor: pointer;
        ">Ir al Login</button>
    `;
    document.body.appendChild(warning);
    
    // Auto-redirigir después de 10 segundos
    setTimeout(() => {
        window.location.href = `${AUTH_CONFIG.FRONTEND_URL}/login.html`;
    }, 10000);
}

/**
 * Obtener el token almacenado
 */
function getToken() {
    return localStorage.getItem("token");
}

/**
 * Obtener el usuario actual
 */
function getUsuarioActual() {
    const usuario = localStorage.getItem("usuario");
    return usuario ? JSON.parse(usuario) : null;
}

/**
 * Verificar si el usuario tiene un rol específico
 */
function tieneRol(rolRequerido) {
    const usuario = getUsuarioActual();
    return usuario && usuario.rol === rolRequerido;
}

/**
 * Verificar si el usuario tiene alguno de los roles permitidos
 */
function tieneAlgunRol(rolesPermitidos) {
    const usuario = getUsuarioActual();
    return usuario && rolesPermitidos.includes(usuario.rol);
}

/**
 * Cerrar sesión
 */
function cerrarSesion() {
    if (confirm("¿Está seguro que desea cerrar sesión?")) {
        console.log("🚪 Cerrando sesión...");
        
        // Limpiar todo el almacenamiento
        localStorage.removeItem("token");
        localStorage.removeItem("usuario");
        sessionStorage.clear();
        
        // Redirigir al login
        window.location.href = `${AUTH_CONFIG.FRONTEND_URL}/login.html`;
    }
}

/**
 * Fetch con autenticación automática
 */
async function fetchAuth(url, options = {}) {
    const token = getToken();
    
    if (!token) {
        console.error("⚠️ No hay token disponible");
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

    // Si el token es inválido, cerrar sesión automáticamente
    if (response.status === 401) {
        console.error("⚠️ Token inválido - Cerrando sesión");
        alert("⚠️ Su sesión ha expirado. Por favor inicie sesión nuevamente.");
        localStorage.removeItem("token");
        localStorage.removeItem("usuario");
        window.location.href = `${AUTH_CONFIG.FRONTEND_URL}/login.html`;
        throw new Error("Sesión expirada");
    }

    return response;
}

/**
 * Mostrar información del usuario en la interfaz
 */
function mostrarInfoUsuario(elementoId = "infoUsuario") {
    const usuario = getUsuarioActual();
    const elemento = document.getElementById(elementoId);
    
    if (elemento && usuario) {
        elemento.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                <span style="font-weight: 500;">👤 ${usuario.nombre}</span>
                <span class="rol-badge" style="
                    background: #9b6330;
                    color: white;
                    padding: 4px 12px;
                    border-radius: 12px;
                    font-size: 11px;
                    font-weight: bold;
                    text-transform: uppercase;
                ">${usuario.rol}</span>
                <button onclick="window.authLogout()" style="
                    background: #d32f2f;
                    color: white;
                    border: none;
                    padding: 6px 16px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 13px;
                    transition: background 0.3s;
                " onmouseover="this.style.background='#b71c1c'" 
                   onmouseout="this.style.background='#d32f2f'">
                    Cerrar Sesión
                </button>
            </div>
        `;
    }
}

/**
 * Proteger una acción para que requiera autenticación
 */
function protegerAccion(callback) {
    return function(...args) {
        const token = getToken();
        if (!token) {
            alert("⚠️ Debe iniciar sesión para realizar esta acción");
            window.location.href = `${AUTH_CONFIG.FRONTEND_URL}/login.html`;
            return;
        }
        return callback.apply(this, args);
    };
}

/**
 * Verificar permisos por rol antes de ejecutar una acción
 */
function verificarPermisos(rolesPermitidos, callback) {
    return function(...args) {
        if (!tieneAlgunRol(rolesPermitidos)) {
            alert(`⚠️ No tiene permisos para realizar esta acción. Se requiere rol: ${rolesPermitidos.join(" o ")}`);
            return;
        }
        return callback.apply(this, args);
    };
}

// ✅ Exportar funciones de forma compatible
// Crear namespace global de forma segura
window.auth = window.auth || {};

// Asignar funciones al objeto auth
Object.assign(window.auth, {
    config: AUTH_CONFIG,
    getToken,
    getUsuarioActual,
    tieneRol,
    tieneAlgunRol,
    cerrarSesion,
    fetchAuth,
    mostrarInfoUsuario,
    protegerAccion,
    verificarPermisos
});

// ✅ También crear funciones globales individuales para compatibilidad
window.authGetToken = getToken;
window.authGetUsuario = getUsuarioActual;
window.authLogout = cerrarSesion;
window.authFetch = fetchAuth;

console.log("🔒 Middleware de autenticación cargado correctamente");
console.log("📦 Usuario actual:", getUsuarioActual());
console.log("🌐 Namespace 'auth' disponible globalmente");