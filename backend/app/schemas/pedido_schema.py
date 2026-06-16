# app/schemas/pedido_schema.py
from pydantic import BaseModel
from typing import Optional, Any
from enum import Enum
from datetime import datetime


class EstadoPedido(str, Enum):
    ARMANDO_PEDIDO = "armando_pedido"
    ENVIADO        = "enviado"


class PedidoCreate(BaseModel):
    datos_carrito: Any
    total:         float
    usuario_id:    str


class PedidoUpdate(BaseModel):
    estado_pedido: EstadoPedido
    comentario:    Optional[str] = None


class PedidoResponse(BaseModel):
    id:                 str
    codigo_seguimiento: str
    datos_carrito:      Any
    total:              float
    estado_pedido:      str
    comentario:         Optional[str]     = None
    usuario_id:         str
    created_at:         Optional[datetime] = None

    class Config:
        from_attributes = True
