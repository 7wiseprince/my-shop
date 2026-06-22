function handlePaymentMethodChange(method) {
    const paypalContainer = document.getElementById('paypal-button-container');
    const codButton = document.getElementById('main-checkout-btn');
    const codWarning = document.getElementById('cod-warning-text'); 
    
    const subtotal = cart.reduce((sum, item) => sum + (Number(item.price) * (item.quantity || 1)), 0);
    
    if (cart.length === 0) return;

    if (method === 'online') {
        if (paypalContainer) paypalContainer.style.display = 'block';
        if (codButton) codButton.style.display = 'none';
        if (codWarning) codWarning.style.display = 'none'; 
        
        document.getElementById('cart-total-price').innerText = `${subtotal} грн`;
        if (subtotal > 0) renderPayPalButton(subtotal);
    } else {
        if (paypalContainer) paypalContainer.style.display = 'none';
        if (codButton) codButton.style.display = 'block';
        
        const commission = 20 + (subtotal * 0.02);
        const totalWithCommission = subtotal + commission;

        const totalElement = document.getElementById('cart-total-price');
        if (totalElement) totalElement.innerText = `${totalWithCommission.toFixed(0)} грн`;

        if (codWarning) {
            codWarning.style.display = 'block';
            codWarning.innerText = `⚠️ При післяплаті нараховується комісія: ${commission.toFixed(0)} грн (вже враховано в сумі)`;
        }
    }
}
    
function submitOrderCOD() {
    const name = document.getElementById('order-name').value.trim();
    const phone = document.getElementById('order-phone').value.trim();
    const delivery = document.getElementById('order-delivery').value.trim();

    if (!name || !phone || !delivery) {
        alert('Будь ласка, заповніть всі поля для доставки!');
        return;
    }

    const subtotal = cart.reduce((sum, item) => sum + (Number(item.price) * (item.quantity || 1)), 0);
    const commission = 20 + (subtotal * 0.02);
    const finalTotal = subtotal + commission;
    const buyerName = typeof currentUser !== 'undefined' && currentUser ? `${name} (${currentUser.name})` : name;
    const orderData = {
       customerName: buyerName,
       phone: phone,
       delivery: delivery,
        // Важливо: передаємо розміри у замовлення для адміна на сервер

           items: cart.map(item => ({ 
            _id: item._id, // Важливо для бази даних
            name: item.chosenSize ? `${item.name} (Розмір: ${item.chosenSize})` : item.name, 
            price: item.price, 
            quantity: item.quantity || 1 
        })),
        total: Math.round(finalTotal),
        paymentMethod: "післяплата",
        status: "Очікує оплати при отриманні"
    };
       
       // 1. Беремо наш системний токен
    const token = localStorage.getItem('sneakers_token')
    // 2. Формуємо базові заголовки запиту
    const headers = { 
        'Content-Type': 'application/json' 
    };

    // 3. Якщо користувач авторизований — прикріплюємо токен
    if (token) {
        headers['Authorization'] = 'Bearer ' + token;
    }
       
       
    fetch('/api/orders', {
        method: 'POST',
         headers: headers,
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
    })
    .catch(err => {
        console.error('Помилка сервера:', err);
        alert('Не вдалося зберегти замовлення.');
    });
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



window.handlePaymentMethodChange = handlePaymentMethodChange;
window.submitOrderCOD = submitOrderCOD;
window.renderPayPalButton = renderPayPalButton;

    
