
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
// Завантаження товарів із сервера
async function loadProducts() {
    try {
        const response = await fetch('/api/products');
        allProducts = await response.json();
        
        // ЧЕТКО: Сортуємо глобальний масив і виводимо в каталог
        const sortedProducts = getSortedProductsForCatalog(allProducts);
        renderProducts(sortedProducts, 'catalog-products');
        
        // ОБОВ'ЯЗКОВО: Оновлюємо популярні товари на головній сторінці при завантаженні
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

    // 📱 ВМИКАЄМО НАШУ УНІВЕРСАЛЬНУ ДВІЙКОВУ СІТКУ!
    container.className = 'products-grid';

    // 🕵️‍♂️ ПЕРЕВІРКА НА АДМІНА
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
        const prodId = product._id || product.id;
        const isFavorite = favorites.some(item => (item._id === prodId || item.id === prodId || item.id == prodId));
        const heartIcon = isFavorite ? '❤️' : '🤍';

        const featuredIds = JSON.parse(localStorage.getItem('featuredProductIds') || '[]');
        const isFeatured = featuredIds.includes(prodId);
        const starIcon = isFeatured ? '⭐ У топі' : '☆ Зробити популярним';

        let adminButtonsHTML = '';
        if (isUserAdmin) {
            adminButtonsHTML = `
                <div class="admin-controls-panel" style="margin-top: 8px; display: flex; flex-direction: column; gap: 5px;">
                    <button class="btn-toggle-featured" onclick="event.stopPropagation(); toggleFeatured('${prodId}')" style="width: 100%; background: #f1c40f; color: #2c3e50; border: none; padding: 6px; border-radius: 5px; cursor: pointer; font-size: 11px; font-weight: bold; box-shadow: 0 2px 4px rgba(241, 196, 15, 0.2);">
                        ${starIcon}
                    </button>
                    <button class="btn-delete-admin" onclick="event.stopPropagation(); deleteProduct('${product.id || prodId}')" style="width: 100%; background: #e74c3c; color: white; border: none; padding: 6px; border-radius: 5px; cursor: pointer; font-size: 11px; font-weight: bold; box-shadow: 0 2px 4px rgba(231, 76, 60, 0.2);">
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

                <div class="product-price">${product.price} грн</div>
                <button class="btn-add-to-cart" onclick="event.stopPropagation(); addToCart('${prodId}')">Додати в кошик</button>

                ${adminButtonsHTML}
            </div>
        `;
    });
}

function updateFeaturedProductsUI() {
    const featuredIds = JSON.parse(localStorage.getItem('featuredProductIds') || '[]');
    
    const featuredProducts = allProducts.filter(product => {
        const prodId = product._id || product.id;
        return featuredIds.includes(prodId);
    });

    if (featuredProducts.length === 0) {
        renderProducts(allProducts.slice(0, 2), 'featured-products');
    } else {
        renderProducts(featuredProducts, 'featured-products');
    }
}

// Фільтрація товарів за категоріями + АВТО-СОРТУВАННЯ В ТОП 🔝
function filterProducts(category, button) {
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');
    
    let filtered = allProducts;
    if (category !== 'all') {
        filtered = allProducts.filter(p => p.category === category);
    }
    
    // Пропускаємо товари через сортувалку, щоб зірочки завжди були вгорі!
    const sortedAndFiltered = getSortedProductsForCatalog(filtered);
    renderProducts(sortedAndFiltered, 'catalog-products');
}

function getSortedProductsForCatalog(productsList) {
    const featuredIds = JSON.parse(localStorage.getItem('featuredProductIds') || '[]');

    return [...productsList].sort((a, b) => {
        const aId = a._id || a.id;
        const bId = b._id || b.id;
        
        const aFeatured = featuredIds.includes(aId) ? 1 : 0;
        const bFeatured = featuredIds.includes(bId) ? 1 : 0;

        return bFeatured - aFeatured; 
    });
                                }
                                                                                                        

        // Додавання товару з адмінки
        // 📸 Створюємо тимчасовий масив, куди будемо зберігати посилання на завантажені фото

    // 📸 Створюємо масив для збереження посилань на фотографії
let uploadedImages = [];

