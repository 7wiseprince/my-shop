function toggleAuthTab(mode) {
    currentAuthMode = mode;
    
    const tabLogin = document.getElementById('tab-login');
    const tabRegister = document.getElementById('tab-register');
    const nameGroup = document.getElementById('auth-name-group');
    const submitBtn = document.getElementById('btn-auth-submit');

    if (mode === 'register') {
        tabRegister.style.color = 'var(--primary-color)';
        tabRegister.style.borderBottom = '2px solid var(--primary-color)';
        tabLogin.style.color = '#7f8c8d';
        tabLogin.style.borderBottom = 'none';
        
        if (nameGroup) nameGroup.style.display = 'block';
        if (submitBtn) submitBtn.innerText = 'Зареєструватися';
    } else {
        tabLogin.style.color = 'var(--primary-color)';
        tabLogin.style.borderBottom = '2px solid var(--primary-color)';
        tabRegister.style.color = '#7f8c8d';
        tabRegister.style.borderBottom = 'none';
        
        if (nameGroup) nameGroup.style.display = 'none';
        if (submitBtn) submitBtn.innerText = 'Увійти';
    }
}

let currentUser = null; 

function handleAuth() {
    const name = document.getElementById('auth-name').value.trim();
    const email = document.getElementById('auth-email').value.trim();
    const password = document.getElementById('auth-password').value.trim();

    if (!email || !password) {
        alert('Будь ласка, заповніть Email та Пароль!');
        return;
    }
    if (currentAuthMode === 'register' && !name) {
        alert('Будь ласка, вкажіть ваше ім\'я для реєстрації!');
        return;
    }

    const url = currentAuthMode === 'register' ? '/api/register' : '/api/login';
    const authData = { email, password };
    if (currentAuthMode === 'register') {
        authData.name = name;
    }

    fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authData)
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => { throw new Error(err.message); });
        }
        return response.json();
    })
    .then(data => {
        alert(data.message);
        
        if (data.token) {
            localStorage.setItem('sneakers_token', data.token); 
        }
        if (data.user) {
            localStorage.setItem('currentUser', JSON.stringify(data.user)); 
        }
        
        currentUser = data.user;
        window.currentUser = data.user; 

        if (typeof allProducts !== 'undefined' && typeof loadProducts === 'function') {
            loadProducts();
        }

        showUserCabinet();
    })
    .catch(error => {
        console.error('Помилка авторизації:', error);
        alert(error.message || 'Щось пішло не так...');
    });
}

function showUserCabinet() {
    if (!currentUser) return;

    document.getElementById('auth-container').style.display = 'none';
    document.getElementById('user-cabinet').style.display = 'block';

    document.getElementById('cabinet-user-name').innerText = `Привіт, ${currentUser.name}!`;
    document.getElementById('cabinet-user-email').innerText = currentUser.email;

    if (currentUser.favorites) {
        favorites = currentUser.favorites;
        updateFavoritesUI();
        updateCabinetFavoritesUI();
    }
            
    document.getElementById('auth-name').value = '';
    document.getElementById('auth-email').value = '';
    document.getElementById('auth-password').value = '';
}

function logout() {
    currentUser = null;
    localStorage.removeItem('sneakers_token');
    document.getElementById('auth-container').style.display = 'block';
    document.getElementById('user-cabinet').style.display = 'none';
    toggleAuthTab('login');
}

function autoLogin() {
    const token = localStorage.getItem('sneakers_token');
    if (!token) return;

    fetch('/api/me', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}` 
        }
    })
    .then(response => {
        if (!response.ok) {
            localStorage.removeItem('sneakers_token');
            throw new Error('Сесія застаріла');
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            currentUser = data.user; 
            showUserCabinet();       
        }
    })
    .catch(err => console.log('Гість або помилка автологіну:', err.message));
}

autoLogin();
