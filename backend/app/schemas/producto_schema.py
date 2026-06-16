# app/schemas/producto_schema.py
from pydantic import BaseModel
from typing import Optional, List
from enum import Enum
from datetime import datetime


class EstadoProducto(str, Enum):
    VISIBLE   = "visible"
    SIN_STOCK = "sin_stock"
    OCULTO    = "oculto"


class VarianteSchema(BaseModel):
    tipo:  str
    valor: str


class ProductoCreate(BaseModel):
    nombre:      str
    precio:      float
    descripcion: Optional[str] = None
    variantes:   Optional[List[VarianteSchema]] = []


class ProductoUpdate(BaseModel):
    nombre:       Optional[str]            = None
    precio:       Optional[float]          = None
    descripcion:  Optional[str]            = None
    estado:       Optional[EstadoProducto] = None
    orden_visual: Optional[int]            = None


class ImagenResponse(BaseModel):
    id:    str
    url:   str
    orden: int

    class Config:
        from_attributes = True


class VarianteResponse(BaseModel):
    id:    str
    tipo:  str
    valor: str

    class Config:
        from_attributes = True


class ProductoResponse(BaseModel):
    id:           str
    nombre:       str
    precio:       float
    descripcion:  Optional[str]                  = None
    estado:       Optional[str]                  = None
    orden_visual: Optional[int]                  = None
    imagenes:     Optional[List[ImagenResponse]] = []
    variantes:    Optional[List[VarianteResponse]] = []
    created_at:   Optional[datetime]             = None

    class Config:
        from_attributes = True
