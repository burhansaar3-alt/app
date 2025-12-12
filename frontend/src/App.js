import { useState, useEffect } from 'react';
import '@/App.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import HomePage from './pages/HomePage';
import AuthPage from './pages/AuthPage';
import AboutPage from './pages/AboutPage';
import ProductDetails from './pages/ProductDetails';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import AdminDashboard from './pages/AdminDashboard';
import StoreDashboard from './pages/StoreDashboard';
import MyOrders from './pages/MyOrders';
import StoreView from './pages/StoreView';
import WishlistPage from './pages/WishlistPage';
import { Toaster } from './components/ui/sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const api = axios.create({
  baseURL: API,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.get('/auth/me')
        .then(res => {
          setUser(res.data);
          setLoading(false);
        })
        .catch(() => {
          localStorage.removeItem('token');
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-xl font-medium text-gray-600">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="App" dir="rtl">
      <Toaster position="top-center" />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage user={user} logout={logout} />} />
          <Route path="/auth" element={user ? <Navigate to="/" /> : <AuthPage setUser={setUser} />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/product/:id" element={<ProductDetails user={user} logout={logout} />} />
          <Route path="/cart" element={user ? <CartPage user={user} logout={logout} /> : <Navigate to="/auth" />} />
          <Route path="/wishlist" element={user ? <WishlistPage user={user} logout={logout} /> : <Navigate to="/auth" />} />
          <Route path="/checkout" element={user ? <CheckoutPage user={user} logout={logout} /> : <Navigate to="/auth" />} />
          <Route path="/orders" element={user ? <MyOrders user={user} logout={logout} /> : <Navigate to="/auth" />} />
          <Route path="/store/:id" element={<StoreView user={user} logout={logout} />} />
          <Route 
            path="/admin" 
            element={user?.role === 'admin' ? <AdminDashboard user={user} logout={logout} /> : <Navigate to="/" />} 
          />
          <Route 
            path="/store-dashboard" 
            element={user?.role === 'store_owner' ? <StoreDashboard user={user} logout={logout} /> : <Navigate to="/" />} 
          />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;