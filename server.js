require('dotenv').config();
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(__dirname)); // Роздаємо файли з головної папки

// Підключення до MongoDB через секретну змінну оточення
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("Успішно підключено до MongoDB Atlas! ☁️");
        seedDatabase(); // 🔥 Автоматичне завантаження базових товарів
    })
    .catch(err => console.error("Помилка підключення до бази:", err));


// ==================== СХЕМИ ДАНИХ (MODELS) ====================

// СХЕМА ТОВАРУ
const productSchema = new mongoose.Schema({
    id: Number,
    name: String,
    price: Number,
    category: String,
    images: [String],
    description: String
});
const Product = mongoose.model('Product', productSchema);

// СХЕМА КОРИСТУВАЧА (🔥 ОНОВЛЕНО: Додано поле role)
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    favorites: { type: Array, default: [] },
    role: { type: String, default: 'user' } // 🔥 'user' або 'admin'
});
const User = mongoose.model('User', userSchema);

// СХЕМА ЗАМОВЛЕННЯ
const orderSchema = new mongoose.Schema({
    id: Number,
    customerName: String,
    items: Array,
    total: Number,
    status: String,
    paymentMethod: String,
    date: String
});
const Order = mongoose.model('Order', orderSchema);


// ==================== МІДЛВЕРИ БЕЗПЕКИ (MIDDLEWARES) ====================

// 🔥 ЗАХИСНИЙ ЩИТ АДМІНІСТРАТОРА
const isAdmin = (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Відсікаємо "Bearer"

        if (!token) {
            return res.status(401).json({ success: false, message: 'Доступ заборонено. Токен відсутній.' });
        }

        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) {
                return res.status(403).json({ success: false, message: 'Сесія застаріла або токен невалідний.' });
            }

            // Перевіряємо, чи зашита в токені роль адміна
            if (decoded.role !== 'admin') {
                return res.status(403).json({ success: false, message: 'Доступ заборонено. Ви не є адміністратором!' });
            }

            req.userId = decoded.id;
            req.userRole = decoded.role;
            next(); // Пропускаємо запит далі, бо це справжній адмін!
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};


