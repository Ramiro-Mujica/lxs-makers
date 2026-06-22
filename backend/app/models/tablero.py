import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base


class Tablero(Base):
    """Agregación con Usuario: el tablero pertenece a un vendedor, pero conceptualmente podría existir aparte."""
    __tablename__ = "tableros"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    vendedor_id = Column(UUID(as_uuid=True), ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False)
    nombre = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))

    tareas = relationship(
        "Tarea",
        back_populates="tablero",
        cascade="all, delete-orphan",
        order_by="Tarea.created_at",
    )


class Tarea(Base):
    """Composición con Tablero — no existe sin él."""
    __tablename__ = "tareas"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tablero_id = Column(UUID(as_uuid=True), ForeignKey("tableros.id", ondelete="CASCADE"), nullable=False)
    contenido = Column(Text, nullable=False)
    seccion = Column(String(20), nullable=False, default="por_hacer")
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))

    tablero = relationship("Tablero", back_populates="tareas")