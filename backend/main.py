# main.py — Punto de entrada de LXS Makers (FastAPI + MVC)
import logging
import app.models
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.background import BackgroundScheduler
from app.config.settings import settings
from app.controllers import (
    auth_controller,
    admin_controller,
    producto_controller,
    pedido_controller,
    tablero_controller,
    estadistica_controller,
    catalogo_controller,
    imagen_controller,
)
from app.services.cron_service import purgar_pedidos_vencidos

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

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_controller.router)
app.include_router(admin_controller.router)
app.include_router(producto_controller.router)
app.include_router(pedido_controller.router)
app.include_router(tablero_controller.router)
app.include_router(estadistica_controller.router)
app.include_router(catalogo_controller.router)
app.include_router(imagen_controller.router)

scheduler = BackgroundScheduler()
scheduler.add_job(purgar_pedidos_vencidos, "interval", hours=24)
scheduler.start()


@app.get("/")
def raiz():
    logger.info("Raíz consultada")
    return {"mensaje": f"{settings.APP_NAME} API funcionando ✓"}


@app.on_event("startup")
def startup():
    logger.info(f"{settings.APP_NAME} iniciado correctamente.")


@app.on_event("shutdown")
def shutdown():
    scheduler.shutdown()
    logger.info(f"{settings.APP_NAME} apagado.")
