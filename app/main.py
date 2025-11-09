from fastapi import FastAPI, Request
from fastapi.responses import Response
from app.routes import pedidos, usuario, mesa, productos, auth, reservas, pagos, ventas
from app.database import engine, Base
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware


# Crear las tablas si no existen
Base.metadata.create_all(bind=engine)

# Inicializar la app
app = FastAPI(title="AGR")

# Montar los archivos estáticos (HTML, CSS, JS, imágenes, etc.)
app.mount("/static", StaticFiles(directory="static"), name="static")

# -------------------------------------------------------------
# 🔹 Middleware de seguridad: CORS
# (Permite comunicación con tu frontend desde otros orígenes)
# -------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5500",
        "http://localhost:5500",
        "*"  # Temporal para desarrollo
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Incluir rutas 
app.include_router(mesa.router)
app.include_router(usuario.router)
app.include_router(pedidos.router)
app.include_router(productos.router)
app.include_router(auth.router)
app.include_router(reservas.router)
app.include_router(pagos.router)
app.include_router(ventas.router)

@app.get("/")
def read_root():
    return {"mensaje": "Bienvenido a la API de Mesero"}