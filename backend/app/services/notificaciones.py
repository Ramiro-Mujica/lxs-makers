import logging
from abc import ABC, abstractmethod

logger = logging.getLogger(__name__)


class ObservadorPedido(ABC):
    """Interfaz que deben implementar todos los observadores de eventos de pedidos."""

    @abstractmethod
    def notificar(self, pedido) -> None:
        ...


class ObservadorLog(ObservadorPedido):
    """Observador concreto: registra el evento en el log del sistema."""

    def notificar(self, pedido) -> None:
        logger.info(
            f"[Observer] Pedido {pedido.codigo_seguimiento} completado — "
            f"total: ${pedido.total}"
        )


class NotificadorPedido:
    """
    Sujeto (Subject) del patrón Observer.
    Mantiene la lista de observadores y les avisa cuando un pedido se completa,
    sin necesitar saber qué hace cada uno con esa información.
    """

    def __init__(self):
        self._observadores: list[ObservadorPedido] = []

    def suscribir(self, observador: ObservadorPedido) -> None:
        self._observadores.append(observador)

    def notificar_pedido_completado(self, pedido) -> None:
        for observador in self._observadores:
            observador.notificar(pedido)


# Instancia única que usan los routers — ya viene con el observador de logging suscripto.
notificador_pedidos = NotificadorPedido()
notificador_pedidos.suscribir(ObservadorLog())