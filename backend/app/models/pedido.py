# app/models/pedido.py
# Composición con Usuario: no existe sin un usuario (vendedor)
import uuid
from sqlalchemy import Column, String, Text, Numeric, Integer, Enum, TIMESTAMP, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.models.usuario import Base

ESTADO_PEDIDO_ENUM = Enum("pendiente", "en_proceso", "enviado", "entregado", name="estado_pedido")


class Pedido(Base):
    """
    Composición con Usuario (Vendedor).
    Se purga automáticamente a los 7 días (Cron Job).
    Al pasar a 'entregado' alimenta el historial de ventas.
    """
    __tablename__ = "pedidos"

    id                  = Column(String(36),     primary_key=True, default=lambda: str(uuid.uuid4()))
    usuario_id          = Column(String(36),     ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False)
    codigo_seguimiento  = Column(String(8),      nullable=False, unique=True)
    datos_carrito       = Column(JSON,           nullable=False)
    total               = Column(Numeric(10, 2), nullable=False)
    estado_pedido       = Column(ESTADO_PEDIDO_ENUM, nullable=False, default="pendiente")
    comentario          = Column(Text,           nullable=True)
    created_at          = Column(TIMESTAMP,      default=datetime.utcnow)

    # Relación con Usuario (back_populates debe coincidir con usuario.py)
    vendedor = relationship("Usuario", back_populates="pedidos", foreign_keys=[usuario_id])

    def generar_codigo_unico(self) -> str:
        pass

    def actualizar_estado(self) -> None:
        pass

    def verificar_vencimiento(self) -> bool:
        pass


class HistorialVenta(Base):
    """
    Se alimenta cuando un pedido pasa a 'entregado'.
    Si se elimina el producto, desaparece de las estadísticas (ON DELETE CASCADE).
    """
    __tablename__ = "historial_ventas"

    id              = Column(String(36),     primary_key=True, default=lambda: str(uuid.uuid4()))
    usuario_id      = Column(String(36),     ForeignKey("usuarios.id",  ondelete="CASCADE"), nullable=False)
    pedido_id       = Column(String(36),     ForeignKey("pedidos.id",   ondelete="CASCADE"), nullable=False)
    producto_id     = Column(String(36),     ForeignKey("productos.id", ondelete="CASCADE"), nullable=False)
    nombre_producto = Column(String(255),    nullable=False)
    precio_unitario = Column(Numeric(10, 2), nullable=False)
    cantidad        = Column(Integer,        nullable=False, default=1)
    total_linea     = Column(Numeric(10, 2), nullable=False)
    fecha_venta     = Column(TIMESTAMP,      default=datetime.utcnow)