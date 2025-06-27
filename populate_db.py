import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'proyecto_final_backend.settings')
django.setup()

from tienda.models import Producto, Categoria, Material, Color

# Crear categorías
categoria_puertas = Categoria.objects.get_or_create(nombre="Puertas")[0]
categoria_portones = Categoria.objects.get_or_create(nombre="Portones")[0]
categoria_rejas = Categoria.objects.get_or_create(nombre="Rejas")[0]
categoria_estructuras = Categoria.objects.get_or_create(nombre="Estructuras")[0]
categoria_carretas = Categoria.objects.get_or_create(nombre="Carretas")[0]

# Crear materiales
material_acero = Material.objects.get_or_create(nombre="Acero galvanizado")[0]
material_hierro = Material.objects.get_or_create(nombre="Hierro forjado")[0]
material_madera_acero = Material.objects.get_or_create(nombre="Madera y acero")[0]
material_acero_estructural = Material.objects.get_or_create(nombre="Acero estructural")[0]
material_acero_solido = Material.objects.get_or_create(nombre="Acero")[0]  # Para rejas

# Crear colores
color_negro = Color.objects.get_or_create(nombre="Negro")[0]
color_gris = Color.objects.get_or_create(nombre="Gris oscuro")[0]
color_azul = Color.objects.get_or_create(nombre="Azul")[0]
color_blanco = Color.objects.get_or_create(nombre="Blanco")[0]
color_madera = Color.objects.get_or_create(nombre="Madera natural y negro")[0]

