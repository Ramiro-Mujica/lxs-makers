import logging
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from .models import Producto, ImagenProducto, Variante
from .serializers import ProductoSerializer, ProductoVendedorSerializer, VarianteSerializer

logger = logging.getLogger(__name__)

MAX_IMAGENES = 5


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def productos(request):
    if request.method == 'GET':
        lista = Producto.objects.filter(vendedor=request.user)
        serializer = ProductoVendedorSerializer(lista, many=True)
        return Response(serializer.data)

    serializer = ProductoVendedorSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    serializer.save(vendedor=request.user)
    logger.info(f"Producto creado por {request.user.email}")
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def producto_detalle(request, producto_id):
    try:
        producto = Producto.objects.get(id=producto_id, vendedor=request.user)
    except Producto.DoesNotExist:
        return Response({'error': 'Producto no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = ProductoVendedorSerializer(producto)
        return Response(serializer.data)

    if request.method == 'PATCH':
        serializer = ProductoVendedorSerializer(producto, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()
        return Response(serializer.data)

    producto.delete()
    logger.info(f"Producto eliminado por {request.user.email}")
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def agregar_imagen(request, producto_id):
    try:
        producto = Producto.objects.get(id=producto_id, vendedor=request.user)
    except Producto.DoesNotExist:
        return Response({'error': 'Producto no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

    if producto.imagenes.count() >= MAX_IMAGENES:
        return Response(
            {'error': f'Máximo {MAX_IMAGENES} imágenes por producto.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    archivo = request.FILES.get('imagen')
    if not archivo:
        return Response({'error': 'No se recibió ninguna imagen.'}, status=status.HTTP_400_BAD_REQUEST)

    if archivo.size > 2 * 1024 * 1024:
        return Response({'error': 'La imagen no puede superar 2MB.'}, status=status.HTTP_400_BAD_REQUEST)

    from services.imagen_service import convertir_y_subir
    url = convertir_y_subir(archivo, str(request.user.id), str(producto_id))
    orden = request.data.get('orden', producto.imagenes.count())
    imagen = ImagenProducto.objects.create(producto=producto, url=url, orden=orden)

    return Response({'id': str(imagen.id), 'url': imagen.url, 'orden': imagen.orden}, status=status.HTTP_201_CREATED)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def eliminar_imagen(request, producto_id, imagen_id):
    try:
        producto = Producto.objects.get(id=producto_id, vendedor=request.user)
        imagen   = ImagenProducto.objects.get(id=imagen_id, producto=producto)
    except (Producto.DoesNotExist, ImagenProducto.DoesNotExist):
        return Response({'error': 'No encontrado.'}, status=status.HTTP_404_NOT_FOUND)

    from services.imagen_service import eliminar_imagen_storage
    eliminar_imagen_storage(imagen.url)
    imagen.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def agregar_variante(request, producto_id):
    try:
        producto = Producto.objects.get(id=producto_id, vendedor=request.user)
    except Producto.DoesNotExist:
        return Response({'error': 'Producto no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

    serializer = VarianteSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    serializer.save(producto=producto)
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def eliminar_variante(request, producto_id, variante_id):
    try:
        producto = Producto.objects.get(id=producto_id, vendedor=request.user)
        variante = Variante.objects.get(id=variante_id, producto=producto)
    except (Producto.DoesNotExist, Variante.DoesNotExist):
        return Response({'error': 'No encontrado.'}, status=status.HTTP_404_NOT_FOUND)

    variante.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['GET'])
@permission_classes([AllowAny])
def catalogo_publico(request, codigo_catalogo):
    from usuarios.models import Usuario
    try:
        vendedor = Usuario.objects.get(codigo_catalogo=codigo_catalogo, estado='activo')
    except Usuario.DoesNotExist:
        return Response({'error': 'Catálogo no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

    productos_visibles = Producto.objects.filter(vendedor=vendedor, estado='visible')
    serializer = ProductoSerializer(productos_visibles, many=True)
    return Response({
        'negocio':   vendedor.nombre_negocio,
        'whatsapp':  vendedor.whatsapp,
        'productos': serializer.data,
    })