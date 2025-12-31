'use client';

import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, collection, addDoc, updateDoc, deleteDoc, doc, getDocs } from 'firebase/firestore';
import { LogOut, Plus, Trash2, Edit2, ShoppingCart, Package, BarChart3, Settings, X, Check } from 'lucide-react';
import { Toaster, toast } from 'sonner';

const firebaseConfig = {
  apiKey: 'AIzaSyAdzskLSuccI8Xe8a4OZZZOqep4yDG9WQo',
  authDomain: 'mi-negocio-facil-f6dcd.firebaseapp.com',
  projectId: 'mi-negocio-facil-f6dcd',
  storageBucket: 'mi-negocio-facil-f6dcd.firebasestorage.app',
  messagingSenderId: '974264300632',
  appId: '1:974264300632:web:4f848f782d4bab3cf4062d',
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

interface User { uid: string; email: string; role: 'admin' | 'client'; }
interface Product { id: string; name: string; price: number; quantity: number; clientId: string; }
interface CartItem { id: string; name: string; price: number; quantity: number; }
interface Sale { id: string; items: CartItem[]; total: number; paymentMethod: string; timestamp: string; clientId: string; }
interface Client { id: string; email: string; expiryDate: string; isActive: boolean; }

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState('login');
  const [isLoading, setIsLoading] = useState(false);

  // Login states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Admin states
  const [clients, setClients] = useState<Client[]>([]);
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientPassword, setNewClientPassword] = useState('');
  const [newClientExpiryDate, setNewClientExpiryDate] = useState('');
  const [showNewClientModal, setShowNewClientModal] = useState(false);

  // Client states
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [showNewProductModal, setShowNewProductModal] = useState(false);
  const [productName, setProductName] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productQuantity, setProductQuantity] = useState('');
  const [currency, setCurrency] = useState('Bs');
  const [exchangeRate, setExchangeRate] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('Efectivo');

  const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const handleAdminLogin = async () => {
    if (password !== '123456') {
      toast.error('Contraseña de admin incorrecta');
      return;
    }
    setUser({ uid: 'admin', email: 'admin@sistema', role: 'admin' });
    setCurrentPage('admin');
    loadClients();
  };

  const handleClientLogin = async () => {
    if (!email || !password) {
      toast.error('Por favor completa todos los campos');
      return;
    }
    if (!isValidEmail(email)) {
      toast.error('Email inválido');
      return;
    }
    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      setUser({ uid: userCredential.user.uid, email: userCredential.user.email || '', role: 'client' });
      setCurrentPage('client');
      loadProducts(userCredential.user.uid);
      loadSales(userCredential.user.uid);
    } catch (error: any) {
      toast.error('Email o contraseña incorrectos');
    } finally {
      setIsLoading(false);
    }
  };

  const loadClients = async () => {
    try {
      const clientsRef = collection(db, 'clients');
      const snapshot = await getDocs(clientsRef);
      setClients(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client)));
    } catch (error) {
      console.error('Error loading clients:', error);
    }
  };

  const loadProducts = async (userId: string) => {
    try {
      const productsRef = collection(db, 'products');
      const snapshot = await getDocs(productsRef);
      setProducts(snapshot.docs.filter(doc => doc.data().clientId === userId).map(doc => ({ id: doc.id, ...doc.data() } as Product)));
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const loadSales = async (userId: string) => {
    try {
      const salesRef = collection(db, 'sales');
      const snapshot = await getDocs(salesRef);
      setSales(snapshot.docs.filter(doc => doc.data().clientId === userId).map(doc => ({ id: doc.id, ...doc.data() } as Sale)));
    } catch (error) {
      console.error('Error loading sales:', error);
    }
  };

  const handleCreateClient = async () => {
    if (!newClientEmail || !newClientPassword || !newClientExpiryDate) {
      toast.error('Por favor completa todos los campos');
      return;
    }
    if (!isValidEmail(newClientEmail)) {
      toast.error('Email inválido');
      return;
    }
    if (newClientPassword.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, newClientEmail, newClientPassword);
      const clientRef = collection(db, 'clients');
      await addDoc(clientRef, {
        email: newClientEmail,
        expiryDate: newClientExpiryDate,
        isActive: true,
        uid: userCredential.user.uid,
      });
      setNewClientEmail('');
      setNewClientPassword('');
      setNewClientExpiryDate('');
      setShowNewClientModal(false);
      toast.success('Cliente creado exitosamente');
      loadClients();
    } catch (error: any) {
      let msg = 'Error al crear cliente';
      if (error.code === 'auth/email-already-in-use') msg = 'Este email ya está registrado';
      else if (error.code === 'auth/weak-password') msg = 'La contraseña es muy débil';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProduct = async () => {
    if (!productName || !productPrice || !productQuantity) {
      toast.error('Por favor completa todos los campos');
      return;
    }
    setIsLoading(true);
    try {
      const productsRef = collection(db, 'products');
      await addDoc(productsRef, {
        name: productName,
        price: parseFloat(productPrice),
        quantity: parseInt(productQuantity),
        clientId: user?.uid,
      });
      setProductName('');
      setProductPrice('');
      setProductQuantity('');
      setShowNewProductModal(false);
      toast.success('Producto creado exitosamente');
      loadProducts(user?.uid || '');
    } catch (error) {
      toast.error('Error al crear producto');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar este cliente?')) {
      try {
        await deleteDoc(doc(db, 'clients', clientId));
        toast.success('Cliente eliminado');
        loadClients();
      } catch (error) {
        toast.error('Error al eliminar cliente');
      }
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar este producto?')) {
      try {
        await deleteDoc(doc(db, 'products', productId));
        toast.success('Producto eliminado');
        loadProducts(user?.uid || '');
      } catch (error) {
        toast.error('Error al eliminar producto');
      }
    }
  };

  const addToCart = (product: Product) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      setCart(cart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, { id: product.id, name: product.name, price: product.price, quantity: 1 }]);
    }
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error('El carrito está vacío');
      return;
    }
    setIsLoading(true);
    try {
      const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const salesRef = collection(db, 'sales');
      await addDoc(salesRef, {
        items: cart,
        total,
        paymentMethod,
        exchangeRate: currency === 'USD' ? exchangeRate : 1,
        timestamp: new Date().toISOString(),
        clientId: user?.uid,
      });
      setCart([]);
      toast.success('Venta registrada exitosamente');
      loadSales(user?.uid || '');
    } catch (error) {
      toast.error('Error al registrar venta');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setCurrentPage('login');
      setEmail('');
      setPassword('');
      setCart([]);
    } catch (error) {
      toast.error('Error al cerrar sesión');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
      <Toaster position="top-center" />

      {currentPage === 'login' && (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
            <h1 className="text-3xl font-bold text-amber-900 mb-2 text-center">Mi Negocio Fácil</h1>
            <p className="text-amber-600 text-center mb-6">Sistema SaaS & POS</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email (dejar vacío para Admin)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="cliente@ejemplo.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Contraseña (123456 para Admin)</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <button
                onClick={() => {
                  if (!email) handleAdminLogin();
                  else handleClientLogin();
                }}
                disabled={isLoading}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50"
              >
                {isLoading ? 'Iniciando...' : 'Iniciar Sesión'}
              </button>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm font-semibold text-blue-900 mb-2">Credenciales de Prueba:</p>
              <p className="text-sm text-blue-800">Admin: Contraseña: 123456</p>
              <p className="text-sm text-blue-800">(Los clientes son creados por el admin)</p>
            </div>
          </div>
        </div>
      )}

      {currentPage === 'admin' && user?.role === 'admin' && (
        <div className="min-h-screen bg-gray-900">
          <div className="max-w-7xl mx-auto">
            <div className="bg-amber-600 text-white p-4 flex justify-between items-center">
              <h1 className="text-2xl font-bold">Panel Maestro</h1>
              <button onClick={handleLogout} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg">
                <LogOut size={18} /> Salir
              </button>
            </div>

            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Gestión de Clientes</h2>
                <button
                  onClick={() => setShowNewClientModal(true)}
                  className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg"
                >
                  <Plus size={18} /> Crear Cliente
                </button>
              </div>

              {showNewClientModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                  <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
                    <h3 className="text-xl font-bold text-white mb-4">Crear Nuevo Cliente</h3>
                    <div className="space-y-4">
                      <input
                        type="email"
                        value={newClientEmail}
                        onChange={(e) => setNewClientEmail(e.target.value)}
                        placeholder="Email"
                        className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                      <input
                        type="password"
                        value={newClientPassword}
                        onChange={(e) => setNewClientPassword(e.target.value)}
                        placeholder="Contraseña"
                        className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                      <input
                        type="date"
                        value={newClientExpiryDate}
                        onChange={(e) => setNewClientExpiryDate(e.target.value)}
                        className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleCreateClient}
                          disabled={isLoading}
                          className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-2 rounded-lg disabled:opacity-50"
                        >
                          Crear
                        </button>
                        <button
                          onClick={() => setShowNewClientModal(false)}
                          className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-lg"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid gap-4">
                {clients.map((client) => (
                  <div key={client.id} className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-white font-semibold">{client.email}</p>
                        <p className="text-gray-400 text-sm">Vencimiento: {client.expiryDate}</p>
                        <p className={`text-sm ${client.isActive ? 'text-green-400' : 'text-red-400'}`}>
                          {client.isActive ? 'Activo' : 'Inactivo'}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteClient(client.id)}
                        className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {currentPage === 'client' && user?.role === 'client' && (
        <div className="min-h-screen">
          <div className="bg-amber-600 text-white p-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold">Mi Negocio</h1>
            <button onClick={handleLogout} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg">
              <LogOut size={18} /> Salir
            </button>
          </div>

          <div className="max-w-7xl mx-auto p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <button
                onClick={() => setCurrentPage('pos')}
                className="bg-blue-600 hover:bg-blue-700 text-white p-6 rounded-lg flex items-center gap-4"
              >
                <ShoppingCart size={32} />
                <div className="text-left">
                  <p className="font-semibold">POS</p>
                  <p className="text-sm">Punto de Venta</p>
                </div>
              </button>
              <button
                onClick={() => setCurrentPage('inventory')}
                className="bg-green-600 hover:bg-green-700 text-white p-6 rounded-lg flex items-center gap-4"
              >
                <Package size={32} />
                <div className="text-left">
                  <p className="font-semibold">Inventario</p>
                  <p className="text-sm">Gestionar Productos</p>
                </div>
              </button>
              <button
                onClick={() => setCurrentPage('sales')}
                className="bg-purple-600 hover:bg-purple-700 text-white p-6 rounded-lg flex items-center gap-4"
              >
                <BarChart3 size={32} />
                <div className="text-left">
                  <p className="font-semibold">Caja</p>
                  <p className="text-sm">Historial de Ventas</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {currentPage === 'pos' && user?.role === 'client' && (
        <div className="min-h-screen bg-gray-900">
          <div className="bg-amber-600 text-white p-4 flex justify-between items-center">
            <button onClick={() => setCurrentPage('client')} className="text-white hover:text-gray-200">← Atrás</button>
            <h1 className="text-2xl font-bold">POS - Punto de Venta</h1>
            <button onClick={handleLogout} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg">
              <LogOut size={18} />
            </button>
          </div>

          <div className="max-w-7xl mx-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <h2 className="text-white text-xl font-bold mb-4">Productos Disponibles</h2>
              <div className="grid grid-cols-1 gap-3">
                {products.map((product) => (
                  <div key={product.id} className="bg-gray-800 p-4 rounded-lg flex justify-between items-center">
                    <div className="text-white">
                      <p className="font-semibold">{product.name}</p>
                      <p className="text-gray-400 text-sm">{currency} {product.price.toFixed(2)} | Stock: {product.quantity}</p>
                    </div>
                    <button
                      onClick={() => addToCart(product)}
                      disabled={product.quantity === 0}
                      className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
                    >
                      Agregar
                    </button>
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
                      <p className="text-gray-400">{item.quantity}x {currency} {item.price.toFixed(2)}</p>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="bg-red-600 hover:bg-red-700 text-white p-1 rounded"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-600 pt-4">
                <p className="text-white text-lg font-bold mb-4">
                  Total: {currency} {cart.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)}
                </p>

                <div className="space-y-2 mb-4">
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600"
                  >
                    <option>Efectivo</option>
                    <option>Pago Móvil</option>
                    <option>Zelle</option>
                    <option>Punto</option>
                  </select>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={cart.length === 0 || isLoading}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-semibold disabled:opacity-50"
                >
                  Cobrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {currentPage === 'inventory' && user?.role === 'client' && (
        <div className="min-h-screen bg-gray-900">
          <div className="bg-amber-600 text-white p-4 flex justify-between items-center">
            <button onClick={() => setCurrentPage('client')} className="text-white hover:text-gray-200">← Atrás</button>
            <h1 className="text-2xl font-bold">Inventario</h1>
            <button onClick={() => setShowNewProductModal(true)} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg">
              <Plus size={18} /> Nuevo Producto
            </button>
          </div>

          <div className="max-w-7xl mx-auto p-6">
            {showNewProductModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
                  <h3 className="text-xl font-bold text-white mb-4">Crear Nuevo Producto</h3>
                  <div className="space-y-4">
                    <input
                      type="text"
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      placeholder="Nombre del producto"
                      className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600"
                    />
                    <input
                      type="number"
                      value={productPrice}
                      onChange={(e) => setProductPrice(e.target.value)}
                      placeholder="Precio"
                      className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600"
                    />
                    <input
                      type="number"
                      value={productQuantity}
                      onChange={(e) => setProductQuantity(e.target.value)}
                      placeholder="Cantidad"
                      className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleCreateProduct}
                        disabled={isLoading}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg disabled:opacity-50"
                      >
                        Crear
                      </button>
                      <button
                        onClick={() => setShowNewProductModal(false)}
                        className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-lg"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="grid gap-4">
              {products.map((product) => (
                <div key={product.id} className="bg-gray-800 p-4 rounded-lg border border-gray-700 flex justify-between items-center">
                  <div className="text-white">
                    <p className="font-semibold">{product.name}</p>
                    <p className="text-gray-400 text-sm">Precio: Bs {product.price.toFixed(2)} | Stock: {product.quantity}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteProduct(product.id)}
                    className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {currentPage === 'sales' && user?.role === 'client' && (
        <div className="min-h-screen bg-gray-900">
          <div className="bg-amber-600 text-white p-4 flex justify-between items-center">
            <button onClick={() => setCurrentPage('client')} className="text-white hover:text-gray-200">← Atrás</button>
            <h1 className="text-2xl font-bold">Caja - Historial de Ventas</h1>
            <button onClick={handleLogout} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg">
              <LogOut size={18} />
            </button>
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
                  <p className="text-gray-400 text-sm">{new Date(sale.timestamp).toLocaleString()}</p>
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
