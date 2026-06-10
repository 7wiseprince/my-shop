
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

