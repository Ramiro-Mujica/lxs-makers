import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, Integer
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base


class Usuario(Base):
    """
    Modelo de Usuario: representa a cualquier persona con cuenta en el sistema
    (administrador o vendedor). Los clientes no tienen registro.
    """
    __tablename__ = "usuarios"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False)
    password = Column(String(255), nullable=False)
    rol = Column(String(20), nullable=False, default="vendedor")
    estado = Column(String(20), nullable=False, default="pendiente")
    nombre_negocio = Column(String(255), nullable=True)
    descripcion = Column(String, nullable=True)
    codigo_catalogo = Column(String(50), unique=True, nullable=True)
    whatsapp = Column(String(20), nullable=True)
    limite_tableros = Column(Integer, nullable=False, default=5)
    is_staff = Column(Boolean, nullable=False, default=False)
    is_superuser = Column(Boolean, nullable=False, default=False)
    last_login = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))

    __mapper_args__ = {
        "polymorphic_identity": "usuario",
        "polymorphic_on": rol,
    }


class Vendedor(Usuario):
    """Herencia: Vendedor extiende Usuario (mismo registro de la tabla, distinto comportamiento)."""

    __mapper_args__ = {
        "polymorphic_identity": "vendedor",
    }

    def editar_perfil(self):
        pass

    def ordenar_catalogo(self):
        pass


class Administrador(Usuario):
    """Herencia: Administrador extiende Usuario (mismo registro de la tabla, distinto comportamiento)."""

    __mapper_args__ = {
        "polymorphic_identity": "administrador",
    }

    def habilitar_vendedor(self, vendedor_id):
        pass

    def deshabilitar_vendedor(self, vendedor_id):
        pass

    def asignar_codigo_catalogo(self, vendedor_id, codigo):
        pass

    def ajustar_limites(self, vendedor_id, limite):
        pass