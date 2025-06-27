from rest_framework import generics
from .models import Color, Material, Pedido, Producto, Categoria
from .serializers import ClienteSerializer, ColorSerializer, MaterialSerializer, PedidoSerializer, ProductoSerializer, CategoriaSerializer, ProductoSerializerActualizar
import django.db.models as models
from django.core.files.storage import default_storage

from rest_framework.response import Response
from rest_framework import status

from datetime import datetime
from django.http import JsonResponse
from .mongo_utils import get_comments_db
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
from .models import Cliente

from bson import ObjectId
from rest_framework.generics import ListAPIView, RetrieveAPIView, CreateAPIView, UpdateAPIView, DestroyAPIView
from rest_framework.pagination import PageNumberPagination

from rest_framework import filters
from django_filters.rest_framework import DjangoFilterBackend
from django.views.decorators.http import require_http_methods
from django.views.decorators.http import require_GET

from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.parsers import JSONParser

from django.db.models import Count, Sum
from datetime import datetime, timedelta
from collections import defaultdict
from django.utils import timezone

from django.db.models import Sum, Count
from datetime import datetime, timedelta
from collections import defaultdict
import pytz
from django.db.models.functions import ExtractYear, ExtractMonth, ExtractDay    




class ProductoCreateAPI(CreateAPIView):
    queryset = Producto.objects.all()
    serializer_class = ProductoSerializer
    parser_classes = [MultiPartParser, FormParser]
    
    def perform_create(self, serializer):
        serializer.save()

class ProductoUpdateAPI(UpdateAPIView):
    queryset = Producto.objects.all()
    serializer_class = ProductoSerializerActualizar
    parser_classes = [JSONParser]
    lookup_field = 'pk'
    
    def update(self, request, *args, **kwargs):
        print("Datos recibidos:", request.data)
        try:
            instance = self.get_object()
            print("Instancia actual:", instance)
            
            # Convertir nombres de materiales/colores a IDs si es necesario
            data = request.data.copy()
            
            serializer = self.get_serializer(instance, data=data, partial=True)
            serializer.is_valid(raise_exception=True)
            
            self.perform_update(serializer)
            return Response(serializer.data)
            
        except Exception as e:
            print("Error durante la actualización:", str(e))
            return Response({
                'error': str(e),
                'received_data': request.data,
                'suggestion': 'Asegúrese de enviar IDs válidos para tipo, material y color'
            }, status=400)

class ProductoDeleteAPI(DestroyAPIView):
    queryset = Producto.objects.all()
    serializer_class = ProductoSerializer
    lookup_field = 'pk'
    
    def perform_destroy(self, instance):
        if instance.imagen:
            instance.imagen.delete()
        instance.delete()        

class MaterialListAPI(ListAPIView):
    queryset = Material.objects.all()
    serializer_class = MaterialSerializer

class ColorListAPI(ListAPIView):
    queryset = Color.objects.all()
    serializer_class = ColorSerializer        

class ProductoBusquedaAPI(generics.ListAPIView):
    serializer_class = ProductoSerializer
    
    def get_queryset(self):
        query = self.request.query_params.get('q', '')
        return Producto.objects.filter(
            models.Q(nombre__icontains=query) |
            models.Q(descripcion__icontains=query) |
            models.Q(tipo__nombre__icontains=query)
        )[:10]  

class CategoriaListAPI(generics.ListAPIView):
    queryset = Categoria.objects.all()
    serializer_class = CategoriaSerializer

