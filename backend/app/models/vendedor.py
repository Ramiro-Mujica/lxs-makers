# app/models/vendedor.py
# Herencia: Vendedor extiende Usuario
from app.models.usuario import Usuario


class Vendedor(Usuario):
    """
    Hereda de Usuario.
    Composición con Producto y Pedido.
    Agregación con Tablero.
    """
    __tablename__   = "usuarios"
    __mapper_args__ = {"polymorphic_identity": "vendedor"}

    def editar_perfil(self) -> None:
        pass

    def ordenar_catalogo(self) -> None:
        pass
