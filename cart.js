
function addToCart(productId, chosenSize = null) {
    const product = allProducts.find(p => p._id === productId);
    if (!product) return;

    const cartItem = cart.find(item => 
        item._id === productId && 
        (item.selectedSize === chosenSize)
    );

    if (cartItem) {
        cartItem.quantity = (cartItem.quantity || 1) + 1;
    } else {
        cart.push({ ...product, quantity: 1, selectedSize: chosenSize });
    }

    if (typeof updateCartUI === 'function') {
        updateCartUI();
    }
}
    
function removeFromCart(index) {
    cart.splice(index, 1); 
    updateCartUI();
}

function toggleCart(show) {
    const cartModal = document.getElementById('cartModal');
    if (cartModal) {
        cartModal.style.display = show ? 'flex' : 'none';
    }
} 

function updateCartUI() {
    const listContainer = document.getElementById('cart-items-container');
    if (!listContainer) return;
    
    listContainer.innerHTML = '';
    let total = 0;

    const topContinueBtn = document.getElementById('top-continue-shopping');
    const checkoutForm = document.getElementById('checkout-form-container');
    const paymentBlock = document.querySelector('.payment-methods');
    const codButton = document.getElementById('main-checkout-btn');
    const paypalContainer = document.getElementById('paypal-button-container');

    if (cart.length === 0) {
        listContainer.innerHTML = '<p class="empty-message">Кошик порожній</p>';
        if (topContinueBtn) topContinueBtn.style.display = 'none';
        if (checkoutForm) checkoutForm.style.display = 'none';
        if (paymentBlock) paymentBlock.style.display = 'none';
        if (codButton) codButton.style.display = 'none';
        if (paypalContainer) paypalContainer.innerHTML = ''; 
    } else {
        if (topContinueBtn) topContinueBtn.style.display = 'block';
        if (checkoutForm) checkoutForm.style.display = 'block';
        if (paymentBlock) paymentBlock.style.display = 'block';

        const selectedPayment = document.querySelector('input[name="payment-method"]:checked');
        const currentMethod = selectedPayment ? selectedPayment.value : 'cod';
        handlePaymentMethodChange(currentMethod);

        cart.forEach((item, index) => {
            total += Number(item.price) * (item.quantity || 1);
            
            // ЧІТКО: генеруємо бейдж розміру, якщо він вибраний
            const sizeText = item.selectedSize ? ` <span style="font-size: 11px; background: #e0e0e0; padding: 2px 6px; border-radius: 4px; margin-left: 5px; color: #333; font-weight: normal;">Роз: ${item.selectedSize}</span>` : '';
            const quantityText = item.quantity > 1 ? ` <span style="color: #666; font-weight: bold;">(x${item.quantity})</span>` : '';
            const itemTotalPrice = Number(item.price) * (item.quantity || 1);

            listContainer.innerHTML += `
                <div class="cart-item">
                    <div class="cart-item-info">
                        <div class="cart-item-title">${item.name}${sizeText}${quantityText}</div>
                        <div class="cart-item-price">${itemTotalPrice} грн</div>
                    </div>
                    <button class="btn-remove" onclick="removeFromCart(${index})">🗑️</button>
                </div>
            `;
        });
    }
    
    const totalPriceElement = document.getElementById('cart-total-price');
    if (totalPriceElement) {
        totalPriceElement.innerText = `Загалом: ${total} грн`;
    }

    if (total > 0 && typeof paypal !== 'undefined') {
        const selectedPayment = document.querySelector('input[name="payment-method"]:checked');
        if (selectedPayment && selectedPayment.value === 'online') {
            renderPayPalButton(total);
        }
    }

    if (document.getElementById('main-checkout-btn') && document.getElementById('main-checkout-btn').style.display === 'block') {
        handlePaymentMethodChange('cod');
    } else {
        handlePaymentMethodChange('online');
    }
    updateCartBadge(); 
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

