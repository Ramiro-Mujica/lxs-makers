import uuid
from django.db import models
from usuarios.models import Usuario


class Tablero(models.Model):
    """Agregación con Usuario — puede existir independientemente."""

    id         = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    vendedor   = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name='tableros')
    nombre     = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'tableros'
        ordering = ['created_at']

    def __str__(self):
        return self.nombre


class Tarea(models.Model):
    """Composición con Tablero — no existe sin él."""

    SECCION_CHOICES = [
        ('por_hacer',   'Por hacer'),
        ('en_progreso', 'En progreso'),
        ('hecho',       'Hecho'),
    ]

    id         = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tablero    = models.ForeignKey(Tablero, on_delete=models.CASCADE, related_name='tareas')
    contenido  = models.TextField()
    seccion    = models.CharField(max_length=20, choices=SECCION_CHOICES, default='por_hacer')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'tareas'
        ordering = ['created_at']

    def __str__(self):
        return self.contenido[:50]