from django.urls import path
from . import views

urlpatterns = [
    path('',                                                views.pedidos,             name='pedidos'),
    path('<uuid:pedido_id>/',                               views.pedido_detalle,      name='pedido_detalle'),
    path('<uuid:pedido_id>/detalles/',                      views.agregar_detalle,     name='agregar_detalle'),
    path('<uuid:pedido_id>/detalles/<uuid:detalle_id>/',    views.eliminar_detalle,    name='eliminar_detalle'),
    path('<uuid:pedido_id>/detalles/<uuid:detalle_id>/editar/', views.editar_detalle,  name='editar_detalle'),
    path('seguimiento/<str:codigo>/',                       views.seguimiento_publico, name='seguimiento_publico'),
]