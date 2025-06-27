"""
URL configuration for proyecto_final_backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import include, path
from django.views.generic import TemplateView

from . import views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('tienda.urls')),  # Corregido: usa path con 'api/' e include
    # Rutas para tus páginas HTML
    path('', TemplateView.as_view(template_name='index.html'), name='index'),
    path('catalogo/', views.catalogo_view, name='catalogo'),
    path('resultados/', TemplateView.as_view(template_name='resultados.html'), name='resultados'),
    path('administration/', TemplateView.as_view(template_name='administracion.html'), name='administracion'),
    path('carrito/', TemplateView.as_view(template_name='carrito.html'), name='carrito'),
    path('contacto/', TemplateView.as_view(template_name='contacto.html'), name='contacto'),
    path('procesar-pago/', views.procesar_pago, name='procesar_pago'),
    path('producto/<int:producto_id>/', views.producto_detalle_view, name='producto_detalle')

]
