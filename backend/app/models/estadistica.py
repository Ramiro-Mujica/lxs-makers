# app/models/estadistica.py
import uuid
from sqlalchemy import Column, String, Integer, Numeric, ForeignKey, UniqueConstraint
from app.models.usuario import Base


class EstadisticaMensual(Base):
    """Contador mensual liviano de ventas por vendedor."""
    __tablename__ = "estadisticas_mensuales"

    id             = Column(String(36),     primary_key=True, default=lambda: str(uuid.uuid4()))
    usuario_id     = Column(String(36),     ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False)
    mes            = Column(Integer,        nullable=False)
    anio           = Column(Integer,        nullable=False)
    total_pedidos  = Column(Integer,        nullable=False, default=0)
    total_ganancia = Column(Numeric(10, 2), nullable=False, default=0)

    __table_args__ = (
        UniqueConstraint("usuario_id", "mes", "anio", name="uq_estadisticas"),
    )