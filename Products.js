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

function updateFeaturedProductsUI() {
    const featuredContainer = document.getElementById('featured-products');
    if (!featuredContainer) return;

    if (!allProducts || allProducts.length === 0) {
        featuredContainer.innerHTML = '<p class="empty-message">Товарів не знайдено</p>';
        return;
    }

    const featuredProducts = allProducts.filter(product => product.isFeatured === true);

    if (featuredProducts.length === 0) {
        featuredContainer.className = ''; 
        featuredContainer.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 40px 20px; color: #7f8c8d; font-style: italic;">
                ✨ Список популярних товарів зараз оновлюється адміністратором...
            </div>
        `;
    } else {
        featuredContainer.className = 'products-grid';
        renderProducts(featuredProducts, 'featured-products');
    }
}

function filterProducts(category, button) {
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');
    
    let filtered = allProducts;
    if (category !== 'all') {
        filtered = allProducts.filter(p => p.category === category);
    }
    
    const sortedAndFiltered = getSortedProductsForCatalog(filtered);
    renderProducts(sortedAndFiltered, 'catalog-products');
}

function getSortedProductsForCatalog(productsList) {
    return [...productsList].sort((a, b) => {
        const aFeatured = a.isFeatured ? 1 : 0;
        const bFeatured = b.isFeatured ? 1 : 0;
        return bFeatured - aFeatured;
    });
                       }
