# app/models/asistente.py
# Agregación con Vendedor: herramienta del panel, no persiste en BD


class Asistente:
    """
    Agregación con Vendedor.
    Calculadora con historial de 24 horas.
    Vive en memoria/sesión del frontend.
    """
    saludo_personalizado: str = ""

    def abrir_calculadora(self) -> None:
        pass

    def limpiar_historial_24hs(self) -> None:
        pass

    def mostrar_consejo(self) -> None:
        pass
