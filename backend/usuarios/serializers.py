import bleach
from rest_framework import serializers
from .models import Usuario


class RegistroSerializer(serializers.ModelSerializer):

    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model  = Usuario
        fields = ['email', 'password', 'nombre_negocio', 'whatsapp']

    def validate_email(self, value):
        return bleach.clean(value.strip().lower())

    def validate_nombre_negocio(self, value):
        if value:
            return bleach.clean(value.strip())
        return value

    def validate_whatsapp(self, value):
        if value:
            return bleach.clean(value.strip())
        return value

    def validate_password(self, value):
        if not any(c.isupper() for c in value):
            raise serializers.ValidationError('Debe tener al menos una mayúscula.')
        if not any(c.islower() for c in value):
            raise serializers.ValidationError('Debe tener al menos una minúscula.')
        if not any(c.isdigit() for c in value):
            raise serializers.ValidationError('Debe tener al menos un número.')
        return value

    def create(self, validated_data):
        return Usuario.objects.create_user(**validated_data)


class LoginSerializer(serializers.Serializer):

    email    = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate_email(self, value):
        return bleach.clean(value.strip().lower())


class UsuarioPerfilSerializer(serializers.ModelSerializer):

    class Meta:
        model  = Usuario
        fields = [
            'id', 'email', 'rol', 'estado',
            'nombre_negocio', 'descripcion',
            'whatsapp', 'codigo_catalogo',
        ]
        read_only_fields = ['id', 'email', 'rol', 'estado', 'codigo_catalogo']