// Функція для відкриття віджета Cloudinary
function openCloudinaryWidget() {
    cloudinary.openUploadWidget({
        cloudName: 'dmjlqld7u',       // Твій особистий Cloud Name
        uploadPreset: 'ml_default',   // Твій пресет (який ти зробив Unsigned)
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

// 🚀 ПРАВИЛЬНИЙ ОБРОБНИК ФОРМИ (БЕЗ БАГІВ)
document.getElementById('addProductForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const productData = {
        name: document.getElementById('p-name').value,
        price: document.getElementById('p-price').value,
        category: document.getElementById('p-category').value,
        images: uploadedImages, 
        description: document.getElementById('p-desc').value
    };

    try {
        // 🔑 БЕРЕМО ПРАВИЛЬНИЙ ТОКЕН З ТВОГО СХОВИЩА:
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
            alert("Помилка сервера: " + (result.error || result.message || "Невідома搬лка"));
        }
    } catch (err) {
        alert("Критична помилка мережі: " + err.message);
    }
});
    
    
    
    
    

     
    
    function toggleFavorite(productId) {
    // 🔍 ШУКАЄМО ТОВАР: враховуємо і p.id, і p._id (MongoDB)
    const product = allProducts.find(p => (p._id === productId || p.id === productId || p.id == productId));
    if (!product) return;

    // 🔍 ШУКАЄМО В ОБРАНОМУ: враховуємо формати ID
    const index = favorites.findIndex(item => (item._id === productId || item.id === productId || item.id == productId));

    if (index === -1) {
        favorites.push(product);
    } else {
        favorites.splice(index, 1);
    }

    // Оновлюємо зовнішній вигляд сайту
    updateFavoritesUI();
    if (typeof updateCabinetFavoritesUI === 'function') {
        updateCabinetFavoritesUI();
    }
    
    // ✨ ОНОВЛЕННЯ ВІТРИНИ: щоб після кліку сердечко відразу міняло колір з ❤️ на 🤍 або навпаки
    if (typeof allProducts !== 'undefined' && allProducts.length > 0) {
        renderProducts(allProducts, 'catalog-products');
        renderProducts(allProducts.slice(0, 2), 'featured-products');
    }

    // МАГІЯ: Якщо користувач авторизований, зберігаємо його обране на сервер
    if (currentUser) {
        // Беремо ID користувача, підтримуючи формат MongoDB (_id)
        const uId = currentUser._id || currentUser.id;
        
        fetch('/api/favorites', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: uId,     // Передаємо ID користувача
                favorites: favorites    // Передаємо оновлений масив товарів
            })
        })
        .then(res => res.json())
        .then(data => console.log(data.message))
        .catch(err => console.error('Помилка збереження обраного:', err));
    }
            }
                                  
    
    
    function updateFavoritesUI() {
    // 1. Отримуємо контейнер сторінки обраного і додаємо йому клас сітки
    const favoritesContainer = document.getElementById('favorites-products');
    if (favoritesContainer) favoritesContainer.className = 'products-grid';

    // Рендеримо товари з масиву обраного
    renderProducts(favorites, 'favorites-products');
    
    // Також оновлюємо товари на головній та в каталозі
    if (allProducts.length > 0) {
        // 2. Отримуємо контейнер каталогу і теж даємо йому клас сітки
        const catalogContainer = document.getElementById('catalog-products');
        if (catalogContainer) catalogContainer.className = 'products-grid';

        // 3. Контейнер популярних товарів (featured) на головній теж стає сіткою
        const featuredContainer = document.getElementById('featured-products');
        if (featuredContainer) featuredContainer.className = 'products-grid';

        renderProducts(allProducts, 'catalog-products');
        renderProducts(allProducts.slice(0, 2), 'featured-products');
    }
}

