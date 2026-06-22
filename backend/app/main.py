from fastapi import FastAPI
from sqlalchemy import text
from app.database import engine
from app.routers import usuarios, productos

app = FastAPI(title="LXS Makers API")

app.include_router(usuarios.router, prefix="/api/usuarios", tags=["usuarios"])
app.include_router(productos.router, prefix="/api/productos", tags=["productos"])


@app.get("/")
def raiz():
    return {"mensaje": "LXS Makers API funcionando"}


@app.get("/salud-db")
def salud_db():
    with engine.connect() as conexion:
        conexion.execute(text("SELECT 1"))
    return {"base_de_datos": "conectada correctamente"}