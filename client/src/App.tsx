import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import {
  LogOut,
  Plus,
  Trash2,
  Edit2,
  ShoppingCart,
  Package,
  BarChart3,
  Settings,
  X,
  Check,
  AlertCircle,
  DollarSign,
  CreditCard,
} from 'lucide-react';
import { Toaster, toast } from 'sonner';

// ============================================================================
// FIREBASE CONFIGURATION
// ============================================================================
const firebaseConfig = {
  apiKey: 'AIzaSyAdzskLSuccI8Xe8a4OZZZOqep4yDG9WQo',
  authDomain: 'mi-negocio-facil-f6dcd.firebaseapp.com',
  projectId: 'mi-negocio-facil-f6dcd',
  storageBucket: 'mi-negocio-facil-f6dcd.firebasestorage.app',
  messagingSenderId: '974264300632',
  appId: '1:974264300632:web:4f848f782d4bab3cf4062d',
  measurementId: 'G-T0XBVKKSRS',
};

let app: any;
let auth: any;
let db: any;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} catch (error) {
  console.error('Firebase initialization error:', error);
}

// ============================================================================
// TYPES
// ============================================================================
interface User {
  uid: string;
  email: string;
  role: 'admin' | 'client';
}

interface Product {
  id: string;
  name: string;
  price: number;
  quantity: number;
  clientId: string;
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface Sale {
  id: string;
  items: CartItem[];
  total: number;
  paymentMethod: string;
  exchangeRate?: number;
  timestamp: string;
  clientId: string;
}

interface Client {
  id: string;
  email: string;
  expiryDate: string;
  isActive: boolean;
  createdAt: string;
}

// ============================================================================
// LOGIN COMPONENT
// ============================================================================
const Login: React.FC<{
  onLoginSuccess: (user: User) => void;
}> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Super Admin Login
    if (password === '123456' && (!email || email === 'admin')) {
      onLoginSuccess({
        uid: 'admin-' + Date.now(),
        email: 'admin@sistema.local',
        role: 'admin',
      });
      return;
    }

    // Client Login
    if (!email || !password) {
      setError('Por favor completa todos los campos');
      return;
    }

    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      onLoginSuccess({
        uid: userCredential.user.uid,
        email: userCredential.user.email || '',
        role: 'client',
      });
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-amber-900 mb-2">
            Mi Negocio Fácil
          </h1>
          <p className="text-amber-700">Sistema SaaS & POS</p>
        </div>

        <div className="bg-white rounded-lg shadow-xl p-8 border border-amber-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Iniciar Sesión</h2>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email (dejar vacío para Admin)
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-amber-600"
                placeholder="cliente@ejemplo.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña (123456 para Admin)
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-amber-600"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-4 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-lg font-semibold transition disabled:opacity-50"
            >
              {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>
          </form>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
            <p className="font-semibold mb-2">Credenciales de Prueba:</p>
            <p>Admin: Contraseña: 123456</p>
            <p className="text-xs text-blue-600 mt-2">
              (Los clientes son creados por el admin)
            </p>
          </div>
        </div>
      </div>

      <Toaster position="bottom-right" />
    </div>
  );
};

