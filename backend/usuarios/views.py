import logging
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from .models import Usuario
import bleach
from .serializers import RegistroSerializer, LoginSerializer, UsuarioPerfilSerializer

logger = logging.getLogger(__name__)


def get_tokens(usuario):
    refresh = RefreshToken.for_user(usuario)
    refresh['rol']    = usuario.rol
    refresh['estado'] = usuario.estado
    return {
        'refresh': str(refresh),
        'access':  str(refresh.access_token),
    }


@api_view(['POST'])
@permission_classes([AllowAny])
def registro(request):
    serializer = RegistroSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    usuario = serializer.save()
    logger.info(f"Nuevo vendedor registrado: {usuario.email}")
    return Response(
        {'mensaje': 'Registro exitoso. Tu cuenta está pendiente de aprobación.'},
        status=status.HTTP_201_CREATED
    )


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    serializer = LoginSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    email    = serializer.validated_data['email']
    password = request.data.get('password')
    usuario  = authenticate(request, username=email, password=password)

    if not usuario:
        return Response(
            {'error': 'Email o contraseña incorrectos.'},
            status=status.HTTP_401_UNAUTHORIZED
        )

    if usuario.estado == 'pendiente':
        return Response(
        {'error': 'Tu cuenta está pendiente de aprobación por el administrador.'},
        status=status.HTTP_403_FORBIDDEN
    )

    tokens = get_tokens(usuario)
    logger.info(f"Login exitoso: {email}")
    return Response({
        **tokens,
        'rol':    usuario.rol,
        'estado': usuario.estado,
        'id':     str(usuario.id),
    })


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def perfil(request):
    if request.method == 'GET':
        serializer = UsuarioPerfilSerializer(request.user)
        return Response(serializer.data)

    datos_permitidos = {}
    if 'nombre_negocio' in request.data:
        datos_permitidos['nombre_negocio'] = bleach.clean(str(request.data['nombre_negocio']).strip())
    if 'whatsapp' in request.data:
        datos_permitidos['whatsapp'] = bleach.clean(str(request.data['whatsapp']).strip())
    if 'descripcion' in request.data:
        datos_permitidos['descripcion'] = bleach.clean(str(request.data['descripcion']).strip())

    serializer = UsuarioPerfilSerializer(request.user, data=datos_permitidos, partial=True)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    serializer.save()
    logger.info(f"Perfil actualizado: {request.user.email}")
    return Response({'mensaje': 'Perfil actualizado correctamente.'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def listar_vendedores(request):
    if request.user.rol != 'administrador':
        return Response({'error': 'Sin permisos.'}, status=status.HTTP_403_FORBIDDEN)

    vendedores = Usuario.objects.filter(rol='vendedor').order_by('-created_at')
    serializer = UsuarioPerfilSerializer(vendedores, many=True)
    return Response(serializer.data)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def cambiar_estado_vendedor(request, usuario_id):
    if request.user.rol != 'administrador':
        return Response({'error': 'Sin permisos.'}, status=status.HTTP_403_FORBIDDEN)

    try:
        vendedor = Usuario.objects.get(id=usuario_id, rol='vendedor')
    except Usuario.DoesNotExist:
        return Response({'error': 'Vendedor no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

    nuevo_estado = request.data.get('estado')
    estados_validos = ['activo', 'deshabilitado', 'pendiente']
    if nuevo_estado not in estados_validos:
        return Response({'error': 'Estado inválido.'}, status=status.HTTP_400_BAD_REQUEST)

    if nuevo_estado == 'activo' and not vendedor.codigo_catalogo:
        from utils.codigo_generator import generar_codigo_catalogo
        codigo = generar_codigo_catalogo()
        while Usuario.objects.filter(codigo_catalogo=codigo).exists():
            codigo = generar_codigo_catalogo()
        vendedor.codigo_catalogo = codigo

    vendedor.estado = nuevo_estado
    vendedor.save()
    logger.info(f"Vendedor {vendedor.email} cambió a estado: {nuevo_estado}")
    return Response({'mensaje': f'Vendedor {nuevo_estado} correctamente.'})
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def resumen_vendedor(request):
    from pedidos.models import Pedido
    from productos.models import Producto
    from django.utils import timezone
    from datetime import timedelta

    pedidos_activos = Pedido.objects.filter(
        vendedor=request.user,
        created_at__gte=timezone.now() - timedelta(days=7)
    )

    productos = Producto.objects.filter(vendedor=request.user)

    return Response({
        'nombre_negocio':    request.user.nombre_negocio or '-',
        'codigo_catalogo':   request.user.codigo_catalogo or None,
        'whatsapp':          request.user.whatsapp or '-',
        'pedidos_pendientes':  pedidos_activos.filter(estado='pendiente').count(),
        'pedidos_en_proceso':  pedidos_activos.filter(estado='en_proceso').count(),
        'pedidos_enviados':    pedidos_activos.filter(estado='enviado').count(),
        'pedidos_completados': pedidos_activos.filter(estado='completado').count(),
        'total_productos':     productos.count(),
        'productos_visibles':  productos.filter(estado='visible').count(),
        'productos_sin_stock': productos.filter(estado='sin_stock').count(),
        'productos_ocultos':   productos.filter(estado='oculto').count(),
    })