import logging
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from .models import Usuario
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

    if usuario.estado == 'deshabilitado':
        return Response(
            {'error': 'Tu cuenta está deshabilitada.'},
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

    serializer = UsuarioPerfilSerializer(request.user, data=request.data, partial=True)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    serializer.save()
    return Response({'mensaje': 'Perfil actualizado correctamente.'})