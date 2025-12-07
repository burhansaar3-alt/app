import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../App';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { ShoppingCart, User, Store, Search, Heart, LogOut, Menu, X, ChevronRight, Mail, Instagram } from 'lucide-react';
import { toast } from 'sonner';

const HomePage = ({ user, logout }) => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [cartCount, setCartCount] = useState(0);
  const [wishlistIds, setWishlistIds] = useState([]);
  const [showCategoriesMenu, setShowCategoriesMenu] = useState(false);
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
  }, [selectedCategory]);

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
        toast.success('تم الإضافة إلى المفضلة');
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

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Header - Trendyol Style */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        {/* Top Bar */}
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between text-xs text-gray-600">
            <div className="flex gap-4">
              <span>مرحباً بك في سوق سوريا</span>
            </div>
            <div className="flex gap-4 items-center">
              <a 
                href="https://www.instagram.com/trend.syria.offical" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-orange-600 transition"
              >
                <Instagram className="w-4 h-4" />
                <span>@trend.syria.offical</span>
              </a>
              <a 
                href="mailto:trendsyria926@gmail.com"
                className="flex items-center gap-1 hover:text-orange-600 transition"
              >
                <Mail className="w-4 h-4" />
                <span>trendsyria926@gmail.com</span>
              </a>
              {user ? (
                <>
                  <span>مرحباً، {user.name}</span>
                  <button onClick={logout} className="hover:text-orange-600 transition">تسجيل الخروج</button>
                </>
              ) : (
                <Link to="/auth" className="hover:text-orange-600 transition">تسجيل الدخول</Link>
              )}
            </div>
          </div>
        </div>

        {/* Main Header */}
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 flex-shrink-0">
              <ShoppingCart className="w-8 h-8 text-orange-600" />
              <span className="text-2xl font-bold text-orange-600">سوق سوريا</span>
            </Link>

            {/* Search Bar */}
            <div className="flex-1 max-w-2xl">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="ابحث عن المنتجات..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-lg border-2 border-gray-200 focus:border-orange-500 transition"
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              {user && (
                <>
                  <Link
                    to="/wishlist"
                    className="p-3 rounded-lg hover:bg-gray-50 transition relative"
                  >
                    <Heart className="w-6 h-6 text-gray-700" />
                    {wishlistIds.length > 0 && (
                      <span className="absolute -top-1 -right-1 bg-orange-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {wishlistIds.length}
                      </span>
                    )}
                  </Link>
                  <Link
                    to="/cart"
                    className="p-3 rounded-lg hover:bg-gray-50 transition relative"
                  >
                    <ShoppingCart className="w-6 h-6 text-gray-700" />
                    {cartCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-orange-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {cartCount}
                      </span>
                    )}
                  </Link>
                  {user.role === 'store_owner' && (
                    <Link
                      to="/store-dashboard"
                      className="p-3 rounded-lg hover:bg-gray-50 transition"
                    >
                      <Store className="w-6 h-6 text-gray-700" />
                    </Link>
                  )}
                  {user.role === 'admin' && (
                    <Link
                      to="/admin"
                      className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-medium"
                    >
                      لوحة الأدمن
                    </Link>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Categories Navigation with Popup Menu */}
        <div className="bg-gray-50 border-t border-gray-200">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex gap-2 overflow-x-auto py-3 scrollbar-hide items-center">
              {/* All Categories Button with Popup */}
              <div className="relative">
                <button
                  onMouseEnter={() => setShowCategoriesMenu(true)}
                  onMouseLeave={() => setShowCategoriesMenu(false)}
                  onClick={() => setSelectedCategory(null)}
                  className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition flex items-center gap-2 ${
                    !selectedCategory
                      ? 'bg-orange-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Menu className="w-4 h-4" />
                  جميع التصنيفات
                </button>

                {/* Categories Popup Menu - Trendyol Style */}
                {showCategoriesMenu && (
                  <div
                    onMouseEnter={() => setShowCategoriesMenu(true)}
                    onMouseLeave={() => setShowCategoriesMenu(false)}
                    className="absolute top-full left-0 mt-2 bg-white shadow-2xl rounded-lg border border-gray-200 py-4 px-6 z-50 w-[800px] grid grid-cols-3 gap-6"
                  >
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => {
                          setSelectedCategory(cat.id);
                          setShowCategoriesMenu(false);
                        }}
                        className="flex items-center justify-between p-3 hover:bg-orange-50 rounded-lg transition text-right group"
                      >
                        <span className="text-sm font-medium text-gray-700 group-hover:text-orange-600">
                          {cat.name_ar}
                        </span>
                        <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-orange-600" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Category Pills */}
              {categories.slice(0, 8).map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition ${
                    selectedCategory === cat.id
                      ? 'bg-orange-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {cat.name_ar}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Page Title */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {selectedCategory
              ? categories.find(c => c.id === selectedCategory)?.name_ar
              : 'جميع المنتجات'}
          </h1>
          <p className="text-gray-600">{filteredProducts.length} منتج</p>
        </div>

        {/* Products Grid - Trendyol Style */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="group bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer relative"
            >
              {/* Wishlist Button */}
              {user && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleWishlist(product.id);
                  }}
                  className="absolute top-2 right-2 z-10 p-2 bg-white rounded-full shadow-md hover:scale-110 transition"
                >
                  <Heart
                    className={`w-5 h-5 ${
                      wishlistIds.includes(product.id)
                        ? 'fill-orange-600 text-orange-600'
                        : 'text-gray-400'
                    }`}
                  />
                </button>
              )}

              {/* Product Image */}
              <div
                onClick={() => navigate(`/product/${product.id}`)}
                className="aspect-square bg-gray-50 overflow-hidden"
              >
                <img
                  src={product.images[0] || 'https://via.placeholder.com/300'}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>

              {/* Product Info */}
              <div
                onClick={() => navigate(`/product/${product.id}`)}
                className="p-3"
              >
                <h3 className="text-sm text-gray-900 mb-2 line-clamp-2 min-h-[40px]">
                  {product.name}
                </h3>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-gray-900">
                    {product.price.toLocaleString()} ل.س
                  </span>
                </div>
                {product.stock > 0 ? (
                  <span className="text-xs text-green-600 mt-1 block">متوفر</span>
                ) : (
                  <span className="text-xs text-red-600 mt-1 block">نفذت الكمية</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredProducts.length === 0 && (
          <div className="text-center py-20">
            <div className="text-gray-400 mb-4">
              <Search className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">لا توجد منتجات</h3>
            <p className="text-gray-500">جرب تغيير الفئة أو البحث بكلمة أخرى</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white mt-20">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-bold text-lg mb-4">عن سوق سوريا</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                منصة التجارة الإلكترونية الرائدة في سوريا. نوفر آلاف المنتجات من متاجر موثوقة.
              </p>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-4">روابط سريعة</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link to="/" className="hover:text-orange-500 transition">الصفحة الرئيسية</Link></li>
                <li><Link to="/auth" className="hover:text-orange-500 transition">تسجيل الدخول</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-4">للبائعين</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link to="/store-dashboard" className="hover:text-orange-500 transition">لوحة تحكم المتجر</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-4">تواصل معنا</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <a href="mailto:trendsyria926@gmail.com" className="hover:text-orange-500 transition">
                    trendsyria926@gmail.com
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <Instagram className="w-4 h-4" />
                  <a 
                    href="https://www.instagram.com/trend.syria.offical" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:text-orange-500 transition"
                  >
                    @trend.syria.offical
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>© 2025 سوق سوريا. جميع الحقوق محفوظة.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;