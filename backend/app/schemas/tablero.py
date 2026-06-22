import bleach
from datetime import datetime
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, field_validator


class TareaSchema(BaseModel):
    id: UUID
    contenido: str
    seccion: str
    created_at: datetime

    class Config:
        from_attributes = True


class TareaCreateSchema(BaseModel):
    contenido: str
    seccion: Optional[str] = "por_hacer"

    @field_validator("contenido")
    @classmethod
    def sanear(cls, value):
        return bleach.clean(value.strip())


class TareaUpdateSchema(BaseModel):
    contenido: Optional[str] = None
    seccion: Optional[str] = None

    @field_validator("contenido")
    @classmethod
    def sanear(cls, value):
        if value:
            return bleach.clean(value.strip())
        return value


class TableroSchema(BaseModel):
    id: UUID
    nombre: str
    tareas: List[TareaSchema] = []
    created_at: datetime

    class Config:
        from_attributes = True


class TableroCreateSchema(BaseModel):
    nombre: str

    @field_validator("nombre")
    @classmethod
    def sanear(cls, value):
        return bleach.clean(value.strip())


class TableroUpdateSchema(BaseModel):
    nombre: Optional[str] = None

    @field_validator("nombre")
    @classmethod
    def sanear(cls, value):
        if value:
            return bleach.clean(value.strip())
        return value