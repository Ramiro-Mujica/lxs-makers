import uuid
from django.db import models
from django.utils import timezone
from datetime import timedelta
from usuarios.models import Usuario
from productos.models import Producto


class Pedido(models.Model):

    ESTADO_CHOICES = [
        ('pendiente',  'Pendiente'),
        ('en_proceso', 'En proceso'),
        ('enviado',    'Enviado'),
        ('completado', 'Completado'),
    ]

    id                 = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    vendedor           = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name='pedidos')
    codigo_seguimiento = models.CharField(max_length=8, unique=True)
    nombre_cliente     = models.CharField(max_length=255, blank=True, null=True)
    comentario         = models.TextField(blank=True, null=True)
    estado             = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='pendiente')
    total              = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    completado_at      = models.DateTimeField(null=True, blank=True)
    created_at         = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'pedidos'
        ordering = ['-created_at']

    def __str__(self):
        return f"Pedido {self.codigo_seguimiento}"

    def esta_vencido(self):
        return timezone.now() > self.created_at + timedelta(days=7)


class DetallePedido(models.Model):
    """Composición con Pedido — no existe sin él."""

    id               = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    pedido           = models.ForeignKey(Pedido, on_delete=models.CASCADE, related_name='detalles')
    producto         = models.ForeignKey(Producto, on_delete=models.SET_NULL, null=True, related_name='detalles_pedido')
    nombre_producto  = models.CharField(max_length=255)
    precio_venta     = models.DecimalField(max_digits=10, decimal_places=2)
    precio_costo     = models.DecimalField(max_digits=10, decimal_places=2)
    cantidad         = models.PositiveIntegerField(default=1)
    variante         = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        db_table = 'detalles_pedido'

    def subtotal(self):
        return self.precio_venta * self.cantidad

    def ganancia(self):
        return (self.precio_venta - self.precio_costo) * self.cantidad


class EstadisticaVendedor(models.Model):
    """Guarda la fecha de inicio del período de estadísticas del vendedor."""

    id            = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    vendedor      = models.OneToOneField(Usuario, on_delete=models.CASCADE, related_name='estadistica')
    inicio_periodo = models.DateTimeField(default=timezone.now)
    created_at    = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'estadisticas_vendedor'

    def __str__(self):
        return f"Estadística de {self.vendedor.email}"

    def debe_reiniciar(self):
        return timezone.now() > self.inicio_periodo + timedelta(days=60)