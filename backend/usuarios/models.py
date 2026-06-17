import uuid
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models


class UsuarioManager(BaseUserManager):

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('El email es obligatorio')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('rol', 'administrador')
        extra_fields.setdefault('estado', 'activo')
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra_fields)


class Usuario(AbstractBaseUser, PermissionsMixin):

    ROL_CHOICES = [
        ('vendedor',       'Vendedor'),
        ('administrador',  'Administrador'),
    ]

    ESTADO_CHOICES = [
        ('pendiente',      'Pendiente'),
        ('activo',         'Activo'),
        ('deshabilitado',  'Deshabilitado'),
    ]

    id              = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email           = models.EmailField(unique=True)
    rol             = models.CharField(max_length=20, choices=ROL_CHOICES, default='vendedor')
    estado          = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='pendiente')
    nombre_negocio  = models.CharField(max_length=255, blank=True, null=True)
    descripcion     = models.TextField(blank=True, null=True)
    codigo_catalogo = models.CharField(max_length=50, unique=True, blank=True, null=True)
    whatsapp        = models.CharField(max_length=20, blank=True, null=True)
    limite_tableros = models.PositiveIntegerField(default=5)
    is_staff        = models.BooleanField(default=False)
    created_at      = models.DateTimeField(auto_now_add=True)

    USERNAME_FIELD  = 'email'
    REQUIRED_FIELDS = []

    objects = UsuarioManager()

    class Meta:
        db_table = 'usuarios'
        verbose_name = 'Usuario'
        verbose_name_plural = 'Usuarios'

    def __str__(self):
        return self.email


class Vendedor(Usuario):
    """Herencia: Vendedor extiende Usuario."""

    class Meta:
        proxy = True
        verbose_name = 'Vendedor'
        verbose_name_plural = 'Vendedores'

    def editar_perfil(self):
        pass

    def ordenar_catalogo(self):
        pass


class Administrador(Usuario):
    """Herencia: Administrador extiende Usuario."""

    class Meta:
        proxy = True
        verbose_name = 'Administrador'
        verbose_name_plural = 'Administradores'

    def habilitar_vendedor(self, vendedor_id):
        pass

    def deshabilitar_vendedor(self, vendedor_id):
        pass

    def asignar_codigo_catalogo(self, vendedor_id, codigo):
        pass

    def ajustar_limites(self, vendedor_id, limite):
        pass