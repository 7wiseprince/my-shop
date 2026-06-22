
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
    
