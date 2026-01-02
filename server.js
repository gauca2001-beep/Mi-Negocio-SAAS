import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist/client')));

// In-memory database
const db = {
  users: [
    { id: 1, email: 'admin', password: '123456', role: 'admin', name: 'Admin' },
    { id: 2, email: 'user', password: '123456', role: 'user', name: 'Usuario' }
  ],
  clients: [],
  products: [],
  sales: []
};

// API Routes
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  const user = db.users.find(u => u.email === email && u.password === password);
  if (user) {
    res.json({ success: true, user: { id: user.id, email: user.email, role: user.role, name: user.name } });
  } else {
    res.status(401).json({ success: false, message: 'Credenciales inválidas' });
  }
});

app.get('/api/clients', (req, res) => {
  res.json(db.clients);
});

app.post('/api/clients', (req, res) => {
  const client = { id: Date.now(), ...req.body };
  db.clients.push(client);
  res.json(client);
});

app.get('/api/products', (req, res) => {
  res.json(db.products);
});

app.post('/api/products', (req, res) => {
  const product = { id: Date.now(), ...req.body };
  db.products.push(product);
  res.json(product);
});

app.get('/api/sales', (req, res) => {
  res.json(db.sales);
});

app.post('/api/sales', (req, res) => {
  const sale = { id: Date.now(), ...req.body };
  db.sales.push(sale);
  res.json(sale);
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/client/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
