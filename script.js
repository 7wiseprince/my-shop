       let allProducts = [];
let cart = [];
let favorites = []; // Масив для зберігання улюблених товарів

// НАВІГАЦІЯ: перемикання між сторінками
function switchPage(pageId) {
    if (pageId === 'favorites'){
        updateFavoritesUI();
    }
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => {
        page.classList.remove('active');
    });

    const activePage = document.getElementById('page-' + pageId);
    if (activePage) {
        activePage.classList.add('active');
    } else {
        console.error("Не знайдено сторінку: page-" + pageId);
    }
}

// Завантаження товарів із сервера
async function loadProducts() {
    try {
        const response = await fetch('/api/products');
        allProducts = await response.json();
        
        // Сортуємо глобальний масив і виводимо в каталог
        const sortedProducts = getSortedProductsForCatalog(allProducts);
        renderProducts(sortedProducts, 'catalog-products');
        
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

    if (window.currentUser && window.currentUser.isAdmin) {
        isUserAdmin = true;
    } else if (userJson) {
        try {
            const parsedUser = JSON.parse(userJson);
            if (parsedUser.isAdmin || parsedUser.role === 'admin') {
                isUserAdmin = true;
            }
        } catch (e) {
            console.error("Не вдалося прочитати дані користувача з localStorage", e);
        }
    }

    products.forEach(product => {
        const prodId = product.id; 
        const isFavorite = favorites.some(item => (item.id == prodId || item._id == product._id));
        const heartIcon = isFavorite ? '❤️' : '🤍';

        const isFeatured = product.isFeatured || false;
        const starIcon = isFeatured ? '⭐ У топі' : '☆ Зробити популярним';

        let adminButtonsHTML = '';
        if (isUserAdmin) {
            adminButtonsHTML = `
                <div class="admin-controls-panel" style="margin-top: 8px; display: flex; flex-direction: column; gap: 5px;">
                    <button class="btn-toggle-featured" onclick="event.stopPropagation(); toggleFeatured('${prodId}')" style="width: 100%; background: #f1c40f; color: #2c3e50; border: none; padding: 6px; border-radius: 5px; cursor: pointer; font-size: 11px; font-weight: bold; box-shadow: 0 2px 4px rgba(241, 196, 15, 0.2);">
                        ${starIcon}
                    </button>
                    <button class="btn-delete-admin" onclick="event.stopPropagation(); deleteProduct('${prodId}')" style="width: 100%; background: #e74c3c; color: white; border: none; padding: 6px; border-radius: 5px; cursor: pointer; font-size: 11px; font-weight: bold; box-shadow: 0 2px 4px rgba(231, 76, 60, 0.2);">
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

let uploadedImages = [];

function openCloudinaryWidget() {
    cloudinary.openUploadWidget({
        cloudName: 'dmjlqld7u',       
        uploadPreset: 'ml_default',   
        multiple: true,
        clientAllowedFormats: ["png", "jpeg", "jpg", "webp"],
        maxFiles: 5
    }, (error, result) => {
        if (!error && result && result.event === "success") {
            console.log('Фото успішно додано:', result.info.secure_url);
            uploadedImages.push(result.info.secure_url);
            alert(`📸 Фото завантажено! Всього додано: ${uploadedImages.length} шт.`);
        }
    });
}

const addProductForm = document.getElementById('addProductForm');
if (addProductForm) {
    addProductForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const productData = {
            name: document.getElementById('p-name').value,
            price: document.getElementById('p-price').value,
            category: document.getElementById('p-category').value,
            images: uploadedImages, 
            description: document.getElementById('p-desc').value
        };

        try {
            const token = localStorage.getItem('sneakers_token');

            const response = await fetch('/api/products', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify(productData)
            });

            if (!response.ok) {
                alert(`🔴 Помилка доступу! Статус сервера: ${response.status}. Перевірте, чи ви авторизовані як адмін.`);
                return;
            }

            const result = await response.json();
            
            if (result.success) {
                alert(result.message);
                document.getElementById('addProductForm').reset();
                uploadedImages = [];
                if (typeof loadProducts === 'function') loadProducts();
                if (typeof switchPage === 'function') switchPage('catalog');
            } else {
                alert("Помилка сервера: " + (result.error || result.message || "Невідома㳑 помилка"));
            }
        } catch (err) {
            alert("Критична помилка мережі: " + err.message);
        }
    });
}

function toggleFavorite(productId) {
    const product = allProducts.find(p => (p._id === productId || p.id === productId || p.id == productId));
    if (!product) return;

    const index = favorites.findIndex(item => (item._id === productId || item.id === productId || item.id == productId));

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
        const uId = currentUser._id || currentUser.id;
        
        fetch('/api/favorites', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: uId,     
                favorites: favorites    
            })
        })
        .then(res => res.json())
        .then(data => console.log(data.message))
        .catch(err => console.error('Помилка збереження обраного:', err));
    }
}
                                  
function updateFavoritesUI() {
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

function addToCart(productId, chosenSize = null) {
    const product = allProducts.find(p => (p._id === productId || p.id === productId || p.id == productId));
    if (!product) return;

    const cartItem = cart.find(item => 
        (item._id === productId || item.id === productId || item.id == productId) && 
        (item.selectedSize === chosenSize)
    );

    if (cartItem) {
        cartItem.quantity = (cartItem.quantity || 1) + 1;
    } else {
        cart.push({ ...product, quantity: 1, selectedSize: chosenSize });
    }

    if (typeof updateCartUI === 'function') {
        updateCartUI();
    }
}
    
function removeFromCart(index) {
    cart.splice(index, 1); 
    updateCartUI();
}

function toggleCart(show) {
    const cartModal = document.getElementById('cartModal');
    if (cartModal) {
        cartModal.style.display = show ? 'flex' : 'none';
    }
} 

function updateCartUI() {
    const listContainer = document.getElementById('cart-items-container');
    if (!listContainer) return;
    
    listContainer.innerHTML = '';
    let total = 0;

    const topContinueBtn = document.getElementById('top-continue-shopping');
    const checkoutForm = document.getElementById('checkout-form-container');
    const paymentBlock = document.querySelector('.payment-methods');
    const codButton = document.getElementById('main-checkout-btn');
    const paypalContainer = document.getElementById('paypal-button-container');

    if (cart.length === 0) {
        listContainer.innerHTML = '<p class="empty-message">Кошик порожній</p>';
        if (topContinueBtn) topContinueBtn.style.display = 'none';
        if (checkoutForm) checkoutForm.style.display = 'none';
        if (paymentBlock) paymentBlock.style.display = 'none';
        if (codButton) codButton.style.display = 'none';
        if (paypalContainer) paypalContainer.innerHTML = ''; 
    } else {
        if (topContinueBtn) topContinueBtn.style.display = 'block';
        if (checkoutForm) checkoutForm.style.display = 'block';
        if (paymentBlock) paymentBlock.style.display = 'block';

        const selectedPayment = document.querySelector('input[name="payment-method"]:checked');
        const currentMethod = selectedPayment ? selectedPayment.value : 'cod';
        handlePaymentMethodChange(currentMethod);

        cart.forEach((item, index) => {
            total += Number(item.price) * (item.quantity || 1);
            
            // ЧІТКО: генеруємо бейдж розміру, якщо він вибраний
            const sizeText = item.selectedSize ? ` <span style="font-size: 11px; background: #e0e0e0; padding: 2px 6px; border-radius: 4px; margin-left: 5px; color: #333; font-weight: normal;">Розмір: ${item.selectedSize}</span>` : '';
            const quantityText = item.quantity > 1 ? ` <span style="color: #666; font-weight: bold;">(x${item.quantity})</span>` : '';
            const itemTotalPrice = Number(item.price) * (item.quantity || 1);

            listContainer.innerHTML += `
                <div class="cart-item">
                    <div class="cart-item-info">
                        <div class="cart-item-title">${item.name}${sizeText}${quantityText}</div>
                        <div class="cart-item-price">${itemTotalPrice} грн</div>
                    </div>
                    <button class="btn-remove" onclick="removeFromCart(${index})">🗑️</button>
                </div>
            `;
        });
    }
    
    const totalPriceElement = document.getElementById('cart-total-price');
    if (totalPriceElement) {
        totalPriceElement.innerText = `Загалом: ${total} грн`;
    }

    if (total > 0 && typeof paypal !== 'undefined') {
        const selectedPayment = document.querySelector('input[name="payment-method"]:checked');
        if (selectedPayment && selectedPayment.value === 'online') {
            renderPayPalButton(total);
        }
    }

    if (document.getElementById('main-checkout-btn') && document.getElementById('main-checkout-btn').style.display === 'block') {
        handlePaymentMethodChange('cod');
    } else {
        handlePaymentMethodChange('online');
    }
    updateCartBadge(); 
}

function handlePaymentMethodChange(method) {
    const paypalContainer = document.getElementById('paypal-button-container');
    const codButton = document.getElementById('main-checkout-btn');
    const codWarning = document.getElementById('cod-warning-text'); 
    
    const subtotal = cart.reduce((sum, item) => sum + (Number(item.price) * (item.quantity || 1)), 0);
    
    if (cart.length === 0) return;

    if (method === 'online') {
        if (paypalContainer) paypalContainer.style.display = 'block';
        if (codButton) codButton.style.display = 'none';
        if (codWarning) codWarning.style.display = 'none'; 
        
        document.getElementById('cart-total-price').innerText = `${subtotal} грн`;
        if (subtotal > 0) renderPayPalButton(subtotal);
    } else {
        if (paypalContainer) paypalContainer.style.display = 'none';
        if (codButton) codButton.style.display = 'block';
        
        const commission = 20 + (subtotal * 0.02);
        const totalWithCommission = subtotal + commission;

        const totalElement = document.getElementById('cart-total-price');
        if (totalElement) totalElement.innerText = `${totalWithCommission.toFixed(0)} грн`;

        if (codWarning) {
            codWarning.style.display = 'block';
            codWarning.innerText = `⚠️ При післяплаті нараховується комісія: ${commission.toFixed(0)} грн (вже враховано в сумі)`;
        }
    }
}
    
function submitOrderCOD() {
    const name = document.getElementById('order-name').value.trim();
    const phone = document.getElementById('order-phone').value.trim();
    const delivery = document.getElementById('order-delivery').value.trim();

    if (!name || !phone || !delivery) {
        alert('Будь ласка, заповніть всі поля для доставки!');
        return;
    }

    const subtotal = cart.reduce((sum, item) => sum + (Number(item.price) * (item.quantity || 1)), 0);
    const commission = 20 + (subtotal * 0.02);
    const finalTotal = subtotal + commission;

    const buyerName = currentUser ? `${name} (${currentUser.name})` : name;

    const orderData = {
        customerName: `${buyerName} | Tel: ${phone} | Доставка: ${delivery}`,
        // Важливо: передаємо розміри у замовлення для адміна на сервер
        items: cart.map(item => ({ 
            name: item.selectedSize ? `${item.name} (Розмір: ${item.selectedSize})` : item.name, 
            price: item.price, 
            quantity: item.quantity || 1 
        })),
        total: Math.round(finalTotal),
        paymentMethod: "післяплата",
        status: "Очікує оплати при отриманні"
    };

    fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
    })
    .then(response => response.json())
    .then(data => {
        showSuccessModal();
        document.getElementById('order-name').value = '';
        document.getElementById('order-phone').value = '';
        document.getElementById('order-delivery').value = '';
        cart = [];
        updateCartUI();
    })
    .catch(err => {
        console.error('Помилка сервера:', err);
        alert('Не вдалося зберегти замовлення.');
    });
}
    
function renderPayPalButton(totalUah) {
    const usdRate = 40;
    const totalUsd = (totalUah / usdRate).toFixed(2);
    document.getElementById('paypal-button-container').innerHTML = '';
    
    paypal.Buttons({
        onClick: function(data, actions) {
            const name = document.getElementById('order-name').value.trim();
            const phone = document.getElementById('order-phone').value.trim();
            const delivery = document.getElementById('order-delivery').value.trim();

            if (!name || !phone || !delivery) {
                alert('Будь ласка, заповніть всі поля для доставки перед оплатою!');
                return actions.reject();
            }
            return actions.resolve();
        },
        createOrder: function(data, actions) {
            return actions.order.create({ purchase_units: [{ amount: { value: totalUsd } }] });
        },
        onApprove: function(data, actions) {
            return actions.order.capture().then(function(details) {
                const name = document.getElementById('order-name').value.trim();
                const phone = document.getElementById('order-phone').value.trim();
                const delivery = document.getElementById('order-delivery').value.trim();

                const orderData = {
                    customerName: `${name} | Тел: ${phone} | Доставка: ${delivery}`,
                    items: cart.map(item => ({ 
                        name: item.selectedSize ? `${item.name} (Розмір: ${item.selectedSize})` : item.name, 
                        price: item.price,
                        quantity: item.quantity || 1
                    })),
                    total: totalUah
                };

                fetch('/api/orders', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(orderData)
                })
                .then(response => response.json())
                .then(data => {
                    showSuccessModal();
                    document.getElementById('order-name').value = '';
                    document.getElementById('order-phone').value = '';
                    document.getElementById('order-delivery').value = '';
                    cart = []; 
                    updateCartUI(); 
                    toggleCart(false);
                })
                .catch(err => {
                    console.error('Помилка відправки замовлення:', err);
                    alert('Оплата пройшла, але виникла помилка при збереженні замовлення на сервері.');
                });
            });
        }
    }).render('#paypal-button-container');
                   }



function toggleAdmin() {
    const adminPage = document.getElementById('page-admin');
    if (adminPage && adminPage.classList.contains('active')) {
        switchPage('home');
        return;
    }
    if (currentUser && currentUser.role === 'admin') {
        switchPage('admin'); 
        loadAdminOrders();
    }
}

function submitAdminLogin() {
    const passwordInput = document.getElementById('admin-password-input').value;
    const errorMsg = document.getElementById('login-error-msg');

    if (passwordInput === "1111") { 
        if (errorMsg) errorMsg.style.display = 'none';
        switchPage('admin'); 
        loadAdminOrders();
    } else {
        if (errorMsg) errorMsg.style.display = 'block';
    }
}
    
async function loadAdminOrders() {
    const container = document.getElementById('admin-orders-list');
    if (!container) return;

    try {
        const token = localStorage.getItem('sneakers_token');

        const response = await fetch('/api/orders', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Не вдалося завантажити замовлення');
        }

        const orders = await response.json();

        if (!orders || orders.length === 0) {
            container.innerHTML = '<p style="color: #7f8c8d; text-align:center; padding: 20px;">📦 Замовлень поки немає</p>';
            return;
        }

        container.innerHTML = '';
        orders.forEach(order => {
            let itemsHtml = '';
            if (order.items && Array.isArray(order.items)) {
                itemsHtml = order.items.map(item => `<li>${item.name} — ${item.price} грн</li>`).join('');
            } else {
                itemsHtml = '<li>Товари не вказані</li>';
            }
            
            container.innerHTML += `
                <div style="background: #f8f9f9; padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 5px solid #27ae60; text-align: left; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                    <div style="display: flex; justify-content: space-between; font-weight: bold; color: #2c3e50; margin-bottom: 8px;">
                        <span>Замовлення №${order.id || '---'}</span>
                        <span style="color: #27ae60;">${order.status || 'Оплачено'}</span>
                    </div>
                    <p style="margin: 5px 0; font-size: 14px; color: #566573;"><strong>Покупець:</strong> ${order.customerName || 'Невідомо'}</p>
                    <p style="margin: 5px 0; font-size: 14px; color: #566573;"><strong>Дата:</strong> ${order.date || '---'}</p>
                    <div style="margin-top: 10px; padding-left: 15px; font-size: 14px;">
                        <strong>Товари:</strong>
                        <ul style="margin: 5px 0; padding-left: 20px;">${itemsHtml}</ul>
                    </div>
                    <div style="text-align: right; font-weight: bold; margin-top: 10px; color: #2c3e50;">
                        Разом: ${order.total || 0} грн
                    </div>
                </div>
            `;
        });
    } catch (err) {
        console.error("Помилка завантаження замовлень:", err);
        container.innerHTML = `<p style="color: #e74c3c; text-align:center; padding: 20px;">❌ Помилка: ${err.message}</p>`;
    }
}
    

// 🔥 ФУНКЦІЯ ЖИВОГО ПОШУКУ (ВИПРАВЛЕНА)
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



let currentAuthMode = 'login'; 

function toggleAuthTab(mode) {
    currentAuthMode = mode;
    
    const tabLogin = document.getElementById('tab-login');
    const tabRegister = document.getElementById('tab-register');
    const nameGroup = document.getElementById('auth-name-group');
    const submitBtn = document.getElementById('btn-auth-submit');

    if (mode === 'register') {
        tabRegister.style.color = 'var(--primary-color)';
        tabRegister.style.borderBottom = '2px solid var(--primary-color)';
        tabLogin.style.color = '#7f8c8d';
        tabLogin.style.borderBottom = 'none';
        
        if (nameGroup) nameGroup.style.display = 'block';
        if (submitBtn) submitBtn.innerText = 'Зареєструватися';
    } else {
        tabLogin.style.color = 'var(--primary-color)';
        tabLogin.style.borderBottom = '2px solid var(--primary-color)';
        tabRegister.style.color = '#7f8c8d';
        tabRegister.style.borderBottom = 'none';
        
        if (nameGroup) nameGroup.style.display = 'none';
        if (submitBtn) submitBtn.innerText = 'Увійти';
    }
}

let currentUser = null; 

function handleAuth() {
    const name = document.getElementById('auth-name').value.trim();
    const email = document.getElementById('auth-email').value.trim();
    const password = document.getElementById('auth-password').value.trim();

    if (!email || !password) {
        alert('Будь ласка, заповніть Email та Пароль!');
        return;
    }
    if (currentAuthMode === 'register' && !name) {
        alert('Будь ласка, вкажіть ваше ім\'я для реєстрації!');
        return;
    }

    const url = currentAuthMode === 'register' ? '/api/register' : '/api/login';
    const authData = { email, password };
    if (currentAuthMode === 'register') {
        authData.name = name;
    }

    fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authData)
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => { throw new Error(err.message); });
        }
        return response.json();
    })
    .then(data => {
        alert(data.message);
        
        if (data.token) {
            localStorage.setItem('sneakers_token', data.token); 
        }
        if (data.user) {
            localStorage.setItem('currentUser', JSON.stringify(data.user)); 
        }
        
        currentUser = data.user;
        window.currentUser = data.user; 

        if (typeof allProducts !== 'undefined' && typeof loadProducts === 'function') {
            loadProducts();
        }

        showUserCabinet();
    })
    .catch(error => {
        console.error('Помилка авторизації:', error);
        alert(error.message || 'Щось пішло не так...');
    });
}

function showUserCabinet() {
    if (!currentUser) return;

    document.getElementById('auth-container').style.display = 'none';
    document.getElementById('user-cabinet').style.display = 'block';

    document.getElementById('cabinet-user-name').innerText = `Привіт, ${currentUser.name}!`;
    document.getElementById('cabinet-user-email').innerText = currentUser.email;

    if (currentUser.favorites) {
        favorites = currentUser.favorites;
        updateFavoritesUI();
        updateCabinetFavoritesUI();
    }
            
    document.getElementById('auth-name').value = '';
    document.getElementById('auth-email').value = '';
    document.getElementById('auth-password').value = '';
}

function logout() {
    currentUser = null;
    localStorage.removeItem('sneakers_token');
    document.getElementById('auth-container').style.display = 'block';
    document.getElementById('user-cabinet').style.display = 'none';
    toggleAuthTab('login');
}

function autoLogin() {
    const token = localStorage.getItem('sneakers_token');
    if (!token) return;

    fetch('/api/me', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}` 
        }
    })
    .then(response => {
        if (!response.ok) {
            localStorage.removeItem('sneakers_token');
            throw new Error('Сесія застаріла');
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            currentUser = data.user; 
            showUserCabinet();       
        }
    })
    .catch(err => console.log('Гість або помилка автологіну:', err.message));
}

autoLogin();
                    
function showSuccessModal() {
    toggleCart(false);
    const successModal = document.getElementById('success-modal');
    if (successModal) successModal.style.display = 'flex';
}

function closeSuccessModal() {
    const successModal = document.getElementById('success-modal');
    if (successModal) successModal.style.display = 'none';
    cart = [];
    updateCartUI();
    switchPage('home'); 
}

async function deleteProduct(productId) {
    if (!confirm("⚠️ Ви впевнені, що хочете назавжди видалити цей товар з бази даних?")) return;

    try {
        const token = localStorage.getItem('sneakers_token');

        const response = await fetch(`/api/products/${productId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            alert(`🔴 Не вдалося видалити. Статус сервера: ${response.status}`);
            return;
        }

        const result = await response.json();

        if (result.success) {
            alert("🗑️ " + result.message);
            if (typeof loadProducts === 'function') loadProducts(); 
        } else {
            alert("Помилка видалення: " + result.error);
        }
    } catch (err) {
        console.error("Помилка при видаленні товару:", err);
        alert("Не вдалося видалити товар. Сервер недоступний.");
    }
}
    
function updateCartBadge() {
    const currentCart = (typeof cart !== 'undefined') ? cart : (JSON.parse(localStorage.getItem('cart')) || []);
    const totalItems = currentCart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    
    const badge = document.getElementById('cart-count-badge');
    if (badge) {
        badge.innerText = totalItems;
        if (totalItems === 0) {
            badge.style.display = 'none';
        } else {
            badge.style.display = 'flex';
        }
    }
}

// Чиста функція відкриття / закриття шторки



       // Функція відкриття/закриття шторки
// ЧИСТА ФУНКЦІЯ ВІДКРИТТЯ / ЗАКРИТТЯ ШТОРКИ
function toggleBurgerMenu(event) {
    if (event) event.preventDefault(); // Зупиняємо стрибки сторінки через href="#"
    const menu = document.getElementById('mobile-burger-menu');
    if (menu) {
        menu.classList.toggle('open');
    }
}

// СИНХРОНІЗОВАНА НАВІГАЦІЯ ДЛЯ БУРГЕР-МЕНЮ (БЕЗ КОНФЛІКТІВ)
// ОНОВЛЕНА НАВІГАЦІЯ БУРГЕРА (ПІД ТВОЮ СИСТЕМУ SWITCHPAGE)
function clickBurgerLink(event, pageId) {
    if (event) event.preventDefault(); // Повністю блокуємо смикання екрану

    // 1. Одразу ховаємо шторку меню назад
    const menu = document.getElementById('mobile-burger-menu');
    if (menu) menu.classList.remove('open');

    // 2. Якщо натиснули на Кошик — відкриваємо кошик
    if (pageId === 'page-cart') {
        if (typeof toggleCart === 'function') toggleCart(true);
        return;
    }

    // 3. Перемикаємо сторінку через твою рідну функцію switchPage
    if (typeof switchPage === 'function') {
        switchPage(pageId);
    }
}



                        



                    async function toggleFeatured(productId) {
    try {
        const token = localStorage.getItem('sneakers_token');

        if (!token) {
            alert("Помилка безпеки: Токен сесії відсутній. Будь ласка, перезайдіть в адмінку.");
            return;
        }

        const response = await fetch(`/api/products/toggle-featured/${productId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            }
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || `Сервер повернув помилку: ${response.status}`);
        }

        allProducts = allProducts.map(p => {
            if (p.id == productId) {
                return { ...p, isFeatured: data.product.isFeatured };
            }
            return p;
        });

        updateFeaturedProductsUI();
        
        const activeFilterBtn = document.querySelector('.filter-btn.active');
        if (activeFilterBtn) {
            const categoryText = activeFilterBtn.innerText.trim();
            if (categoryText.includes("Взуття")) filterProducts('shoes', activeFilterBtn);
            else if (categoryText.includes("Одяг")) filterProducts('clothes', activeFilterBtn);
            else if (categoryText.includes("Аксесуари")) filterProducts('accessories', activeFilterBtn);
            else filterProducts('all', activeFilterBtn);
        } else {
            const sortedProducts = getSortedProductsForCatalog(allProducts);
            renderProducts(sortedProducts, 'catalog-products');
        }

    } catch (error) {
        console.error("Помилка toggleFeatured:", error);
        alert(error.message || "Не вдалося зберегти зміни. Спробуйте ще раз.");
    }
}

