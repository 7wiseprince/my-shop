let allProducts = [];
let cart = [];
let favorites = []; // Масив для зберігання улюблених товарів
let uploadedImages = [];






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