function updateCabinetFavoritesUI() {
    const cabinetList = document.getElementById('cabinet-favorites-list');
    if (!cabinetList) return; // Якщо такого контейнера немає в HTML, зупиняємо роботу

    // Замість старого довгого циклу з купою тексту просто викликаємо наш готовий рендер!
    // Він сам додасть сітку, сам намалює красиві картки, кнопки і сердечка.
    renderProducts(favorites, 'cabinet-favorites-list');
}


     
    // Функції кошика
      
    function addToCart(productId) {
    // 🔍 ШУКАЄМО ТОВАР: перевіряємо і p._id, і p.id
    const product = allProducts.find(p => (p._id === productId || p.id === productId || p.id == productId));
    if (!product) return;

    // 🔍 ШУКАЄМО В КОШИКУ: так само гнучко перевіряємо ID товарів, що вже всередині
    const cartItem = cart.find(item => (item._id === productId || item.id === productId || item.id == productId));

    if (cartItem) {
        // Якщо товар уже є, просто збільшуємо його кількість на 1
        cartItem.quantity = (cartItem.quantity || 1) + 1;
    } else {
        // Якщо товару немає, додаємо його і створюємо поле quantity зі значенням 1
        cart.push({ ...product, quantity: 1 });
    }

    // Оновлюємо інтерфейс кошика
    if (typeof updateCartUI === 'function') {
        updateCartUI();
    }
    }
    
    
    
    
        function removeFromCart(index) {
            cart.splice(index, 1); 
            updateCartUI();
        }

        function toggleCart(show) {
            // Підлаштовано під назву твого ID вікна кошика (cartModal)
            const cartModal = document.getElementById('cartModal');
            if (cartModal) {
                cartModal.style.display = show ? 'flex' : 'none';
            }
        } 

// 1. ГОЛОВНА ФУНКЦІЯ ОНОВЛЕННЯ КОШИКА
function updateCartUI() {
    const listContainer = document.getElementById('cart-items-container');
    if (!listContainer) return;
    
    listContainer.innerHTML = '';
    let total = 0;

    // Знаходимо елементи керування замовленням
    const topContinueBtn = document.getElementById('top-continue-shopping');
    const checkoutForm = document.getElementById('checkout-form-container');
    const paymentBlock = document.querySelector('.payment-methods');
    const codButton = document.getElementById('main-checkout-btn');
    const paypalContainer = document.getElementById('paypal-button-container');

    if (cart.length === 0) {
        // Якщо кошик порожній — виводимо текст і ХОВАЄМО ВСЕ зайве
        listContainer.innerHTML = '<p class="empty-message">Кошик порожній</p>';
        if (topContinueBtn) topContinueBtn.style.display = 'none';
        if (checkoutForm) checkoutForm.style.display = 'none';
        if (paymentBlock) paymentBlock.style.display = 'none';
        if (codButton) codButton.style.display = 'none';
        if (paypalContainer) paypalContainer.innerHTML = ''; 
    } else {
        // Якщо в кошику є товари — ПОКАЗУЄМО форму доставки та блок оплати
        if (topContinueBtn) topContinueBtn.style.display = 'block';
        if (checkoutForm) checkoutForm.style.display = 'block';
        if (paymentBlock) paymentBlock.style.display = 'block';

        // Перевіряємо, який спосіб оплати зараз обраний, і показуємо відповідну кнопку
        const selectedPayment = document.querySelector('input[name="payment-method"]:checked');
        const currentMethod = selectedPayment ? selectedPayment.value : 'cod';
        handlePaymentMethodChange(currentMethod);

        // Виводимо товари
        cart.forEach((item, index) => {
    // 1. Рахуємо загальну суму з урахуванням кількості товарів
    total += Number(item.price) * (item.quantity || 1);

    // 2. Створюємо напис кількості, якщо товарів більше ніж 1
    const quantityText = item.quantity > 1 ? ` <span style="color: #666; font-weight: bold;">(x${item.quantity})</span>` : '';

    // 3. Рахуємо фінальну ціну для цієї позиції (ціна * кількість)
    const itemTotalPrice = Number(item.price) * (item.quantity || 1);

    // 4. Виводимо в HTML (твоя рідна структура класів + нові змінні)
    listContainer.innerHTML += `
        <div class="cart-item">
            <div class="cart-item-info">
                <div class="cart-item-title">${item.name}${quantityText}</div>
                <div class="cart-item-price">${itemTotalPrice} грн</div>
            </div>
            <button class="btn-remove" onclick="removeFromCart(${index})">🗑️</button>
        </div>
    `;
});
            
    }
    
    // Оновлюємо загальну суму
    const totalPriceElement = document.getElementById('cart-total-price');
    if (totalPriceElement) {
        totalPriceElement.innerText = `Загалом: ${total} грн`;
    }

    // Якщо обрано PayPal і є сума — рендеримо кнопку PayPal
    if (total > 0 && typeof paypal !== 'undefined') {
        const selectedPayment = document.querySelector('input[name="payment-method"]:checked');
        if (selectedPayment && selectedPayment.value === 'online') {
            renderPayPalButton(total);
        }
    }
// Додай це в самий кінець функції updateCartUI, щоб сума завжди перераховувалась при видаленні товарів
if (document.getElementById('main-checkout-btn') && document.getElementById('main-checkout-btn').style.display === 'block') {
    handlePaymentMethodChange('cod');
} else {
    handlePaymentMethodChange('online');
}
   updateCartBadge(); 
    
}

