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

