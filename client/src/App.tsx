import React, { useState } from 'react';
import { LogOut, Plus, Trash2, ShoppingCart, Package, BarChart3 } from 'lucide-react';
import { Toaster, toast } from 'sonner';

interface Product { id: string; name: string; price: number; quantity: number; }
interface CartItem { id: string; name: string; price: number; quantity: number; }
interface Sale { id: string; items: CartItem[]; total: number; paymentMethod: string; timestamp: string; }
interface Client { id: string; email: string; expiryDate: string; isActive: boolean; }

export default function App() {
  const [page, setPage] = useState('login');
  const [role, setRole] = useState<'admin' | 'client' | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
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

  const handleLogin = () => {
    if (!email && password === '123456') {
      setRole('admin');
      setPage('admin');
    } else if (email && password) {
      setRole('client');
      setPage('client');
    } else {
      toast.error('Credenciales inválidas');
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
      toast.error('Completa todos los campos');
      return;
    }
    setClients([...clients, { id: Date.now().toString(), email: newEmail, expiryDate: newDate, isActive: true }]);
    setNewEmail('');
    setNewPass('');
    setNewDate('');
    toast.success('Cliente creado');
  };

  const deleteClient = (id: string) => {
    setClients(clients.filter(c => c.id !== id));
    toast.success('Cliente eliminado');
  };

  const addProduct = () => {
    if (!newProdName || !newProdPrice || !newProdQty) {
      toast.error('Completa todos los campos');
      return;
    }
    setProducts([...products, { id: Date.now().toString(), name: newProdName, price: parseFloat(newProdPrice), quantity: parseInt(newProdQty) }]);
    setNewProdName('');
    setNewProdPrice('');
    setNewProdQty('');
    toast.success('Producto creado');
  };

  const deleteProduct = (id: string) => {
    setProducts(products.filter(p => p.id !== id));
    toast.success('Producto eliminado');
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
      toast.error('Carrito vacío');
      return;
    }
    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    setSales([...sales, { id: Date.now().toString(), items: cart, total, paymentMethod, timestamp: new Date().toLocaleString() }]);
    setCart([]);
    toast.success('Venta registrada');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
      <Toaster position="top-center" />

      {page === 'login' && (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
            <h1 className="text-3xl font-bold text-amber-900 mb-2 text-center">Mi Negocio Fácil</h1>
            <p className="text-amber-600 text-center mb-6">Sistema SaaS & POS</p>
            <div className="space-y-4">
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email (vacío para Admin)" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500" />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Contraseña (123456 para Admin)" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500" />
              <button onClick={handleLogin} className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2 rounded-lg transition">Iniciar Sesión</button>
            </div>
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm font-semibold text-blue-900">Credenciales de Prueba:</p>
              <p className="text-sm text-blue-800">Admin: Contraseña: 123456</p>
            </div>
          </div>
        </div>
      )}

      {page === 'admin' && role === 'admin' && (
        <div className="min-h-screen bg-gray-900">
          <div className="bg-amber-600 text-white p-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold">Panel Maestro</h1>
            <button onClick={handleLogout} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg"><LogOut size={18} /> Salir</button>
          </div>
          <div className="max-w-7xl mx-auto p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Gestión de Clientes</h2>
              <button onClick={() => setPage('addclient')} className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg"><Plus size={18} /> Crear Cliente</button>
            </div>
            <div className="grid gap-4">
              {clients.map((client) => (
                <div key={client.id} className="bg-gray-800 p-4 rounded-lg border border-gray-700 flex justify-between items-center">
                  <div className="text-white">
                    <p className="font-semibold">{client.email}</p>
                    <p className="text-gray-400 text-sm">Vencimiento: {client.expiryDate}</p>
                  </div>
                  <button onClick={() => deleteClient(client.id)} className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg"><Trash2 size={18} /></button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {page === 'addclient' && role === 'admin' && (
        <div className="min-h-screen bg-gray-900">
          <div className="bg-amber-600 text-white p-4 flex justify-between items-center">
            <button onClick={() => setPage('admin')} className="text-white hover:text-gray-200">← Atrás</button>
            <h1 className="text-2xl font-bold">Crear Cliente</h1>
            <button onClick={handleLogout} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg"><LogOut size={18} /></button>
          </div>
          <div className="max-w-md mx-auto p-6 mt-10">
            <div className="bg-gray-800 p-6 rounded-lg space-y-4">
              <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="Email" className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600" />
              <input type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} placeholder="Contraseña" className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600" />
              <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600" />
              <div className="flex gap-2">
                <button onClick={addClient} className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-2 rounded-lg">Crear</button>
                <button onClick={() => setPage('admin')} className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-lg">Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {page === 'client' && role === 'client' && (
        <div className="min-h-screen">
          <div className="bg-amber-600 text-white p-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold">Mi Negocio</h1>
            <button onClick={handleLogout} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg"><LogOut size={18} /> Salir</button>
          </div>
          <div className="max-w-7xl mx-auto p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button onClick={() => setPage('pos')} className="bg-blue-600 hover:bg-blue-700 text-white p-6 rounded-lg flex items-center gap-4"><ShoppingCart size={32} /><div className="text-left"><p className="font-semibold">POS</p><p className="text-sm">Punto de Venta</p></div></button>
              <button onClick={() => setPage('inventory')} className="bg-green-600 hover:bg-green-700 text-white p-6 rounded-lg flex items-center gap-4"><Package size={32} /><div className="text-left"><p className="font-semibold">Inventario</p><p className="text-sm">Gestionar Productos</p></div></button>
              <button onClick={() => setPage('sales')} className="bg-purple-600 hover:bg-purple-700 text-white p-6 rounded-lg flex items-center gap-4"><BarChart3 size={32} /><div className="text-left"><p className="font-semibold">Caja</p><p className="text-sm">Historial de Ventas</p></div></button>
            </div>
          </div>
        </div>
      )}

      {page === 'pos' && role === 'client' && (
        <div className="min-h-screen bg-gray-900">
          <div className="bg-amber-600 text-white p-4 flex justify-between items-center">
            <button onClick={() => setPage('client')} className="text-white hover:text-gray-200">← Atrás</button>
            <h1 className="text-2xl font-bold">POS - Punto de Venta</h1>
            <button onClick={handleLogout} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg"><LogOut size={18} /></button>
          </div>
          <div className="max-w-7xl mx-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <h2 className="text-white text-xl font-bold mb-4">Productos Disponibles</h2>
              <div className="grid grid-cols-1 gap-3">
                {products.map((product) => (
                  <div key={product.id} className="bg-gray-800 p-4 rounded-lg flex justify-between items-center">
                    <div className="text-white">
                      <p className="font-semibold">{product.name}</p>
                      <p className="text-gray-400 text-sm">Bs {product.price.toFixed(2)} | Stock: {product.quantity}</p>
                    </div>
                    <button onClick={() => addToCart(product)} disabled={product.quantity === 0} className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg disabled:opacity-50">Agregar</button>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg h-fit">
              <h3 className="text-white text-lg font-bold mb-4">Carrito</h3>
              <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
                {cart.map((item) => (
                  <div key={item.id} className="bg-gray-700 p-2 rounded flex justify-between items-center">
                    <div className="text-white text-sm">
                      <p>{item.name}</p>
                      <p className="text-gray-400">{item.quantity}x Bs {item.price.toFixed(2)}</p>
                    </div>
                    <button onClick={() => removeFromCart(item.id)} className="bg-red-600 hover:bg-red-700 text-white p-1 rounded">×</button>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-600 pt-4">
                <p className="text-white text-lg font-bold mb-4">Total: Bs {cart.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)}</p>
                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 mb-4">
                  <option>Efectivo</option>
                  <option>Pago Móvil</option>
                  <option>Zelle</option>
                  <option>Punto</option>
                </select>
                <button onClick={checkout} disabled={cart.length === 0} className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-semibold disabled:opacity-50">Cobrar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {page === 'inventory' && role === 'client' && (
        <div className="min-h-screen bg-gray-900">
          <div className="bg-amber-600 text-white p-4 flex justify-between items-center">
            <button onClick={() => setPage('client')} className="text-white hover:text-gray-200">← Atrás</button>
            <h1 className="text-2xl font-bold">Inventario</h1>
            <button onClick={() => setPage('addproduct')} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg"><Plus size={18} /> Nuevo Producto</button>
          </div>
          <div className="max-w-7xl mx-auto p-6">
            <div className="grid gap-4">
              {products.map((product) => (
                <div key={product.id} className="bg-gray-800 p-4 rounded-lg border border-gray-700 flex justify-between items-center">
                  <div className="text-white">
                    <p className="font-semibold">{product.name}</p>
                    <p className="text-gray-400 text-sm">Precio: Bs {product.price.toFixed(2)} | Stock: {product.quantity}</p>
                  </div>
                  <button onClick={() => deleteProduct(product.id)} className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg"><Trash2 size={18} /></button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {page === 'addproduct' && role === 'client' && (
        <div className="min-h-screen bg-gray-900">
          <div className="bg-amber-600 text-white p-4 flex justify-between items-center">
            <button onClick={() => setPage('inventory')} className="text-white hover:text-gray-200">← Atrás</button>
            <h1 className="text-2xl font-bold">Crear Producto</h1>
            <button onClick={handleLogout} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg"><LogOut size={18} /></button>
          </div>
          <div className="max-w-md mx-auto p-6 mt-10">
            <div className="bg-gray-800 p-6 rounded-lg space-y-4">
              <input type="text" value={newProdName} onChange={(e) => setNewProdName(e.target.value)} placeholder="Nombre del producto" className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600" />
              <input type="number" value={newProdPrice} onChange={(e) => setNewProdPrice(e.target.value)} placeholder="Precio" className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600" />
              <input type="number" value={newProdQty} onChange={(e) => setNewProdQty(e.target.value)} placeholder="Cantidad" className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600" />
              <div className="flex gap-2">
                <button onClick={addProduct} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg">Crear</button>
                <button onClick={() => setPage('inventory')} className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-lg">Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {page === 'sales' && role === 'client' && (
        <div className="min-h-screen bg-gray-900">
          <div className="bg-amber-600 text-white p-4 flex justify-between items-center">
            <button onClick={() => setPage('client')} className="text-white hover:text-gray-200">← Atrás</button>
            <h1 className="text-2xl font-bold">Caja - Historial de Ventas</h1>
            <button onClick={handleLogout} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg"><LogOut size={18} /></button>
          </div>
          <div className="max-w-7xl mx-auto p-6">
            <div className="grid gap-4">
              {sales.map((sale) => (
                <div key={sale.id} className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-white font-semibold">Venta #{sale.id.slice(0, 8)}</p>
                    <p className="text-amber-400 font-bold">Bs {sale.total.toFixed(2)}</p>
                  </div>
                  <p className="text-gray-400 text-sm">Método: {sale.paymentMethod}</p>
                  <p className="text-gray-400 text-sm">{sale.timestamp}</p>
                  <div className="mt-2 text-gray-300 text-sm">
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
