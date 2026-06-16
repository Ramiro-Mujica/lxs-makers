# app/models/producto.py
# Composición con Usuario: no existe sin un usuario (vendedor)
import uuid
from sqlalchemy import Column, String, Text, Numeric, Integer, Enum, TIMESTAMP, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.models.usuario import Base

ESTADO_PRODUCTO_ENUM = Enum("visible", "sin_stock", "oculto", name="estado_producto")


class Producto(Base):
    """Composición con Usuario. Composición con ImagenProducto y Variante."""
    __tablename__ = "productos"

    id           = Column(String(36),     primary_key=True, default=lambda: str(uuid.uuid4()))
    usuario_id   = Column(String(36),     ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False)
    nombre       = Column(String(255),    nullable=False)
    descripcion  = Column(Text,           nullable=True)
    precio       = Column(Numeric(10, 2), nullable=False)
    estado       = Column(ESTADO_PRODUCTO_ENUM, nullable=False, default="visible")
    orden_visual = Column(Integer,        nullable=False, default=0)
    created_at   = Column(TIMESTAMP,      default=datetime.utcnow)

    vendedor  = relationship("Usuario",        back_populates="productos", foreign_keys=[usuario_id])
    imagenes  = relationship("ImagenProducto", back_populates="producto",  cascade="all, delete-orphan")
    variantes = relationship("Variante",        back_populates="producto",  cascade="all, delete-orphan")

    def crear_producto(self) -> None:
        pass

    def editar_producto(self) -> None:
        pass

    def eliminar_producto(self) -> None:
        pass

    def procesar_imagen_webp(self) -> None:
        pass


class ImagenProducto(Base):
    """Composición con Producto: hasta 5 imágenes (URLs de Cloudinary)."""
    __tablename__ = "imagenes_producto"

    id          = Column(String(36),  primary_key=True, default=lambda: str(uuid.uuid4()))
    producto_id = Column(String(36),  ForeignKey("productos.id", ondelete="CASCADE"), nullable=False)
    url         = Column(String(500), nullable=False)
    orden       = Column(Integer,     nullable=False, default=0)
    created_at  = Column(TIMESTAMP,   default=datetime.utcnow)

    producto = relationship("Producto", back_populates="imagenes")


class Variante(Base):
    """Composición con Producto: variantes libres definidas por el vendedor."""
    __tablename__ = "variantes"

    id          = Column(String(36),  primary_key=True, default=lambda: str(uuid.uuid4()))
    producto_id = Column(String(36),  ForeignKey("productos.id", ondelete="CASCADE"), nullable=False)
    tipo        = Column(String(100), nullable=False)
    valor       = Column(String(100), nullable=False)
    created_at  = Column(TIMESTAMP,   default=datetime.utcnow)

    producto = relationship("Producto", back_populates="variantes")
