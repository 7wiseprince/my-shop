function toggleFavorite(productId) {
    const product = allProducts.find(p => p._id === productId);
    if (!product) return;

    const index = favorites.findIndex(item => item._id === productId);

    if (index === -1) {
        favorites.push(product);
    } else {
        favorites.splice(index, 1);
    }

    updateFavoritesUI();
    if (typeof updateCabinetFavoritesUI === 'function') {
        updateCabinetFavoritesUI();
    }
    
    if (typeof allProducts !== 'undefined' && allProducts.length > 0) {
        renderProducts(allProducts, 'catalog-products');
        renderProducts(allProducts.slice(0, 2), 'featured-products');
    }

   if (currentUser) {

    const token = localStorage.getItem('sneakers_token');

    fetch('/api/favorites', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            favorites: favorites
        })
    })
    .then(res => res.json())
    .then(data => console.log(data.message))
    .catch(err => console.error('Помилка збереження обраного:', err));
       }
}
                                  
function updateFavoritesUI() {
   favorites = favorites.filter(fav =>
    allProducts.some(p => p._id === fav._id)
);
    const favoritesContainer = document.getElementById('favorites-products');
    if (favoritesContainer) favoritesContainer.className = 'products-grid';

    renderProducts(favorites, 'favorites-products');
    
    if (allProducts.length > 0) {
        const catalogContainer = document.getElementById('catalog-products');
        if (catalogContainer) catalogContainer.className = 'products-grid';

        const featuredContainer = document.getElementById('featured-products');
        if (featuredContainer) featuredContainer.className = 'products-grid';

        renderProducts(allProducts, 'catalog-products');
        renderProducts(allProducts.slice(0, 2), 'featured-products');
    }
}

function updateCabinetFavoritesUI() {
    const cabinetList = document.getElementById('cabinet-favorites-list');
    if (!cabinetList) return; 
    renderProducts(favorites, 'cabinet-favorites-list');
     }
                     