function animateAndAddToCart(buttonElement, productId) {
    if (buttonElement.classList.contains('added-pulse')) return;

    buttonElement.classList.add('added-pulse');
    const iconSpan = buttonElement.querySelector('.cart-icon-symbol');
    if (iconSpan) iconSpan.innerText = '✔️';

    if (typeof addToCart === 'function') {
        addToCart(productId);
    }

    setTimeout(() => {
        buttonElement.classList.remove('added-pulse');
        if (iconSpan) iconSpan.innerText = '🛒';
    }, 450);
}

function openProductPage(productId) {
    const product = allProducts.find(p => p.id == productId || p._id == productId);
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

                <button class="btn-main-buy" onclick="addToCartFromPage('${product.id}')">
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

// --- ДОПОМІЖНІ ФУНКЦІЇ ДЛЯ ІНТЕРАКТИВУ ---
function changeMainImage(thumbElement, newSrc) {
    document.getElementById('mainProductImage').src = newSrc;
    document.querySelectorAll('.thumb-img').forEach(img => img.classList.remove('active'));
    thumbElement.classList.add('active');
}

let selectedProductSize = null;
function selectSize(buttonElement, size) {
    document.querySelectorAll('.size-chip').forEach(btn => btn.classList.remove('selected'));
    buttonElement.classList.add('selected');
    selectedProductSize = size; 
}

function switchTab(event, tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    event.currentTarget.classList.add('active');
}

function addToCartFromPage(productId) {
    const product = allProducts.find(p => p.id == productId || p._id == productId);
    if (!product) return;

    const category = product.category ? product.category.toLowerCase() : 'all';
    
    if ((category === 'shoes' || category === 'взуття' || category === 'clothes' || category === 'одяг') && !selectedProductSize) {
        alert('⚠️ Будь ласка, оберіть розмір перед додаванням у кошик!');
        return;
    }

    addToCart(productId, selectedProductSize);
    alert(`🛒 Товар додано в кошик! ${selectedProductSize ? '(Розмір: ' + selectedProductSize + ')' : ''}`);
}


// Функція, яка відкриває товари конкретної категорії в каталозі
function openCatalogCategory(category) {
    // 1. Ховаємо великі картки категорій
    document.querySelector('.categories-catalog-grid').style.display = 'none';
    
    // 2. Показуємо блок із товарами та кнопкою "Назад"
    document.getElementById('inner-category-products-wrapper').style.display = 'block';
    
    // 3. Міняємо заголовок під категорію
    const title = document.getElementById('current-category-title');
    if (category === 'shoes') title.innerText = '👟 Взуття';
    if (category === 'clothes') title.innerText = '👕 Одяг';
    if (category === 'accessories') title.innerText = '🎒 Аксесуари';

    // 4. Фільтруємо наші товари з бази і рендеримо їх у сітку
    const filtered = allProducts.filter(p => p.category && p.category.toLowerCase() === category);
    renderProducts(filtered, 'catalog-products');
}

// Функція повернення назад до вибору категорій
function backToCatalogCategories() {
    // Показуємо картки категорій назад
    document.querySelector('.categories-catalog-grid').style.display = 'flex';
    // Ховаємо товари
    document.getElementById('inner-category-products-wrapper').style.display = 'none';
}






// Старт додатка
document.addEventListener("DOMContentLoaded", () => {
    loadProducts();
    loadAdminOrders(); 
    if (typeof updateCartUI === 'function') {
        updateCartUI(); 
    } else {
        updateCartBadge();
    }
});
