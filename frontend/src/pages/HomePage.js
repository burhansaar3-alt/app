import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../App';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { ShoppingCart, User, Store, Search, Heart, LogOut } from 'lucide-react';
import { toast } from 'sonner';

const HomePage = ({ user, logout }) => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [cartCount, setCartCount] = useState(0);
  const [sortBy, setSortBy] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [wishlistIds, setWishlistIds] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCategories();
    fetchProducts();
    if (user) {
      fetchCart();
      fetchWishlist();
    }
  }, [user]);

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, sortBy, maxPrice]);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const params = {};
      if (selectedCategory) params.category_id = selectedCategory;
      if (sortBy) params.sort_by = sortBy;
      if (maxPrice) params.max_price = parseFloat(maxPrice);
      const res = await api.get('/products', { params });
      setProducts(res.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchWishlist = async () => {
    try {
      const res = await api.get('/wishlist');
      const ids = res.data.products.map(p => p.id);
      setWishlistIds(ids);
    } catch (error) {
      console.error('Error fetching wishlist:', error);
    }
  };

  const toggleWishlist = async (productId) => {
    if (!user) {
      toast.error('يرجى تسجيل الدخول أولاً');
      navigate('/auth');
      return;
    }

    try {
      if (wishlistIds.includes(productId)) {
        await api.delete(`/wishlist/remove/${productId}`);
        setWishlistIds(wishlistIds.filter(id => id !== productId));
        toast.success('تم الحذف من المفضلات');
      } else {
        await api.post(`/wishlist/add/${productId}`);
        setWishlistIds([...wishlistIds, productId]);
        toast.success('تم الإضافة إلى المفضلات');
      }
    } catch (error) {
      toast.error('حدث خطأ');
    }
  };

  const fetchCart = async () => {
    try {
      const res = await api.get('/cart');
      setCartCount(res.data.items?.length || 0);
    } catch (error) {
      console.error('Error fetching cart:', error);
    }
  };

  const addToCart = async (productId) => {
    if (!user) {
      toast.error('يرجى تسجيل الدخول أولاً');
      navigate('/auth');
      return;
    }

    try {
      await api.post('/cart/add', { product_id: productId, quantity: 1 });
      toast.success('تمت إضافة المنتج إلى السلة');
      fetchCart();
    } catch (error) {
      toast.error('حدث خطأ أثناء الإضافة');
    }
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50">
      {/* Navbar */}
      <nav className="glass-effect sticky top-0 z-50 border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-3 space-x-reverse">
              <Store className="w-8 h-8 text-blue-600" />
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                سوق سوريا
              </span>
            </Link>

            {/* Search Bar */}
            <div className="hidden md:flex flex-1 max-w-xl mx-8">
              <div className="relative w-full">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  data-testid="search-input"
                  type="text"
                  placeholder="ابحث عن المنتجات..."
                  className="pr-10 bg-white border-gray-300 focus:border-blue-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              {user ? (
                <>
                  <Button
                    data-testid="wishlist-button"
                    variant="ghost"
                    size="icon"
                    className="relative"
                    onClick={() => navigate('/wishlist')}
                  >
                    <Heart className="w-5 h-5" />
                    {wishlistIds.length > 0 && (
                      <span className="absolute -top-1 -left-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {wishlistIds.length}
                      </span>
                    )}
                  </Button>
                  
                  <Button
                    data-testid="cart-button"
                    variant="ghost"
                    size="icon"
                    className="relative"
                    onClick={() => navigate('/cart')}
                  >
                    <ShoppingCart className="w-5 h-5" />
                    {cartCount > 0 && (
                      <span className="absolute -top-1 -left-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {cartCount}
                      </span>
                    )}
                  </Button>
                  
                  {user.role === 'admin' && (
                    <Button
                      data-testid="admin-dashboard-button"
                      variant="outline"
                      size="sm"
                      onClick={() => navigate('/admin')}
                    >
                      لوحة الإدارة
                    </Button>
                  )}
                  
                  {user.role === 'store_owner' && (
                    <Button
                      data-testid="store-dashboard-button"
                      variant="outline"
                      size="sm"
                      onClick={() => navigate('/store-dashboard')}
                    >
                      متجري
                    </Button>
                  )}
                  
                  <Button
                    data-testid="orders-button"
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/orders')}
                  >
                    طلباتي
                  </Button>

                  <Button
                    data-testid="logout-button"
                    variant="ghost"
                    size="icon"
                    onClick={logout}
                  >
                    <LogOut className="w-5 h-5" />
                  </Button>
                </>
              ) : (
                <Button
                  data-testid="login-button"
                  onClick={() => navigate('/auth')}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  تسجيل الدخول
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Categories Bar */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-4 py-4 overflow-x-auto scrollbar-hide">
            <Button
              data-testid="category-all"
              variant={!selectedCategory ? "default" : "outline"}
              size="sm"
              className={!selectedCategory ? "bg-blue-600 hover:bg-blue-700" : ""}
              onClick={() => setSelectedCategory(null)}
            >
              الكل
            </Button>
            {categories.map((cat) => (
              <Button
                key={cat.id}
                data-testid={`category-${cat.slug}`}
                variant={selectedCategory === cat.id ? "default" : "outline"}
                size="sm"
                className={selectedCategory === cat.id ? "bg-blue-600 hover:bg-blue-700 whitespace-nowrap" : "whitespace-nowrap"}
                onClick={() => setSelectedCategory(cat.id)}
              >
                {cat.name_ar}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative h-[400px] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
            <div className="text-white max-w-2xl">
              <h1 className="text-5xl md:text-6xl font-bold mb-4 animate-fade-in">
                تسوق بذكاء
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-blue-100">
                أفضل المنتجات من محلات سورية موثوقة
              </p>
              <Button
                data-testid="hero-shop-now"
                size="lg"
                className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-6 rounded-full"
                onClick={() => window.scrollTo({ top: 600, behavior: 'smooth' })}
              >
                ابدأ التسوق الآن
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">المنتجات المميزة</h2>
          <p className="text-gray-600">{filteredProducts.length} منتج</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">الترتيب</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                data-testid="sort-select"
              >
                <option value="">افتراضي</option>
                <option value="newest">الأحدث</option>
                <option value="price_low">الأرخص</option>
                <option value="price_high">الأغلى</option>
                <option value="rating">الأعلى تقييماً</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">السعر الأقصى</label>
              <Input
                type="number"
                placeholder="مثال: 100000"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                data-testid="max-price-input"
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={() => { setSortBy(''); setMaxPrice(''); }}
                variant="outline"
                className="w-full"
                data-testid="clear-filters"
              >
                مسح الفلاتر
              </Button>
            </div>
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">لا توجد منتجات حالياً</p>
          </div>
        ) : (
          <div className="product-grid">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                data-testid={`product-card-${product.id}`}
                className="bg-white rounded-2xl overflow-hidden shadow-md card-hover cursor-pointer"
              >
                <div
                  className="relative h-64 overflow-hidden"
                  onClick={() => navigate(`/product/${product.id}`)}
                >
                  <img
                    src={product.images[0] || 'https://via.placeholder.com/300'}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                  />
                  {product.stock <= 10 && product.stock > 0 && (
                    <div className="absolute top-2 left-2 bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                      باقي {product.stock} قطع
                    </div>
                  )}
                  {product.stock === 0 && (
                    <div className="absolute top-2 left-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                      نفذت الكمية
                    </div>
                  )}
                  <Button
                    data-testid={`wishlist-${product.id}`}
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 bg-white/80 hover:bg-white rounded-full w-8 h-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleWishlist(product.id);
                    }}
                  >
                    <Heart 
                      className={`w-4 h-4 ${wishlistIds.includes(product.id) ? 'fill-red-500 text-red-500' : 'text-gray-600'}`}
                    />
                  </Button>
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 truncate">
                    {product.name}
                  </h3>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {product.description || 'وصف المنتج'}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-blue-600">
                      {product.price.toLocaleString()} ل.س
                    </span>
                    <Button
                      data-testid={`add-to-cart-${product.id}`}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 rounded-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart(product.id);
                      }}
                      disabled={product.stock === 0}
                    >
                      أضف للسلة
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">سوق سوريا</h3>
              <p className="text-gray-400">
                منصة التسوق الإلكتروني الأولى في سوريا
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">روابط سريعة</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/" className="hover:text-white">الرئيسية</Link></li>
                <li><Link to="/orders" className="hover:text-white">طلباتي</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">تواصل معنا</h3>
              <div className="space-y-2">
                <p className="text-gray-400 flex items-center gap-2">
                  <span className="font-semibold text-white">📧 البريد:</span>
                  <a href="mailto:info@syriamarket.com" className="hover:text-blue-400">
                    info@syriamarket.com
                  </a>
                </p>
                <p className="text-gray-400 flex items-center gap-2">
                  <span className="font-semibold text-white">📱 الهاتف:</span>
                  <a href="tel:+963933333333" className="hover:text-blue-400">
                    +963 933 333 333
                  </a>
                </p>
                <p className="text-gray-400 flex items-center gap-2">
                  <span className="font-semibold text-white">📷 انستغرام:</span>
                  <a href="https://instagram.com/syriamarket" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400">
                    @syriamarket
                  </a>
                </p>
              </div>
              <p className="text-sm text-gray-500 mt-4">
                للاستفسارات وطلبات الشراكة والتعاون
              </p>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>جميع الحقوق محفوظة © 2025 سوق سوريا</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;