class ProductoDetalleAPI(generics.RetrieveAPIView):
    queryset = Producto.objects.all()
    serializer_class = ProductoSerializer
    lookup_field = 'pk'

    def retrieve(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            serializer = self.get_serializer(instance)
            return Response(serializer.data)
        except Producto.DoesNotExist:
            return Response(
                {"error": "Producto no encontrado"},
                status=status.HTTP_404_NOT_FOUND
            )
        
@csrf_exempt
def agregar_comentario(request, producto_id):
    if request.method == 'POST':
        try:
            nombre = request.POST.get('nombre')
            telefono = request.POST.get('telefono')
            comentario = request.POST.get('comentario')
            
            # Verificar si el cliente existe en PostgreSQL
            cliente = Cliente.objects.filter(telefono=telefono).first()

            if not cliente:
                return JsonResponse({
                    'success': False,
                    'message': 'Debes ser un cliente registrado (haber realizado una compra) para poder comentar'
                }, status=403)

            
            
            # Conectar a MongoDB
            db = get_comments_db()
            comments_collection = db.product_comments
            
            # Crear o actualizar el documento
            comentario_data = {
                "texto": comentario,
                "fecha": datetime.now()
            }
            
            update_result = comments_collection.update_one(
                {
                    "id_producto": producto_id,
                    "id_cliente": cliente.id 
                },
                {
                    "$setOnInsert": {
                        "preferencias": {
                            "idioma": "ES",
                            "metodo_pago": "Tarjeta de credito",
                            "notificaciones": True
                        }
                    },
                    "$push": {
                        "comentarios": comentario_data
                    }
                },
                upsert=True
            )
            
            return JsonResponse({
                'success': True,
                'message': 'Comentario agregado correctamente'
            })
            
        except Exception as e:
            return JsonResponse({
                'success': False,
                'message': str(e)
            }, status=500)
    
    return JsonResponse({'success': False, 'message': 'Método no permitido'}, status=405)

# creador: DIAZ PALOMINO ABDIEL JESUS
def obtener_comentarios(request, producto_id):
    try:
        db = get_comments_db()
        comments = list(db.product_comments.find(
            {"id_producto": producto_id},
            {"_id": 0, "comentarios": 1, "id_cliente": 1}
        ))
        
        # Obtener nombres de clientes desde PostgreSQL
        cliente_ids = [c['id_cliente'] for c in comments if c.get('id_cliente')]
        clientes = {c.id: {'nombre': c.nombre, 'id': c.id} for c in Cliente.objects.filter(id__in=cliente_ids)}
        
        # Formatear respuesta
        formatted_comments = []
        for doc in comments:
            for comentario in doc.get('comentarios', []):
                cliente_info = clientes.get(doc['id_cliente'], {'nombre': 'Anónimo', 'id': None})
                formatted_comments.append({
                    'producto_id': producto_id,
                    'producto_nombre': Producto.objects.get(pk=producto_id).nombre if Producto.objects.filter(pk=producto_id).exists() else 'Producto eliminado',
                    'cliente': cliente_info['nombre'],
                    'cliente_id': cliente_info['id'],
                    'texto': comentario['texto'],
                    'fecha': comentario['fecha'].strftime('%d/%m/%Y %H:%M'),
                    'id': str(comentario.get('_id', ''))  # Incluir el ID del comentario
                })
        
        return JsonResponse({'comentarios': formatted_comments})
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=500)
    

# -----------ADMINISTRACION---------------
def comentarios_por_cliente(request, cliente_id):
    try:
        db = get_comments_db()
        
        comentarios = list(db.product_comments.find(
            {"id_cliente": cliente_id},
            {"_id": 0, "comentarios": 1, "id_producto": 1}
        ))
        
        productos_ids = [c['id_producto'] for c in comentarios]
        productos = {p.id: p.nombre for p in Producto.objects.filter(id__in=productos_ids)}
        
        formatted_comments = []
        for doc in comentarios:
            for comentario in doc.get('comentarios', []):
                formatted_comments.append({
                    'producto_id': doc['id_producto'],
                    'producto_nombre': productos.get(doc['id_producto'], 'Producto eliminado'),
                    'texto': comentario['texto'],
                    'fecha': comentario['fecha'].strftime('%d/%m/%Y %H:%M')
                })
        
        return JsonResponse({'comentarios': formatted_comments})
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=500)

def cliente_detalle(request, pk):
    try:
        cliente = Cliente.objects.get(pk=pk)
        serializer = ClienteSerializer(cliente)
        return JsonResponse(serializer.data)
    except Cliente.DoesNotExist:
        return JsonResponse({'error': 'Cliente no encontrado'}, status=404)




