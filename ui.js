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
