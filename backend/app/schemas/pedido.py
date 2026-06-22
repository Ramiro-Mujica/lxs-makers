import bleach
from decimal import Decimal
from datetime import datetime
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, field_validator


class DetallePedidoSchema(BaseModel):
    """Un producto incluido dentro de un pedido."""
    id: UUID
    producto_id: Optional[UUID] = None
    nombre_producto: str
    precio_venta: Decimal
    precio_costo: Decimal
    cantidad: int
    variante: Optional[str] = None

    class Config:
        from_attributes = True


class PedidoSchema(BaseModel):
    """Datos completos de un pedido — para el vendedor."""
    id: UUID
    codigo_seguimiento: str
    nombre_cliente: Optional[str] = None
    comentario: Optional[str] = None
    estado: str
    total: Decimal
    created_at: datetime
    detalles: List[DetallePedidoSchema] = []
    dias_restantes: int

    class Config:
        from_attributes = True


class PedidoCreateSchema(BaseModel):
    """Datos para crear un pedido nuevo (lo manda el catálogo público al finalizar la compra)."""
    nombre_cliente: Optional[str] = None
    comentario: Optional[str] = None

    @field_validator("nombre_cliente", "comentario")
    @classmethod
    def sanear_texto(cls, value):
        if value:
            return bleach.clean(value.strip())
        return value


class PedidoUpdateSchema(BaseModel):
    """Datos editables de un pedido (lo usa el vendedor, principalmente para cambiar el estado)."""
    nombre_cliente: Optional[str] = None
    comentario: Optional[str] = None
    estado: Optional[str] = None

    @field_validator("nombre_cliente", "comentario")
    @classmethod
    def sanear_texto(cls, value):
        if value:
            return bleach.clean(value.strip())
        return value


class DetalleAgregarSchema(BaseModel):
    """Datos para agregar un producto a un pedido."""
    producto_id: UUID
    cantidad: int = 1
    variante: Optional[str] = ""


class DetalleEditarSchema(BaseModel):
    """Datos para editar la cantidad de un detalle ya agregado."""
    cantidad: int

    @field_validator("cantidad")
    @classmethod
    def validar_cantidad(cls, value):
        if value < 1:
            raise ValueError("La cantidad debe ser al menos 1.")
        return value


class SeguimientoPublicoSchema(BaseModel):
    """Solo para consulta pública — sin datos sensibles del vendedor ni del cliente."""
    codigo_seguimiento: str
    estado: str
    created_at: datetime
    dias_restantes: int

    class Config:
        from_attributes = True