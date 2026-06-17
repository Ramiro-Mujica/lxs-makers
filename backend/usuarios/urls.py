from django.urls import path
from . import views

urlpatterns = [
    path('registro/',                            views.registro,                 name='registro'),
    path('login/',                               views.login,                    name='login'),
    path('perfil/',                              views.perfil,                   name='perfil'),
    path('vendedores/',                          views.listar_vendedores,        name='listar_vendedores'),
    path('vendedores/<uuid:usuario_id>/estado/', views.cambiar_estado_vendedor,  name='cambiar_estado_vendedor'),
]