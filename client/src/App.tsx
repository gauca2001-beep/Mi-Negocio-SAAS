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
  setDoc,
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
  Calendar,
  DollarSign,
  CreditCard,
  Smartphone,
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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ============================================================================
// TYPES & INTERFACES
// ============================================================================
interface User {
  uid: string;
  email: string;
  role: 'admin' | 'client';
  clientId?: string;
  expiryDate?: string;
  isActive?: boolean;
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
// MODAL COMPONENTS
// ============================================================================
const DeleteModal: React.FC<{
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}> = ({ isOpen, title, message, onConfirm, onCancel, isLoading = false }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-sm w-full mx-4 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-red-100 p-3 rounded-full">
            <AlertCircle className="w-6 h-6 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            {isLoading ? 'Eliminando...' : 'Eliminar'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// EMPTY STATE COMPONENT
// ============================================================================
const EmptyState: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
}> = ({ icon, title, description }) => (
  <div className="flex flex-col items-center justify-center py-12 px-4">
    <div className="text-amber-100 mb-4">{icon}</div>
    <h3 className="text-lg font-semibold text-gray-700 mb-2">{title}</h3>
    <p className="text-gray-500 text-center">{description}</p>
  </div>
);

// ============================================================================
// ADMIN PANEL - SUPER ADMIN INTERFACE (DARK MODE)
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
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [editExpiryDate, setEditExpiryDate] = useState('');
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    clientId?: string;
  }>({ isOpen: false });
  const [isLoading, setIsLoading] = useState(false);

  // Cargar clientes
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

  // Crear nuevo cliente
  const handleCreateClient = async () => {
    if (!newClientEmail || !newClientPassword || !newClientExpiryDate) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    setIsLoading(true);
    try {
      // Crear usuario en Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        newClientEmail,
        newClientPassword
      );

      // Guardar cliente en Firestore
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

  // Actualizar fecha de vencimiento
  const handleUpdateExpiryDate = async () => {
    if (!editingClient || !editExpiryDate) return;

    setIsLoading(true);
    try {
      const clientRef = doc(db, 'clients', editingClient.id);
      await updateDoc(clientRef, {
        expiryDate: editExpiryDate,
      });

      setClients(
        clients.map((c) =>
          c.id === editingClient.id
            ? { ...c, expiryDate: editExpiryDate }
            : c
        )
      );

      setEditingClient(null);
      setEditExpiryDate('');
      toast.success('Fecha de vencimiento actualizada');
    } catch (error) {
      console.error('Error updating expiry date:', error);
      toast.error('Error al actualizar fecha de vencimiento');
    } finally {
      setIsLoading(false);
    }
  };

  // Alternar estado del cliente
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

  // Eliminar cliente
  const handleDeleteClient = async (clientId: string) => {
    setIsLoading(true);
    try {
      const clientRef = doc(db, 'clients', clientId);
      await deleteDoc(clientRef);

      setClients(clients.filter((c) => c.id !== clientId));
      setDeleteModal({ isOpen: false });
      toast.success('Cliente eliminado exitosamente');
    } catch (error) {
      console.error('Error deleting client:', error);
      toast.error('Error al eliminar cliente');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
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

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Create Client Button */}
        <div className="mb-8">
          <button
            onClick={() => setShowNewClientModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-lg font-semibold transition shadow-lg"
          >
            <Plus className="w-5 h-5" />
            Crear Nuevo Cliente
          </button>
        </div>

        {/* Clients Table */}
        <div className="bg-gray-800/30 backdrop-blur border border-gray-700 rounded-lg overflow-hidden">
          {clients.length === 0 ? (
            <EmptyState
              icon={<Package className="w-16 h-16" />}
              title="Sin Clientes"
              description="Crea tu primer cliente para comenzar"
            />
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
                            onClick={() => {
                              setEditingClient(client);
                              setEditExpiryDate(client.expiryDate);
                            }}
                            className="p-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded transition"
                            title="Editar fecha"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() =>
                              handleToggleActive(client.id, client.isActive)
                            }
                            className={`p-2 rounded transition ${
                              client.isActive
                                ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400'
                                : 'bg-green-500/20 hover:bg-green-500/30 text-green-400'
                            }`}
                            title={
                              client.isActive ? 'Desactivar' : 'Activar'
                            }
                          >
                            {client.isActive ? (
                              <X className="w-4 h-4" />
                            ) : (
                              <Check className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() =>
                              setDeleteModal({
                                isOpen: true,
                                clientId: client.id,
                              })
                            }
                            className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded transition"
                            title="Eliminar"
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

      {/* Create Client Modal */}
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

      {/* Edit Expiry Date Modal */}
      {editingClient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 border border-gray-700">
            <h2 className="text-2xl font-bold text-amber-400 mb-4">
              Editar Fecha de Vencimiento
            </h2>
            <p className="text-gray-400 mb-4">Cliente: {editingClient.email}</p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Nueva Fecha
              </label>
              <input
                type="date"
                value={editExpiryDate}
                onChange={(e) => setEditExpiryDate(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setEditingClient(null)}
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleUpdateExpiryDate}
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition disabled:opacity-50 font-semibold"
              >
                {isLoading ? 'Actualizando...' : 'Actualizar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      <DeleteModal
        isOpen={deleteModal.isOpen}
        title="Eliminar Cliente"
        message="¿Estás seguro de que deseas eliminar este cliente? Esta acción no se puede deshacer."
        onConfirm={() =>
          deleteModal.clientId && handleDeleteClient(deleteModal.clientId)
        }
        onCancel={() => setDeleteModal({ isOpen: false })}
        isLoading={isLoading}
      />

      <Toaster position="bottom-right" />
    </div>
  );
};

// ============================================================================
// CLIENT APP - POS & INVENTORY INTERFACE (LIGHT MODE)
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
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    productId?: string;
  }>({ isOpen: false });
  const [isLoading, setIsLoading] = useState(false);
  const [multimonedaEnabled, setMultimonedaEnabled] = useState(false);
  const [exchangeRate, setExchangeRate] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('efectivo');

  // Cargar productos
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
        toast.error('Error al cargar productos');
      }
    };

    loadProducts();
  }, [user.uid]);

  // Cargar ventas
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

  // Crear producto
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

  // Eliminar producto
  const handleDeleteProduct = async (productId: string) => {
    setIsLoading(true);
    try {
      const productRef = doc(db, 'products', productId);
      await deleteDoc(productRef);

      setProducts(products.filter((p) => p.id !== productId));
      setDeleteModal({ isOpen: false });
      toast.success('Producto eliminado exitosamente');
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Error al eliminar producto');
    } finally {
      setIsLoading(false);
    }
  };

  // Agregar al carrito
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

  // Remover del carrito
  const handleRemoveFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.id !== productId));
  };

  // Actualizar cantidad en carrito
  const handleUpdateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveFromCart(productId);
    } else {
      setCart(
        cart.map((item) =>
          item.id === productId ? { ...item, quantity } : item
        )
      );
    }
  };

  // Procesar venta
  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error('El carrito está vacío');
      return;
    }

    setIsLoading(true);
    try {
      const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

      // Guardar venta
      const salesCollection = collection(db, 'sales');
      await addDoc(salesCollection, {
        items: cart,
        total: multimonedaEnabled ? total / exchangeRate : total,
        paymentMethod,
        exchangeRate: multimonedaEnabled ? exchangeRate : undefined,
        timestamp: new Date().toISOString(),
        clientId: user.uid,
      });

      // Actualizar inventario
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
      {/* Header */}
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

      {/* Navigation Tabs */}
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

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* POS Tab */}
        {activeTab === 'pos' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Products List */}
            <div className="lg:col-span-2">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Productos Disponibles
              </h2>
              {products.length === 0 ? (
                <EmptyState
                  icon={<Package className="w-16 h-16" />}
                  title="Sin Productos"
                  description="Crea productos en la sección de Inventario"
                />
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
                        className="w-full px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Agregar al Carrito
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Shopping Cart */}
            <div className="lg:col-span-1">
              <div className="bg-white border border-gray-200 rounded-lg p-6 sticky top-24">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <ShoppingCart className="w-6 h-6" />
                  Carrito
                </h2>

                {cart.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    Carrito vacío
                  </p>
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
                      {multimonedaEnabled && (
                        <div className="flex justify-between mb-2 text-sm">
                          <span className="text-gray-600">
                            Tasa de Cambio:
                          </span>
                          <span className="font-semibold">
                            1 USD = Bs {exchangeRate.toFixed(2)}
                          </span>
                        </div>
                      )}
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

        {/* Inventory Tab */}
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
              <EmptyState
                icon={<Package className="w-16 h-16" />}
                title="Sin Productos"
                description="Crea tu primer producto para comenzar"
              />
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                          Nombre
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                          Precio (Bs)
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
                          className="border-b border-gray-200 hover:bg-gray-50 transition"
                        >
                          <td className="px-6 py-4 text-gray-900">
                            {product.name}
                          </td>
                          <td className="px-6 py-4 text-gray-900">
                            {product.price.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 text-gray-900">
                            {product.quantity}
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() =>
                                setDeleteModal({
                                  isOpen: true,
                                  productId: product.id,
                                })
                              }
                              className="p-2 text-red-600 hover:bg-red-50 rounded transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Sales Tab */}
        {activeTab === 'sales' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Historial de Ventas
            </h2>

            {sales.length === 0 ? (
              <EmptyState
                icon={<BarChart3 className="w-16 h-16" />}
                title="Sin Ventas"
                description="Realiza tu primera venta para ver el historial"
              />
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
                        <p className="text-sm text-gray-600">Método de Pago</p>
                        <p className="font-semibold text-gray-900 capitalize">
                          {sale.paymentMethod}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Total</p>
                        <p className="font-semibold text-amber-600 text-lg">
                          {sale.exchangeRate ? 'USD' : 'Bs'}{' '}
                          {sale.total.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <div className="border-t border-gray-200 pt-4">
                      <p className="text-sm font-semibold text-gray-900 mb-2">
                        Productos:
                      </p>
                      <ul className="space-y-1 text-sm text-gray-600">
                        {sale.items.map((item, idx) => (
                          <li key={idx}>
                            {item.name} x{item.quantity} = Bs{' '}
                            {(item.price * item.quantity).toFixed(2)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Configuración Regional
            </h2>

            <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
              {/* Multimoneda */}
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

              {/* Exchange Rate */}
              {multimonedaEnabled && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Tasa de Cambio (1 USD = Bs)
                  </label>
                  <input
                    type="number"
                    value={exchangeRate}
                    onChange={(e) => setExchangeRate(parseFloat(e.target.value))}
                    className="w-full px-4 py-2 border border-amber-300 rounded-lg focus:outline-none focus:border-amber-600"
                    step="0.01"
                    min="0"
                  />
                </div>
              )}

              {/* Payment Methods Info */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                  Métodos de Pago Disponibles
                </h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    Efectivo
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    Pago Móvil
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    Zelle
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    Punto (POS)
                  </li>
                </ul>
              </div>

              {/* Account Info */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-3">
                  Información de Cuenta
                </h3>
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="text-gray-600">Email:</span>{' '}
                    <span className="font-semibold text-gray-900">
                      {user.email}
                    </span>
                  </p>
                  <p>
                    <span className="text-gray-600">Tipo de Cuenta:</span>{' '}
                    <span className="font-semibold text-gray-900 capitalize">
                      Cliente
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* New Product Modal */}
      {showNewProductModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Agregar Nuevo Producto
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Producto
                </label>
                <input
                  type="text"
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-amber-600"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-amber-600"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cantidad en Stock
                </label>
                <input
                  type="number"
                  value={newProductQuantity}
                  onChange={(e) => setNewProductQuantity(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-amber-600"
                  placeholder="0"
                  min="0"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowNewProductModal(false)}
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg transition disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateProduct}
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition disabled:opacity-50 font-semibold"
              >
                {isLoading ? 'Creando...' : 'Crear'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      <DeleteModal
        isOpen={deleteModal.isOpen}
        title="Eliminar Producto"
        message="¿Estás seguro de que deseas eliminar este producto? Esta acción no se puede deshacer."
        onConfirm={() =>
          deleteModal.productId && handleDeleteProduct(deleteModal.productId)
        }
        onCancel={() => setDeleteModal({ isOpen: false })}
        isLoading={isLoading}
      />

      <Toaster position="bottom-right" />
    </div>
  );
};

// ============================================================================
// LOGIN COMPONENT
// ============================================================================
const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setError('');

    // Super Admin Login
    if (password === '123456' && (!email || email === 'admin')) {
      try {
        setIsLoading(true);
        // Crear una sesión de admin sin autenticación real
        localStorage.setItem('adminSession', 'true');
        window.location.reload();
      } catch (err) {
        setError('Error al iniciar sesión como admin');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Client Login
    if (!email || !password) {
      setError('Por favor completa todos los campos');
      return;
    }

    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      console.log('User logged in:', userCredential.user);
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-amber-900 mb-2">
            Mi Negocio Fácil
          </h1>
          <p className="text-amber-700">Sistema SaaS & POS</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-lg shadow-xl p-8 border border-amber-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Iniciar Sesión</h2>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4 mb-6">
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
          </div>

          <button
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full px-4 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-lg font-semibold transition disabled:opacity-50"
          >
            {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>

          {/* Info Box */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
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
// MAIN APP COMPONENT
// ============================================================================
export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for admin session
    const adminSession = localStorage.getItem('adminSession');
    if (adminSession) {
      setUser({
        uid: 'admin',
        email: 'admin@sistema.local',
        role: 'admin',
      });
      setLoading(false);
      return;
    }

    // Check Firebase auth state
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
  }, []);

  const handleLogout = async () => {
    try {
      const adminSession = localStorage.getItem('adminSession');
      if (adminSession) {
        localStorage.removeItem('adminSession');
        setUser(null);
      } else {
        await signOut(auth);
        setUser(null);
      }
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
    return <Login />;
  }

  return user.role === 'admin' ? (
    <AdminPanel user={user} onLogout={handleLogout} />
  ) : (
    <ClientApp user={user} onLogout={handleLogout} />
  );
}
