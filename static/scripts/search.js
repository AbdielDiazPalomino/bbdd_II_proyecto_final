document.addEventListener('DOMContentLoaded', function() {
    const searchToggle = document.getElementById('search-toggle');
    const searchOverlay = document.getElementById('search-overlay');
    const closeSearch = document.getElementById('close-search');
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    const searchSuggestions = document.getElementById('search-suggestions');
    
    // Mostrar/ocultar overlay
    searchToggle.addEventListener('click', function(e) {
        e.preventDefault();
        searchOverlay.classList.add('active');
        searchInput.focus();
    });
    
    closeSearch.addEventListener('click', function() {
        searchOverlay.classList.remove('active');
        searchSuggestions.classList.remove('visible');
    });
    
    // Buscar productos via API
    searchInput.addEventListener('input', function() {
        const query = this.value.trim();
        
        if (query.length > 1) {
            fetch(`/api/productos/buscar/?q=${encodeURIComponent(query)}`)

                .then(response => response.json())
                .then(data => {
                    displaySuggestions(data);
                })
                .catch(error => {
                    console.error('Error en la búsqueda:', error);
                    searchSuggestions.innerHTML = '<div class="search-suggestion-item">Error en la búsqueda</div>';
                    searchSuggestions.classList.add('visible');
                });
        } else {
            searchSuggestions.classList.remove('visible');
        }
    });
    
    // Mostrar sugerencias
    function displaySuggestions(results) {
        if (results.length === 0) {
            searchSuggestions.innerHTML = '<div class="search-suggestion-item">No se encontraron productos</div>';
            searchSuggestions.classList.add('visible');
            return;
        }
        
        let html = '';
        
        results.slice(0, 5).forEach(product => {
            html += `
                <div class="search-suggestion-item" data-id="${product.id}">
                    <img src="${product.imagen}" alt="${product.nombre}">
                    <div class="search-suggestion-info">
                        <h4>${product.nombre}</h4>
                        <p>${product.tipo} - S/. ${parseFloat(product.precio).toFixed(2)}</p>
                    </div>
                </div>
            `;
        });
        
        if (results.length > 5) {
            html += `<div class="search-suggestion-item view-all">Ver todos los resultados (${results.length})</div>`;
        }
        
        searchSuggestions.innerHTML = html;
        searchSuggestions.classList.add('visible');
        
        // Manejar clic en sugerencias
        document.querySelectorAll('.search-suggestion-item').forEach(item => {
            item.addEventListener('click', function() {
                const searchTerm = searchInput.value;
                localStorage.setItem('searchTerm', searchTerm);
                window.location.href = '/resultados/'; // Ruta definida en urls.py
            });
        });
    }
    
    // Buscar al hacer clic o presionar Enter
    function performSearch() {
        const searchTerm = searchInput.value.trim();
        if (searchTerm) {
            localStorage.setItem('searchTerm', searchTerm);
            window.location.href = '/resultados/';
        }
    }
    
    searchButton.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
    
    // Cerrar al hacer clic fuera
    searchOverlay.addEventListener('click', function(e) {
        if (e.target === searchOverlay) {
            searchOverlay.classList.remove('active');
            searchSuggestions.classList.remove('visible');
        }
    });
});