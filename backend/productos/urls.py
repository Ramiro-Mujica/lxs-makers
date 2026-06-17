from django.urls import path
from . import views

urlpatterns = [
    path('',                                          views.productos,         name='productos'),
    path('<uuid:producto_id>/',                       views.producto_detalle,  name='producto_detalle'),
    path('<uuid:producto_id>/imagenes/',              views.agregar_imagen,    name='agregar_imagen'),
    path('<uuid:producto_id>/imagenes/<uuid:imagen_id>/', views.eliminar_imagen, name='eliminar_imagen'),
    path('<uuid:producto_id>/variantes/',             views.agregar_variante,  name='agregar_variante'),
    path('<uuid:producto_id>/variantes/<uuid:variante_id>/', views.eliminar_variante, name='eliminar_variante'),
    path('catalogo/<str:codigo_catalogo>/',           views.catalogo_publico,  name='catalogo_publico'),
]