import bleach
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, EmailStr, field_validator


class RegistroSchema(BaseModel):
    """Datos que se reciben al registrar un nuevo vendedor."""
    email: EmailStr
    password: str
    nombre_negocio: Optional[str] = None
    whatsapp: Optional[str] = None

    @field_validator("email")
    @classmethod
    def sanear_email(cls, value):
        return bleach.clean(str(value).strip().lower())

    @field_validator("nombre_negocio", "whatsapp")
    @classmethod
    def sanear_texto(cls, value):
        if value:
            return bleach.clean(value.strip())
        return value

    @field_validator("password")
    @classmethod
    def validar_password(cls, value):
        if len(value) < 6:
            raise ValueError("La contraseña debe tener al menos 6 caracteres.")
        if not any(c.isupper() for c in value):
            raise ValueError("Debe tener al menos una mayúscula.")
        if not any(c.islower() for c in value):
            raise ValueError("Debe tener al menos una minúscula.")
        if not any(c.isdigit() for c in value):
            raise ValueError("Debe tener al menos un número.")
        return value


class LoginSchema(BaseModel):
    """Datos que se reciben al iniciar sesión."""
    email: EmailStr
    password: str


class UsuarioPerfilSchema(BaseModel):
    """Datos que se devuelven al consultar el perfil propio."""
    id: UUID
    email: str
    rol: str
    estado: str
    nombre_negocio: Optional[str] = None
    descripcion: Optional[str] = None
    whatsapp: Optional[str] = None
    codigo_catalogo: Optional[str] = None

    class Config:
        from_attributes = True


class UsuarioPerfilUpdateSchema(BaseModel):
    """Datos editables del propio perfil. El resto (rol, estado, código) es de solo lectura."""
    nombre_negocio: Optional[str] = None
    whatsapp: Optional[str] = None
    descripcion: Optional[str] = None

    @field_validator("nombre_negocio", "whatsapp", "descripcion")
    @classmethod
    def sanear_texto(cls, value):
        if value:
            return bleach.clean(value.strip())
        return value