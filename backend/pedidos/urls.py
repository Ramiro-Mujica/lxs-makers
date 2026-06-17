from django.urls import path
from . import views
from . import estadisticas_views

urlpatterns = [
    path('',                                                    views.pedidos,                        name='pedidos'),
    path('<uuid:pedido_id>/',                                   views.pedido_detalle,                 name='pedido_detalle'),
    path('<uuid:pedido_id>/detalles/',                          views.agregar_detalle,                name='agregar_detalle'),
    path('<uuid:pedido_id>/detalles/<uuid:detalle_id>/',        views.eliminar_detalle,               name='eliminar_detalle'),
    path('<uuid:pedido_id>/detalles/<uuid:detalle_id>/editar/', views.editar_detalle,                 name='editar_detalle'),
    path('seguimiento/<str:codigo>/',                           views.seguimiento_publico,            name='seguimiento_publico'),
    path('estadisticas/',                                       estadisticas_views.estadisticas_vendedor, name='estadisticas_vendedor'),
    path('estadisticas/reiniciar/',                             estadisticas_views.reiniciar_estadisticas, name='reiniciar_estadisticas'),
    path('estadisticas/admin/',                                 estadisticas_views.estadisticas_admin,    name='estadisticas_admin'),
    path('estadisticas/admin/reiniciar/',                       estadisticas_views.reiniciar_contador_admin, name='reiniciar_contador_admin'),
]