def estadisticas_generales(request):
    now = timezone.now()
    current_year = now.year
    current_month = now.month
    
    stats = {
        'total_clientes': Cliente.objects.count(),
        'total_pedidos': Pedido.objects.count(),
        'total_productos': Producto.objects.count(),
        'total_comentarios': 0,
        'ventas_mensuales': {'dias': [], 'ventas_diarias': []},
        'ventas_anuales': {'meses': [], 'ventas_mensuales': []},
        'productos_mas_vendidos': {'nombres': [], 'cantidades': []}
    }

    # Estadísticas de comentarios desde MongoDB
    try:
        db = get_comments_db()
        stats['total_comentarios'] = db.product_comments.aggregate([
            {"$unwind": "$comentarios"},
            {"$count": "total"}
        ]).next().get('total', 0)
    except Exception as e:
        print(f"Error obteniendo comentarios: {e}")

    # Ventas por día del mes actual
    ventas_diarias = Pedido.objects.filter(
        fecha__year=current_year,
        fecha__month=current_month
    ).annotate(
        day=ExtractDay('fecha')
    ).values('day').annotate(
        total_ventas=Sum('total')
    ).order_by('day')

    for venta in ventas_diarias:
        stats['ventas_mensuales']['dias'].append(venta['day'])
        stats['ventas_mensuales']['ventas_diarias'].append(float(venta['total_ventas']))

    # Ventas por mes del año actual
    ventas_mensuales = Pedido.objects.filter(
        fecha__year=current_year
    ).annotate(
        month=ExtractMonth('fecha')
    ).values('month').annotate(
        total_ventas=Sum('total')
    ).order_by('month')

    for venta in ventas_mensuales:
        stats['ventas_anuales']['meses'].append(venta['month'])
        stats['ventas_anuales']['ventas_mensuales'].append(float(venta['total_ventas']))

    # Productos más vendidos
    productos = Producto.objects.annotate(
        total_vendido=Sum('detallepedido__cantidad')
    ).exclude(total_vendido__isnull=True).order_by('-total_vendido')[:5]

    stats['productos_mas_vendidos']['nombres'] = [p.nombre for p in productos]
    stats['productos_mas_vendidos']['cantidades'] = [p.total_vendido or 0 for p in productos]

    return JsonResponse(stats)

class PedidoListAPI(ListAPIView):
    queryset = Pedido.objects.all().order_by('-fecha')
    serializer_class = PedidoSerializer
    pagination_class = None  
    
    def get(self, request, *args, **kwargs):
        limit = request.query_params.get('limit')
        if limit:
            queryset = self.get_queryset()[:int(limit)]
            serializer = self.get_serializer(queryset, many=True)
            return Response({
                'results': serializer.data,  
                'count': len(serializer.data)
            })
        return super().get(request, *args, **kwargs)




class ClientePagination(PageNumberPagination):
    page_size = 10  
    page_size_query_param = 'page_size'
    max_page_size = 100

    def get_paginated_response(self, data):
        return Response({
            'count': self.page.paginator.count,
            'next': self.get_next_link(),
            'previous': self.get_previous_link(),
            'results': data
        })

class ClienteListAPI(generics.ListAPIView):
    queryset = Cliente.objects.all().order_by('-fecha_registro')
    serializer_class = ClienteSerializer
    pagination_class = ClientePagination  
    
    # For the dashboard count (unpaginated)
    def get(self, request, *args, **kwargs):
        if request.query_params.get('dashboard') == 'true':
            queryset = self.get_queryset()
            serializer = self.get_serializer(queryset, many=True)
            return Response(serializer.data)
        return super().get(request, *args, **kwargs)

class PedidoDetalleAPI(RetrieveAPIView):
    queryset = Pedido.objects.all()
    serializer_class = PedidoSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['include_detalles'] = True
        return context   

