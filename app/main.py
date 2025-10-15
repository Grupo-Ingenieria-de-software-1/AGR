from fastapi import FastAPI, Request
from fastapi.responses import Response
from app.routes import pedidos, usuario, mesa, productos
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
    allow_origins=["*"],  # Acepta todos los orígenes (ajustar en producción)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Incluir rutas 
app.include_router(mesa.router)
app.include_router(usuario.router)
app.include_router(pedidos.router)
app.include_router(productos.router)


@app.get("/")
def read_root():
    return {"mensaje": "Bienvenido a la API de Mesero"}