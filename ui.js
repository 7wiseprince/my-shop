function switchPage(pageId) {
    if (pageId === 'favorites'){
        updateFavoritesUI();
    }
    if (pageId === 'home'){
        updateFeaturedProductsUI();
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



function switchTab(event, tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    event.currentTarget.classList.add('active');
}
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









window.switchPage = switchPage;
window.toggleBurgerMenu = toggleBurgerMenu;
window.clickBurgerLink = clickBurgerLink;
window.switchTab = switchTab;
window.showSuccessModal = showSuccessModal;
window.closeSuccessModal = closeSuccessModal;
window.openCatalogCategory = openCatalogCategory;
window.backToCatalogCategories = backToCatalogCategories;
