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
