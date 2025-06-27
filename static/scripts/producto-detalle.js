document.addEventListener("DOMContentLoaded", async () => {
    // Obtener el ID del producto de la URL
    const pathSegments = window.location.pathname.split('/');
    const productId = pathSegments[pathSegments.length - 2]; // Obtener ID de la ruta
    
    if (!productId) {
        
        window.location.href = "/catalogo/";
        return;
    }

    try {
        // Obtener datos del producto desde la API
        const response = await fetch(`/api/productos/${productId}/`);
        if (!response.ok) {
            throw new Error('Producto no encontrado');
        }
        const producto = await response.json();
        
        // Renderizar el producto
        renderizarProducto(producto);
        console.log('Producto cargado:', producto);
    } catch (error) {
        console.error('Error:', error);
        printf("No se encontró el ID del producto en la URL");
        window.location.href = "/catalogo/";
    }
});

function renderizarProducto(producto) {
    const contenedor = document.getElementById('producto-detalle');
    
    // Ajustar para usar los datos de la API de Django
    contenedor.innerHTML = `
        <div class="galeria-producto">
            <div class="imagen-container">
                <img src="${producto.imagen}" alt="${producto.nombre}" class="imagen-principal">
            </div>
        </div>
        <div class="info-producto">
            <h1>${producto.nombre}</h1>
            <div class="precio-producto">S/ ${parseFloat(producto.precio).toFixed(2)}</div>
            <div class="descripcion-producto">${producto.descripcion}</div>
            
            <div class="opciones-producto">
                <!-- ... otros detalles ... -->
            </div>
            
            <button class="btn-agregar-carrito" onclick="addToCart(${JSON.stringify(producto).replace(/"/g, '&quot;')})">
                <i class="fas fa-shopping-bag"></i> Añadir al carrito
            </button>
            
            <div class="detalles-adicionales">
                <div class="detalle-item"><span>Material:</span> <span>${producto.material}</span></div>
                <div class="detalle-item"><span>Disponibilidad:</span> <span>${producto.stock > 0 ? 'En stock' : 'Agotado'}</span></div>
                <div class="detalle-item"><span>Categoría:</span> <span>${producto.tipo}</span></div>
            </div>
        </div>
    `;
}

// ... resto de funciones ...

function cambiarImagenPrincipal(src, elemento) {
    document.getElementById('imagen-principal').src = src;
    document.querySelectorAll('.miniatura').forEach(img => img.classList.remove('active'));
    elemento.classList.add('active');
}

function seleccionarTalla(boton) {
    document.querySelectorAll('.talla-btn').forEach(btn => btn.classList.remove('selected'));
    boton.classList.add('selected');
}

function seleccionarColor(boton) {
    document.querySelectorAll('.color-btn').forEach(btn => btn.classList.remove('selected'));
    boton.classList.add('selected');
}

// Función para añadir al carrito
function addToCart(producto) {
    try {
        // Convertir el string de producto a objeto si es necesario
        if (typeof producto === 'string') {
            producto = JSON.parse(producto);
        }
        
        // Obtener el carrito actual del localStorage
        let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
        
        // Verificar si el producto ya está en el carrito
        const productoExistente = carrito.find(item => item.id === producto.id);
        
        if (productoExistente) {
            // Si ya existe, aumentar la cantidad en 1
            productoExistente.cantidad += 1;
        } else {
            // Si no existe, añadirlo al carrito con cantidad 1
            carrito.push({
                id: producto.id,
                nombre: producto.nombre,
                precio: producto.precio,
                imagen: producto.imagen,
                cantidad: 1
            });
        }
        
        // Guardar el carrito actualizado en localStorage
        localStorage.setItem('carrito', JSON.stringify(carrito));
        
        // Actualizar el contador del carrito
        actualizarContadorCarrito();
        
        // Mostrar notificación
        mostrarNotificacion('Producto añadido al carrito');
    } catch (error) {
        console.error('Error al añadir al carrito:', error);
        mostrarNotificacion('Error al añadir el producto');
    }
}

// Función para mostrar notificación
function mostrarNotificacion(mensaje) {
    const notificacion = document.createElement('div');
    notificacion.className = 'notificacion';
    notificacion.textContent = mensaje;
    document.body.appendChild(notificacion);
    
    // Animar la notificación
    setTimeout(() => {
        notificacion.classList.add('mostrar');
    }, 100);
    
    // Eliminar la notificación después de 3 segundos
    setTimeout(() => {
        notificacion.classList.remove('mostrar');
        setTimeout(() => {
            notificacion.remove();
        }, 300);
    }, 3000);
}

// Función para actualizar el contador del carrito
function actualizarContadorCarrito() {
    const carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    const totalItems = carrito.reduce((total, item) => total + item.cantidad, 0);
    
    // Actualizar todos los contadores del carrito en la página
    const contadores = document.querySelectorAll('.cart-count');
    contadores.forEach(contador => {
        contador.textContent = totalItems;
        contador.style.display = totalItems > 0 ? 'flex' : 'none';
    });
    
    console.log('Contador actualizado:', totalItems);
}

function getColorHex(colorName) {
    const colors = {
        'Blanco': '#ffffff',
        'Negro': '#000000',
        'Azul': '#2929ab',
        'Celeste': '#87CEEB',
        'Azul marino': '#000080',
        'Gris': '#808080',
        'Rojo': '#ff0000'
    };
    return colors[colorName] || '#cccccc';
}