class ProductoListAPI(generics.ListAPIView):
    queryset = Producto.objects.all().select_related('tipo', 'material', 'color')
    serializer_class = ProductoSerializer
    pagination_class = PageNumberPagination  
    page_size = 10  

    def get_queryset(self):
        queryset = super().get_queryset()
        search = self.request.query_params.get('search', '').strip()
        
        if search:
            queryset = queryset.filter(
                models.Q(nombre__icontains=search) |
                models.Q(descripcion__icontains=search) |
                models.Q(tipo__nombre__icontains=search) |
                models.Q(material__nombre__icontains=search) |
                models.Q(color__nombre__icontains=search)
            ).distinct()
        
        return queryset.order_by('id')  

class ClienteDetalleAPI(RetrieveAPIView):
    queryset = Cliente.objects.all()
    serializer_class = ClienteSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['include_pedidos'] = True
        context['include_comentarios'] = True
        context['cliente_id'] = self.kwargs['pk']
        return context
    
class PedidoBusquedaAPI(ListAPIView):
    queryset = Pedido.objects.all()
    serializer_class = PedidoSerializer
    filter_backends = [filters.SearchFilter, DjangoFilterBackend]
    search_fields = ['cliente__nombre'] 


def buscar_comentarios(request):
    search_term = request.GET.get('search', '').strip().lower()
    
    try:
        db = get_comments_db()
        
        clientes_coincidentes = Cliente.objects.filter(
            models.Q(nombre__icontains=search_term) |
            models.Q(email__icontains=search_term)
        ).values_list('id', flat=True)
        
        cliente_ids = list(clientes_coincidentes)
        
        # Pipeline de agregación
        pipeline = [
            {"$unwind": "$comentarios"},
            {"$sort": {"comentarios.fecha": -1}},
            
        ]
        
        if search_term:
            or_conditions = [
                {"comentarios.texto": {"$regex": search_term, "$options": "i"}},
                {"id_cliente": {"$in": cliente_ids}} if cliente_ids else None
            ]
            
            # Filtrar condiciones None
            or_conditions = [cond for cond in or_conditions if cond is not None]
            
            if or_conditions:
                pipeline.append({
                    "$match": {
                        "$or": or_conditions
                    }
                })

        pipeline.extend([
            {"$limit": 50},
            {"$project": {
                "_id": 0,
                "documento_id": {"$toString": "$_id"},  
                "id_producto": 1,
                "id_cliente": 1,
                "texto": "$comentarios.texto",
                "fecha": "$comentarios.fecha",
                
            }}
        ])
        
        comentarios = list(db.product_comments.aggregate(pipeline))
        
        product_ids = list({c['id_producto'] for c in comentarios})
        productos = {p.id: p.nombre for p in Producto.objects.filter(id__in=product_ids)}
        
        cliente_ids = list({c['id_cliente'] for c in comentarios if c.get('id_cliente')})
        clientes = {c.id: {'nombre': c.nombre, 'id': c.id} for c in Cliente.objects.filter(id__in=cliente_ids)}
        
        formatted_comments = []
        print(comentarios)
        for comentario in comentarios:
            cliente_info = clientes.get(comentario.get('id_cliente'), {'nombre': 'Anónimo', 'id': None})
            formatted_comments.append({
                'producto_id': comentario['id_producto'],
                'producto_nombre': productos.get(comentario['id_producto'], 'Producto eliminado'),
                'cliente': cliente_info['nombre'],
                'cliente_id': cliente_info['id'],
                'texto': comentario['texto'],
                'fecha': comentario['fecha'].strftime('%d/%m/%Y %H:%M') if 'fecha' in comentario else 'N/A',
                'id': comentario.get('documento_id', '')
            })
        
        return JsonResponse({'comentarios': formatted_comments})
        
    except Exception as e:
        print(f"Error en buscar_comentarios: {str(e)}")
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=500)
    

