import bleach
from rest_framework import serializers
from .models import Producto, ImagenProducto, Variante


class ImagenProductoSerializer(serializers.ModelSerializer):

    class Meta:
        model  = ImagenProducto
        fields = ['id', 'url', 'orden']


class VarianteSerializer(serializers.ModelSerializer):

    class Meta:
        model  = Variante
        fields = ['id', 'tipo', 'valor']


class ProductoSerializer(serializers.ModelSerializer):

    imagenes  = ImagenProductoSerializer(many=True, read_only=True)
    variantes = VarianteSerializer(many=True, read_only=True)

    class Meta:
        model  = Producto
        fields = [
            'id', 'nombre', 'descripcion',
            'precio_venta', 'estado', 'orden_visual',
            'imagenes', 'variantes', 'created_at',
        ]


class ProductoVendedorSerializer(serializers.ModelSerializer):
    """Serializer completo para el vendedor — incluye precio de costo."""

    imagenes  = ImagenProductoSerializer(many=True, read_only=True)
    variantes = VarianteSerializer(many=True, read_only=True)

    class Meta:
        model  = Producto
        fields = [
            'id', 'nombre', 'descripcion',
            'precio_venta', 'precio_costo',
            'estado', 'orden_visual',
            'imagenes', 'variantes', 'created_at',
        ]

    def validate_nombre(self, value):
        return bleach.clean(value.strip())

    def validate_descripcion(self, value):
        if value:
            return bleach.clean(value.strip())
        return value

    def validate_precio_costo(self, value):
        if value <= 0:
            raise serializers.ValidationError('El precio de costo debe ser mayor a cero.')
        return value

    def validate(self, data):
        precio_venta = data.get('precio_venta')
        precio_costo = data.get('precio_costo')
        if precio_venta and precio_costo:
            if precio_costo >= precio_venta:
                raise serializers.ValidationError(
                    'El precio de costo no puede ser igual o mayor al precio de venta.'
                )
        return data