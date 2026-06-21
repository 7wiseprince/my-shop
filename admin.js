
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