// 2. ФУНКЦІЯ ПЕРЕМИКАННЯ КНОПОК ОПЛАТИ
function handlePaymentMethodChange(method) {
    const paypalContainer = document.getElementById('paypal-button-container');
    const codButton = document.getElementById('main-checkout-btn');
    const codWarning = document.getElementById('cod-warning-text'); 
    
    // Рахуємо чисту суму товарів
    // Тепер ціна кожного товару множиться на його кількість у кошику!
const subtotal = cart.reduce((sum, item) => sum + (Number(item.price) * (item.quantity || 1)), 0);
    
    if (cart.length === 0) return;

    if (method === 'online') {
        if (paypalContainer) paypalContainer.style.display = 'block';
        if (codButton) codButton.style.display = 'none';
        if (codWarning) codWarning.style.display = 'none'; 
        
        // Виводим звичайну суму без комісії
        document.getElementById('cart-total-price').innerText = `${subtotal} грн`;
        if (subtotal > 0) renderPayPalButton(subtotal);
    } else {
        if (paypalContainer) paypalContainer.style.display = 'none';
        if (codButton) codButton.style.display = 'block';
        
        // МАГІЯ: Рахуємо комісію післяплати (20 грн + 2%)
        const commission = 20 + (subtotal * 0.02);
        const totalWithCommission = subtotal + commission;

        // Оновлюємо суму на екрані (заміни 'cart-total-price' на свій ID суми, якщо він інший)
        const totalElement = document.getElementById('cart-total-price');
        if (totalElement) totalElement.innerText = `${totalWithCommission.toFixed(0)} грн`;

        // Виводимо красиву підказку про комісію
        if (codWarning) {
            codWarning.style.display = 'block';
            codWarning.innerText = `⚠️ При післяплаті нараховується комісія: ${commission.toFixed(0)} грн (вже враховано в сумі)`;
        }
    }
}
    
    