# Lista de productos basada en productos.json
productos = [
    {
        "nombre": "Puerta Principal de Metal Moderna",
        "descripcion": "Puerta de entrada de diseño contemporáneo, fabricada en acero galvanizado con acabado en pintura electrostática negra. Ideal para viviendas modernas que buscan seguridad y estilo.",
        "precio": 1200.00,
        "imagen": "https://cdn.pixabay.com/photo/2016/11/29/06/15/door-1867093_1280.jpg",
        "tipo": categoria_puertas,
        "material": material_acero,
        "dimensiones": "210x90 cm",
        "color": color_negro,
        "stock": 10,
        "caracteristicas": "Diseño moderno,Alta resistencia a la corrosión,Incluye cerradura de seguridad"
    },
    {
        "nombre": "Portón Principal de Metal Doble Hoja",
        "descripcion": "Portón de dos hojas fabricado en hierro forjado, con diseño clásico y robusto. Perfecto para entradas principales de residencias o propiedades rurales.",
        "precio": 2500.00,
        "imagen": "https://cdn.pixabay.com/photo/2017/08/06/00/07/gate-2584501_1280.jpg",
        "tipo": categoria_portones,
        "material": material_hierro,
        "dimensiones": "300x200 cm",
        "color": color_negro,
        "stock": 5,
        "caracteristicas": "Diseño clásico,Sistema de apertura manual,Preparado para automatización"
    },
    {
        "nombre": "Puerta de Metal y Madera",
        "descripcion": "Puerta combinada de metal y madera, ofreciendo la calidez de la madera con la seguridad del metal. Acabado en madera natural y marco metálico negro.",
        "precio": 1800.00,
        "imagen": "https://cdn.pixabay.com/photo/2016/11/29/06/15/door-1867093_1280.jpg",
        "tipo": categoria_puertas,
        "material": material_madera_acero,
        "dimensiones": "210x90 cm",
        "color": color_madera,
        "stock": 8,
        "caracteristicas": "Combinación de materiales,Aislante térmico y acústico,Incluye cerradura de seguridad"
    },
    {
        "nombre": "Reja de Seguridad para Puerta",
        "descripcion": "Reja metálica de seguridad para puertas principales, fabricada en acero sólido con diseño decorativo. Proporciona protección adicional sin comprometer la estética.",
        "precio": 600.00,
        "imagen": "https://cdn.pixabay.com/photo/2017/08/06/00/07/gate-2584501_1280.jpg",
        "tipo": categoria_rejas,
        "material": material_acero_solido,
        "dimensiones": "210x90 cm",
        "color": color_negro,
        "stock": 15,
        "caracteristicas": "Diseño decorativo,Fácil instalación,Resistente a la corrosión"
    },
    {
        "nombre": "Estructura Metálica para Techos",
        "descripcion": "Estructura metálica prefabricada para techos de naves industriales o almacenes. Fabricada en acero estructural de alta resistencia.",
        "precio": 3500.00,
        "imagen": "https://cdn.pixabay.com/photo/2015/07/17/22/43/metal-849270_1280.jpg",
        "tipo": categoria_estructuras,
        "material": material_acero_estructural,
        "dimensiones": "A medida",
        "color": color_gris,
        "stock": 3,
        "caracteristicas": "Alta resistencia estructural,Fácil montaje,Personalizable según requerimientos"
    },
    {
        "nombre": "Carreta Metálica de Carga",
        "descripcion": "Carreta metálica robusta para transporte de materiales en obras o almacenes. Equipado con ruedas neumáticas y manijas ergonómicas.",
        "precio": 750.00,
        "imagen": "https://cdn.pixabay.com/photo/2017/08/06/00/07/gate-2584501_1280.jpg",
        "tipo": categoria_carretas,
        "material": material_acero_solido,
        "dimensiones": "150x80x60 cm",
        "color": color_azul,
        "stock": 12,
        "caracteristicas": "Capacidad de carga de 500 kg,Ruedas resistentes,Diseño ergonómico"
    },
    {
        "nombre": "Puerta de Metal con Diseño Clásico",
        "descripcion": "Puerta metálica con diseño clásico ornamental, ideal para entradas principales que buscan un toque elegante y tradicional.",
        "precio": 1300.00,
        "imagen": "https://cdn.pixabay.com/photo/2016/11/29/06/15/door-1867093_1280.jpg",
        "tipo": categoria_puertas,
        "material": material_hierro,
        "dimensiones": "210x90 cm",
        "color": color_negro,
        "stock": 7,
        "caracteristicas": "Diseño ornamental,Durabilidad garantizada,Incluye cerradura de seguridad"
    },
    {
        "nombre": "Reja Metálica para Ventana",
        "descripcion": "Reja de seguridad para ventanas, fabricada en acero con diseño minimalista. Proporciona protección sin obstruir la vista.",
        "precio": 400.00,
        "imagen": "https://cdn.pixabay.com/photo/2017/08/06/00/07/gate-2584501_1280.jpg",
        "tipo": categoria_rejas,
        "material": material_acero_solido,
        "dimensiones": "120x100 cm",
        "color": color_blanco,
        "stock": 20,
        "caracteristicas": "Fácil instalación,Diseño discreto,Resistente a la intemperie"
    },
    {
        "nombre": "Puerta de Metal de Doble Hoja",
        "descripcion": "Puerta metálica de doble hoja, ideal para entradas amplias. Fabricada en acero con acabado en pintura electrostática.",
        "precio": 2200.00,
        "imagen": "https://cdn.pixabay.com/photo/2017/08/06/00/07/gate-2584501_1280.jpg",
        "tipo": categoria_puertas,
        "material": material_acero,
        "dimensiones": "240x200 cm",
        "color": color_gris,
        "stock": 6,
        "caracteristicas": "Apertura amplia,Sistema de cierre seguro,Diseño moderno"
    },
    {
        "nombre": "Reja de Seguridad para Patio",
        "descripcion": "Reja metálica para patios, fabricada en acero con diseño robusto. Proporciona seguridad y delimitación de espacios exteriores.",
        "precio": 800.00,
        "imagen": "https://cdn.pixabay.com/photo/2017/08/06/00/07/gate-2584501_1280.jpg",
        "tipo": categoria_rejas,
        "material": material_acero_solido,
        "dimensiones": "200x150 cm",
        "color": color_negro,  # Asignamos negro por defecto
        "stock": 10,
        "caracteristicas": "Fácil instalación,Resistente a la intemperie,Diseño robusto"
    }
]

# Crear productos
for producto_data in productos:
    Producto.objects.get_or_create(
        nombre=producto_data["nombre"],
        defaults=producto_data
    )

print("Base de datos poblada exitosamente con 10 productos")