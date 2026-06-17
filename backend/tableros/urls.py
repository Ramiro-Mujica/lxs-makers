from django.urls import path
from . import views

urlpatterns = [
    path('',                                              views.tableros,        name='tableros'),
    path('<uuid:tablero_id>/',                            views.tablero_detalle, name='tablero_detalle'),
    path('<uuid:tablero_id>/tareas/',                     views.agregar_tarea,   name='agregar_tarea'),
    path('<uuid:tablero_id>/tareas/<uuid:tarea_id>/',     views.tarea_detalle,   name='tarea_detalle'),
]
