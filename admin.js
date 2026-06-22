
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



    
