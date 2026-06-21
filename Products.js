async function loadProducts() {
    try {
        const response = await fetch('/api/products');
        allProducts = await response.json();
        
        // Сортуємо глобальний масив і виводимо в каталог
        const sortedProducts = getSortedProductsForCatalog(allProducts);
        renderProducts(sortedProducts, 'catalog-products');

       favorites = favorites.filter(fav =>
    allProducts.some(p => p._id === fav._id)
);

        updateFavoritesUI();
        // Оновлюємо популярні товари на головній сторінці при завантаженні
        updateFeaturedProductsUI();
            
    } catch (error) {
        console.error("Помилка завантаження товарів:", error);
    }
}

function renderProducts(products, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    
    if (products.length === 0) {
        container.className = ''; // Прибираємо сітку, щоб повідомлення було по центру
        container.innerHTML = '<p class="empty-message">Товарів не знайдено</p>';
        return;
    }

    // ВМИКАЄМО НАШУ УНІВЕРСАЛЬНУ ДВІЙКОВУ СІТКУ!
    container.className = 'products-grid';

    // ПЕРЕВІРКА НА АДМІНА
    const userJson = localStorage.getItem('user') || localStorage.getItem('currentUser');
    let isUserAdmin = false;

    if (window.currentUser && window.currentUser.role === 'admin') {
        isUserAdmin = true;
    } else if (userJson) {
        try {
            const parsedUser = JSON.parse(userJson);
            if (parsedUser.role === 'admin') {
                isUserAdmin = true;
            }
        } catch (e) {
            console.error("Не вдалося прочитати дані користувача з localStorage", e);
        }
    }

    products.forEach(product => {
        const prodId = product._id; 
        const isFavorite = favorites.some(item => (item._id === prodId));
        const heartIcon = isFavorite ? '❤️' : '🤍';

        const isFeatured = product.isFeatured || false;
        const starIcon = isFeatured ? '⭐ У топі' : '☆ Зробити популярним';

        let adminButtonsHTML = '';
        if (isUserAdmin) {
            adminButtonsHTML = `
                <div class="admin-controls-panel" style="margin-top: 8px; display: flex; flex-direction: column; gap: 5px;">
                    <button class="btn-toggle-featured" onclick="event.stopPropagation(); toggleFeatured('${prodId}')" style="width: 100%; background: #f1c40f; color: #2c3e50; border: none; padding: 6px; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 12px;">
                        ${starIcon}
                    </button>
                    <button class="btn-delete-admin" onclick="event.stopPropagation(); deleteProduct('${prodId}')" style="width: 100%; background: #e74c3c; color: white; border: none; padding: 6px; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 12px;">
                        🗑️ Видалити товар (Адмін)
                    </button>
                </div>
            `;
        }

        container.innerHTML += `
            <div class="product-card" style="position: relative;">
                <button class="btn-favorite" onclick="event.stopPropagation(); toggleFavorite('${prodId}')">${heartIcon}</button>
                
                <div onclick="openProductPage('${prodId}')" style="cursor: pointer;">
                    <img class="product-image" src="${(product.images && product.images.length > 0) ? product.images[0] : (product.image || 'https://via.placeholder.com/150')}" alt="${product.name}">
                    <div class="product-title">${product.name}</div>
                    <div class="product-desc">${product.description || ''}</div>
                </div>

                <div class="product-footer-row">
                    <div class="product-price">${product.price} грн</div>
                    <button class="btn-cart-icon" onclick="event.stopPropagation(); animateAndAddToCart(this, '${prodId}')">
                        <span class="cart-icon-symbol">🛒</span>
                    </button>
                </div>

                ${adminButtonsHTML}
            </div>
        `;
    });
    }
