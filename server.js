const express = require('express');
const path = require('path');
const mongoose = require('mongoose');

// Твоє хмарне посилання (не забудь вписати свій пароль замість <db_password>!)
const MONGO_URI = "mongodb+srv://admin:Goodprince7@cluster0.xtmklcd.mongodb.net/myShopDB?retryWrites=true&w=majority&appName=Cluster0";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(__dirname)); // Роздаємо файли з головної папки

// Підключення до хмари MongoDB Atlas
mongoose.connect(MONGO_URI)
    .then(() => {
        console.log("Успішно підключено до хмарної бази MongoDB Atlas! ☁️");
        seedDatabase(); 
    })
    .catch(err => console.error("Помилка підключення до хмари:", err));

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

// СХЕМА ЗАМОВЛЕННЯ
const orderSchema = new mongoose.Schema({
    id: Number,
    customerName: String,
    items: Array,
    total: Number,
    status: String,
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
        const { items, total, customerName } = req.body;
        const lastOrder = await Order.findOne().sort({ id: -1 });
        const orderId = lastOrder ? lastOrder.id + 1 : 1001;

        const newOrder = new Order({
            id: orderId,
            customerName: customerName || "Анонімний покупець",
            items,
            total,
            status: "Оплачено, очікує відправки",
            date: new Date().toLocaleString('uk-UA')
        });
// Маршрут для отримання всіх замовлень (для адміна)
app.get('/api/orders', async (req, res) => {
    try {
        const orders = await Order.find({}).sort({ id: -1 }); // Нові замовлення будуть зверху
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
        
        await newOrder.save();
        res.json({ success: true, orderId: orderId });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Сервер працює`);
});
