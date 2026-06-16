# main.py — Punto de entrada de LXS Makers (FastAPI + MVC)
import logging
import app.models
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config.settings import settings
from app.controllers import auth_controller, admin_controller, producto_controller

# Configuración de logs
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[
        logging.FileHandler("app.log"),
        logging.StreamHandler(),
    ],
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title=settings.APP_NAME,
    description="Sistema de Gestión Comercial para Emprendedores",
    version="1.0.0",
)

# CORS — permite que React se comunique con la API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registrar controllers (MVC)
app.include_router(auth_controller.router)
app.include_router(admin_controller.router)
app.include_router(producto_controller.router)


@app.get("/")
def raiz():
    logger.info("Raíz consultada")
    return {"mensaje": f"{settings.APP_NAME} API funcionando ✓"}


@app.on_event("startup")
def startup():
    logger.info(f"{settings.APP_NAME} iniciado correctamente.")


@app.on_event("shutdown")
def shutdown():
    logger.info(f"{settings.APP_NAME} apagado.")