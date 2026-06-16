# app/models/usuario.py
# Clase base del diagrama de clases (Herencia hacia Vendedor y Administrador)
import uuid
from sqlalchemy import Column, String, Enum, TIMESTAMP
from sqlalchemy.orm import declarative_base, relationship
from datetime import datetime
from sqlalchemy import Column, String, Enum, TIMESTAMP, Integer
from sqlalchemy.orm import relationship

Base = declarative_base()

ROL_ENUM = Enum("vendedor", "administrador", name="rol_usuario")
ESTADO_ENUM = Enum("pendiente", "activo", "deshabilitado", name="estado_usuario")


class Usuario(Base):
    """
    Clase base. Vendedor y Administrador heredan de esta clase.
    """
    __tablename__ = "usuarios"

    id              = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email           = Column(String(255), nullable=False, unique=True)
    password        = Column(String(255), nullable=False)
    rol             = Column(ROL_ENUM, nullable=False)
    estado          = Column(ESTADO_ENUM, nullable=False, default="pendiente")
    nombre_negocio  = Column(String(255), nullable=True)
    codigo_catalogo = Column(String(50), nullable=True, unique=True)
    whatsapp        = Column(String(20), nullable=True)
    limite_tableros = Column(Integer, nullable=False, default=5)
    created_at      = Column(TIMESTAMP, default=datetime.utcnow)
    productos = relationship("Producto", back_populates="vendedor", cascade="all, delete-orphan")
    pedidos   = relationship("Pedido",   back_populates="vendedor", cascade="all, delete-orphan")
    tableros  = relationship("Tablero",  back_populates="vendedor")

    def login(self) -> None:
        pass

    def logout(self) -> None:
        pass

    def cambiar_password(self, nueva_password: str) -> None:
        pass
