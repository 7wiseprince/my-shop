let allProducts = [];
let cart = [];
let favorites = []; // Масив для зберігання улюблених товарів
let uploadedImages = [];








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
