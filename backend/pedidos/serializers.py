import bleach
from rest_framework import serializers
from .models import Pedido, DetallePedido


class DetallePedidoSerializer(serializers.ModelSerializer):

    class Meta:
        model  = DetallePedido
        fields = [
            'id', 'producto', 'nombre_producto',
            'precio_venta', 'precio_costo',
            'cantidad', 'variante',
        ]
        read_only_fields = ['id']


class PedidoSerializer(serializers.ModelSerializer):

    detalles       = DetallePedidoSerializer(many=True, read_only=True)
    dias_restantes = serializers.SerializerMethodField()

    class Meta:
        model  = Pedido
        fields = [
            'id', 'codigo_seguimiento', 'nombre_cliente',
            'comentario', 'estado', 'total',
            'created_at', 'detalles', 'dias_restantes',
        ]
        read_only_fields = ['id', 'codigo_seguimiento', 'total', 'created_at']

    def get_dias_restantes(self, obj):
        from django.utils import timezone
        from datetime import timedelta
        vencimiento = obj.created_at + timedelta(days=7)
        restantes   = (vencimiento - timezone.now()).days
        return max(restantes, 0)

    def validate_nombre_cliente(self, value):
        if value:
            return bleach.clean(value.strip())
        return value

    def validate_comentario(self, value):
        if value:
            return bleach.clean(value.strip())
        return value


class SeguimientoSerializer(serializers.ModelSerializer):
    """Solo para consulta pública — sin datos sensibles."""

    dias_restantes = serializers.SerializerMethodField()

    class Meta:
        model  = Pedido
        fields = ['codigo_seguimiento', 'estado', 'created_at', 'dias_restantes']

    def get_dias_restantes(self, obj):
        from django.utils import timezone
        from datetime import timedelta
        vencimiento = obj.created_at + timedelta(days=7)
        restantes   = (vencimiento - timezone.now()).days
        return max(restantes, 0)