document.addEventListener('DOMContentLoaded', function() {
    const resultsContainer = document.getElementById('results-container');
    const noResults = document.getElementById('no-results');
    const resultsTitle = document.getElementById('results-title');
    
    // Obtener término de búsqueda del localStorage
    const searchTerm = localStorage.getItem('searchTerm') || '';
    resultsTitle.textContent = `Resultados para: "${searchTerm}"`;
    
    // Si no hay término de búsqueda, mostrar mensaje
    if (!searchTerm.trim()) {
        noResults.style.display = 'block';
        noResults.querySelector('h2').textContent = 'No se ha ingresado término de búsqueda';
        return;
    }
    
    // Obtener resultados desde la API de Django
    fetch(`/api/productos/buscar/?q=${encodeURIComponent(searchTerm)}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Error en la respuesta de la API');
            }
            return response.json();
        })
        .then(data => {
            displayResults(data);
        })
        .catch(error => {
            console.error('Error al cargar los productos:', error);
            noResults.style.display = 'block';
            noResults.querySelector('h2').textContent = 'Error al cargar los resultados';
        });
    
    // Mostrar resultados
    function displayResults(results) {
        if (!results || results.length === 0) {
            noResults.style.display = 'block';
            return;
        }
        
        let html = '';
        results.forEach(product => {
            html += `
                <div class="result-card">
                    <img src="${product.imagen}" alt="${product.nombre}" class="result-card-img">
                    <div class="result-card-content">
                        <span class="result-card-category">${product.tipo}</span>
                        <h3 class="result-card-title">${product.nombre}</h3>
                        <p class="result-card-price">S/. ${parseFloat(product.precio).toFixed(2)}</p>
                        <a href="#" class="result-card-btn">Ver producto</a>
                    </div>
                </div>
            `;
        });
        
        resultsContainer.innerHTML = html;
        noResults.style.display = 'none';
    }
});