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
 🔥 ФУНКЦІЯ ЖИВОГО ПОШУКУ (ВИПРАВЛЕНА)
function handleSearch() {
    const searchInput = document.getElementById('search-input');
    if (!searchInput) return;
    
    const query = searchInput.value.trim().toLowerCase();
    
    const catalogPage = document.getElementById('page-catalog');
    const categoriesGrid = document.querySelector('.categories-catalog-grid');
    const innerCategoryWrapper = document.getElementById('inner-category-products-wrapper');
    const title = document.getElementById('current-category-title');

    // 1. Якщо користувач почав писати і він не в каталозі — перемикаємо на каталог
    if (query.length > 0 && (!catalogPage || !catalogPage.classList.contains('active'))) {
        switchPage('catalog');
    }

    // 2. Логіка відображення, якщо в пошуку щось є
    if (query.length > 0) {
        // Ховаємо великі картки категорій (щоб товари не залізали під них)
        if (categoriesGrid) categoriesGrid.style.display = 'none';
        
        // Показуємо блок із сіткою товарів
        if (innerCategoryWrapper) innerCategoryWrapper.style.display = 'block';
        
        // Змінюємо заголовок, щоб було зрозуміло, що це пошук
        if (title) title.innerText = '🔍 Результати пошуку';

        // Фільтруємо товари з глобального масиву allProducts
        const filteredProducts = allProducts.filter(product => {
            const nameMatches = product.name && product.name.toLowerCase().includes(query);
            const descMatches = product.description && product.description.toLowerCase().includes(query);
            return nameMatches || descMatches;
        });

        // Виводимо знайдені товари
        renderProducts(filteredProducts, 'catalog-products');

    } else {
        // 3. Якщо пошуковий рядок порожній (користувач усе стер)
        // Перевіряємо, чи ми зараз у режимі результатів пошуку
        if (title && title.innerText === '🔍 Результати пошуку') {
            // Повертаємо назад початковий вигляд каталогу з категоріями
            if (categoriesGrid) categoriesGrid.style.display = 'flex';
            if (innerCategoryWrapper) innerCategoryWrapper.style.display = 'none';
            if (title) title.innerText = '';
        }
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

function openProductPage(productId) {
    const product = allProducts.find(p => p._id === productId);
    if (!product) {
        console.error("Товар не знайдено з ID:", productId);
        return;
    }
    renderProductDetailPage(product);
    switchPage('product');
}

function renderProductDetailPage(product) {
    const container = document.getElementById('product-detail-container');
    if (!container) return;

    const images = product.images && product.images.length > 0 
        ? product.images 
        : [product.image || 'https://via.placeholder.com/400'];

    let thumbnailsHTML = '';
    if (images.length > 1) {
        images.forEach((imgUrl, index) => {
            thumbnailsHTML += `
                <img class="thumb-img ${index === 0 ? 'active' : ''}" 
                     src="${imgUrl}" 
                     alt="Прев'ю ${index + 1}" 
                     onclick="changeMainImage(this, '${imgUrl}')">
            `;
        });
    }

    // УНІВЕРСАЛЬНІ РОЗМІРИ ЗА КАТЕГОРІЯМИ
    selectedProductSize = null; 
    let sizesSectionHTML = ''; 
    const category = product.category ? product.category.toLowerCase() : 'all';

    if (category === 'shoes' || category === 'взуття') {
        const availableSizes = product.sizes && product.sizes.length > 0 ? product.sizes : [39, 40, 41, 42, 43];
        let sizesGrid = '';
        availableSizes.forEach(size => {
            sizesGrid += `<button class="size-chip" onclick="selectSize(this, '${size}')">${size}</button>`;
        });
        sizesSectionHTML = `
            <div class="size-selector-section">
                <div class="section-label">Оберіть розмір взуття:</div>
                <div class="sizes-grid">${sizesGrid}</div>
            </div>
        `;
    } else if (category === 'clothes' || category === 'одяг') {
        const availableSizes = product.sizes && product.sizes.length > 0 ? product.sizes : ['S', 'M', 'L', 'XL'];
        let sizesGrid = '';
        availableSizes.forEach(size => {
            sizesGrid += `<button class="size-chip" onclick="selectSize(this, '${size}')">${size}</button>`;
        });
        sizesSectionHTML = `
            <div class="size-selector-section">
                <div class="section-label">Оберіть розмір одягу:</div>
                <div class="sizes-grid">${sizesGrid}</div>
            </div>
        `;
    } else {
        sizesSectionHTML = ''; // Ховаємо для аксесуарів
    }

    const specs = product.specs || {
        "Категорія": product.category || "Спорт",
        "Бренд": product.brand || "Original",
        "Наявність": "На складі"
    };
    
    let specsHTML = '';
    for (let key in specs) {
        specsHTML += `<li><strong>${key}:</strong> <span>${specs[key]}</span></li>`;
    }

    container.innerHTML = `
        <div class="product-page-container">
            <div class="product-media-gallery">
                <div class="main-image-wrapper">
                    <img id="mainProductImage" src="${images[0]}" alt="${product.name}">
                </div>
                <div class="thumbnails-container">
                    ${thumbnailsHTML}
                </div>
            </div>

            <div class="product-info-order">
                <h1 class="single-product-title">${product.name}</h1>
                
                <div class="product-status-badge">
                    <span class="status-dot"></span> В наявності
                </div>

                <div class="single-product-price">${product.price} грн</div>

                ${sizesSectionHTML}

                <button class="btn-main-buy" onclick="addToCartFromPage('${product._id}')">
                    <span>🛒 Додати в кошик</span>
                </button>
            </div>
        </div>

        <div class="product-details-tabs">
            <div class="tabs-header">
                <button class="tab-btn active" onclick="switchTab(event, 'tab-description')">Опис</button>
                <button class="tab-btn" onclick="switchTab(event, 'tab-specs')">Характеристики</button>
            </div>
            
            <div class="tab-content active" id="tab-description">
                <p>${product.description || 'Опис цього товару незабаром з\'явиться.'}</p>
            </div>
            
            <div class="tab-content" id="tab-specs">
                <ul class="specs-list">
                    ${specsHTML}
                </ul>
            </div>
        </div>
    `;
}
function getSortedProductsForCatalog(productsList) {
    return [...productsList].sort((a, b) => {
        const aFeatured = a.isFeatured ? 1 : 0;
        const bFeatured = b.isFeatured ? 1 : 0;
        return bFeatured - aFeatured;
    });
}


