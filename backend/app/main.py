from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import text
from app.database import engine
from app.routers import usuarios, productos, pedidos, estadisticas, tableros
from app.security.auth import renovar_access_token

app = FastAPI(title="LXS Makers API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(usuarios.router, prefix="/api/usuarios", tags=["usuarios"])
app.include_router(productos.router, prefix="/api/productos", tags=["productos"])
app.include_router(estadisticas.router, prefix="/api/pedidos", tags=["estadisticas"])
app.include_router(pedidos.router, prefix="/api/pedidos", tags=["pedidos"])
app.include_router(tableros.router, prefix="/api/tableros", tags=["tableros"])


class RefreshSchema(BaseModel):
    refresh: str


@app.post("/api/token/refresh/")
def token_refresh(datos: RefreshSchema):
    nuevo_access = renovar_access_token(datos.refresh)
    return {"access": nuevo_access}


@app.get("/")
def raiz():
    return {"mensaje": "LXS Makers API funcionando"}


@app.get("/salud-db")
def salud_db():
    with engine.connect() as conexion:
        conexion.execute(text("SELECT 1"))
    return {"base_de_datos": "conectada correctamente"}