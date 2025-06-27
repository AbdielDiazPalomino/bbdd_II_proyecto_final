from django.urls import path
from .views import ClienteDetalleAPI, ClienteListAPI, PedidoBusquedaAPI, PedidoDetalleAPI, PedidoListAPI, ProductoBusquedaAPI, ProductoCreateAPI, ProductoDeleteAPI, ProductoDetalleAPI, CategoriaListAPI, ProductoListAPI, ProductoUpdateAPI
from . import views

urlpatterns = [
    path('comentarios/<str:comentario_id>/eliminar/', views.eliminar_comentario, name='eliminar-comentario'),
    path('productos/<int:pk>/actualizar/', ProductoUpdateAPI.as_view(), name='producto-update'),
    path('tipos-producto/', views.tipos_producto_list, name='tipos-producto-list'),    
    path('comentarios/buscar/', views.buscar_comentarios, name='comentario-buscar'),
    path('productos/<int:pk>/eliminar/', ProductoDeleteAPI.as_view(), name='producto-delete'),  
    path('productos/buscar/', ProductoBusquedaAPI.as_view(), name='producto-buscar'),
    
    path('productos/crear/', ProductoCreateAPI.as_view(), name='producto-create'),
    path('productos/<int:pk>/', ProductoDetalleAPI.as_view(), name='producto-detalle'),
    path('productos/<int:producto_id>/comentarios/', views.obtener_comentarios, name='obtener_comentarios'),
    path('productos/<int:producto_id>/comentarios/agregar/', views.agregar_comentario, name='agregar_comentario'),
    
    path('categorias/', CategoriaListAPI.as_view(), name='categoria-list'),

    path('productos/comentarios/', views.comentarios_generales, name='comentarios-generales'), 
    # Pedidos
    path('pedidos/', PedidoListAPI.as_view(), name='pedido-list'),  # Nueva ruta
    
    # Clientes
    path('clientes/', ClienteListAPI.as_view(), name='cliente-list'),  # Nueva ruta

    path('clientes/<int:cliente_id>/comentarios/', views.comentarios_por_cliente, name='comentarios_por_cliente'),
    
    # Categorías
    path('categorias/', CategoriaListAPI.as_view(), name='categoria-list'),

    # Estadísticas
    path('estadisticas/', views.estadisticas_generales, name='estadisticas'),


    path('productos/', ProductoListAPI.as_view(), name='producto-list'),
    
    

    path('pedidos/<int:pk>/', PedidoDetalleAPI.as_view(), name='pedido-detalle'),

    path('clientes/<int:pk>/', ClienteDetalleAPI.as_view(), name='cliente-detalle'),

    path('pedidos/buscar/', PedidoBusquedaAPI.as_view(), name='pedido-buscar'),

    path('api/productos/<int:pk>/', views.producto_detail, name='producto-detail'),

    path('materiales/', views.MaterialListAPI.as_view(), name='material-list'),
    path('colores/', views.ColorListAPI.as_view(), name='color-list'),
    

    

] 