def comentarios_generales(request):
    try:
        db = get_comments_db()
        comentarios = list(db.product_comments.aggregate([
            {"$unwind": "$comentarios"},
            {"$sort": {"comentarios.fecha": -1}},
            {"$limit": 10},
            {"$project": {
                "_id": 0,
                "comentario_id": {"$toString": "$_id"},  
                "id_producto": 1,
                "id_cliente": 1,
                "texto": "$comentarios.texto",
                "fecha": "$comentarios.fecha",
                
            }}
        ]))
        
        cliente_ids = [c['id_cliente'] for c in comentarios if c.get('id_cliente')]
        product_ids = [c['id_producto'] for c in comentarios]
        
        clientes = {c.id: {'nombre': c.nombre, 'id': c.id} for c in Cliente.objects.filter(id__in=cliente_ids)}
        productos = {p.id: p.nombre for p in Producto.objects.filter(id__in=product_ids)}

        formatted_comments = []
        for comentario in comentarios:
            cliente_info = clientes.get(comentario.get('id_cliente'), {'nombre': 'Anónimo', 'id': None})
            formatted_comments.append({
                'producto_id': comentario['id_producto'],
                'producto_nombre': productos.get(comentario['id_producto'], 'Producto eliminado'),
                'cliente': cliente_info['nombre'],
                'cliente_id': cliente_info['id'],
                'texto': comentario['texto'],
                'fecha': comentario['fecha'].strftime('%d/%m/%Y %H:%M') if 'fecha' in comentario else 'N/A',
                'id': comentario.get('comentario_id', '')
            })
        
        return JsonResponse({'comentarios': formatted_comments})
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=500)
    


@csrf_exempt
def eliminar_comentario(request, comentario_id):
    print("HOLA")
    if request.method != 'DELETE':
        return JsonResponse({
            'success': False, 
            'message': 'Método no permitido'
        }, status=405)
    
    try:
        # Validar que el ID sea un ObjectId válido
        ObjectId(comentario_id)
    except:
        return JsonResponse({
            'success': False,
            'message': 'ID de comentario inválido'
        }, status=400)
    
    try:
        db = get_comments_db()
        result = db.product_comments.delete_one({"_id": ObjectId(comentario_id)})
        
        
        return JsonResponse({
                'success': True,
                'message': 'Comentario eliminado'
        })
        
            
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=500)


@csrf_exempt
def producto_detail(request, pk):
    try:
        producto = Producto.objects.get(pk=pk)
    except Producto.DoesNotExist:
        return JsonResponse({'error': 'Producto no encontrado'}, status=404)

    if request.method == 'GET':
        # Obtener detalles del producto
        data = {
            'id': producto.id,
            'nombre': producto.nombre,
            'descripcion': producto.descripcion,
            'precio': str(producto.precio),
            'stock': producto.stock,
            'tipo': {
                'id': producto.tipo.id,
                'nombre': producto.tipo.nombre
            },
            'material': producto.material,
            'dimensiones': producto.dimensiones,
            'imagen': request.build_absolute_uri(producto.imagen.url) if producto.imagen else None
        }
        return JsonResponse(data)

    elif request.method == 'PUT':
        # Actualizar producto
        try:
            data = request.POST
            files = request.FILES
            
            producto.nombre = data.get('nombre', producto.nombre)
            producto.descripcion = data.get('descripcion', producto.descripcion)
            producto.precio = data.get('precio', producto.precio)
            producto.stock = data.get('stock', producto.stock)
            
            tipo_id = data.get('tipo')
            if tipo_id:
                producto.tipo = Categoria.objects.get(pk=tipo_id)
            
            producto.material = data.get('material', producto.material)
            producto.dimensiones = data.get('dimensiones', producto.dimensiones)
            
            if 'imagen' in files:
                if producto.imagen:
                    default_storage.delete(producto.imagen.path)
                producto.imagen = files['imagen']
            
            producto.save()
            
            return JsonResponse({
                'success': True,
                'message': 'Producto actualizado correctamente',
                'producto': {
                    'id': producto.id,
                    'nombre': producto.nombre,
                    'precio': str(producto.precio),
                    'stock': producto.stock,
                    'tipo': producto.tipo.nombre
                }
            })
            
        except Exception as e:
            return JsonResponse({
                'success': False,
                'message': str(e)
            }, status=400)

    else:
        return JsonResponse({'error': 'Método no permitido'}, status=405)
    

def tipos_producto_list(request):
    tipos = Categoria.objects.all().values('id', 'nombre')
    return JsonResponse(list(tipos), safe=False)
















