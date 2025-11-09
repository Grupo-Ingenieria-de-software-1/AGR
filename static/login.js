const FRONTEND_URL = "http://127.0.0.1:5500";
const API_URL = "http://127.0.0.1:8000";

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("loginForm");

    // Login tradicional
    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const formData = new FormData(form);
        const data = new URLSearchParams(formData);

        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: data
            });

            const result = await response.json();

            if (response.ok) {
                localStorage.setItem("token", result.access_token);
                localStorage.setItem("usuario", JSON.stringify(result.usuario));
                
                console.log("✅ Login exitoso:", result.usuario);
                alert(`✅ Bienvenido ${result.usuario.nombre}`);
                
                redirigirSegunRol(result.usuario.rol);
                
            } else {
                alert("❌ Error: " + result.detail);
            }
        } catch (error) {
            console.error("Error al conectar con el servidor:", error);
            alert("❌ Error al conectar con el servidor");
        }
    });

    verificarSesionActiva();
});

function verificarSesionActiva() {
    const token = localStorage.getItem("token");
    const usuario = localStorage.getItem("usuario");
    
    if (token && usuario) {
        const userData = JSON.parse(usuario);
        console.log("✅ Sesión activa detectada:", userData);
        
        if (confirm(`Ya tiene una sesión activa como ${userData.nombre}. ¿Desea continuar?`)) {
            redirigirSegunRol(userData.rol);
        } else {
            localStorage.removeItem("token");
            localStorage.removeItem("usuario");
        }
    }
}

/**
 * Maneja el login con Google
 * IMPORTANTE: Esta función se llama automáticamente cuando Google completa la autenticación
 */
async function handleGoogleLogin(response) {
    console.log("🔐 Iniciando sesión con Google...");
    console.log("📦 Google Response:", response);
    
    // Verificar que tengamos el credential
    if (!response.credential) {
        console.error("❌ No se recibió credential de Google");
        alert("❌ Error: No se pudo obtener la credencial de Google");
        return;
    }
    
    const googleToken = response.credential;
    console.log("🔑 Token recibido (primeros 50 caracteres):", googleToken.substring(0, 50) + "...");
    
    try {
        // IMPORTANTE: Usar FormData en lugar de URLSearchParams
        const formData = new FormData();
        formData.append('google_token', googleToken);

        console.log("📤 Enviando petición al backend...");

        const res = await fetch(`${API_URL}/auth/google-login`, {
            method: "POST",
            // NO enviar Content-Type, fetch lo configura automáticamente para FormData
            body: formData
        });

        console.log("📥 Respuesta del servidor:", res.status);

        // Intentar leer la respuesta como JSON
        let result;
        try {
            result = await res.json();
        } catch (e) {
            console.error("❌ Error al parsear JSON:", e);
            const text = await res.text();
            console.error("📄 Respuesta del servidor (texto):", text);
            alert("❌ Error al procesar la respuesta del servidor");
            return;
        }

        if (res.ok) {
            localStorage.setItem("token", result.access_token);
            localStorage.setItem("usuario", JSON.stringify(result.usuario));
            
            console.log("✅ Login con Google exitoso:", result.usuario);
            alert(`✅ Bienvenido ${result.usuario.nombre}`);
            
            redirigirSegunRol(result.usuario.rol);
        } else {
            console.error("❌ Error del servidor:", result);
            alert(`❌ Error al iniciar sesión con Google: ${result.detail || 'Error desconocido'}`);
        }
    } catch (error) {
        console.error("❌ Error al conectar con el servidor:", error);
        alert("❌ Error al conectar con el servidor. Revisa la consola para más detalles.");
    }
}

function redirigirSegunRol(rol) {
    console.log(`🚀 Redirigiendo a: ${rol}`);
    
    switch(rol) {
        case "mesero":
            window.location.href = `${FRONTEND_URL}/mesero/meseros.html`;
            break;
        case "cajero":
            window.location.href = `${FRONTEND_URL}/cajero/cajero.html`;
            break;
        case "administrador":
            window.location.href = `${FRONTEND_URL}/admin/admin.html`;
            break;
        default:
            console.warn("⚠️ Rol desconocido, redirigiendo a mesero");
            window.location.href = `${FRONTEND_URL}/mesero/meseros.html`;
    }
}

// Hacer la función global para que Google pueda llamarla
window.handleGoogleLogin = handleGoogleLogin;