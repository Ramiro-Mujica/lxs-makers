import uuid
from datetime import datetime, timedelta, timezone
from sqlalchemy import Column, String, Text, Numeric, Integer, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base

DIAS_VENCIMIENTO_PEDIDO = 7
DIAS_REINICIO_ESTADISTICAS = 60


class Pedido(Base):
    """Representa una compra realizada por un cliente a través del catálogo público."""
    __tablename__ = "pedidos"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    vendedor_id = Column(UUID(as_uuid=True), ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False)
    codigo_seguimiento = Column(String(8), unique=True, nullable=False)
    nombre_cliente = Column(String(255), nullable=True)
    comentario = Column(Text, nullable=True)
    estado = Column(String(20), nullable=False, default="pendiente")
    total = Column(Numeric(10, 2), nullable=False, default=0)
    completado_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))

    detalles = relationship(
        "DetallePedido",
        back_populates="pedido",
        cascade="all, delete-orphan",
    )

    def esta_vencido(self) -> bool:
        limite = self.created_at + timedelta(days=DIAS_VENCIMIENTO_PEDIDO)
        return datetime.now(timezone.utc) > limite

    @property
    def dias_restantes(self) -> int:
        vencimiento = self.created_at + timedelta(days=DIAS_VENCIMIENTO_PEDIDO)
        restantes = (vencimiento - datetime.now(timezone.utc)).days
        return max(restantes, 0)


class DetallePedido(Base):
    """Composición con Pedido — no existe sin él."""
    __tablename__ = "detalles_pedido"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    pedido_id = Column(UUID(as_uuid=True), ForeignKey("pedidos.id", ondelete="CASCADE"), nullable=False)
    producto_id = Column(UUID(as_uuid=True), ForeignKey("productos.id", ondelete="SET NULL"), nullable=True)
    nombre_producto = Column(String(255), nullable=False)
    precio_venta = Column(Numeric(10, 2), nullable=False)
    precio_costo = Column(Numeric(10, 2), nullable=False)
    cantidad = Column(Integer, nullable=False, default=1)
    variante = Column(String(255), nullable=True)

    pedido = relationship("Pedido", back_populates="detalles")

    def subtotal(self):
        return self.precio_venta * self.cantidad

    def ganancia(self):
        return (self.precio_venta - self.precio_costo) * self.cantidad


class EstadisticaVendedor(Base):
    """Guarda la fecha de inicio del período de estadísticas. Relación uno a uno con Usuario."""
    __tablename__ = "estadisticas_vendedor"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    vendedor_id = Column(UUID(as_uuid=True), ForeignKey("usuarios.id", ondelete="CASCADE"), unique=True, nullable=False)
    inicio_periodo = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))

    def debe_reiniciar(self) -> bool:
        limite = self.inicio_periodo + timedelta(days=DIAS_REINICIO_ESTADISTICAS)
        return datetime.now(timezone.utc) > limite