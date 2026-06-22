import bleach
from decimal import Decimal
from typing import Optional, List
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, field_validator, model_validator


class ImagenProductoSchema(BaseModel):
    """Datos de una imagen ya subida."""
    id: UUID
    url: str
    orden: int

    class Config:
        from_attributes = True


class VarianteSchema(BaseModel):
    """Datos de una variante ya creada."""
    id: UUID
    tipo: str
    valor: str

    class Config:
        from_attributes = True


class VarianteCreateSchema(BaseModel):
    """Datos para crear una variante nueva (ej: tipo='Talle', valor='M')."""
    tipo: str
    valor: str

    @field_validator("tipo", "valor")
    @classmethod
    def sanear(cls, value):
        return bleach.clean(value.strip())


class ProductoPublicoSchema(BaseModel):
    """Lo que ve un cliente en el catálogo público — SIN precio de costo."""
    id: UUID
    nombre: str
    descripcion: Optional[str] = None
    precio_venta: Decimal
    estado: str
    orden_visual: int
    imagenes: List[ImagenProductoSchema] = []
    variantes: List[VarianteSchema] = []
    created_at: datetime

    class Config:
        from_attributes = True


class ProductoVendedorSchema(BaseModel):
    """Lo que ve el propio vendedor — incluye precio de costo."""
    id: UUID
    nombre: str
    descripcion: Optional[str] = None
    precio_venta: Decimal
    precio_costo: Decimal
    estado: str
    orden_visual: int
    imagenes: List[ImagenProductoSchema] = []
    variantes: List[VarianteSchema] = []
    created_at: datetime

    class Config:
        from_attributes = True


class ProductoCreateSchema(BaseModel):
    """Datos para crear un producto nuevo."""
    nombre: str
    descripcion: Optional[str] = None
    precio_venta: Decimal
    precio_costo: Decimal
    estado: Optional[str] = "visible"
    orden_visual: Optional[int] = 0

    @field_validator("nombre", "descripcion")
    @classmethod
    def sanear_texto(cls, value):
        if value:
            return bleach.clean(value.strip())
        return value

    @field_validator("precio_costo")
    @classmethod
    def validar_precio_costo(cls, value):
        if value <= 0:
            raise ValueError("El precio de costo debe ser mayor a cero.")
        return value

    @model_validator(mode="after")
    def validar_precios(self):
        if self.precio_costo >= self.precio_venta:
            raise ValueError("El precio de costo no puede ser igual o mayor al precio de venta.")
        return self


class ProductoUpdateSchema(BaseModel):
    """Igual que ProductoCreateSchema, pero todos los campos son opcionales (para editar parcialmente)."""
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    precio_venta: Optional[Decimal] = None
    precio_costo: Optional[Decimal] = None
    estado: Optional[str] = None
    orden_visual: Optional[int] = None

    @field_validator("nombre", "descripcion")
    @classmethod
    def sanear_texto(cls, value):
        if value:
            return bleach.clean(value.strip())
        return value

    @model_validator(mode="after")
    def validar_precios(self):
        if self.precio_costo is not None and self.precio_venta is not None:
            if self.precio_costo >= self.precio_venta:
                raise ValueError("El precio de costo no puede ser igual o mayor al precio de venta.")
        return self