document.addEventListener('DOMContentLoaded', function () {
    // Variables globales
    let currentSection = 'dashboard';
    let currentPage = 1;
    const itemsPerPage = 10;

    // Inicializar
    loadSection(currentSection);
    setupEventListeners();

    function setupEventListeners() {
        // Navegación del menú
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', function () {
                document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
                this.classList.add('active');
                currentSection = this.getAttribute('data-section');
                document.getElementById('section-title').textContent =
                    this.querySelector('span').textContent;
                loadSection(currentSection);
            });
        });

        // Modal
        document.querySelector('.cerrar-modal').addEventListener('click', () => {
            document.getElementById('detail-modal').style.display = 'none';
        });
    }

    function loadSection(section) {
        const contentSection = document.getElementById('content-section');
        contentSection.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i></div>';

        switch (section) {
            case 'dashboard':
                loadDashboard();
                break;
            case 'clientes':
                loadClientes();
                break;
            case 'pedidos':
                loadPedidos();
                break;
            case 'productos':
                loadProductos();
                break;
            case 'comentarios':
                loadComentarios();
                break;
            case 'estadisticas':
                loadEstadisticas();
                break;
            default:
                loadDashboard();
        }
    }

    async function loadDashboard() {
        try {
            const [clientesRes, pedidosRes, comentariosRes] = await Promise.all([
                fetch('/api/clientes/?dashboard=true'),
                fetch('/api/pedidos/'),
                fetch('/api/productos/comentarios/')  // Esta es la nueva URL
            ]);

            // Verificar si las respuestas son OK
            if (!clientesRes.ok || !pedidosRes.ok || !comentariosRes.ok) {
                throw new Error('Error al cargar datos del dashboard');
            }

            const [clientes, pedidos, comentarios] = await Promise.all([
                clientesRes.json(),
                pedidosRes.json(),
                comentariosRes.json()
            ]);
            console.log(comentarios.comentarios.length)

            const html = `
                <div class="dashboard-cards">
                    <div class="card">
                        <div class="card-header">
                            <div>
                                <div class="card-value">${clientes.length}</div>
                                <div class="card-title">Clientes</div>
                            </div>
                            <div class="card-icon clients">
                                <i class="fas fa-users"></i>
                            </div>
                        </div>
                        <div class="card-footer">
                            <a href="#" data-section="clientes">Ver todos</a>
                        </div>
                    </div>

                    <div class="card">
                        <div class="card-header">
                            <div>
                                <div class="card-value">${pedidos.length}</div>
                                <div class="card-title">Pedidos</div>
                            </div>
                            <div class="card-icon orders">
                                <i class="fas fa-shopping-bag"></i>
                            </div>
                        </div>
                        <div class="card-footer">
                            <a href="#" data-section="pedidos">Ver todos</a>
                        </div>
                    </div>

                    <div class="card">
                        <div class="card-header">
                            <div>
                                <div class="card-value">${comentarios.comentarios.length}</div>
                                <div class="card-title">Comentarios</div>
                            </div>
                            <div class="card-icon comments">
                                <i class="fas fa-comments"></i>
                            </div>
                        </div>
                        <div class="card-footer">
                            <a href="#" data-section="comentarios">Ver todos</a>
                        </div>
                    </div>
                </div>

                <div class="data-section">
                    <div class="section-header">
                        <h2>Últimos Pedidos</h2>
                        <a href="#" data-section="pedidos">Ver todos</a>
                    </div>
                    <div id="ultimos-pedidos"></div>
                </div>

                <div class="data-section">
                    <div class="section-header">
                        <h2>Últimos Comentarios</h2>
                        <a href="#" data-section="comentarios">Ver todos</a>
                    </div>
                    <div id="ultimos-comentarios"></div>
                </div>
            `;

            document.getElementById('content-section').innerHTML = html;
            loadUltimosPedidos();
            loadUltimosComentarios();
            setupLinks();
        } catch (error) {
            console.error('Error loading dashboard:', error);
            showError('Error al cargar el dashboard');
        }
    }

    async function loadClientes(page = 1) {
        try {
            const response = await fetch(`/api/clientes/?page=${page}`);
            if (!response.ok) throw new Error('Error al cargar clientes');
            const data = await response.json();

            // Handle both paginated and non-paginated responses
            const clientes = data.results || data || [];

            let clientesHtml = '';
            clientes.forEach(cliente => {
                clientesHtml += `
                <tr>
                    <td>${cliente.id}</td>
                    <td>${cliente.nombre}</td>
                    <td>${cliente.email}</td>
                    <td>${cliente.telefono || 'N/A'}</td>
                    <td>${new Date(cliente.fecha_registro).toLocaleDateString()}</td>
                    <td>
                        <button class="action-btn view-btn" onclick="showClienteDetail(${cliente.id})">
                            <i class="fas fa-eye"></i> Ver
                        </button>
                        
                    </td>
                </tr>
            `;
            });

            const html = `
            <div class="data-section">
                <div class="section-header">
                    <h2>Lista de Clientes</h2>
                    
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Nombre</th>
                            <th>Email</th>
                            <th>Teléfono</th>
                            <th>Fecha Registro</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${clientesHtml}
                    </tbody>
                </table>

                ${data.count ? `
                <div class="pagination">
                    ${data.previous ? `<button onclick="loadClientes(${page - 1})">Anterior</button>` : ''}
                    <span>Página ${page} de ${Math.ceil(data.count / itemsPerPage)}</span>
                    ${data.next ? `<button onclick="loadClientes(${page + 1})">Siguiente</button>` : ''}
                </div>
                ` : ''}
            </div>
        `;

            document.getElementById('content-section').innerHTML = html;

            // Initialize search only after the HTML is rendered
            if (typeof setupSearch === 'function') {
                setupSearch('cliente-search', 'clientes');
            }
        } catch (error) {
            console.error('Error loading clients:', error);
            showError('Error al cargar los clientes');
        }
    }

    async function showClienteDetail(clienteId) {
        try {
            // Solo necesitamos una llamada al endpoint del cliente
            const response = await fetch(`/api/clientes/${clienteId}/`);
            if (!response.ok) throw new Error('Error al cargar cliente');
            const cliente = await response.json();
            console.log(cliente)
            let pedidosHtml = '';
            if (cliente.pedidos && cliente.pedidos.length) {
                cliente.pedidos.forEach(pedido => {
                    pedidosHtml += `
                    <div class="pedido-item pedido-item-detail">
                        <span class="pedido-id">#${pedido.id}</span>
                        <span class="pedido-fecha">${new Date(pedido.fecha).toLocaleDateString()}</span>
                        <span class="pedido-total">S/ ${pedido.total.toFixed(2)}</span>
                        <span class="pedido-estado ${pedido.estado.toLowerCase()}">${pedido.estado_display || pedido.estado}</span>
                        <button class="action-btn view-btn" onclick="showPedidoDetail(${pedido.id})">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                `;
                });
            } else {
                pedidosHtml = '<p>No hay pedidos registrados</p>';
            }

            let comentariosHtml = '';
            if (cliente.comentarios && cliente.comentarios.length) {
                cliente.comentarios.forEach(comentario => {
                    comentariosHtml += `
                    <div class="comentario-item">
                        <div class="comentario-producto">${comentario.producto_nombre || 'Producto ID: ' + (comentario.producto_id || comentario.id_producto)}</div>
                        <div class="comentario-texto">${comentario.texto}</div>
                        <div class="comentario-fecha">${new Date(comentario.fecha).toLocaleString()}</div>
                    </div>
                `;
                });
            } else {
                comentariosHtml = '<p>No hay comentarios</p>';
            }

            const modalContent = `
            <div class="cliente-detail">
                <h3>${cliente.nombre}</h3>
                <div class="cliente-info">
                    <p><strong>Email:</strong> ${cliente.email}</p>
                    <p><strong>Teléfono:</strong> ${cliente.telefono || 'N/A'}</p>
                    <p><strong>Dirección:</strong> ${cliente.direccion || 'N/A'}</p>
                    <p><strong>Registrado desde:</strong> ${new Date(cliente.fecha_registro).toLocaleDateString()}</p>
                </div>

                <div class="detail-section">
                    <h4>Pedidos (${cliente.pedidos ? cliente.pedidos.length : 0})</h4>
                    <div class="pedidos-list">
                        ${pedidosHtml}
                    </div>
                </div>

                <div class="detail-section">
                    <h4>Comentarios (${cliente.comentarios ? cliente.comentarios.length : 0})</h4>
                    <div class="comentarios-list">
                        ${comentariosHtml}
                    </div>
                </div>
            </div>
        `;

            document.getElementById('modal-content').innerHTML = modalContent;
            document.getElementById('detail-modal').style.display = 'flex';
        } catch (error) {
            console.error('Error loading client detail:', error);
            showError('Error al cargar los detalles del cliente');
        }
    }

    async function loadUltimosPedidos() {
        try {
            const response = await fetch('/api/pedidos/?limit=3');
            if (!response.ok) {
                throw new Error('Error al cargar últimos pedidos');
            }
            const data = await response.json();

            // Handle both direct array and paginated format
            const pedidos = data.results || data;

            let pedidosHtml = '';
            if (pedidos && pedidos.length) {

                pedidos.forEach(pedido => {
                    pedidosHtml += `
                    <tr>
                        <td>#${pedido.id}</td>
                        <td>${pedido.cliente?.nombre || 'N/A'}</td>
                        <td>${new Date(pedido.fecha).toLocaleDateString()}</td>
                        <td>S/ ${pedido.total?.toFixed(2) || '0.00'}</td>
                        <td><span class="status ${pedido.estado?.toLowerCase() || ''}">${pedido.estado_display || pedido.estado || 'N/A'}</span></td>
                        <td>
                            <button class="action-btn view-btn" onclick="showPedidoDetail(${pedido.id})">
                                <i class="fas fa-eye"></i> Ver
                            </button>
                        </td>
                    </tr>
                `;
                });
            } else {
                pedidosHtml = '<tr><td colspan="6">No hay pedidos recientes</td></tr>';
            }

            document.getElementById('ultimos-pedidos').innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th>ID Pedido</th>
                        <th>Cliente</th>
                        <th>Fecha</th>
                        <th>Total</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${pedidosHtml}
                </tbody>
            </table>
        `;
        } catch (error) {
            console.error('Error loading latest orders:', error);
            document.getElementById('ultimos-pedidos').innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                <span>Error al cargar los últimos pedidos</span>
            </div>
        `;
        }
    }
    async function loadUltimosComentarios() {
        try {
            const response = await fetch('/api/productos/comentarios/?limit=5');
            if (!response.ok) {
                throw new Error('Error al cargar últimos comentarios');
            }
            const { comentarios } = await response.json();

            let comentariosHtml = '';
            comentarios.forEach(comentario => {
                comentariosHtml += `
                    <div class="comment-card">
                        <div class="comment-header">
                            <div>
                                <span class="comment-client">${comentario.cliente}</span> en 
                                <span class="comment-product">${comentario.producto_nombre || 'Producto ID: ' + comentario.producto_id}</span>
                            </div>
                            <div class="comment-date">${comentario.fecha}</div>
                        </div>
                        <div class="comment-text">
                            ${comentario.texto}
                        </div>
                        <div class="comment-actions">
                            <button class="action-btn view-btn" onclick="location.href='/producto/${comentario.producto_id}/'">
                                <i class="fas fa-eye"></i> Ver Producto
                            </button>
                        </div>
                    </div>
                `;
            });

            document.getElementById('ultimos-comentarios').innerHTML = comentariosHtml;
        } catch (error) {
            console.error('Error loading latest comments:', error);
            document.getElementById('ultimos-comentarios').innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-circle"></i>
                    <span>Error al cargar los últimos comentarios</span>
                </div>
            `;
        }
    }

    async function loadProductos(page = 1) {
        try {
            const response = await fetch(`/api/productos/?page=${page}`);
            if (!response.ok) {
                throw new Error('Error al cargar productos');
            }
            const data = await response.json();
            console.log(data)
            const productos = Array.isArray(data) ? data : (data.results || []);



            let productosHtml = '';
            productos.forEach(producto => {
                productosHtml += `
                <tr>
                    <td>${producto.id}</td>
                    <td>${producto.nombre}</td>
                    <td>S/ ${producto.precio}</td>
                    <td>${producto.stock}</td>
                    <td>${producto.tipo}</td>
                    <td>
                        <button class="action-btn view-btn" onclick="showProductoDetail(${producto.id})">
                            <i class="fas fa-eye"></i> Ver
                        </button>
                        <button class="action-btn edit-btn" onclick="editProducto(${producto.id})">
                            <i class="fas fa-edit"></i> Editar
                        </button>
                        <button class="action-btn delete-btn" onclick="window.eliminarProducto(${producto.id})">
                            <i class="fas fa-trash"></i> Eliminar
                        </button>
                    </td>
                </tr>
            `;
            });

            const html = `
            <div class="data-section">
                <div class="section-header">
                    <h2>Lista de Productos</h2>
                    <div class="search-filter">
                        <div class="search-box">
                            <i class="fas fa-search"></i>
                            <input type="text" id="producto-search" placeholder="Buscar productos...">
                        </div>
                        <button class="filter-btn">
                            <i class="fas fa-filter"></i>
                            <span>Filtrar</span>
                        </button>
                    </div>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Nombre</th>
                            <th>Precio</th>
                            <th>Stock</th>
                            <th>Categoría</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${productosHtml}
                    </tbody>
                </table>

                <div class="pagination" style="display:none">
                    ${data.previous ? `<button onclick="loadProductos(${page - 1})">Anterior</button>` : ''}
                    <span>Página ${page} de ${Math.ceil(data.count / itemsPerPage)}</span>
                    ${data.next ? `<button onclick="loadProductos(${page + 1})">Siguiente</button>` : ''}
                </div>
            </div>
        `;

            document.getElementById('content-section').innerHTML = html;
            setupSearch('producto-search', 'productos');
        } catch (error) {
            console.error('Error loading products:', error);
            showError('Error al cargar los productos');
        }
    }

    // Añadir estas funciones al objeto window para que sean accesibles desde los botones
    window.showProductoDetail = async function (productoId) {
        try {
            const response = await fetch(`/api/productos/${productoId}/`);
            if (!response.ok) throw new Error('Error al cargar producto');
            const producto = await response.json();

            const modalContent = `
                <div class="producto-detail" style="display: flex; flex-direction: column; align-items: center;">
                    <h3 style="padding-top:15px;padding-bottom:15px;">${producto.nombre}</h3>
                    <div class="producto-info" style="padding-bottom:15px;">
                        <p><strong>Descripción:</strong> ${producto.descripcion || 'No disponible'}</p>
                        <p><strong>Precio:</strong> S/ ${parseFloat(producto.precio).toFixed(2)}</p>
                        <p><strong>Stock:</strong> ${producto.stock}</p>
                        <p><strong>Tipo:</strong> ${producto.tipo?.nombre || producto.tipo || 'N/A'}</p>
                        <p><strong>Material:</strong> ${producto.material || 'No especificado'}</p>
                        <p><strong>Dimensiones:</strong> ${producto.dimensiones || 'No especificado'}</p>
                    </div>
                    ${producto.imagen ? `<img src="${producto.imagen}" alt="${producto.nombre}" class="producto-imagen" style="width: 500px;">` : ''}
                </div>
            `;

            document.getElementById('modal-content').innerHTML = modalContent;
            document.getElementById('detail-modal').style.display = 'flex';
        } catch (error) {
            console.error('Error al mostrar detalle del producto:', error);
            alert('Error al cargar los detalles del producto');
        }
    };

    window.crearProducto = async function () {
        try {
            const modalContent = `
        <div class="edit-product-form">
            <h3>Crear Nuevo Producto</h3>
            <form id="productoCreateForm" enctype="multipart/form-data">
                <div class="form-group">
                    <label>Nombre:</label>
                    <input type="text" name="nombre" required>
                </div>
                
                <div class="form-group">
                    <label>Descripción:</label>
                    <textarea name="descripcion" required></textarea>
                </div>
                
                <div class="form-group">
                    <label>Precio (S/):</label>
                    <input type="number" step="0.01" name="precio" required>
                </div>
                
                <div class="form-group">
                    <label>Stock:</label>
                    <input type="number" name="stock" required>
                </div>
                
                <div class="form-group">
                    <label>Tipo:</label>
                    <select name="tipo" required>
                        <option value="">Seleccione tipo</option>
                        ${await getTiposProducto()}
                    </select>
                </div>
                
                <div class="form-group">
                    <label>Material:</label>
                    <input type="text" name="material">
                </div>
                
                <div class="form-group">
                    <label>Dimensiones:</label>
                    <input type="text" name="dimensiones">
                </div>
                
                <div class="form-group">
                    <label>Imagen:</label>
                    <input type="file" name="imagen" accept="image/*">
                </div>
                
                <div class="form-actions">
                    <button type="button" class="cancel-btn" onclick="document.getElementById('detail-modal').style.display='none'">Cancelar</button>
                    <button type="submit" class="save-btn">Crear Producto</button>
                </div>
            </form>
        </div>
        `;

            document.getElementById('modal-content').innerHTML = modalContent;
            document.getElementById('detail-modal').style.display = 'flex';

            document.getElementById('productoCreateForm').addEventListener('submit', async function (e) {
                e.preventDefault();
                await createNewProduct(this);
            });

        } catch (error) {
            console.error('Error al crear producto:', error);
            alert('Error al cargar el formulario de creación');
        }
    };


    window.editProducto = async function (productoId) {
        try {
            const [producto, materiales, colores] = await Promise.all([
                fetch(`/api/productos/${productoId}/`).then(res => res.json()),
                getMateriales(),
                getColores()
            ]);



            // Función para determinar si un material está seleccionado
            const isMaterialSelected = (materialNombre) => {
                // Comparar el nombre del material (case insensitive)
                return producto.material;
            };

            // Crear formulario de edición con selects para materiales y colores
            const modalContent = `
                <div class="edit-product-form">
                    <h3>Editar Producto: ${producto.nombre}</h3>
                    <form id="productoEditForm">
                        <input type="hidden" name="id" value="${producto.id}">
                        
                        <div class="form-group">
                            <label>Nombre:</label>
                            <input type="text" name="nombre" value="${producto.nombre || ''}" required>
                        </div>
                        
                        <div class="form-group">
                            <label>Descripción:</label>
                            <textarea name="descripcion" required>${producto.descripcion || ''}</textarea>
                        </div>
                        
                        <div class="form-group">
                            <label>Precio (S/):</label>
                            <input type="number" step="0.01" name="precio" value="${producto.precio || ''}" required>
                        </div>
                        
                        <div class="form-group">
                            <label>Stock:</label>
                            <input type="number" name="stock" value="${producto.stock || ''}" required>
                        </div>
                        
                        <div class="form-group">
                            <label>Tipo:</label>
                            <select name="tipo" required>
                                <option value="">Seleccione tipo</option>
                                ${await getTiposProducto(producto.tipo?.id || producto.tipo)}
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label>Material:</label>
                            <select name="material">
                        <option value="">Seleccione material</option>
                        ${materiales.map(m =>
                `<option value="${m.id}" ${isMaterialSelected(m.id) ? 'selected' : ''}>
                                ${m.nombre}
                            </option>`
            ).join('')}
                    </select>
                        </div>
                        
                        <div class="form-group">
                            <label>Color:</label>
                            <select name="color">
                                <option value="">Seleccione color</option>
                                ${colores.map(c =>
                `<option value="${c.id}" ${(producto.color?.id === c.id || producto.color === c.id) ? 'selected' : ''}>
                                        ${c.nombre}
                                    </option>`
            ).join('')}
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label>Dimensiones:</label>
                            <input type="text" name="dimensiones" value="${producto.dimensiones || ''}">
                        </div>
                        
                        <div class="form-group">
                            <label>URL de la Imagen:</label>
                            <input type="text" name="imagen" value="${producto.imagen || ''}" placeholder="https://ejemplo.com/imagen.jpg">
                            ${producto.imagen ? `<img src="${producto.imagen}" class="current-image-preview">` : ''}
                        </div>
                        
                        <div class="form-actions">
                            <button type="button" class="cancel-btn" onclick="document.getElementById('detail-modal').style.display='none'">Cancelar</button>
                            <button type="submit" class="save-btn">Guardar Cambios</button>
                        </div>
                    </form>
                </div>
                `;

            document.getElementById('modal-content').innerHTML = modalContent;
            document.getElementById('detail-modal').style.display = 'flex';

            document.getElementById('productoEditForm').addEventListener('submit', async function (e) {
                e.preventDefault();
                await saveProductChanges(this, productoId);
            });

        } catch (error) {
            console.error('Error al editar producto:', error);
            alert('Error al cargar el formulario de edición');
        }
    };


    // Función para eliminar producto
    window.eliminarProducto = async function (productoId) {
        if (!confirm('¿Estás seguro de que deseas eliminar este producto?')) {
            return;
        }

        try {
            const response = await fetch(`/api/productos/${productoId}/eliminar/`, {
                method: 'DELETE',
                headers: {
                    'X-CSRFToken': getCookie('csrftoken'),
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Error al eliminar producto');
            }

            alert('Producto eliminado correctamente');
            loadProductos(currentPage); // Recargar la lista

        } catch (error) {
            console.error('Error al eliminar producto:', error);
            alert('Error al eliminar el producto');
        }
    };


    async function saveProductChanges(form, productoId) {
        try {
            // Crear objeto con los datos del formulario
            const formData = {
                nombre: form.nombre.value,
                descripcion: form.descripcion.value,
                precio: parseFloat(form.precio.value),
                stock: parseInt(form.stock.value),
                tipo: parseInt(form.tipo.value),
                material: parseInt(form.material.value),  // Asegurar que es ID
                color: parseInt(form.color.value),
                dimensiones: form.dimensiones.value,
                imagen: form.imagen.value
            };



            const response = await fetch(`/api/productos/${productoId}/actualizar/`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken')
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al guardar cambios');
            }

            const updatedProduct = await response.json();
            alert('Producto actualizado correctamente');
            document.getElementById('detail-modal').style.display = 'none';
            loadProductos(currentPage); // Recargar la lista

        } catch (error) {
            console.error('Error al guardar cambios:', error);
            alert(error.message || 'Error al guardar cambios');
        }
    }

    async function getMateriales() {
        try {
            const response = await fetch('/api/materiales/');
            if (!response.ok) throw new Error('Error al cargar materiales');
            return await response.json();
        } catch (error) {
            console.error('Error:', error);
            return [];
        }
    }

    async function getColores() {
        try {
            const response = await fetch('/api/colores/');
            if (!response.ok) throw new Error('Error al cargar colores');
            return await response.json();
        } catch (error) {
            console.error('Error:', error);
            return [];
        }
    }

    async function getTiposProducto(currentTipo) {
        try {
            const response = await fetch('/api/tipos-producto/');
            if (!response.ok) return '';
            const tipos = await response.json();

            let options = '';
            tipos.forEach(tipo => {
                const isSelected = (tipo.id === currentTipo || tipo.nombre === currentTipo) ? 'selected' : '';
                options += `<option value="${tipo.id}" ${isSelected}>${tipo.nombre}</option>`;
            });
            return options;
        } catch (error) {
            console.error('Error al cargar tipos:', error);
            return '';
        }
    }


    // Función auxiliar para obtener el token CSRF
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


    async function loadComentarios(page = 1) {
        try {
            const response = await fetch(`/api/productos/comentarios/?page=${page}`);
            if (!response.ok) {
                throw new Error('Error al cargar comentarios');
            }
            const { comentarios, count } = await response.json();

            let comentariosHtml = '';
            comentarios.forEach(comentario => {
                comentariosHtml += `
                <tr>
                    <td>${comentario.cliente}</td>
                    <td>${comentario.producto_nombre || 'Producto ID: ' + comentario.producto_id}</td>
                    <td>${comentario.texto}</td>
                    <td>${comentario.fecha}</td>
                    <td>
                        <button class="action-btn view-btn" onclick="location.href='/producto/${comentario.producto_id}/'">
                            <i class="fas fa-eye"></i> Ver Producto
                        </button>
                        <button class="action-btn delete-btn" onclick="deleteComentario('${comentario.id}')">
                            <i class="fas fa-trash"></i> Eliminar
                        </button>
                        
                    </td>
                </tr>
            `;
            });

            const html = `
            <div class="data-section">
                <div class="section-header">
                    <h2>Lista de Comentarios</h2>
                    <div class="search-filter">
                        <div class="search-box">
                            <i class="fas fa-search"></i>
                            <input type="text" id="comentario-search" placeholder="Buscar comentarios...">
                        </div>
                        
                    </div>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>Cliente</th>
                            <th>Producto</th>
                            <th>Comentario</th>
                            <th>Fecha</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${comentariosHtml}
                    </tbody>
                </table>

                <div class="pagination" style="display: none;">
                    ${page > 1 ? `<button onclick="loadComentarios(${page - 1})">Anterior</button>` : ''}
                    
                    <span>Página ${page} de ${Math.ceil(count / itemsPerPage)}</span>
                    ${comentarios.length === itemsPerPage ? `<button onclick="loadComentarios(${page + 1})">Siguiente</button>` : ''}
                </div>
            </div>
        `;

            document.getElementById('content-section').innerHTML = html;
            setupSearch('comentario-search', 'comentarios');
        } catch (error) {
            console.error('Error loading comments:', error);
            showError('Error al cargar los comentarios');
        }
    }


    async function loadEstadisticas() {
        console.log('Cargando estadísticas...');
        try {
            const response = await fetch('/api/estadisticas/');
            if (!response.ok) {
                throw new Error('Error al cargar estadísticas');
            }
            const data = await response.json();

            const html = `
        <div class="dashboard-cards">
            <div class="card">
                <div class="card-header">
                    <div>
                        <div class="card-value">${data.total_clientes}</div>
                        <div class="card-title">Clientes Totales</div>
                    </div>
                    <div class="card-icon clients">
                        <i class="fas fa-users"></i>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <div>
                        <div class="card-value">${data.total_pedidos}</div>
                        <div class="card-title">Pedidos Totales</div>
                    </div>
                    <div class="card-icon orders">
                        <i class="fas fa-shopping-bag"></i>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <div>
                        <div class="card-value">${data.total_productos}</div>
                        <div class="card-title">Productos</div>
                    </div>
                    <div class="card-icon products">
                        <i class="fas fa-box-open"></i>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <div>
                        <div class="card-value">${data.total_comentarios}</div>
                        <div class="card-title">Comentarios</div>
                    </div>
                    <div class="card-icon comments">
                        <i class="fas fa-comments"></i>
                    </div>
                </div>
            </div>
        </div>

        <div class="data-section">
            <div class="section-header">
                <h2>Ventas del Mes Actual</h2>
            </div>
            <div class="chart-container" style="position: relative; height:300px; width:100%">
                <canvas id="ventasMensualesChart"></canvas>
            </div>
        </div>

        <div class="data-section">
            <div class="section-header">
                <h2>Ventas del Año Actual</h2>
            </div>
            <div class="chart-container" style="position: relative; height:300px; width:100%">
                <canvas id="ventasAnualesChart"></canvas>
            </div>
        </div>

        <div class="data-section">
            <div class="section-header">
                <h2>Productos Más Vendidos</h2>
            </div>
            <div class="chart-container" style="position: relative; height:300px; width:100%">
                <canvas id="productosChart"></canvas>
            </div>
        </div>
    `;

            document.getElementById('content-section').innerHTML = html;

            // Inicializar gráficos
            if (data.ventas_mensuales) {
                initVentasMensualesChart(data.ventas_mensuales);
            }
            if (data.ventas_anuales) {
                initVentasAnualesChart(data.ventas_anuales);
            }
            if (data.productos_mas_vendidos) {
                initProductosChart(data.productos_mas_vendidos);
            }
        } catch (error) {
            console.error('Error loading statistics:', error);
            showError('Error al cargar las estadísticas');
        }
    }

    function initVentasMensualesChart(data) {
        const ctx = document.getElementById('ventasMensualesChart').getContext('2d');

        // Preparar datos para todos los días del mes
        const now = new Date();
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const allDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);
        const ventasPorDia = allDays.map(day => {
            const index = data.dias.indexOf(day);
            return index !== -1 ? data.ventas_diarias[index] : 0;
        });

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: allDays.map(d => `Día ${d}`),
                datasets: [{
                    label: 'Ventas diarias (S/)',
                    data: ventasPorDia,
                    backgroundColor: 'rgba(54, 162, 235, 0.7)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }]
            },
            options: getChartOptions('Ventas por día del mes actual')
        });
    }

    function initVentasAnualesChart(data) {
        const ctx = document.getElementById('ventasAnualesChart').getContext('2d');

        // Nombres de los meses
        const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun",
            "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

        // Preparar datos para todos los meses del año
        const allMonths = Array.from({ length: 12 }, (_, i) => i + 1);
        const ventasPorMes = allMonths.map(month => {
            const index = data.meses.indexOf(month);
            return index !== -1 ? data.ventas_mensuales[index] : 0;
        });

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: allMonths.map(m => monthNames[m - 1]),
                datasets: [{
                    label: 'Ventas mensuales (S/)',
                    data: ventasPorMes,
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 2,
                    tension: 0.1,
                    fill: true
                }]
            },
            options: getChartOptions('Ventas por mes del año actual')
        });
    }

    function getChartOptions(title) {
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: title,
                    font: {
                        size: 16
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return `S/ ${context.raw.toFixed(2)}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function (value) {
                            return 'S/ ' + value;
                        }
                    }
                },
                x: {
                    ticks: {
                        autoSkip: false
                    }
                }
            }
        };
    }


    function initProductosChart(data) {
        const ctx = document.getElementById('productosChart').getContext('2d');

        // Configurar el tamaño máximo de las etiquetas
        Chart.defaults.font.size = 12;
        Chart.defaults.plugins.legend.labels.boxWidth = 12;

        console.log('Initializing Productos Chart with data:', data);

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.nombres,
                datasets: [{
                    label: 'Unidades vendidas',
                    data: data.cantidades,
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.7)',
                        'rgba(54, 162, 235, 0.7)',
                        'rgba(255, 206, 86, 0.7)',
                        'rgba(75, 192, 192, 0.7)',
                        'rgba(153, 102, 255, 0.7)'
                    ],
                    borderColor: [
                        'rgba(255, 99, 132, 1)',
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 206, 86, 1)',
                        'rgba(75, 192, 192, 1)',
                        'rgba(153, 102, 255, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                return `${context.dataset.label}: ${context.raw}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    },
                    x: {
                        ticks: {
                            autoSkip: false,
                            maxRotation: 45,
                            minRotation: 45
                        }
                    }
                }
            }
        });
    }

    function initVentasChart(data) {
        const ctx = document.getElementById('ventasChart').getContext('2d');

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.meses,
                datasets: [{
                    label: 'Ventas mensuales (S/)',
                    data: data.ventas,
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 2,
                    tension: 0.1,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                return `S/ ${context.raw.toFixed(2)}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function (value) {
                                return 'S/ ' + value;
                            }
                        }
                    }
                }
            }
        });
    }

    async function showPedidoDetail(pedidoId) {
        try {
            const response = await fetch(`/api/pedidos/${pedidoId}/`);
            if (!response.ok) {
                throw new Error('Error al cargar detalles del pedido');
            }
            const pedido = await response.json();

            // Format the date
            const fechaFormateada = new Date(pedido.fecha).toLocaleString();

            // Format the items list
            let itemsHtml = '';

            if (pedido.detalles && pedido.detalles.length) {
                pedido.detalles.forEach(detalle => {
                    itemsHtml += `
                        <div class="pedido-item">
                            <span class="producto-nombre">${detalle.producto.nombre}</span>
                            <span class="producto-cantidad">${detalle.cantidad} x</span>
                            <span class="producto-precio">S/ ${detalle.precio_unitario}</span>
                            <span class="producto-subtotal">S/ ${(detalle.cantidad * detalle.precio_unitario).toFixed(2)}</span>
                        </div>
                    `;
                });
            } else {
                itemsHtml = '<p>No hay items en este pedido</p>';
            }

            const modalContent = `
            <div class="pedido-detail">
                <h3>Pedido #${pedido.id}</h3>
                <div class="pedido-info">
                    <p><strong>Cliente:</strong> ${pedido.cliente?.nombre || 'N/A'}</p>
                    <p><strong>Fecha:</strong> ${fechaFormateada}</p>
                    <p><strong>Estado:</strong> <span class="status ${pedido.estado.toLowerCase()}">${pedido.estado_display || pedido.estado}</span></p>
                    <p><strong>Total:</strong> S/ ${pedido.total.toFixed(2)}</p>
                </div>

                <div class="detail-section">
                    <h4>Items del Pedido</h4>
                    <div class="items-list">
                        ${itemsHtml}
                    </div>
                </div>
            </div>
        `;

            document.getElementById('modal-content').innerHTML = modalContent;
            document.getElementById('detail-modal').style.display = 'flex';
        } catch (error) {
            console.error('Error loading order detail:', error);
            alert('Error al cargar los detalles del pedido');
        }
    }

    function setupSearch(inputId, section) {
        const searchInput = document.getElementById(inputId);
        if (!searchInput) return;

        searchInput.addEventListener('input', async (e) => {
            const searchTerm = e.target.value.trim();
            if (searchTerm.length < 1 && searchTerm.length !== 0) return;

            try {
                let url = `/api/${section}/`;

                switch (section) {
                    case 'comentarios':
                        url = `/api/comentarios/buscar/?search=${encodeURIComponent(searchTerm)}`;
                        break;
                    case 'pedidos':
                        url = `/api/pedidos/buscar/?search=${encodeURIComponent(searchTerm)}`;
                        break;

                    default:
                        url = `/api/${section}/?search=${encodeURIComponent(searchTerm)}`;
                }

                const response = await fetch(url);
                if (!response.ok) throw new Error('Error en búsqueda');

                const data = await response.json();

                console.log(data);

                const items = data.results || data;

                if (section === 'productos') {

                    // Para productos, actualizar la tabla completa incluyendo paginación
                    updateProductosTable(items, data);
                } else {
                    updateTableWithSearchResults(section, data.results || data);
                }


            } catch (error) {
                console.error('Search error:', error);
                showError('Error al realizar la búsqueda');
            }
        });
    }

    // Nueva función para actualizar la tabla de productos
    function updateProductosTable(productos, paginationData) {
        let productosHtml = '';

        productos.forEach(producto => {
            productosHtml += `
        <tr>
            <td>${producto.id}</td>
            <td>${producto.nombre}</td>
            <td>S/ ${producto.precio}</td>
            <td>${producto.stock}</td>
            <td>${producto.tipo?.nombre || producto.tipo || 'N/A'}</td>
            <td>
                <button class="action-btn view-btn" onclick="showProductoDetail(${producto.id})">
                    <i class="fas fa-eye"></i> Ver
                </button>
                <button class="action-btn edit-btn" onclick="editProducto(${producto.id})">
                    <i class="fas fa-edit"></i> Editar
                </button>
                <button class="action-btn delete-btn" onclick="window.eliminarProducto(${producto.id})">
                    <i class="fas fa-trash"></i> Eliminar
                </button>
            </td>
        </tr>
        `;
        });

        const tableHtml = `
        <table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Nombre</th>
                    <th>Precio</th>
                    <th>Stock</th>
                    <th>Categoría</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
                ${productosHtml}
            </tbody>
        </table>
        
        ${paginationData?.count ? `
        <div class="pagination" style="display: none;">
            ${paginationData.previous ? `<button onclick="loadProductos(1, '${searchInput.value}')">Anterior</button>` : ''}
            <span>Página ${paginationData.current_page || 1} de ${Math.ceil(paginationData.count / itemsPerPage)}</span>
            ${paginationData.next ? `<button onclick="loadProductos(${(paginationData.current_page || 1) + 1}, '${searchInput.value}')">Siguiente</button>` : ''}
        </div>
        ` : ''}
    `;

        const tbody = document.querySelector('#content-section table tbody');
        if (tbody) {
            tbody.parentElement.outerHTML = tableHtml;
        } else {
            document.querySelector('#content-section .data-section').innerHTML += tableHtml;
        }
    }


    function updateTableWithSearchResults(section, items) {
        let rowsHtml = '';
        items = section === 'comentarios' ? items.comentarios : data;

        switch (section) {
            case 'clientes':
                items.forEach(item => {
                    rowsHtml += `
                    <tr>
                        <td>${item.id}</td>
                        <td>${item.nombre}</td>
                        <td>${item.email}</td>
                        <td>${item.telefono || 'N/A'}</td>
                        <td>${new Date(item.fecha_registro).toLocaleDateString()}</td>
                        <td>
                            <button class="action-btn view-btn" onclick="showClienteDetail(${item.id})">
                                <i class="fas fa-eye"></i> Ver
                            </button>
                            
                        </td>
                    </tr>
                `;
                });
                break;

            case 'pedidos':
                items.forEach(item => {
                    rowsHtml += `
                    <tr>
                        <td>#${item.id}</td>
                        <td>${item.cliente?.nombre || 'N/A'}</td>
                        <td>${new Date(item.fecha).toLocaleDateString()}</td>
                        <td>S/ ${item.total?.toFixed(2) || '0.00'}</td>
                        <td><span class="status ${item.estado?.toLowerCase() || ''}">${item.estado_display || item.estado || 'N/A'}</span></td>
                        <td>
                            <button class="action-btn view-btn" onclick="showPedidoDetail(${item.id})">
                                <i class="fas fa-eye"></i> Ver
                            </button>
                        </td>
                    </tr>
                `;
                });
                break;

            case 'comentarios':

                items.forEach(comentario => {
                    rowsHtml += `
                <tr>
                    <td>${comentario.cliente || 'Anónimo'}</td>
                    <td>${comentario.producto_nombre || 'Producto ID: ' + (comentario.producto_id || 'N/A')}</td>
                    <td>${comentario.texto}</td>
                    <td>${comentario.fecha}</td>
                    <td>
                        <button class="action-btn view-btn" onclick="location.href='/producto/${comentario.producto_id}/'">
                            <i class="fas fa-eye"></i> Ver Producto
                        </button>
                        <button class="action-btn delete-btn" onclick="deleteComentario('${comentario.id}')">
                            <i class="fas fa-trash"></i> Eliminar
                        </button>
                    </td>
                </tr>
                `;
                });
                break;
        }

        const tbody = document.querySelector(`#content-section table tbody`);
        if (tbody) {
            tbody.innerHTML = rowsHtml;
        }
    }

    window.deleteComentario = async function (comentarioId) {
        if (!confirm('¿Estás seguro de que deseas eliminar este comentario?')) {
            return;
        }

        const deleteBtn = document.querySelector(`button[onclick*="deleteComentario('${comentarioId}')"]`);
        if (deleteBtn) {
            deleteBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Eliminando...';
            deleteBtn.disabled = true;
        }

        try {
            const response = await fetch(`/api/comentarios/${comentarioId}/eliminar/`, {
                method: 'DELETE',
                headers: {
                    'X-CSRFToken': getCookie('csrftoken'),
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al eliminar comentario');
            }

            const data = await response.json();

            if (data.success) {
                showAlert('success', 'Comentario eliminado correctamente');
                const row = deleteBtn?.closest('tr');
                if (row) row.remove();
            } else {
                throw new Error(data.message || 'Error al eliminar comentario');
            }
        } catch (error) {
            console.error('Error al eliminar comentario:', error);
            showAlert('error', error.message || 'Error al eliminar el comentario');
        } finally {
            if (deleteBtn) {
                deleteBtn.innerHTML = '<i class="fas fa-trash"></i> Eliminar';
                deleteBtn.disabled = false;
            }
        }
    };

    // Función para mostrar alertas (debes implementarla según tu UI)
    function showAlert(type, message) {
        // Implementación básica - ajusta según tu framework de UI
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type}`;
        alertDiv.textContent = message;
        document.body.appendChild(alertDiv);

        // Eliminar la alerta después de 5 segundos
        setTimeout(() => {
            alertDiv.remove();
        }, 5000);
    }

    async function loadPedidos(page = 1) {
        try {
            const response = await fetch(`/api/pedidos/?page=${page}`);
            if (!response.ok) throw new Error('Error al cargar pedidos');
            const data = await response.json();

            // Handle both paginated and non-paginated responses
            const pedidos = data.results || data || [];

            let pedidosHtml = '';
            pedidos.forEach(pedido => {
                pedidosHtml += `
                <tr>
                    <td>#${pedido.id}</td>
                    <td>${pedido.cliente?.nombre || 'N/A'}</td>
                    <td>${new Date(pedido.fecha).toLocaleDateString()}</td>
                    <td>S/ ${pedido.total?.toFixed(2) || '0.00'}</td>
                    <td><span class="status ${pedido.estado?.toLowerCase() || ''}">${pedido.estado_display || pedido.estado || 'N/A'}</span></td>
                    <td>
                        <button class="action-btn view-btn" onclick="showPedidoDetail(${pedido.id})">
                            <i class="fas fa-eye"></i> Ver
                        </button>
                    </td>
                </tr>
            `;
            });

            const html = `
            <div class="data-section">
                <div class="section-header">
                    <h2>Lista de Pedidos</h2>
                    <div class="search-filter">
                        <div class="search-box">
                            <i class="fas fa-search"></i>
                            <input type="text" id="pedido-search" placeholder="Buscar pedidos...">
                        </div>
                        
                    </div>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>ID Pedido</th>
                            <th>Cliente</th>
                            <th>Fecha</th>
                            <th>Total</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${pedidosHtml}
                    </tbody>
                </table>

                ${data.count ? `
                <div class="pagination">
                    ${data.previous ? `<button onclick="loadPedidos(${page - 1})">Anterior</button>` : ''}
                    <span>Página ${page} de ${Math.ceil(data.count / itemsPerPage)}</span>
                    ${data.next ? `<button onclick="loadPedidos(${page + 1})">Siguiente</button>` : ''}
                </div>
                ` : ''}
            </div>
        `;

            document.getElementById('content-section').innerHTML = html;

            // Initialize search
            if (typeof setupSearch === 'function') {
                setupSearch('pedido-search', 'pedidos');
            }
        } catch (error) {
            console.error('Error loading orders:', error);
            showError('Error al cargar los pedidos');
        }
    }










    // Funciones auxiliares
    function setupLinks() {
        document.querySelectorAll('[data-section]').forEach(link => {
            link.addEventListener('click', function (e) {
                e.preventDefault();
                const section = this.getAttribute('data-section');
                document.querySelector(`.nav-item[data-section="${section}"]`).click();
            });
        });
    }

    function showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.innerHTML = `
            <i class="fas fa-exclamation-circle"></i>
            <span>${message}</span>
        `;
        document.getElementById('content-section').innerHTML = '';
        document.getElementById('content-section').appendChild(errorDiv);
    }

    window.loadClientes = loadClientes;
    window.showClienteDetail = showClienteDetail;

    window.loadProductos = loadProductos;
    window.loadComentarios = loadComentarios;
    window.loadEstadisticas = loadEstadisticas;
    window.showPedidoDetail = showPedidoDetail;

    window.setupSearch = setupSearch;
    window.loadPedidos = loadPedidos;

});