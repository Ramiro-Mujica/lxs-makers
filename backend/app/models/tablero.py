# app/models/tablero.py
# Agregación con Usuario: el tablero puede existir independientemente
# Composición con Tarea: las tareas no existen sin un tablero
import uuid
from sqlalchemy import Column, String, Text, Enum, TIMESTAMP, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.models.usuario import Base

SECCION_ENUM = Enum("por_hacer", "en_progreso", "hecho", name="seccion_tarea")


class Tablero(Base):
    """Agregación con Usuario. Composición con Tarea."""
    __tablename__ = "tableros"

    id         = Column(String(36),  primary_key=True, default=lambda: str(uuid.uuid4()))
    usuario_id = Column(String(36),  ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False)
    nombre     = Column(String(255), nullable=False)
    created_at = Column(TIMESTAMP,   default=datetime.utcnow)

    vendedor = relationship("Usuario", back_populates="tableros", foreign_keys=[usuario_id])
    tareas   = relationship("Tarea",   back_populates="tablero",  cascade="all, delete-orphan")

    def crear_tablero(self) -> None:
        pass

    def editar_secciones(self) -> None:
        pass

    def eliminar_tablero(self) -> None:
        pass


class Tarea(Base):
    """Composición con Tablero: no existe sin un tablero."""
    __tablename__ = "tareas"

    id         = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tablero_id = Column(String(36), ForeignKey("tableros.id", ondelete="CASCADE"), nullable=False)
    contenido  = Column(Text,       nullable=False)
    seccion    = Column(SECCION_ENUM, nullable=False, default="por_hacer")
    created_at = Column(TIMESTAMP,  default=datetime.utcnow)

    tablero = relationship("Tablero", back_populates="tareas")
