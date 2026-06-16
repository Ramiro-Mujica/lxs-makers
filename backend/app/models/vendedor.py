# app/models/vendedor.py
# Herencia: Vendedor extiende Usuario
# Composición con Producto y Pedido (no existen sin Vendedor)
# Agregación con TableroKanban (pueden existir de forma independiente)
from sqlalchemy import Column, String, Integer, ForeignKey
from sqlalchemy.orm import relationship
from app.models.usuario import Usuario


class Vendedor(Usuario):
    """
    Hereda de Usuario.
    Extiende con atributos y relaciones propias del vendedor.
    """
    __tablename__ = "usuarios"
    __mapper_args__ = {
        "polymorphic_identity": "vendedor",
    }

    limite_tableros = Column(Integer, nullable=False, default=5)

    # Composición: productos y pedidos no existen sin el vendedor
    productos = relationship("Producto", back_populates="vendedor", cascade="all, delete-orphan")
    pedidos   = relationship("Pedido",   back_populates="vendedor", cascade="all, delete-orphan")

    # Agregación: tableros pueden existir independientemente
    tableros  = relationship("Tablero",  back_populates="vendedor")

    def editar_perfil(self) -> None:
        pass

    def ordenar_catalogo(self) -> None:
        pass
