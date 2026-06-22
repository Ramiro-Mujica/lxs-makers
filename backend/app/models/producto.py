import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, Numeric, Integer, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base


class Producto(Base):
    """Representa cada artículo del catálogo de un vendedor."""
    __tablename__ = "productos"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    vendedor_id = Column(UUID(as_uuid=True), ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False)
    nombre = Column(String(255), nullable=False)
    descripcion = Column(Text, nullable=True)
    precio_venta = Column(Numeric(10, 2), nullable=False)
    precio_costo = Column(Numeric(10, 2), nullable=False)
    estado = Column(String(20), nullable=False, default="visible")
    orden_visual = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))

    # Composición: si se borra el producto, se borran sus imágenes y variantes
    imagenes = relationship(
        "ImagenProducto",
        back_populates="producto",
        cascade="all, delete-orphan",
        order_by="ImagenProducto.orden",
    )
    variantes = relationship(
        "Variante",
        back_populates="producto",
        cascade="all, delete-orphan",
    )

    def ganancia_unitaria(self):
        return self.precio_venta - self.precio_costo


class ImagenProducto(Base):
    """Composición con Producto: hasta 5 imágenes. No existe sin su producto."""
    __tablename__ = "imagenes_producto"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    producto_id = Column(UUID(as_uuid=True), ForeignKey("productos.id", ondelete="CASCADE"), nullable=False)
    url = Column(String(500), nullable=False)
    orden = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))

    producto = relationship("Producto", back_populates="imagenes")


class Variante(Base):
    """Composición con Producto: variantes opcionales (talle, color, etc.). No existe sin su producto."""
    __tablename__ = "variantes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    producto_id = Column(UUID(as_uuid=True), ForeignKey("productos.id", ondelete="CASCADE"), nullable=False)
    tipo = Column(String(100), nullable=False)
    valor = Column(String(100), nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))

    producto = relationship("Producto", back_populates="variantes")