// 3. ФУНКЦІЯ ВІДПРАВКИ ЗАМОВЛЕННЯ ПІСЛЯПЛАТОЮ
      function submitOrderCOD() {
    const name = document.getElementById('order-name').value.trim();
    const phone = document.getElementById('order-phone').value.trim();
    const delivery = document.getElementById('order-delivery').value.trim();

    if (!name || !phone || !delivery) {
        alert('Будь ласка, заповніть всі поля для доставки!');
        return;
    }

    // 1. Рахуємо суму з урахуванням кількості та додаємо комісію післяплати
    const subtotal = cart.reduce((sum, item) => sum + (Number(item.price) * (item.quantity || 1)), 0);
    const commission = 20 + (subtotal * 0.02);
    const finalTotal = subtotal + commission;

    const buyerName = currentUser ? `${name} (${currentUser.name})` : name;

    const orderData = {
        customerName: `${buyerName} | Тел: ${phone} | Доставка: ${delivery}`,
        // 2. МАГІЯ: мапимо товари і додаємо поле quantity у базу даних MongoDB
        items: cart.map(item => ({ 
            name: item.name, 
            price: item.price, 
            quantity: item.quantity || 1 
        })),
        total: Math.round(finalTotal),
        paymentMethod: "післяплата",
        status: "Очікує оплати при отриманні"
    };

    // 3. Відправляємо на сервер Render
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
    
                                  
    

        // Інтеграція PayPal
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
                            items: cart.map(item => ({ name: item.name, price: item.price })),
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

        // АДМІН-ПАНЕЛЬ
        // === АДМІН-ПАНЕЛЬ (ОНОВЛЕНО З ТОКЕНАМИ) ===
// === АДМІН-ПАНЕЛЬ (РЕЖИМ ПОВНОЇ КОНСПІРАЦІЇ) ===
function toggleAdmin() {
    const adminPage = document.getElementById('page-admin');
    
    if (adminPage && adminPage.classList.contains('active')) {
        switchPage('home');
        return;
    }

    // 🔥 Пускає тільки тебе, для інших — повна тиша
    if (currentUser && currentUser.role === 'admin') {
        switchPage('admin'); 
        loadAdminOrders();
    } else {
        return; 
    }
}

function submitAdminLogin() {
    toggleAdmin();
}
    

// Залишаємо цю функцію як запасну, якщо захочеш зайти по старому паролю 1111
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
        // 🔥 Отримуємо токен з пам'яті телефону
        const token = localStorage.getItem('sneakers_token');

        // Робимо запит на сервер і прикріплюємо токен адміна
        const response = await fetch('/api/orders', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` // 🔥 Обов'язковий захист сервера
            }
        });

        // Якщо сервер відмовив (наприклад, токен застарів)
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
    

        // ПОШУК ТОВАРІВ
        function handleSearch() {
    const query = document.getElementById('search-input').value.toLowerCase();
    const productCards = document.querySelectorAll('.product-card');

    productCards.forEach(card => {
        const titleElement = card.querySelector('.product-title');
        if (titleElement) {
            const title = titleElement.innerText.toLowerCase();
            // Якщо текст збігається, показуємо картку (у тебе в CSS для карток використовується block)
            if (title.includes(query)) {
                card.style.display = 'block'; 
            } else {
                card.style.display = 'none'; 
            }
        }
    });
        }


      let currentAuthMode = 'login'; // Поточний режим: або 'login', або 'register'

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

let currentUser = null; // Поточний авторизований користувач

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
    // Заміни фінальну частину .then(data => { ... }) всередині handleAuth на цю:
    .then(data => {
        alert(data.message);
        
        if (data.token) {
            localStorage.setItem('sneakers_token', data.token); // Твій токен
        }
        if (data.user) {
            localStorage.setItem('currentUser', JSON.stringify(data.user)); // Твій користувач для кнопок
        }
        
        currentUser = data.user;
        window.currentUser = data.user; // Дублюємо в глобальну змінну

        // Оновлюємо каталог, щоб одразу з'явилися кнопки видалення, якщо зайшов адмін
        if (typeof products !== 'undefined' && typeof loadProducts === 'function') {
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

// 🔥 ОНОВЛЕНО: Функція виходу з акаунту тепер чистить пам'ять
function logout() {
    currentUser = null;
    
    // 🔥 НОВЕ: Видаляємо токен з пам'яті, щоб сайт забув користувача при виході
    localStorage.removeItem('sneakers_token');
    
    document.getElementById('auth-container').style.display = 'block';
    document.getElementById('user-cabinet').style.display = 'none';
    toggleAuthTab('login');
}

// 🔥 НОВЕ: Функція для автоматичного входу при завантаженні сторінки
function autoLogin() {
    const token = localStorage.getItem('sneakers_token');
    
    // Якщо токена немає, людина просто гість, нічого не робимо
    if (!token) return;

    // Якщо токен знайшли, відправляємо його серверу на перевірку
    fetch('/api/me', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}` // Передаємо токен у спеціальному заголовку
        }
    })
    .then(response => {
        if (!response.ok) {
            // Якщо токен застарів або підроблений — видаляємо його
            localStorage.removeItem('sneakers_token');
            throw new Error('Сесія застаріла');
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            currentUser = data.user; // Автоматично підставляємо користувача
            showUserCabinet();       // Одразу відкриваємо кабінет без введення пароля!
        }
    })
    .catch(err => console.log('Гість або помилка автологіну:', err.message));
}

// 🔥 НОВЕ: Викликаємо автологін одразу, як тільки завантажується цей JS-скрипт!
autoLogin();
                    
    

          
    
    
        // Модальне вікно успішного замовлення
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




    // Функція для відкриття детальної сторінки кросівка
