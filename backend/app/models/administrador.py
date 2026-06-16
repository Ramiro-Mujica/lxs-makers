# app/models/administrador.py
# Herencia: Administrador extiende Usuario
from sqlalchemy.orm import relationship
from app.models.usuario import Usuario


class Administrador(Usuario):
    """
    Hereda de Usuario.
    Gestiona vendedores, catálogos y límites del sistema.
    """
    __tablename__ = "usuarios"
    __mapper_args__ = {
        "polymorphic_identity": "administrador",
    }

    def habilitar_vendedor(self, vendedor_id: str) -> None:
        pass

    def deshabilitar_vendedor(self, vendedor_id: str) -> None:
        pass

    def asignar_codigo_catalogo(self, vendedor_id: str, codigo: str) -> None:
        pass

    def ajustar_limite_tableros(self, vendedor_id: str, nuevo_limite: int) -> None:
        pass
