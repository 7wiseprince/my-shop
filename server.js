require('dotenv').config();
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');


const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(__dirname)); // Роздаємо файли з головної папки

// Підключення до MongoDB через секретну змінну оточення
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("Успішно підключено до MongoDB Atlas! ☁️");
        seedDatabase(); // 🔥 Залишаємо, щоб товари автоматично завантажувалися на вітрину
    })
    .catch(err => console.error("Помилка підключення до бази:", err));


// СХЕМА ТОВАРУ
const productSchema = new mongoose.Schema({
    id: Number,
    name: String,
    price: Number,
    category: String,
    image: String,
    description: String
});
const Product = mongoose.model('Product', productSchema);

// СХЕМА КОРИСТУВАЧА
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true }, // unique гарантує, що імейли не будуть дублюватися
    password: { type: String, required: true },
    favorites: { type: Array, default: [] } // Тут зберігатимемо ID улюблених товарів
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

// ГОЛОВНА СТОРІНКА (Зверни увагу на велику літеру 'Index.html'!)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// API ТОЧКИ
app.get('/api/products', async (req, res) => {
    try {
        const products = await Product.find({});
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/products', async (req, res) => {
    try {
        const { name, price, category, image, description } = req.body;
        const lastProduct = await Product.findOne().sort({ id: -1 });
        const newId = lastProduct ? lastProduct.id + 1 : 1;

        const newProduct = new Product({
            id: newId,
            name,
            price: Number(price),
            category,
            image: image || "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=500",
            description
        });

        await newProduct.save();
        res.json({ success: true, message: "Товар успішно додано!" });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.delete('/api/products/:id', async (req, res) => {
    try {
        const productId = Number(req.params.id);
        await Product.deleteOne({ id: productId });
        res.json({ success: true, message: "Товар успішно видалено!" });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});
app.post('/api/orders', async (req, res) => {
    try {
        // 1. Додаємо paymentMethod, який прилетить із кошика
        const { items, total, customerName, status, paymentMethod } = req.body; 
        const lastOrder = await Order.findOne().sort({ id: -1 });
        const orderId = lastOrder ? lastOrder.id + 1 : 1001;

        const newOrder = new Order({
            id: orderId,
            customerName: customerName || "Анонімний покупець",
            items,
            total,
            // Якщо обрано післяплату, статус логічно зробити "Очікує оплати при отриманні"
            status: status || (paymentMethod === 'післяплата' ? "Очікує оплати при отриманні" : "Оплачено, очікує відправки"), 
            paymentMethod: paymentMethod || "Не вказано", // 2. Записуємо метод оплати в базу
            date: new Date().toLocaleString('uk-UA')
        });

        await newOrder.save();
        res.json({ success: true, orderId: orderId });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});
            
    

// ТЕПЕР МАРШРУТ GET СТОЇТЬ ОКРЕМО, ЯК САМОСТІЙНИЙ БЛОК:
app.get('/api/orders', async (req, res) => {
    try {
        const orders = await Order.find({}).sort({ id: -1 });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const bcrypt = require('bcrypt');

// === РЕЄСТРАЦІЯ КОРИСТУВАЧА (ОНОВЛЕНА З ТОКЕНОМ) ===
app.post('/api/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Перевіряємо, чи є вже такий користувач у базі MongoDB
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ success: false, message: 'Користувач з таким Email вже існує!' });
        }

        // Хешуємо пароль
        const hashedPassword = await bcrypt.hash(password, 10);

        // Створюємо новий документ
        const newUser = new User({
            name,
            email,
            password: hashedPassword,
            favorites: []
        });

        // Зберігаємо в хмару
        await newUser.save();

        // Створюємо JWT токен для нового користувача, щоб він одразу був залогінений
        const token = jwt.sign(
            { id: newUser._id }, 
            process.env.JWT_SECRET, 
            { expiresIn: '7d' }
        );

        // Повертаємо відповідь разом із токеном
        res.status(201).json({ 
            success: true,
            message: 'Реєстрація успішна!', 
            token, // Передаємо токен на фронтенд
            user: { id: newUser._id, name: newUser.name, email: newUser.email, favorites: newUser.favorites } 
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// === МАРШРУТ ВХОДУ ===
// === ВХІД КОРИСТУВАЧА (ОНОВЛЕНИЙ З ТОКЕНОМ) ===
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Шукаємо в MongoDB за email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ success: false, message: 'Неправильний Email або пароль!' });
        }

        // Порівнюємо паролі
        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) {
            return res.status(400).json({ success: false, message: 'Неправильний Email або пароль!' });
        }

        // 1. Створюємо JWT токен. Зашифровуємо в нього id користувача
        // process.env.JWT_SECRET автоматично візьме те секретне слово, яке ти ввів у Render!
        const token = jwt.sign(
            { id: user._id }, 
            process.env.JWT_SECRET, 
            { expiresIn: '7d' } // Токен буде дійсним 7 днів
        );

        // 2. Повертаємо відповідь разом із токеном
        res.json({
            success: true,
            message: 'Вхід успішний!',
            token, // Передаємо токен на фронтенд
            user: { id: user._id, name: user.name, email: user.email, favorites: user.favorites }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});


// === ЗБЕРЕЖЕННЯ ОБРАНОГО В ХМАРУ ===
app.post('/api/favorites', async (req, res) => {
    try {
        const { userId, favorites } = req.body;

        // Знаходимо користувача за його ID та оновлюємо масив favorites
        await User.findByIdAndUpdate(userId, { favorites: favorites });

        res.json({ success: true, message: 'Обране синхронізовано з базою!' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// === АВТОМАТИЧНА ПЕРЕВІРКА ТОКЕНА (АВТОЛОГІН) ===
app.get('/api/me', async (req, res) => {
    try {
        // Беремо токен із заголовків запиту
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Відсікаємо слово "Bearer"

        if (!token) {
            return res.status(401).json({ success: false, message: 'Токен відсутній' });
        }

        // Перевіряємо та розшифровуємо токен за допомогою нашого секрету з Render
        jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
            if (err) {
                return res.status(403).json({ success: false, message: 'Невалідний токен' });
            }

            // Якщо токен правильний, у decoded.id буде лежати ID користувача. Шукаємо його в базі
            const user = await User.findById(decoded.id);
            if (!user) {
                return res.status(404).json({ success: false, message: 'Користувача не знайдено' });
            }

            // Повертаємо дані користувача на фронтенд для автологіну
            res.json({
                success: true,
                user: { id: user._id, name: user.name, email: user.email, favorites: user.favorites }
            });
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});



app.listen(PORT, () => {
    console.log(`Сервер працює`);
});
            