function openProductPage(productId) {
    const container = document.getElementById('product-detail-container');
    if (!container) return;

    const product = allProducts.find(p => (p._id === productId || p.id === productId || p.id == productId));

    if (!product) {
        alert("Товар не знайдено!");
        return;
    }

    // 📸 ПЕРЕВІРКА КАРТИНОК: Створюємо масив фотографій. 
    // Підтримуємо і новий масив product.images, і старі товари з одиночним product.image
    let photos = [];
    if (Array.isArray(product.images) && product.images.length > 0) {
        photos = product.images;
    } else if (product.image) {
        photos = [product.image];
    } else {
        photos = ['https://via.placeholder.com/350'];
    }

    // Генеруємо HTML для кожної картинки в слайдері
    let sliderHtml = photos.map(imgUrl => `
        <div style="min-width: 100%; box-sizing: border-box; display: flex; justify-content: center; align-items: center; padding: 0 10px;">
            <img src="${imgUrl}" alt="${product.name}" style="width: 100%; max-width: 350px; height: auto; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); object-fit: cover;">
        </div>
    `).join('');

    // Якщо картинок більше однієї, додамо маленьку підказку для користувача
    let hintHtml = photos.length > 1 ? `<p style="text-align:center; color:#95a5a6; font-size:12px; margin-top:5px;">↔️ Гортайте фото пальцем</p>` : '';

    container.innerHTML = `
        <div style="width: 100%; overflow-x: auto; display: flex; scroll-snap-type: x mandatory; scroll-behavior: smooth; margin-top: 15px; padding-bottom: 5px;" class="product-gallery-slider">
            ${sliderHtml}
        </div>
        ${hintHtml}

        <h1 style="font-size: 24px; color: #2c3e50; margin: 20px 0 10px 0;">${product.name}</h1>
        <p style="font-size: 14px; color: #7f8c8d; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 15px 0;">Категорія: ${product.category || 'Взуття'}</p>
        
        <div style="font-size: 22px; font-weight: bold; color: #e74c3c; margin-bottom: 20px;">
            ${product.price} грн
        </div>

        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 25px;">
            <h3 style="margin-top: 0; color: #34495e; font-size: 16px;">Опис товару</h3>
            <p style="color: #5d6d7e; line-height: 1.6; font-size: 15px; margin-bottom: 0;">
                ${product.description || 'Опис для цієї моделі поки що відсутній.'}
            </p>
        </div>

        <button onclick="addToCart('${product._id || product.id}'); alert('👟 Товар додано в кошик!')" style="width: 100%; background: #27ae60; color: white; border: none; padding: 15px; font-size: 18px; font-weight: bold; border-radius: 8px; cursor: pointer; box-shadow: 0 4px 6px rgba(39, 174, 96, 0.2); transition: 0.2s;">
            🛒 Додати в кошик
        </button>
    `;

    switchPage('product');
    
    // Скидаємо скролл слайдера на початок при відкритті нової сторінки
    setTimeout(() => {
        const slider = document.querySelector('.product-gallery-slider');
        if (slider) slider.scrollLeft = 0;
    }, 50);
            }
    
async function deleteProduct(productId) {
    if (!confirm("⚠️ Ви впевнені, що хочете назавжди видалити цей товар з бази даних?")) return;

    try {
        // 🔑 БЕРЕМО ПРАВИЛЬНИЙ ТОКЕН:
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
    // Якщо у тебе в script.js глобальний масив називається cart, беремо його.
    // Якщо він порожній або не існує, пробуємо взяти з localStorage
    const currentCart = (typeof cart !== 'undefined') ? cart : (JSON.parse(localStorage.getItem('cart')) || []);
    
    // Рахуємо загальну кількість
    const totalItems = currentCart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    
    const badge = document.getElementById('cart-count-badge');
    if (badge) {
        badge.innerText = totalItems;
        
        // Повністю ховаємо або показуємо кружечок
        if (totalItems === 0) {
            badge.style.display = 'none';
        } else {
            badge.style.display = 'flex';
        }
    }
}
function toggleBurgerMenu() {
    const menu = document.getElementById('burger-menu');
    if (menu) {
        menu.classList.toggle('active');
    }
}

function toggleFeatured(productId) {
    let featuredIds = JSON.parse(localStorage.getItem('featuredProductIds') || '[]');
    
    if (featuredIds.includes(productId)) {
        // Якщо товар вже був популярним — прибираємо його
        featuredIds = featuredIds.filter(id => id !== productId);
    } else {
        // Якщо не був — додаємо в масив популярних
        featuredIds.push(productId);
    }
    
    // Зберігаємо оновлений список у сховище
    localStorage.setItem('featuredProductIds', JSON.stringify(featuredIds));
    
    // Перерендерюємо сторінки, щоб зміни миттєво відобразилися
    if (typeof updateFavoritesUI === 'function') {
        updateFavoritesUI();
    } else {
        // Якщо функції відрізняються, просто онови поточні сторінки:
        renderProducts(allProducts, 'catalog-products');
        updateFeaturedProductsUI();
    }
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
                
