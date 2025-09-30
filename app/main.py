from fastapi import FastAPI
from app.routes import pedidos
from app.routes import usuario
from app.routes import mesa
from app.database import engine, Base
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware




# Crea las tablas si no existen
Base.metadata.create_all(bind=engine)

app = FastAPI(title="API Mesero")

app.mount("/static", StaticFiles(directory="static"), name="static")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], #quiere decir que acepta todos los origenes, ojo despues hay que cambiarlo 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(mesa.router)

app.include_router(usuario.router)
# Incluir las rutas
app.include_router(pedidos.router)

@app.get("/")
def read_root():
    return {"mensaje": "Bienvenido a la API de Mesero"}