// Наповнення бази даних
async function seedDatabase() {
    const count = await Product.countDocuments();
    if (count === 0) {
        const defaultProducts = [
            { id: 1, name: "Спортивні кросівки", price: 300, category: "shoes", image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500", description: "Легкі професійні кросівки для бігу." },
            { id: 2, name: "Стильна футболка", price: 150, category: "clothes", image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500", description: "100% натуральна бавовна." },
            { id: 3, name: "Спортивна кепка", price: 100, category: "accessories", image: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=500", description: "Стильний захист від сонця." }
        ];
        await Product.insertMany(defaultProducts);
        console.log("Базові товари успішно завантажені в хмару!");
    }
}


// ==================== МАРШРУТИ ДЛЯ СТОРІНОК (FRONTEND) ====================

// ГОЛОВНА СТОРІНКА
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 🔥 СТОРІНКА КОНКРЕТНОГО ТОВАРУ (Динамічний роут)
// Коли людина перейде на сайт.com/product/1 — їй віддасться файл product.html
app.get('/product/:id', (req, res) => {
    res.sendFile(path.join(__dirname, 'product.html'));
});


// ==================== МАРШРУТИ АПІ (API ENDPOINTS) ====================

// Отримати всі товари
app.get('/api/products', async (req, res) => {
    try {
        const products = await Product.find({});
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 🔥 Отримати ОДИН товар за його цифровим ID (для сторінки товару)
app.get('/api/products/:id', async (req, res) => {
    try {
        const productId = Number(req.params.id);
        const product = await Product.findOne({ id: productId });
        
        if (!product) {
            return res.status(404).json({ success: false, message: "Товар не знайдено" });
        }
        res.json(product);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 🔥 Додати товар (ТЕПЕР ЗАХИЩЕНО ДЛЯ АДМІНІВ)
app.post('/api/products', isAdmin, async (req, res) => {
    try {
        // 📸 Замість image витягуємо images з req.body
        const { name, price, category, images, description } = req.body;
        const lastProduct = await Product.findOne().sort({ id: -1 });
        const newId = lastProduct ? lastProduct.id + 1 : 1;

        // Перевіряємо, чи нам прийшов масив і чи він не порожній. 
        // Якщо порожній — ставимо стандартну картинку всередину масиву.
        const finalImages = (Array.isArray(images) && images.length > 0) 
            ? images 
            : ["https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=500"];

        const newProduct = new Product({
            id: newId,
            name,
            price: Number(price),
            category,
            images: finalImages, // 📸 Зберігаємо масив посилань у базу даних
            description
        });

        await newProduct.save();
        res.json({ success: true, message: "Товар успішно додано адміном!" });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});
            
// 🔥 Видалити товар (ТЕПЕР ЗАХИЩЕНО ДЛЯ АДМІНІВ)
app.delete('/api/products/:id', isAdmin, async (req, res) => {
    try {
        const productId = Number(req.params.id);
        await Product.deleteOne({ id: productId });
        res.json({ success: true, message: "Товар успішно видалено адміном!" });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Створити нове замовлення (доступно всім покупцям)
app.post('/api/orders', async (req, res) => {
    try {
        const { items, total, customerName, status, paymentMethod } = req.body; 
        const lastOrder = await Order.findOne().sort({ id: -1 });
        const orderId = lastOrder ? lastOrder.id + 1 : 1001;

        const newOrder = new Order({
            id: orderId,
            customerName: customerName || "Анонімний покупець",
            items,
            total,
            status: status || (paymentMethod === 'післяплата' ? "Очікує оплати при отриманні" : "Оплачено, очікує відправки"), 
            paymentMethod: paymentMethod || "Не вказано",
            date: new Date().toLocaleString('uk-UA')
        });

        await newOrder.save();
        res.json({ success: true, orderId: orderId });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Отримати всі замовлення (🔥 ТЕПЕР ЗАХИЩЕНО ДЛЯ АДМІНІВ — ніхто чужий не побачить список замовлень)
app.get('/api/orders', isAdmin, async (req, res) => {
    try {
        const orders = await Order.find({}).sort({ id: -1 });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==================== АВТЕНТИФІКАЦІЯ ТА ПРОФІЛЬ ====================

// РЕЄСТРАЦІЯ КОРИСТУВАЧА
app.post('/api/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ success: false, message: 'Користувач з таким Email вже існує!' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            name,
            email,
            password: hashedPassword,
            favorites: [],
            role: 'user' // Нові користувачі завжди реєструються як звичайні юзери
        });

        await newUser.save();

        // 🔥 Гарантуємо наявність ролі при створенні токена
        const userRole = newUser.role || 'user';

        const token = jwt.sign(
            { id: newUser._id, role: userRole }, 
            process.env.JWT_SECRET, 
            { expiresIn: '7d' }
        );

        res.status(201).json({ 
            success: true,
            message: 'Реєстрація успішна!', 
            token,
            user: { id: newUser._id, name: newUser.name, email: newUser.email, favorites: newUser.favorites, role: userRole } 
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ВХІД КОРИСТУВАЧА
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ success: false, message: 'Неправильний Email або пароль!' });
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) {
            return res.status(400).json({ success: false, message: 'Неправильний Email або пароль!' });
        }

        // 🔥 ПЕРЕВІРКА: беремо роль з бази, якщо її немає (або раптом записано через isAdmin) — підстраховуємось
        const userRole = (user.role === 'admin' || user.isAdmin === true) ? 'admin' : (user.role || 'user');

        // Зашифровуємо точну роль у токен
        const token = jwt.sign(
            { id: user._id, role: userRole }, 
            process.env.JWT_SECRET, 
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            message: 'Вхід успішний!',
            token,
            user: { id: user._id, name: user.name, email: user.email, favorites: user.favorites, role: userRole }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// СИНХРОНІЗАЦІЯ ОБРАНОГО
app.post('/api/favorites', async (req, res) => {
    try {
        const { userId, favorites } = req.body;
        await User.findByIdAndUpdate(userId, { favorites: favorites });
        res.json({ success: true, message: 'Обране синхронізовано з базою!' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// АВТОМАТИЧНА ПЕРЕВІРКА ТОКЕНА
app.get('/api/me', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ success: false, message: 'Токен відсутній' });
        }

        jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
            if (err) {
                return res.status(403).json({ success: false, message: 'Невалідний токен' });
            }

            const user = await User.findById(decoded.id);
            if (!user) {
                return res.status(404).json({ success: false, message: 'Користувача не знайдено' });
            }

            // 🔥 Тут також віддаємо підстраховану роль користувача
            const userRole = (user.role === 'admin' || user.isAdmin === true) ? 'admin' : (user.role || 'user');

            res.json({
                success: true,
                user: { id: user._id, name: user.name, email: user.email, favorites: user.favorites, role: userRole }
            });
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
             


app.listen(PORT, () => {
    console.log(`Сервер успішно запущений на порту ${PORT} 🚀`);
});
