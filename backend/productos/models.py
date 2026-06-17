import uuid
from django.db import models
from usuarios.models import Usuario


class Producto(models.Model):

    ESTADO_CHOICES = [
        ('visible',   'Visible'),
        ('sin_stock', 'Sin stock'),
        ('oculto',    'Oculto'),
    ]

    id           = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    vendedor     = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name='productos')
    nombre       = models.CharField(max_length=255)
    descripcion  = models.TextField(blank=True, null=True)
    precio_venta = models.DecimalField(max_digits=10, decimal_places=2)
    precio_costo = models.DecimalField(max_digits=10, decimal_places=2)
    estado       = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='visible')
    orden_visual = models.PositiveIntegerField(default=0)
    created_at   = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'productos'
        ordering = ['orden_visual']

    def __str__(self):
        return self.nombre

    def ganancia_unitaria(self):
        return self.precio_venta - self.precio_costo


class ImagenProducto(models.Model):
    """Composición con Producto: hasta 5 imágenes."""

    id          = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    producto    = models.ForeignKey(Producto, on_delete=models.CASCADE, related_name='imagenes')
    url         = models.URLField(max_length=500)
    orden       = models.PositiveIntegerField(default=0)
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'imagenes_producto'
        ordering = ['orden']

    def __str__(self):
        return f"Imagen {self.orden} de {self.producto.nombre}"


class Variante(models.Model):
    """Composición con Producto: variantes opcionales."""

    id          = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    producto    = models.ForeignKey(Producto, on_delete=models.CASCADE, related_name='variantes')
    tipo        = models.CharField(max_length=100)
    valor       = models.CharField(max_length=100)
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'variantes'

    def __str__(self):
        return f"{self.tipo}: {self.valor}"