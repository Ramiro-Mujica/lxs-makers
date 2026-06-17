import bleach
from rest_framework import serializers
from .models import Tablero, Tarea


class TareaSerializer(serializers.ModelSerializer):

    class Meta:
        model  = Tarea
        fields = ['id', 'contenido', 'seccion', 'created_at']
        read_only_fields = ['id', 'created_at']

    def validate_contenido(self, value):
        return bleach.clean(value.strip())


class TableroSerializer(serializers.ModelSerializer):

    tareas = TareaSerializer(many=True, read_only=True)

    class Meta:
        model  = Tablero
        fields = ['id', 'nombre', 'tareas', 'created_at']
        read_only_fields = ['id', 'created_at']

    def validate_nombre(self, value):
        return bleach.clean(value.strip())