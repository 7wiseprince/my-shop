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

// СХЕМА ТОВАРУ (🔥 ОНОВЛЕНО: Додано поле isFeatured)
const productSchema = new mongoose.Schema({
    name: String,
    price: Number,
    category: String,
    images: [String],
    description: String,
    isFeatured: { type: Boolean, default: false } // 🔥 true — відображається на головній та в топі категорії
});
const Product = mongoose.model('Product', productSchema);

// СХЕМА КОРИСТУВАЧА
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    favorites: { type: Array, default: [] },
    role: { type: String, default: 'user' } // 'user' або 'admin'
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
            next(); // Пропускаємо запит далі, бо це справжній admin!
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
            {  name: "Спортивні кросівки", price: 300, category: "shoes", images: ["https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500"], description: "Легкі професійні кросівки для бігу.", isFeatured: false },
            {  name: "Стильна футболка", price: 150, category: "clothes", images: ["https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500"], description: "100% натуральна бавовна.", isFeatured: false },
            {  name: "Спортивна кепка", price: 100, category: "accessories", images: ["https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=500"], description: "Стильний захист від сонця.", isFeatured: false }
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

// СТОРІНКА КОНКРЕТНОГО ТОВАРУ (Динамічний роут)
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

// Отримати ОДИН товар за його цифровим ID
app.get('/api/products/:id', async (req, res) => {
    const product = await Product.findById(req.params.id);

    if (!product) {
        return res.status(404).json({
            success: false,
            message: "Товар не знайдено"
        });
    }

    res.json(product);
});
// 🔥 НОВИЙ МАРШРУТ: Перемикання статусу популярності товару (ЗАХИЩЕНО ДЛЯ АДМІНІВ)
app.post('/api/products/toggle-featured/:id', isAdmin, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        
        if (!product) {
            return res.status(404).json({ success: false, message: 'Товар не знайдено' });
        }
        
        // Змінюємо прапорець на протилежний
        product.isFeatured = !product.isFeatured;
        await product.save();
        
        res.json({ success: true, message: "Статус популярності оновлено в базі!", product });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Додати товар (ЗАХИЩЕНО ДЛЯ АДМІНІВ)
app.post('/api/products', isAdmin, async (req, res) => {
    try {
        const { name, price, category, images, description } = req.body;

        const finalImages = (Array.isArray(images) && images.length > 0) 
            ? images 
            : ["https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=500"];

        const newProduct = new Product({
            name,
            price: Number(price),
            category,
            images: finalImages,
            description,
            isFeatured: false // Нові товари спочатку йдуть як звичайні
        });

        await newProduct.save();
        res.json({ success: true, message: "Товар успішно додано адміном!" });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});
            
// Видалити товар (ЗАХИЩЕНО ДЛЯ АДМІНІВ)
app.delete('/api/products/:id', isAdmin, async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: "Товар успішно видалено адміном!" });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Створити нове замовлення
app.post('/api/orders', async (req, res) => {
    try {
        const { items, total, customerName, phone, status, paymentMethod } = req.body; 
        
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

        const discordWebhookUrl = process.env.DISCORD_WEBHOOK_URL;

        if (discordWebhookUrl) {
            const itemsList = items && items.length > 0 
                ? items.map(item => `• ${item.name} (${item.quantity || 1} шт.)`).join('\n')
                : 'Товари не вказані';

            const discordMessage = {
                content: "🚨 **НА САЙТІ НОВЕ ЗАМОВЛЕННЯ!** 🚨",
                embeds: [{
                    title: `📦 Замовлення №${orderId}`,
                    color: 3066993,
                    fields: [
                        { name: "👤 Покупець", value: customerName || 'Анонімний покупець', inline: true },
                        { name: "📞 Телефон клієнта", value: phone || "Не вказано", inline: true },
                        { name: "💰 Сума", value: `${total || 0} грн`, inline: true },
                        { name: "💳 Спосіб оплати", value: paymentMethod || "Не вказано", inline: false },
                        { name: "👟 Товари", value: itemsList, inline: false }
                    ],
                    timestamp: new Date()
                }]
            };

            fetch(discordWebhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(discordMessage)
            }).catch(err => console.error("Помилка Discord:", err));
        }

        await newOrder.save();
        res.json({ success: true, orderId: orderId });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});
    
// Отримати всі замовлення (ЗАХИЩЕНО ДЛЯ АДМІНІВ)
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
            role: 'user'
        });

        await newUser.save();

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

        const userRole = (user.role === 'admin' || user.isAdmin === true) ? 'admin' : (user.role || 'user');

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
            
