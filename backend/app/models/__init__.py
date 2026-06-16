# app/models/__init__.py
# Importar todos los modelos para que SQLAlchemy los registre correctamente
from app.models.usuario import Usuario, Base
from app.models.producto import Producto, ImagenProducto, Variante
from app.models.pedido import Pedido, HistorialVenta
from app.models.tablero import Tablero, Tarea
