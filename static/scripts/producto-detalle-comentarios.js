// Cargar comentarios al cargar la página
async function cargarComentarios(productoId) {
    try {
        const response = await fetch(`/api/productos/${productoId}/comentarios/`);
        const data = await response.json();
        
        const contenedor = document.getElementById('comentarios-container');
        if (data.comentarios && data.comentarios.length > 0) {
            contenedor.innerHTML = data.comentarios.map(comentario => `
                <div class="comentario">
                    <div class="comentario-header">
                        <span class="comentario-autor">${comentario.cliente}</span>
                        <span class="comentario-fecha">${comentario.fecha}</span>
                    </div>
                    <div class="comentario-texto">${comentario.texto}</div>
                </div>
            `).join('');
        } else {
            contenedor.innerHTML = '<p>No hay comentarios aún. Sé el primero en comentar.</p>';
        }
    } catch (error) {
        console.error('Error cargando comentarios:', error);
    }
}

// Manejar el modal de comentarios
function setupModalComentario() {
    const modal = document.getElementById('modal-comentario');
    const btnAbrir = document.getElementById('abrir-modal-comentario');
    const btnCerrar = document.querySelector('.cerrar-modal');
    const form = document.getElementById('form-comentario');

    btnAbrir.addEventListener('click', () => {
        modal.style.display = 'block';
    });

    btnCerrar.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const productoId = document.getElementById('producto-id').value;
        const nombre = document.getElementById('nombre-comentario').value;
        const telefono = document.getElementById('telefono-comentario').value;
        const texto = document.getElementById('texto-comentario').value;

        try {
            const response = await fetch(`/api/productos/${productoId}/comentarios/agregar/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'X-CSRFToken': getCookie('csrftoken')
                },
                body: new URLSearchParams({
                    'nombre': nombre,
                    'telefono': telefono,
                    'comentario': texto
                })
            });

            const data = await response.json();
            
            if (data.success) {
                mostrarNotificacion('Comentario agregado correctamente');
                modal.style.display = 'none';
                form.reset();
                cargarComentarios(productoId);
            } else {
                mostrarNotificacion('Error: ' + data.message);

            }
        } catch (error) {
            console.error('Error:', error);
            mostrarNotificacion('Error al enviar el comentario');
        }
    });
}

// Función auxiliar para obtener cookies
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

// Al cargar la página
document.addEventListener("DOMContentLoaded", async () => {
    // ... código existente ...
    
    // Cargar comentarios
    const pathSegments = window.location.pathname.split('/');
    const productId = pathSegments[pathSegments.length - 2];
    if (productId) {
        cargarComentarios(productId);
        setupModalComentario();
    }
});