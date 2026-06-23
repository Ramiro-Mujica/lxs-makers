from abc import ABC, abstractmethod
from typing import List
from app.models.producto import Producto


class EstrategiaOrden(ABC):
    """Interfaz que deben implementar todas las estrategias de ordenamiento del catálogo."""

    @abstractmethod
    def ordenar(self, productos: List[Producto]) -> List[Producto]:
        ...


class OrdenPorDefecto(EstrategiaOrden):
    """Mantiene el orden manual que definió el vendedor (orden_visual)."""

    def ordenar(self, productos: List[Producto]) -> List[Producto]:
        return sorted(productos, key=lambda p: p.orden_visual)


class OrdenPrecioAscendente(EstrategiaOrden):
    """Del más barato al más caro."""

    def ordenar(self, productos: List[Producto]) -> List[Producto]:
        return sorted(productos, key=lambda p: p.precio_venta)


class OrdenPrecioDescendente(EstrategiaOrden):
    """Del más caro al más barato."""

    def ordenar(self, productos: List[Producto]) -> List[Producto]:
        return sorted(productos, key=lambda p: p.precio_venta, reverse=True)


# Mapa de estrategias disponibles — agregar una nueva opción no requiere
# tocar el endpoint del catálogo, solo sumar una entrada acá.
ESTRATEGIAS_ORDEN = {
    "defecto": OrdenPorDefecto(),
    "precio_asc": OrdenPrecioAscendente(),
    "precio_desc": OrdenPrecioDescendente(),
}


def obtener_estrategia(nombre: str) -> EstrategiaOrden:
    return ESTRATEGIAS_ORDEN.get(nombre, ESTRATEGIAS_ORDEN["defecto"])