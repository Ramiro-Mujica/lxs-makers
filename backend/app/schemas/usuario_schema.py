# app/schemas/usuario_schema.py
from pydantic import BaseModel
from typing import Optional
from enum import Enum
from datetime import datetime


class RolUsuario(str, Enum):
    VENDEDOR      = "vendedor"
    ADMINISTRADOR = "administrador"


class EstadoUsuario(str, Enum):
    PENDIENTE     = "pendiente"
    ACTIVO        = "activo"
    DESHABILITADO = "deshabilitado"


class UsuarioCreate(BaseModel):
    email:          str
    password:       str
    nombre_negocio: Optional[str] = None
    whatsapp:       Optional[str] = None


class UsuarioResponse(BaseModel):
    id:              str
    email:           str
    rol:             RolUsuario
    estado:          EstadoUsuario
    nombre_negocio:  Optional[str] = None
    codigo_catalogo: Optional[str] = None
    whatsapp:        Optional[str] = None
    limite_tableros: Optional[int] = None
    created_at:      Optional[datetime] = None

    class Config:
        from_attributes = True


class LoginRequest(BaseModel):
    email:    str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type:   str = "bearer"
    rol:          str
    estado:       str
    user_id:      str
