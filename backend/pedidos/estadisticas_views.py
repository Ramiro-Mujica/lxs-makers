import logging
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from datetime import timedelta, datetime, timezone as dt_timezone
from django.db.models import Sum, F, ExpressionWrapper, DecimalField
from .models import Pedido, DetallePedido, EstadisticaVendedor

logger = logging.getLogger(__name__)


def obtener_o_crear_estadistica(vendedor):
    estadistica, _ = EstadisticaVendedor.objects.get_or_create(vendedor=vendedor)
    if estadistica.debe_reiniciar():
        estadistica.inicio_periodo = timezone.now()
        estadistica.save()
        logger.info(f"Estadísticas reiniciadas automáticamente para {vendedor.email}")
    return estadistica


def detalles_completados(vendedor, desde):
    return DetallePedido.objects.filter(
        pedido__vendedor=vendedor,
        pedido__estado='completado',
        pedido__completado_at__gte=desde,
    )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def estadisticas_vendedor(request):
    estadistica = obtener_o_crear_estadistica(request.user)
    desde       = estadistica.inicio_periodo
    ahora       = timezone.now()

    detalles = detalles_completados(request.user, desde)

    ganancia_expr = ExpressionWrapper(
        (F('precio_venta') - F('precio_costo')) * F('cantidad'),
        output_field=DecimalField()
    )

    ingreso_expr = ExpressionWrapper(
        F('precio_venta') * F('cantidad'),
        output_field=DecimalField()
    )

    ganancia_diaria = []
    for i in range(29, -1, -1):
        dia       = (ahora - timedelta(days=i)).date()
        dia_desde = datetime.combine(dia, datetime.min.time()).replace(tzinfo=dt_timezone.utc)
        dia_hasta = datetime.combine(dia, datetime.max.time()).replace(tzinfo=dt_timezone.utc)
        resultado = detalles.filter(
            pedido__completado_at__range=(dia_desde, dia_hasta)
        ).aggregate(
            ganancia=Sum(ganancia_expr),
            ingresos=Sum(ingreso_expr),
        )
        ganancia_diaria.append({
            'fecha':    dia.strftime('%d/%m'),
            'ganancia': float(resultado['ganancia'] or 0),
            'ingresos': float(resultado['ingresos'] or 0),
        })

    ganancia_semanal = []
    for i in range(7, -1, -1):
        semana_hasta = ahora - timedelta(weeks=i)
        semana_desde = semana_hasta - timedelta(weeks=1)
        resultado = detalles.filter(
            pedido__completado_at__range=(semana_desde, semana_hasta)
        ).aggregate(
            ganancia=Sum(ganancia_expr),
            ingresos=Sum(ingreso_expr),
        )
        ganancia_semanal.append({
            'semana':   f"S{8 - i}",
            'ganancia': float(resultado['ganancia'] or 0),
            'ingresos': float(resultado['ingresos'] or 0),
        })

    ganancia_mensual = []
    for i in range(1, -1, -1):
        mes_hasta = ahora - timedelta(days=30 * i)
        mes_desde = mes_hasta - timedelta(days=30)
        resultado = detalles.filter(
            pedido__completado_at__range=(mes_desde, mes_hasta)
        ).aggregate(
            ganancia=Sum(ganancia_expr),
            ingresos=Sum(ingreso_expr),
        )
        ganancia_mensual.append({
            'mes':      mes_desde.strftime('%b %Y'),
            'ganancia': float(resultado['ganancia'] or 0),
            'ingresos': float(resultado['ingresos'] or 0),
        })

    top_vendidos = detalles.values('nombre_producto').annotate(
        total_vendido=Sum('cantidad')
    ).order_by('-total_vendido')[:5]

    top_ganancia = detalles.values('nombre_producto').annotate(
        total_ganancia=Sum(ganancia_expr)
    ).order_by('-total_ganancia')[:5]

    totales = detalles.aggregate(
        ganancia_total=Sum(ganancia_expr),
        ingresos_total=Sum(ingreso_expr),
        pedidos_completados=Sum('cantidad'),
    )

    return Response({
        'ganancia_diaria':      ganancia_diaria,
        'ganancia_semanal':     ganancia_semanal,
        'ganancia_mensual':     ganancia_mensual,
        'top_vendidos':         list(top_vendidos),
        'top_ganancia':         list(top_ganancia),
        'ganancia_total':       float(totales['ganancia_total'] or 0),
        'ingresos_total':       float(totales['ingresos_total'] or 0),
        'pedidos_completados':  totales['pedidos_completados'] or 0,
        'inicio_periodo':       estadistica.inicio_periodo,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def reiniciar_estadisticas(request):
    estadistica, _ = EstadisticaVendedor.objects.get_or_create(vendedor=request.user)
    estadistica.inicio_periodo = timezone.now()
    estadistica.save()
    logger.info(f"Estadísticas reiniciadas manualmente por {request.user.email}")
    return Response({'mensaje': 'Estadísticas reiniciadas correctamente.'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def estadisticas_admin(request):
    if request.user.rol != 'administrador':
        return Response({'error': 'Sin permisos.'}, status=status.HTTP_403_FORBIDDEN)

    from usuarios.models import Usuario
    vendedores = Usuario.objects.filter(rol='vendedor', estado='activo')

    resultado = []
    for v in vendedores:
        total = Pedido.objects.filter(
            vendedor=v, estado='completado'
        ).count()
        resultado.append({
            'vendedor':            v.email,
            'nombre_negocio':      v.nombre_negocio or '-',
            'pedidos_completados': total,
        })

    return Response(resultado)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def reiniciar_contador_admin(request):
    if request.user.rol != 'administrador':
        return Response({'error': 'Sin permisos.'}, status=status.HTTP_403_FORBIDDEN)

    vendedor_id = request.data.get('vendedor_id')
    if vendedor_id:
        Pedido.objects.filter(vendedor_id=vendedor_id, estado='completado').update(estado='archivado')
    logger.info(f"Contador admin reiniciado por {request.user.email}")
    return Response({'mensaje': 'Contador reiniciado.'})