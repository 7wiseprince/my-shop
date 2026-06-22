let allProducts = [];
let cart = [];
let favorites = []; // Масив для зберігання улюблених товарів
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
                alert("Помилка сервера: " + (result.error || result.message || "Невідома помилка"));
            }
        } catch (err) {
            alert("Критична помилка мережі: " + err.message);
        }
    });
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
    const buyerName = typeof currentUser !== 'undefined' && currentUser ? `${name} (${currentUser.name})` : name;
    const orderData = {
       customerName: buyerName,
       phone: phone,
       delivery: delivery,
        // Важливо: передаємо розміри у замовлення для адміна на сервер

           items: cart.map(item => ({ 
            _id: item._id, // Важливо для бази даних
            name: item.chosenSize ? `${item.name} (Розмір: ${item.chosenSize})` : item.name, 
            price: item.price, 
            quantity: item.quantity || 1 
        })),
        total: Math.round(finalTotal),
        paymentMethod: "післяплата",
        status: "Очікує оплати при отриманні"
    };
       
       // 1. Беремо наш системний токен
    const token = localStorage.getItem('sneakers_token')
    // 2. Формуємо базові заголовки запиту
    const headers = { 
        'Content-Type': 'application/json' 
    };

    // 3. Якщо користувач авторизований — прикріплюємо токен
    if (token) {
        headers['Authorization'] = 'Bearer ' + token;
    }
       
       
    fetch('/api/orders', {
        method: 'POST',
         headers: headers,
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
            if (p._id === productId) {
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
