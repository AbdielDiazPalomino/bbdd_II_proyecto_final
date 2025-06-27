from rest_framework import serializers
from .models import Cliente, Color, DetallePedido, Material, Pedido, Producto, Categoria
from .mongo_utils import get_comments_db


class ProductoSerializer(serializers.ModelSerializer):
    tipo = serializers.StringRelatedField()
    material = serializers.StringRelatedField()
    color = serializers.StringRelatedField()
    caracteristicas = serializers.SerializerMethodField()
    precio = serializers.DecimalField(
        max_digits=10, 
        decimal_places=2,
        coerce_to_string=False  # ¡Esto es importante!
    )
    
    class Meta:
        model = Producto
        fields = [
            'id', 'nombre', 'descripcion', 'precio', 'imagen', 
            'tipo', 'material', 'dimensiones', 'color', 'stock',
            'caracteristicas'
        ]
    
    def get_caracteristicas(self, obj):
        return [c.strip() for c in obj.caracteristicas.split(',')]

class CategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = ['id', 'nombre']

class ProductoSerializer(serializers.ModelSerializer):
    tipo = serializers.StringRelatedField()
    material = serializers.StringRelatedField()
    
    class Meta:
        model = Producto
        fields = [
            'id', 'nombre', 'descripcion', 'precio', 
            'imagen', 'stock', 'tipo', 'material',
            'dimensiones', 'color'
        ]   

class ProductoSerializerActualizar(serializers.ModelSerializer):
    tipo = serializers.PrimaryKeyRelatedField(queryset=Categoria.objects.all())
    material = serializers.PrimaryKeyRelatedField(queryset=Material.objects.all())
    color = serializers.PrimaryKeyRelatedField(queryset=Color.objects.all())
    
    class Meta:
        model = Producto
        fields = [
            'id', 'nombre', 'descripcion', 'precio', 'stock',
            'tipo', 'material', 'dimensiones', 'imagen', 'color'
        ]
        extra_kwargs = {
            'imagen': {'required': False, 'allow_null': True}
        }

class MaterialSerializer(serializers.ModelSerializer):
    class Meta:
        model = Material
        fields = ['id', 'nombre']

class ColorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Color
        fields = ['id', 'nombre']        

class ClienteSerializer(serializers.ModelSerializer):

    pedidos = serializers.SerializerMethodField()
    comentarios = serializers.SerializerMethodField()

    class Meta:
        model = Cliente
        fields = '__all__'      
    def get_pedidos(self, obj):
        if 'include_pedidos' in self.context and self.context['include_pedidos']:
            cliente_id = self.context.get('cliente_id', obj.id)
            pedidos = Pedido.objects.filter(cliente_id=cliente_id).order_by('-fecha')[:10]
            return PedidoSerializer(pedidos, many=True).data
        return None

    def get_comentarios(self, obj):
        if 'include_comentarios' in self.context and self.context['include_comentarios']:
            cliente_id = self.context.get('cliente_id', obj.id)
            db = get_comments_db()
            comentarios_collection = db.product_comments
            print(f"Coneccion: {comentarios_collection.name}")
            # Buscar todos los documentos donde id_cliente coincide
            documentos = comentarios_collection.find({"id_cliente": cliente_id}) 
            
            comentarios_list = []
            for doc in documentos:
                producto_nombre = self.get_producto_nombre(doc['id_producto'])
                for comentario in doc.get('comentarios', []):
                    comentarios_list.append({
                        'producto_id': doc['id_producto'],
                        'producto_nombre': producto_nombre,
                        'texto': comentario['texto'],
                        'fecha': comentario['fecha'],
                        
                    })

            return comentarios_list
        return None   
    
    def get_producto_nombre(self, producto_id):
        from .models import Producto  # Importamos aquí para evitar circular imports
        try:
            producto = Producto.objects.get(id=producto_id)
            return producto.nombre
        except Producto.DoesNotExist:
            print(f"Producto con ID {producto_id} no encontrado")
            return f"Producto ID: {producto_id}"

class DetallePedidoSerializer(serializers.ModelSerializer):
    producto = ProductoSerializer()
    
    class Meta:
        model = DetallePedido
        fields = '__all__'        

class PedidoSerializer(serializers.ModelSerializer):
    cliente = ClienteSerializer()  
    detalles = DetallePedidoSerializer(many=True, read_only=True)
    total = serializers.FloatField()
    
    class Meta:
        model = Pedido
        fields = '__all__'     


