import logging
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Tablero, Tarea
from .serializers import TableroSerializer, TareaSerializer

logger = logging.getLogger(__name__)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def tableros(request):
    if request.method == 'GET':
        lista = Tablero.objects.filter(vendedor=request.user)
        serializer = TableroSerializer(lista, many=True)
        return Response(serializer.data)

    limite = request.user.limite_tableros
    total  = Tablero.objects.filter(vendedor=request.user).count()
    if total >= limite:
        return Response(
            {'error': f'Límite de {limite} tableros alcanzado.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    serializer = TableroSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    tablero = serializer.save(vendedor=request.user)
    logger.info(f"Tablero creado por {request.user.email}: {tablero.nombre}")
    return Response(TableroSerializer(tablero).data, status=status.HTTP_201_CREATED)


@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def tablero_detalle(request, tablero_id):
    try:
        tablero = Tablero.objects.get(id=tablero_id, vendedor=request.user)
    except Tablero.DoesNotExist:
        return Response({'error': 'Tablero no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response(TableroSerializer(tablero).data)

    if request.method == 'PATCH':
        serializer = TableroSerializer(tablero, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()
        return Response(serializer.data)

    tablero.delete()
    logger.info(f"Tablero eliminado por {request.user.email}")
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def agregar_tarea(request, tablero_id):
    try:
        tablero = Tablero.objects.get(id=tablero_id, vendedor=request.user)
    except Tablero.DoesNotExist:
        return Response({'error': 'Tablero no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

    serializer = TareaSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    tarea = serializer.save(tablero=tablero)
    return Response(TareaSerializer(tarea).data, status=status.HTTP_201_CREATED)


@api_view(['PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def tarea_detalle(request, tablero_id, tarea_id):
    try:
        tablero = Tablero.objects.get(id=tablero_id, vendedor=request.user)
        tarea   = Tarea.objects.get(id=tarea_id, tablero=tablero)
    except (Tablero.DoesNotExist, Tarea.DoesNotExist):
        return Response({'error': 'No encontrado.'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'PATCH':
        serializer = TareaSerializer(tarea, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()
        return Response(serializer.data)

    tarea.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)