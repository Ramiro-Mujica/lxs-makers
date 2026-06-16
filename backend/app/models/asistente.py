# app/models/asistente.py
# Agregación con Vendedor: el asistente es una herramienta del panel
# El historial de la calculadora expira cada 24 horas


class Asistente:
    """
    Agregación con Vendedor.
    Calculadora con historial de 24 horas.
    No persiste en base de datos, vive en memoria/sesión del frontend.
    """
    saludo_personalizado: str = ""

    def abrir_calculadora(self) -> None:
        pass

    def limpiar_historial_24hs(self) -> None:
        pass

    def mostrar_consejo(self) -> None:
        pass
