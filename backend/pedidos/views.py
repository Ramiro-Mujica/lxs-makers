import logging
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.utils import timezone
from datetime import timedelta
from .models import Pedido, DetallePedido
from .serializers import PedidoSerializer, SeguimientoSerializer
from utils.codigo_generator import generar_codigo_seguimiento

logger = logging.getLogger(__name__)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def pedidos(request):
    if request.method == 'GET':
        lista = Pedido.objects.filter(
            vendedor=request.user,
            created_at__gte=timezone.now() - timedelta(days=7)
        )
        serializer = PedidoSerializer(lista, many=True)
        return Response(serializer.data)

    serializer = PedidoSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    codigo = generar_codigo_seguimiento()
    while Pedido.objects.filter(codigo_seguimiento=codigo).exists():
        codigo = generar_codigo_seguimiento()

    pedido = serializer.save(vendedor=request.user, codigo_seguimiento=codigo)
    logger.info(f"Pedido creado: {codigo} por {request.user.email}")
    return Response(PedidoSerializer(pedido).data, status=status.HTTP_201_CREATED)


@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def pedido_detalle(request, pedido_id):
    try:
        pedido = Pedido.objects.get(id=pedido_id, vendedor=request.user)
    except Pedido.DoesNotExist:
        return Response({'error': 'Pedido no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response(PedidoSerializer(pedido).data)

    if request.method == 'PATCH':
        estado_anterior = pedido.estado
        serializer = PedidoSerializer(pedido, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        pedido_actualizado = serializer.save()

        if estado_anterior != 'completado' and pedido_actualizado.estado == 'completado':
            pedido_actualizado.completado_at = timezone.now()
            pedido_actualizado.save()
            logger.info(f"Pedido {pedido.codigo_seguimiento} completado")

        return Response(PedidoSerializer(pedido_actualizado).data)

    pedido.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def agregar_detalle(request, pedido_id):
    try:
        pedido = Pedido.objects.get(id=pedido_id, vendedor=request.user)
    except Pedido.DoesNotExist:
        return Response({'error': 'Pedido no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

    from productos.models import Producto
    producto_id = request.data.get('producto_id')
    cantidad    = int(request.data.get('cantidad', 1))
    variante    = request.data.get('variante', '')

    try:
        producto = Producto.objects.get(id=producto_id, vendedor=request.user)
    except Producto.DoesNotExist:
        return Response({'error': 'Producto no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

    detalle_existente = DetallePedido.objects.filter(
        pedido=pedido,
        producto=producto,
        variante=variante
    ).first()

    if detalle_existente:
        detalle_existente.cantidad += cantidad
        detalle_existente.save()
    else:
        DetallePedido.objects.create(
            pedido          = pedido,
            producto        = producto,
            nombre_producto = producto.nombre,
            precio_venta    = producto.precio_venta,
            precio_costo    = producto.precio_costo,
            cantidad        = cantidad,
            variante        = variante,
        )

    pedido.total = sum(d.subtotal() for d in pedido.detalles.all())
    pedido.save()

    return Response(PedidoSerializer(pedido).data, status=status.HTTP_200_OK)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def eliminar_detalle(request, pedido_id, detalle_id):
    try:
        pedido  = Pedido.objects.get(id=pedido_id, vendedor=request.user)
        detalle = DetallePedido.objects.get(id=detalle_id, pedido=pedido)
    except (Pedido.DoesNotExist, DetallePedido.DoesNotExist):
        return Response({'error': 'No encontrado.'}, status=status.HTTP_404_NOT_FOUND)

    detalle.delete()
    pedido.total = sum(d.subtotal() for d in pedido.detalles.all())
    pedido.save()
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['GET'])
@permission_classes([AllowAny])
def seguimiento_publico(request, codigo):
    try:
        pedido = Pedido.objects.get(codigo_seguimiento=codigo)
    except Pedido.DoesNotExist:
        return Response({'error': 'Pedido no encontrado o vencido.'}, status=status.HTTP_404_NOT_FOUND)

    if pedido.esta_vencido():
        return Response({'error': 'Pedido no encontrado o vencido.'}, status=status.HTTP_404_NOT_FOUND)

    detalles = [
        {
            'nombre_producto': d.nombre_producto,
            'variante':        d.variante or '-',
            'cantidad':        d.cantidad,
            'subtotal':        float(d.subtotal()),
        }
        for d in pedido.detalles.all()
    ]

    return Response({
        'codigo_seguimiento': pedido.codigo_seguimiento,
        'estado':             pedido.estado,
        'total':              float(pedido.total),
        'dias_restantes':     SeguimientoSerializer(pedido).data['dias_restantes'],
        'detalles':           detalles,
    })

@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def editar_detalle(request, pedido_id, detalle_id):
    try:
        pedido  = Pedido.objects.get(id=pedido_id, vendedor=request.user)
        detalle = DetallePedido.objects.get(id=detalle_id, pedido=pedido)
    except (Pedido.DoesNotExist, DetallePedido.DoesNotExist):
        return Response({'error': 'No encontrado.'}, status=status.HTTP_404_NOT_FOUND)

    cantidad = request.data.get('cantidad')
    if cantidad is not None:
        cantidad = int(cantidad)
        if cantidad < 1:
            return Response({'error': 'La cantidad debe ser al menos 1.'}, status=status.HTTP_400_BAD_REQUEST)
        detalle.cantidad = cantidad
        detalle.save()

    pedido.total = sum(d.subtotal() for d in pedido.detalles.all())
    pedido.save()

    return Response(PedidoSerializer(pedido).data)