// ============================================================================
// ADMIN PANEL
// ============================================================================
const AdminPanel: React.FC<{
  user: User;
  onLogout: () => void;
}> = ({ user, onLogout }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientPassword, setNewClientPassword] = useState('');
  const [newClientExpiryDate, setNewClientExpiryDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadClients = async () => {
      try {
        const clientsCollection = collection(db, 'clients');
        const snapshot = await getDocs(clientsCollection);
        const clientsList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        } as Client));
        setClients(clientsList);
      } catch (error) {
        console.error('Error loading clients:', error);
        toast.error('Error al cargar clientes');
      }
    };

    loadClients();
  }, []);

  const handleCreateClient = async () => {
    if (!newClientEmail || !newClientPassword || !newClientExpiryDate) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        newClientEmail,
        newClientPassword
      );

      const clientRef = collection(db, 'clients');
      await addDoc(clientRef, {
        email: newClientEmail,
        expiryDate: newClientExpiryDate,
        isActive: true,
        createdAt: new Date().toISOString(),
        uid: userCredential.user.uid,
      });

      setClients([
        ...clients,
        {
          id: userCredential.user.uid,
          email: newClientEmail,
          expiryDate: newClientExpiryDate,
          isActive: true,
          createdAt: new Date().toISOString(),
        },
      ]);

      setNewClientEmail('');
      setNewClientPassword('');
      setNewClientExpiryDate('');
      setShowNewClientModal(false);
      toast.success('Cliente creado exitosamente');
    } catch (error: any) {
      console.error('Error creating client:', error);
      toast.error(error.message || 'Error al crear cliente');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    setIsLoading(true);
    try {
      const clientRef = doc(db, 'clients', clientId);
      await deleteDoc(clientRef);
      setClients(clients.filter((c) => c.id !== clientId));
      toast.success('Cliente eliminado exitosamente');
    } catch (error) {
      console.error('Error deleting client:', error);
      toast.error('Error al eliminar cliente');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActive = async (clientId: string, currentStatus: boolean) => {
    setIsLoading(true);
    try {
      const clientRef = doc(db, 'clients', clientId);
      await updateDoc(clientRef, {
        isActive: !currentStatus,
      });

      setClients(
        clients.map((c) =>
          c.id === clientId ? { ...c, isActive: !currentStatus } : c
        )
      );

      toast.success(
        !currentStatus ? 'Cliente activado' : 'Cliente desactivado'
      );
    } catch (error) {
      console.error('Error toggling client status:', error);
      toast.error('Error al cambiar estado del cliente');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="bg-gray-800/50 backdrop-blur border-b border-amber-500/20 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-amber-400">Panel Maestro</h1>
            <p className="text-gray-400 text-sm">Gestión de Licencias SaaS</p>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
          >
            <LogOut className="w-4 h-4" />
            Cerrar Sesión
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <button
            onClick={() => setShowNewClientModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-lg font-semibold transition shadow-lg"
          >
            <Plus className="w-5 h-5" />
            Crear Nuevo Cliente
          </button>
        </div>

        <div className="bg-gray-800/30 backdrop-blur border border-gray-700 rounded-lg overflow-hidden">
          {clients.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <Package className="w-16 h-16 text-amber-100 mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Sin Clientes</h3>
              <p className="text-gray-500 text-center">Crea tu primer cliente para comenzar</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-800/50 border-b border-gray-700">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                      Email
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                      Vencimiento
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                      Estado
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map((client) => (
                    <tr
                      key={client.id}
                      className="border-b border-gray-700 hover:bg-gray-800/30 transition"
                    >
                      <td className="px-6 py-4 text-gray-300">{client.email}</td>
                      <td className="px-6 py-4 text-gray-300">
                        {new Date(client.expiryDate).toLocaleDateString('es-VE')}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            client.isActive
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}
                        >
                          {client.isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              handleToggleActive(client.id, client.isActive)
                            }
                            className={`p-2 rounded transition ${
                              client.isActive
                                ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400'
                                : 'bg-green-500/20 hover:bg-green-500/30 text-green-400'
                            }`}
                          >
                            {client.isActive ? (
                              <X className="w-4 h-4" />
                            ) : (
                              <Check className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => handleDeleteClient(client.id)}
                            className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showNewClientModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 border border-gray-700">
            <h2 className="text-2xl font-bold text-amber-400 mb-4">
              Crear Nuevo Cliente
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={newClientEmail}
                  onChange={(e) => setNewClientEmail(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-amber-500"
                  placeholder="cliente@ejemplo.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Contraseña
                </label>
                <input
                  type="password"
                  value={newClientPassword}
                  onChange={(e) => setNewClientPassword(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-amber-500"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Fecha de Vencimiento
                </label>
                <input
                  type="date"
                  value={newClientExpiryDate}
                  onChange={(e) => setNewClientExpiryDate(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowNewClientModal(false)}
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateClient}
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition disabled:opacity-50 font-semibold"
              >
                {isLoading ? 'Creando...' : 'Crear'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Toaster position="bottom-right" />
    </div>
  );
};

// ============================================================================
// CLIENT APP
// ============================================================================
const ClientApp: React.FC<{
  user: User;
  onLogout: () => void;
}> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'pos' | 'inventory' | 'sales' | 'settings'>('pos');
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [showNewProductModal, setShowNewProductModal] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newProductPrice, setNewProductPrice] = useState('');
  const [newProductQuantity, setNewProductQuantity] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [multimonedaEnabled, setMultimonedaEnabled] = useState(false);
  const [exchangeRate, setExchangeRate] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('efectivo');

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const productsCollection = collection(db, 'products');
        const q = query(productsCollection, where('clientId', '==', user.uid));
        const snapshot = await getDocs(q);
        const productsList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        } as Product));
        setProducts(productsList);
      } catch (error) {
        console.error('Error loading products:', error);
      }
    };

    loadProducts();
  }, [user.uid]);

  useEffect(() => {
    const loadSales = async () => {
      try {
        const salesCollection = collection(db, 'sales');
        const q = query(salesCollection, where('clientId', '==', user.uid));
        const snapshot = await getDocs(q);
        const salesList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        } as Sale));
        setSales(salesList);
      } catch (error) {
        console.error('Error loading sales:', error);
      }
    };

    loadSales();
  }, [user.uid]);

  const handleCreateProduct = async () => {
    if (!newProductName || !newProductPrice || !newProductQuantity) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    setIsLoading(true);
    try {
      const productsCollection = collection(db, 'products');
      const docRef = await addDoc(productsCollection, {
        name: newProductName,
        price: parseFloat(newProductPrice),
        quantity: parseInt(newProductQuantity),
        clientId: user.uid,
        createdAt: new Date().toISOString(),
      });

      setProducts([
        ...products,
        {
          id: docRef.id,
          name: newProductName,
          price: parseFloat(newProductPrice),
          quantity: parseInt(newProductQuantity),
          clientId: user.uid,
        },
      ]);

      setNewProductName('');
      setNewProductPrice('');
      setNewProductQuantity('');
      setShowNewProductModal(false);
      toast.success('Producto creado exitosamente');
    } catch (error) {
      console.error('Error creating product:', error);
      toast.error('Error al crear producto');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    setIsLoading(true);
    try {
      const productRef = doc(db, 'products', productId);
      await deleteDoc(productRef);
      setProducts(products.filter((p) => p.id !== productId));
      toast.success('Producto eliminado exitosamente');
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Error al eliminar producto');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToCart = (product: Product) => {
    const existingItem = cart.find((item) => item.id === product.id);

    if (existingItem) {
      if (existingItem.quantity < product.quantity) {
        setCart(
          cart.map((item) =>
            item.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        );
      } else {
        toast.error('No hay suficiente cantidad en inventario');
      }
    } else {
      setCart([
        ...cart,
        {
          id: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
        },
      ]);
    }
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.id !== productId));
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error('El carrito está vacío');
      return;
    }

    setIsLoading(true);
    try {
      const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

      const salesCollection = collection(db, 'sales');
      await addDoc(salesCollection, {
        items: cart,
        total: multimonedaEnabled ? total / exchangeRate : total,
        paymentMethod,
        exchangeRate: multimonedaEnabled ? exchangeRate : undefined,
        timestamp: new Date().toISOString(),
        clientId: user.uid,
      });

      for (const item of cart) {
        const product = products.find((p) => p.id === item.id);
        if (product) {
          const productRef = doc(db, 'products', item.id);
          await updateDoc(productRef, {
            quantity: product.quantity - item.quantity,
          });
        }
      }

      setSales([
        ...sales,
        {
          id: Date.now().toString(),
          items: cart,
          total: multimonedaEnabled ? total / exchangeRate : total,
          paymentMethod,
          exchangeRate: multimonedaEnabled ? exchangeRate : undefined,
          timestamp: new Date().toISOString(),
          clientId: user.uid,
        },
      ]);

      setCart([]);
      toast.success('Venta procesada exitosamente');
    } catch (error) {
      console.error('Error processing sale:', error);
      toast.error('Error al procesar venta');
    } finally {
      setIsLoading(false);
    }
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const displayTotal = multimonedaEnabled ? cartTotal / exchangeRate : cartTotal;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-amber-600">Mi Negocio Fácil</h1>
            <p className="text-gray-600 text-sm">Sistema POS e Inventario</p>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
          >
            <LogOut className="w-4 h-4" />
            Cerrar Sesión
          </button>
        </div>
      </div>

      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 flex gap-8">
          {[
            { id: 'pos' as const, label: 'POS', icon: ShoppingCart },
            { id: 'inventory' as const, label: 'Inventario', icon: Package },
            { id: 'sales' as const, label: 'Caja', icon: BarChart3 },
            { id: 'settings' as const, label: 'Configuración', icon: Settings },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`py-4 px-2 border-b-2 font-semibold transition flex items-center gap-2 ${
                activeTab === id
                  ? 'border-amber-600 text-amber-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="w-5 h-5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'pos' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Productos Disponibles
              </h2>
              {products.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Sin productos disponibles</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {products.map((product) => (
                    <div
                      key={product.id}
                      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition"
                    >
                      <h3 className="font-semibold text-gray-900 mb-2">
                        {product.name}
                      </h3>
                      <p className="text-gray-600 mb-2">
                        Bs {product.price.toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-500 mb-4">
                        Stock: {product.quantity}
                      </p>
                      <button
                        onClick={() => handleAddToCart(product)}
                        disabled={product.quantity === 0}
                        className="w-full px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition disabled:opacity-50"
                      >
                        Agregar al Carrito
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white border border-gray-200 rounded-lg p-6 sticky top-24">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <ShoppingCart className="w-6 h-6" />
                  Carrito
                </h2>

                {cart.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">Carrito vacío</p>
                ) : (
                  <>
                    <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
                      {cart.map((item) => (
                        <div
                          key={item.id}
                          className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">
                              {item.name}
                            </p>
                            <p className="text-sm text-gray-600">
                              Bs {item.price.toFixed(2)} x {item.quantity}
                            </p>
                          </div>
                          <button
                            onClick={() => handleRemoveFromCart(item.id)}
                            className="ml-2 p-1 text-red-600 hover:bg-red-50 rounded"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-gray-200 pt-4 mb-4">
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-600">Subtotal:</span>
                        <span className="font-semibold">
                          Bs {cartTotal.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total:</span>
                        <span className="text-amber-600">
                          {multimonedaEnabled ? 'USD' : 'Bs'}{' '}
                          {displayTotal.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Método de Pago
                      </label>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-amber-600"
                      >
                        <option value="efectivo">Efectivo</option>
                        <option value="pago-movil">Pago Móvil</option>
                        <option value="zelle">Zelle</option>
                        <option value="punto">Punto</option>
                      </select>
                    </div>

                    <button
                      onClick={handleCheckout}
                      disabled={isLoading}
                      className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition disabled:opacity-50"
                    >
                      {isLoading ? 'Procesando...' : 'Procesar Venta'}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'inventory' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Gestión de Inventario
              </h2>
              <button
                onClick={() => setShowNewProductModal(true)}
                className="flex items-center gap-2 px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold transition"
              >
                <Plus className="w-5 h-5" />
                Agregar Producto
              </button>
            </div>

            {products.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Sin productos</p>
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Nombre
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Precio
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Stock
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <tr
                        key={product.id}
                        className="border-b border-gray-200 hover:bg-gray-50"
                      >
                        <td className="px-6 py-4 text-gray-900">{product.name}</td>
                        <td className="px-6 py-4 text-gray-900">
                          Bs {product.price.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-gray-900">{product.quantity}</td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'sales' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Historial de Ventas
            </h2>

            {sales.length === 0 ? (
              <div className="text-center py-12">
                <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Sin ventas registradas</p>
              </div>
            ) : (
              <div className="space-y-4">
                {sales.map((sale) => (
                  <div
                    key={sale.id}
                    className="bg-white border border-gray-200 rounded-lg p-6"
                  >
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-600">Fecha</p>
                        <p className="font-semibold text-gray-900">
                          {new Date(sale.timestamp).toLocaleDateString('es-VE')}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Hora</p>
                        <p className="font-semibold text-gray-900">
                          {new Date(sale.timestamp).toLocaleTimeString('es-VE')}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Método</p>
                        <p className="font-semibold text-gray-900 capitalize">
                          {sale.paymentMethod}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Total</p>
                        <p className="font-semibold text-amber-600">
                          Bs {sale.total.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Configuración
            </h2>

            <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-amber-600" />
                    Modo Multimoneda
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Activa para trabajar en USD y Bolívares
                  </p>
                </div>
                <button
                  onClick={() => setMultimonedaEnabled(!multimonedaEnabled)}
                  className={`px-4 py-2 rounded-lg font-semibold transition ${
                    multimonedaEnabled
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-300 text-gray-700'
                  }`}
                >
                  {multimonedaEnabled ? 'Activo' : 'Inactivo'}
                </button>
              </div>

              {multimonedaEnabled && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Tasa de Cambio (1 USD = Bs)
                  </label>
                  <input
                    type="number"
                    value={exchangeRate}
                    onChange={(e) => setExchangeRate(parseFloat(e.target.value))}
                    className="w-full px-4 py-2 border border-amber-300 rounded-lg"
                    step="0.01"
                    min="0"
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {showNewProductModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Agregar Nuevo Producto
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre
                </label>
                <input
                  type="text"
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="Ej: Laptop"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Precio (Bs)
                </label>
                <input
                  type="number"
                  value={newProductPrice}
                  onChange={(e) => setNewProductPrice(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stock
                </label>
                <input
                  type="number"
                  value={newProductQuantity}
                  onChange={(e) => setNewProductQuantity(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="0"
                  min="0"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowNewProductModal(false)}
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateProduct}
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold"
              >
                {isLoading ? 'Creando...' : 'Crear'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Toaster position="bottom-right" />
    </div>
  );
};

// ============================================================================
// MAIN APP
// ============================================================================
export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        if (firebaseUser) {
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            role: 'client',
          });
        } else {
          setUser(null);
        }
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error('Auth error:', error);
      setLoading(false);
    }
  }, []);

  const handleLoginSuccess = (newUser: User) => {
    setUser(newUser);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error('Error al cerrar sesión');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-amber-900 font-semibold">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return user.role === 'admin' ? (
    <AdminPanel user={user} onLogout={handleLogout} />
  ) : (
    <ClientApp user={user} onLogout={handleLogout} />
  );
}
