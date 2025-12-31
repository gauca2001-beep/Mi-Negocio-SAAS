import React, { useState } from 'react';

interface Product { id: string; name: string; price: number; quantity: number; }
interface CartItem { id: string; name: string; price: number; quantity: number; }
interface Sale { id: string; items: CartItem[]; total: number; paymentMethod: string; timestamp: string; }
interface Client { id: string; email: string; expiryDate: string; isActive: boolean; }

export default function App() {
  const [page, setPage] = useState('login');
  const [role, setRole] = useState<'admin' | 'client' | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  
  // Admin state
  const [clients, setClients] = useState<Client[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [newPass, setNewPass] = useState('');
  const [newDate, setNewDate] = useState('');
  
  // Client state
  const [products, setProducts] = useState<Product[]>([
    { id: '1', name: 'Producto A', price: 100, quantity: 10 },
    { id: '2', name: 'Producto B', price: 200, quantity: 5 },
  ]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [newProdName, setNewProdName] = useState('');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdQty, setNewProdQty] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Efectivo');

  const showMsg = (text: string, type: 'error' | 'success') => {
    setMessage(text);
    setTimeout(() => setMessage(''), 3000);
  };

  const handleLogin = () => {
    if (!email && password === '123456') {
      setRole('admin');
      setPage('admin');
    } else if (email && password) {
      setRole('client');
      setPage('client');
    } else {
      showMsg('Credenciales inválidas', 'error');
    }
  };

  const handleLogout = () => {
    setRole(null);
    setPage('login');
    setEmail('');
    setPassword('');
    setCart([]);
  };

  const addClient = () => {
    if (!newEmail || !newPass || !newDate) {
      showMsg('Completa todos los campos', 'error');
      return;
    }
    setClients([...clients, { id: Date.now().toString(), email: newEmail, expiryDate: newDate, isActive: true }]);
    setNewEmail('');
    setNewPass('');
    setNewDate('');
    showMsg('Cliente creado', 'success');
    setPage('admin');
  };

  const deleteClient = (id: string) => {
    setClients(clients.filter(c => c.id !== id));
    showMsg('Cliente eliminado', 'success');
  };

  const addProduct = () => {
    if (!newProdName || !newProdPrice || !newProdQty) {
      showMsg('Completa todos los campos', 'error');
      return;
    }
    setProducts([...products, { id: Date.now().toString(), name: newProdName, price: parseFloat(newProdPrice), quantity: parseInt(newProdQty) }]);
    setNewProdName('');
    setNewProdPrice('');
    setNewProdQty('');
    showMsg('Producto creado', 'success');
    setPage('inventory');
  };

  const deleteProduct = (id: string) => {
    setProducts(products.filter(p => p.id !== id));
    showMsg('Producto eliminado', 'success');
  };

  const addToCart = (product: Product) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      setCart(cart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, { id: product.id, name: product.name, price: product.price, quantity: 1 }]);
    }
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const checkout = () => {
    if (cart.length === 0) {
      showMsg('Carrito vacío', 'error');
      return;
    }
    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    setSales([...sales, { id: Date.now().toString(), items: cart, total, paymentMethod, timestamp: new Date().toLocaleString() }]);
    setCart([]);
    showMsg('Venta registrada', 'success');
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fef3e2', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {message && (
        <div style={{ position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)', padding: '12px 24px', backgroundColor: message.includes('inválidas') || message.includes('vacío') || message.includes('Completa') ? '#ef4444' : '#22c55e', color: 'white', borderRadius: '8px', zIndex: 1000 }}>
          {message}
        </div>
      )}

      {page === 'login' && (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', padding: '32px', width: '100%', maxWidth: '400px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#92400e', marginBottom: '8px', textAlign: 'center' }}>Mi Negocio Fácil</h1>
            <p style={{ color: '#f59e0b', textAlign: 'center', marginBottom: '24px' }}>Sistema SaaS & POS</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email (vacío para Admin)" style={{ width: '100%', padding: '10px 16px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Contraseña (123456 para Admin)" style={{ width: '100%', padding: '10px 16px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} />
              <button onClick={handleLogin} style={{ width: '100%', backgroundColor: '#f59e0b', color: 'white', fontWeight: '600', padding: '10px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '14px' }}>Iniciar Sesión</button>
            </div>
            <div style={{ marginTop: '24px', padding: '16px', backgroundColor: '#dbeafe', borderRadius: '8px', border: '1px solid #93c5fd' }}>
              <p style={{ fontSize: '12px', fontWeight: '600', color: '#1e3a8a' }}>Credenciales de Prueba:</p>
              <p style={{ fontSize: '12px', color: '#1e40af' }}>Admin: Contraseña: 123456</p>
            </div>
          </div>
        </div>
      )}

      {page === 'admin' && role === 'admin' && (
        <div style={{ minHeight: '100vh', backgroundColor: '#111827' }}>
          <div style={{ backgroundColor: '#b45309', color: 'white', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h1 style={{ fontSize: '20px', fontWeight: 'bold' }}>Panel Maestro</h1>
            <button onClick={handleLogout} style={{ backgroundColor: '#dc2626', color: 'white', padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '14px' }}>Salir</button>
          </div>
          <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: 'white' }}>Gestión de Clientes</h2>
              <button onClick={() => setPage('addclient')} style={{ backgroundColor: '#f59e0b', color: 'white', padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '14px' }}>+ Crear Cliente</button>
            </div>
            <div style={{ display: 'grid', gap: '16px' }}>
              {clients.map((client) => (
                <div key={client.id} style={{ backgroundColor: '#1f2937', padding: '16px', borderRadius: '8px', border: '1px solid #374151', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ color: 'white' }}>
                    <p style={{ fontWeight: '600' }}>{client.email}</p>
                    <p style={{ color: '#9ca3af', fontSize: '12px' }}>Vencimiento: {client.expiryDate}</p>
                  </div>
                  <button onClick={() => deleteClient(client.id)} style={{ backgroundColor: '#dc2626', color: 'white', padding: '8px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '12px' }}>Eliminar</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {page === 'addclient' && role === 'admin' && (
        <div style={{ minHeight: '100vh', backgroundColor: '#111827' }}>
          <div style={{ backgroundColor: '#b45309', color: 'white', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button onClick={() => setPage('admin')} style={{ color: 'white', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', fontSize: '14px' }}>← Atrás</button>
            <h1 style={{ fontSize: '20px', fontWeight: 'bold' }}>Crear Cliente</h1>
            <button onClick={handleLogout} style={{ backgroundColor: '#dc2626', color: 'white', padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '14px' }}>Salir</button>
          </div>
          <div style={{ maxWidth: '400px', margin: '0 auto', padding: '24px', marginTop: '40px' }}>
            <div style={{ backgroundColor: '#1f2937', padding: '24px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="Email" style={{ width: '100%', padding: '10px 16px', backgroundColor: '#374151', color: 'white', borderRadius: '8px', border: '1px solid #4b5563', fontSize: '14px', boxSizing: 'border-box' }} />
              <input type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} placeholder="Contraseña" style={{ width: '100%', padding: '10px 16px', backgroundColor: '#374151', color: 'white', borderRadius: '8px', border: '1px solid #4b5563', fontSize: '14px', boxSizing: 'border-box' }} />
              <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} style={{ width: '100%', padding: '10px 16px', backgroundColor: '#374151', color: 'white', borderRadius: '8px', border: '1px solid #4b5563', fontSize: '14px', boxSizing: 'border-box' }} />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={addClient} style={{ flex: 1, backgroundColor: '#f59e0b', color: 'white', padding: '10px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}>Crear</button>
                <button onClick={() => setPage('admin')} style={{ flex: 1, backgroundColor: '#4b5563', color: 'white', padding: '10px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}>Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {page === 'client' && role === 'client' && (
        <div>
          <div style={{ backgroundColor: '#b45309', color: 'white', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h1 style={{ fontSize: '20px', fontWeight: 'bold' }}>Mi Negocio</h1>
            <button onClick={handleLogout} style={{ backgroundColor: '#dc2626', color: 'white', padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '14px' }}>Salir</button>
          </div>
          <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
              <button onClick={() => setPage('pos')} style={{ backgroundColor: '#2563eb', color: 'white', padding: '24px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '16px', fontWeight: '600', textAlign: 'left' }}>🛒 POS\n<span style={{ fontSize: '12px', display: 'block', marginTop: '4px' }}>Punto de Venta</span></button>
              <button onClick={() => setPage('inventory')} style={{ backgroundColor: '#16a34a', color: 'white', padding: '24px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '16px', fontWeight: '600', textAlign: 'left' }}>📦 Inventario\n<span style={{ fontSize: '12px', display: 'block', marginTop: '4px' }}>Gestionar Productos</span></button>
              <button onClick={() => setPage('sales')} style={{ backgroundColor: '#9333ea', color: 'white', padding: '24px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '16px', fontWeight: '600', textAlign: 'left' }}>📊 Caja\n<span style={{ fontSize: '12px', display: 'block', marginTop: '4px' }}>Historial de Ventas</span></button>
            </div>
          </div>
        </div>
      )}

      {page === 'pos' && role === 'client' && (
        <div style={{ minHeight: '100vh', backgroundColor: '#111827' }}>
          <div style={{ backgroundColor: '#b45309', color: 'white', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button onClick={() => setPage('client')} style={{ color: 'white', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', fontSize: '14px' }}>← Atrás</button>
            <h1 style={{ fontSize: '20px', fontWeight: 'bold' }}>POS - Punto de Venta</h1>
            <button onClick={handleLogout} style={{ backgroundColor: '#dc2626', color: 'white', padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '14px' }}>Salir</button>
          </div>
          <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px', display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px' }}>
            <div>
              <h2 style={{ color: 'white', fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>Productos Disponibles</h2>
              <div style={{ display: 'grid', gap: '12px' }}>
                {products.map((product) => (
                  <div key={product.id} style={{ backgroundColor: '#1f2937', padding: '16px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ color: 'white' }}>
                      <p style={{ fontWeight: '600' }}>{product.name}</p>
                      <p style={{ color: '#9ca3af', fontSize: '12px' }}>Bs {product.price.toFixed(2)} | Stock: {product.quantity}</p>
                    </div>
                    <button onClick={() => addToCart(product)} disabled={product.quantity === 0} style={{ backgroundColor: '#f59e0b', color: 'white', padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '12px', opacity: product.quantity === 0 ? 0.5 : 1 }}>Agregar</button>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ backgroundColor: '#1f2937', padding: '16px', borderRadius: '8px', height: 'fit-content' }}>
              <h3 style={{ color: 'white', fontSize: '16px', fontWeight: 'bold', marginBottom: '16px' }}>Carrito</h3>
              <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '16px' }}>
                {cart.map((item) => (
                  <div key={item.id} style={{ backgroundColor: '#374151', padding: '8px', borderRadius: '4px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ color: 'white', fontSize: '12px' }}>
                      <p>{item.name}</p>
                      <p style={{ color: '#9ca3af' }}>{item.quantity}x Bs {item.price.toFixed(2)}</p>
                    </div>
                    <button onClick={() => removeFromCart(item.id)} style={{ backgroundColor: '#dc2626', color: 'white', padding: '4px 8px', borderRadius: '4px', border: 'none', cursor: 'pointer', fontSize: '12px' }}>×</button>
                  </div>
                ))}
              </div>
              <div style={{ borderTop: '1px solid #4b5563', paddingTop: '16px' }}>
                <p style={{ color: 'white', fontSize: '16px', fontWeight: 'bold', marginBottom: '16px' }}>Total: Bs {cart.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)}</p>
                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} style={{ width: '100%', padding: '8px', backgroundColor: '#374151', color: 'white', borderRadius: '8px', border: '1px solid #4b5563', marginBottom: '16px', fontSize: '12px', boxSizing: 'border-box' }}>
                  <option>Efectivo</option>
                  <option>Pago Móvil</option>
                  <option>Zelle</option>
                  <option>Punto</option>
                </select>
                <button onClick={checkout} disabled={cart.length === 0} style={{ width: '100%', backgroundColor: '#16a34a', color: 'white', padding: '10px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '14px', opacity: cart.length === 0 ? 0.5 : 1 }}>Cobrar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {page === 'inventory' && role === 'client' && (
        <div style={{ minHeight: '100vh', backgroundColor: '#111827' }}>
          <div style={{ backgroundColor: '#b45309', color: 'white', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button onClick={() => setPage('client')} style={{ color: 'white', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', fontSize: '14px' }}>← Atrás</button>
            <h1 style={{ fontSize: '20px', fontWeight: 'bold' }}>Inventario</h1>
            <button onClick={() => setPage('addproduct')} style={{ backgroundColor: '#16a34a', color: 'white', padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '14px' }}>+ Nuevo Producto</button>
          </div>
          <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px' }}>
            <div style={{ display: 'grid', gap: '16px' }}>
              {products.map((product) => (
                <div key={product.id} style={{ backgroundColor: '#1f2937', padding: '16px', borderRadius: '8px', border: '1px solid #374151', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ color: 'white' }}>
                    <p style={{ fontWeight: '600' }}>{product.name}</p>
                    <p style={{ color: '#9ca3af', fontSize: '12px' }}>Precio: Bs {product.price.toFixed(2)} | Stock: {product.quantity}</p>
                  </div>
                  <button onClick={() => deleteProduct(product.id)} style={{ backgroundColor: '#dc2626', color: 'white', padding: '8px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '12px' }}>Eliminar</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {page === 'addproduct' && role === 'client' && (
        <div style={{ minHeight: '100vh', backgroundColor: '#111827' }}>
          <div style={{ backgroundColor: '#b45309', color: 'white', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button onClick={() => setPage('inventory')} style={{ color: 'white', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', fontSize: '14px' }}>← Atrás</button>
            <h1 style={{ fontSize: '20px', fontWeight: 'bold' }}>Crear Producto</h1>
            <button onClick={handleLogout} style={{ backgroundColor: '#dc2626', color: 'white', padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '14px' }}>Salir</button>
          </div>
          <div style={{ maxWidth: '400px', margin: '0 auto', padding: '24px', marginTop: '40px' }}>
            <div style={{ backgroundColor: '#1f2937', padding: '24px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <input type="text" value={newProdName} onChange={(e) => setNewProdName(e.target.value)} placeholder="Nombre del producto" style={{ width: '100%', padding: '10px 16px', backgroundColor: '#374151', color: 'white', borderRadius: '8px', border: '1px solid #4b5563', fontSize: '14px', boxSizing: 'border-box' }} />
              <input type="number" value={newProdPrice} onChange={(e) => setNewProdPrice(e.target.value)} placeholder="Precio" style={{ width: '100%', padding: '10px 16px', backgroundColor: '#374151', color: 'white', borderRadius: '8px', border: '1px solid #4b5563', fontSize: '14px', boxSizing: 'border-box' }} />
              <input type="number" value={newProdQty} onChange={(e) => setNewProdQty(e.target.value)} placeholder="Cantidad" style={{ width: '100%', padding: '10px 16px', backgroundColor: '#374151', color: 'white', borderRadius: '8px', border: '1px solid #4b5563', fontSize: '14px', boxSizing: 'border-box' }} />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={addProduct} style={{ flex: 1, backgroundColor: '#16a34a', color: 'white', padding: '10px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}>Crear</button>
                <button onClick={() => setPage('inventory')} style={{ flex: 1, backgroundColor: '#4b5563', color: 'white', padding: '10px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}>Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {page === 'sales' && role === 'client' && (
        <div style={{ minHeight: '100vh', backgroundColor: '#111827' }}>
          <div style={{ backgroundColor: '#b45309', color: 'white', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button onClick={() => setPage('client')} style={{ color: 'white', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', fontSize: '14px' }}>← Atrás</button>
            <h1 style={{ fontSize: '20px', fontWeight: 'bold' }}>Caja - Historial de Ventas</h1>
            <button onClick={handleLogout} style={{ backgroundColor: '#dc2626', color: 'white', padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '14px' }}>Salir</button>
          </div>
          <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px' }}>
            <div style={{ display: 'grid', gap: '16px' }}>
              {sales.map((sale) => (
                <div key={sale.id} style={{ backgroundColor: '#1f2937', padding: '16px', borderRadius: '8px', border: '1px solid #374151' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                    <p style={{ color: 'white', fontWeight: '600' }}>Venta #{sale.id.slice(0, 8)}</p>
                    <p style={{ color: '#f59e0b', fontWeight: 'bold' }}>Bs {sale.total.toFixed(2)}</p>
                  </div>
                  <p style={{ color: '#9ca3af', fontSize: '12px' }}>Método: {sale.paymentMethod}</p>
                  <p style={{ color: '#9ca3af', fontSize: '12px' }}>{sale.timestamp}</p>
                  <div style={{ marginTop: '8px', color: '#d1d5db', fontSize: '12px' }}>
                    {sale.items.map((item, idx) => (
                      <p key={idx}>{item.quantity}x {item.name}</p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
