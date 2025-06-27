from django.shortcuts import render
from tienda.models import Producto, Categoria, Material, Cliente, Pedido, DetallePedido
from django.shortcuts import render, redirect
from django.contrib import messages
from django.views.decorators.csrf import csrf_exempt
import json



def catalogo_view(request):
    # Obtener parámetros de filtrado
    tipo_filtro = request.GET.get('tipo', 'Todos')
    material_filtro = request.GET.get('material', 'Todos')
    orden_filtro = request.GET.get('orden', 'ninguno')
    
    # Obtener productos
    productos = Producto.objects.all()
    
    # Aplicar filtros
    if tipo_filtro != 'Todos':
        productos = productos.filter(tipo__nombre=tipo_filtro)
    
    if material_filtro != 'Todos':
        productos = productos.filter(material__nombre=material_filtro)
    
    # Ordenar
    if orden_filtro == 'asc':
        productos = productos.order_by('precio')
    elif orden_filtro == 'desc':
        productos = productos.order_by('-precio')
    
    # Obtener opciones para filtros
    categorias = Categoria.objects.all()
    materiales = Material.objects.all()
    
    context = {
        'productos': productos,
        'categorias': categorias,
        'materiales': materiales,
        'tipo_seleccionado': tipo_filtro,
        'material_seleccionado': material_filtro,
        'orden_seleccionado': orden_filtro,
    }
    return render(request, 'catalogo.html', context)


def producto_detalle_view(request, producto_id):
    try:
        producto = Producto.objects.get(id=producto_id)
        return render(request, 'producto-detalle.html', {'producto': producto})
    except Producto.DoesNotExist:
        return render(request, '404.html', status=404)
    
@csrf_exempt
def procesar_pago(request):
    if request.method == 'POST':
        try:
            # 1. Manejar el cliente (nuevo o existente)
            email = request.POST.get('email')
            nombre = request.POST.get('nombre')
            telefono = request.POST.get('telefono', '')
            direccion = request.POST.get('direccion', '')
            
            # Verificar si el cliente ya existe
            try:
                cliente = Cliente.objects.get(email=email)
                # Actualizar datos del cliente existente si es necesario
                if nombre and cliente.nombre != nombre:
                    cliente.nombre = nombre
                if telefono and cliente.telefono != telefono:
                    cliente.telefono = telefono
                if direccion and cliente.direccion != direccion:
                    cliente.direccion = direccion
                cliente.save()
            except Cliente.DoesNotExist:
                # Crear nuevo cliente si no existe
                cliente = Cliente(
                    nombre=nombre,
                    email=email,
                    telefono=telefono,
                    direccion=direccion
                )
                cliente.save()
            
            # 2. Procesar carrito y crear pedido
            carrito_data = json.loads(request.POST.get('carrito_data', '[]'))
            
            # Calcular total del carrito
            total = sum(float(item['precio']) * int(item['cantidad']) for item in carrito_data)
            
            # Crear pedido
            pedido = Pedido(
                cliente=cliente,
                total=total,
                estado='P'  # Pendiente
            )
            pedido.save() 
            # creador: DIAZ PALOMINO ABDIEL JESUS
            # 3. Crear detalles del pedido
            for item in carrito_data:
                try:
                    producto = Producto.objects.get(id=item['id'])
                    DetallePedido.objects.create(
                        pedido=pedido,
                        producto=producto,
                        cantidad=item['cantidad'],
                        precio_unitario=item['precio']
                    )
                except Producto.DoesNotExist:
                    # Manejar caso donde el producto no existe
                    continue

                
            
            messages.success(request, 'Pago procesado correctamente. ¡Gracias por tu compra!')
            return redirect('index')
        except Exception as e:
            messages.error(request, f'Error al procesar el pago: {str(e)}')
            return redirect('carrito')
    
    return redirect('carrito')    