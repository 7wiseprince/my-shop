<script>
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
                renderProducts(allProducts, 'catalog-products');
                renderProducts(allProducts.slice(0, 2), 'featured-products');
            } catch (error) {
                console.error("Помилка завантаження товарів:", error);
            }
        }

        // Відображення карток товарів
        function renderProducts(products, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    
    if (products.length === 0) {
        container.innerHTML = '<p class="empty-message">Товарів не знайдено</p>';
        return;
    }

    products.forEach(product => {
        // Отримуємо правильний ID з бази даних (підтримуємо MongoDB _id та звичайний id)
        const prodId = product._id || product.id;

        // Перевіряємо, чи цей товар уже є в обраному, щоб правильно зафарбувати сердечко
        const isFavorite = favorites.some(item => (item._id === prodId || item.id === prodId || item.id == prodId));
        const heartIcon = isFavorite ? '❤️' : '🤍';

        // Формуємо картку з твоєю детальною логікою
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

                <button class="btn-delete-admin" onclick="event.stopPropagation(); deleteProduct('${product.id || prodId}')" style="display: none; width: 100%; background: #e74c3c; color: white; border: none; padding: 8px; margin-top: 8px; border-radius: 5px; cursor: pointer; font-size: 12px; font-weight: bold; box-shadow: 0 2px 4px rgba(231, 76, 60, 0.2);">
                    🗑️ Видалити товар (Адмін)
                </button>
            </div>
        `;
    });

    // 🕵️‍♂️ ОНОВЛЕНА ПЕРЕВІРКА НА АДМІНА (шукає всюди: і в пам'яті, і в локальному сховищі браузера)
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

    // Якщо перевірка підтвердила, що ти адмін — вмикаємо червоні кнопки видалення!
    if (isUserAdmin) {
        container.querySelectorAll('.btn-delete-admin').forEach(btn => {
            btn.style.display = 'block';
        });
    }
    }
    
    
    

        // Фільтрація товарів за категоріями
        function filterProducts(category, button) {
            document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            if (category === 'all') {
                renderProducts(allProducts, 'catalog-products');
            } else {
                const filtered = allProducts.filter(p => p.category === category);
                renderProducts(filtered, 'catalog-products');
            }
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
    // Рендеримо товари з масиву обраного в контейнер сторінки обраного.
    // Припускаємо, що твій контейнер на сторінки обраного має ID 'favorites-products'
    renderProducts(favorites, 'favorites-products');
    
    // Також оновлюємо товари на головній та в каталозі, щоб сердечка синхронно міняли колір
    if (allProducts.length > 0) {
        renderProducts(allProducts, 'catalog-products');
        renderProducts(allProducts.slice(0, 2), 'featured-products');
    }
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
