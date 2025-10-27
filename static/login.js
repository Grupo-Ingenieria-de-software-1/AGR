document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector("form");

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const formData = new FormData(form);
        const data = new URLSearchParams(formData);

        try {
            const response = await fetch("http://127.0.0.1:8000/auth/login", {
                method: "POST",
                body: data
            });

            const result = await response.json();

            if (response.ok) {
                
                localStorage.setItem("token", result.access_token);
                // Redirigir según el rol, si quieres
                 window.location.href = "/mesero/meseros.html";
                  
            } else {
                alert("Error: " + result.detail);
            }
        } catch (error) {
            console.error("Error al conectar con el servidor:", error);
        }
    });
});