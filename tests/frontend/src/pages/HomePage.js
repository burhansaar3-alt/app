import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../App';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { ShoppingCart, User, Store, Search, Heart, LogOut, Menu, X, ChevronRight, Mail, Instagram, Package, AlertTriangle, UtensilsCrossed, ShoppingBasket } from 'lucide-react';
import { toast } from 'sonner';

const HomePage = ({ user, logout }) => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [cartCount, setCartCount] = useState(0);
  const [wishlistIds, setWishlistIds] = useState([]);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const navigate = useNavigate();

  // Get main categories (not food or market)
  const mainCategories = categories.filter(c => c.type === 'main');
  
  // Get current category object
  const currentCategory = categories.find(c => c.id === selectedCategory);

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
  }, [selectedCategory, selectedSubcategory]);

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
      if (selectedSubcategory) params.subcategory_id = selectedSubcategory;
      
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

  const handleCategorySelect = (categoryId) => {
    setSelectedCategory(categoryId);
    setSelectedSubcategory(null);
  };

  const handleSubcategorySelect = (subcategoryId) => {
    setSelectedSubcategory(subcategoryId);
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        {/* Top Bar - White */}
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between text-xs">
            <div className="flex gap-4 items-center">
              <span className="text-gray-600">مرحباً بك في سوق سوريا</span>
            </div>
            <div className="flex gap-4 items-center">
              <a href="https://www.instagram.com/trend.syria.offical" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-gray-600 hover:text-emerald-600 transition">
                <span className="bg-emerald-500 text-white px-2 py-0.5 rounded text-[10px] font-bold">موثق</span>
                <Instagram className="w-4 h-4" />
                <span>@trend.syria.offical</span>
              </a>
              <a href="mailto:trendsyria926@gmail.com" className="flex items-center gap-1 text-gray-600 hover:text-emerald-600 transition">
                <Mail className="w-4 h-4" />
                <span>trendsyria926@gmail.com</span>
              </a>
              {user ? (
                <>
                  <span className="text-gray-700 font-medium">مرحباً، {user.name}</span>
                  <button onClick={logout} className="text-red-500 hover:text-red-600 transition font-medium">تسجيل الخروج</button>
                </>
              ) : (
                <Link to="/auth" className="text-emerald-600 hover:text-emerald-700 transition font-medium">تسجيل الدخول</Link>
              )}
            </div>
          </div>
        </div>

        {/* Main Header */}
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 flex-shrink-0" onClick={() => { setSelectedCategory(null); setSelectedSubcategory(null); }}>
              <ShoppingCart className="w-8 h-8 text-emerald-600" />
              <span className="text-xl md:text-2xl font-bold text-emerald-600">سوق سوريا</span>
            </Link>

            {/* Search Bar */}
            <div className="flex-1 max-w-xl hidden md:block">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="ابحث عن المنتجات..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-2.5 rounded-lg border-2 border-gray-200 focus:border-emerald-500"
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* Food Button */}
              <Link
                to="/food"
                className="hidden md:flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition font-medium"
              >
                <UtensilsCrossed className="w-5 h-5" />
                <span>الطعام</span>
              </Link>

              {/* Market Button */}
              <Link
                to="/market"
                className="hidden md:flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-medium"
              >
                <ShoppingBasket className="w-5 h-5" />
                <span>السوبرماركت</span>
              </Link>

              {user && (
                <>
                  <Link to="/complaints" className="p-2.5 rounded-lg hover:bg-gray-100 transition" title="الشكاوى">
                    <AlertTriangle className="w-5 h-5 text-gray-700" />
                  </Link>
                  <Link to="/orders" className="p-2.5 rounded-lg hover:bg-gray-100 transition" title="طلباتي">
                    <Package className="w-5 h-5 text-gray-700" />
                  </Link>
                  <Link to="/wishlist" className="p-2.5 rounded-lg hover:bg-gray-100 transition relative">
                    <Heart className="w-5 h-5 text-gray-700" />
                    {wishlistIds.length > 0 && (
                      <span className="absolute -top-1 -right-1 bg-emerald-600 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
                        {wishlistIds.length}
                      </span>
                    )}
                  </Link>
                  <Link to="/cart" className="p-2.5 rounded-lg hover:bg-gray-100 transition relative">
                    <ShoppingCart className="w-5 h-5 text-gray-700" />
                    {cartCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-emerald-600 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
                        {cartCount}
                      </span>
                    )}
                  </Link>
                  {user.role === 'store_owner' && (
                    <Link to="/store-dashboard" className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium flex items-center gap-2">
                      <Store className="w-4 h-4" />
                      <span>لوحة المتجر</span>
                    </Link>
                  )}
                  {(user.role === 'admin' || user.role === 'viewer') && (
                    <Link to="/admin" className="px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition text-sm font-medium">
                      لوحة الأدمن
                    </Link>
                  )}
                </>
              )}
              
              {/* Mobile Menu Button */}
              <button onClick={() => setShowMobileMenu(!showMobileMenu)} className="md:hidden p-2.5 rounded-lg hover:bg-gray-100">
                {showMobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Search */}
          <div className="mt-3 md:hidden">
            <div className="relative">
              <Input
                type="text"
                placeholder="ابحث عن المنتجات..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-2.5 rounded-lg border-2 border-gray-200"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Categories Navigation */}
        <div className="bg-white border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex gap-1 overflow-x-auto py-2 scrollbar-hide">
              {/* All Products */}
              <button
                onClick={() => { setSelectedCategory(null); setSelectedSubcategory(null); }}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition text-sm ${
                  !selectedCategory ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-emerald-100'
                }`}
              >
                الكل
              </button>
              
              {/* Main Categories */}
              {mainCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategorySelect(cat.id)}
                  className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition text-sm ${
                    selectedCategory === cat.id ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-emerald-100'
                  }`}
                >
                  {cat.name_ar}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="md:hidden bg-white border-t border-gray-200 p-4">
            <div className="flex flex-col gap-2">
              <Link to="/food" className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg text-orange-600 font-medium">
                <UtensilsCrossed className="w-5 h-5" />
                <span>الطعام والمطاعم</span>
              </Link>
              <Link to="/market" className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg text-blue-600 font-medium">
                <ShoppingBasket className="w-5 h-5" />
                <span>السوبرماركت</span>
              </Link>
              {!user && (
                <Link to="/auth" className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg text-emerald-600 font-medium">
                  <User className="w-5 h-5" />
                  <span>تسجيل الدخول</span>
                </Link>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Subcategories Circles */}
        {currentCategory && currentCategory.subcategories?.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4">{currentCategory.name_ar}</h2>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
              {/* All in category */}
              <button
                onClick={() => setSelectedSubcategory(null)}
                className={`flex flex-col items-center gap-2 min-w-[90px] group`}
              >
                <div className={`w-18 h-18 md:w-20 md:h-20 rounded-full overflow-hidden flex items-center justify-center transition-all duration-300 ${
                  !selectedSubcategory 
                    ? 'ring-4 ring-emerald-500 shadow-xl scale-105' 
                    : 'ring-2 ring-gray-200 group-hover:ring-emerald-400 group-hover:shadow-lg'
                }`}>
                  <div className="w-full h-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center">
                    <span className="text-white text-2xl font-bold">الكل</span>
                  </div>
                </div>
                <span className={`text-xs md:text-sm font-medium text-center transition-colors ${!selectedSubcategory ? 'text-emerald-600' : 'text-gray-700 group-hover:text-emerald-600'}`}>
                  الكل
                </span>
              </button>
              
              {currentCategory.subcategories.map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => handleSubcategorySelect(sub.id)}
                  className="flex flex-col items-center gap-2 min-w-[90px] group"
                >
                  <div className={`w-18 h-18 md:w-20 md:h-20 rounded-full overflow-hidden transition-all duration-300 ${
                    selectedSubcategory === sub.id 
                      ? 'ring-4 ring-emerald-500 shadow-xl scale-105' 
                      : 'ring-2 ring-gray-200 group-hover:ring-emerald-400 group-hover:shadow-lg'
                  }`}>
                    {sub.image ? (
                      <img 
                        src={sub.image} 
                        alt={sub.name_ar}
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                      />
                    ) : null}
                    <div className={`w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 items-center justify-center text-3xl ${sub.image ? 'hidden' : 'flex'}`}>
                      {sub.icon || '📦'}
                    </div>
                  </div>
                  <span className={`text-xs md:text-sm font-medium text-center max-w-[90px] line-clamp-2 transition-colors ${
                    selectedSubcategory === sub.id ? 'text-emerald-600' : 'text-gray-700 group-hover:text-emerald-600'
                  }`}>
                    {sub.name_ar}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Page Title */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">
              {selectedSubcategory 
                ? currentCategory?.subcategories?.find(s => s.id === selectedSubcategory)?.name_ar
                : selectedCategory 
                  ? currentCategory?.name_ar 
                  : 'جميع المنتجات'}
            </h1>
            <p className="text-gray-600 text-sm">{filteredProducts.length} منتج</p>
          </div>
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16">
            <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">لا توجد منتجات</h3>
            <p className="text-gray-500">لم يتم العثور على منتجات في هذا التصنيف</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                data-testid={`product-card-${product.id}`}
                className="group relative flex flex-col bg-white rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 shadow-md hover:shadow-2xl border-2 border-transparent hover:border-emerald-500"
                onClick={() => navigate(`/product/${product.id}`)}
              >
                {/* Image Container */}
                <div className="relative aspect-[3/4] overflow-hidden bg-gray-100">
                  {/* Stock Badge */}
                  <div className="absolute top-3 right-3 z-20">
                    {product.stock > 0 ? (
                      <span className="bg-emerald-500/90 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg">
                        متوفر
                      </span>
                    ) : (
                      <span className="bg-red-500/90 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg">
                        نفذ
                      </span>
                    )}
                  </div>
                  
                  {/* Wishlist Button */}
                  {user && (
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleWishlist(product.id); }}
                      className="absolute top-3 left-3 z-20 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110"
                    >
                      <Heart className={`w-5 h-5 transition-colors ${wishlistIds.includes(product.id) ? 'fill-red-500 text-red-500' : 'text-gray-400 hover:text-red-500'}`} />
                    </button>
                  )}
                  
                  {/* Product Image */}
                  <img
                    src={product.images?.[0] || '/placeholder.jpg'}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    onError={(e) => { e.target.src = '/placeholder.jpg'; }}
                  />
                </div>

                {/* Product Info */}
                <div className="flex flex-col flex-1 p-4">
                  <h3 className="text-sm font-bold text-gray-800 mb-3 line-clamp-2 min-h-[44px] group-hover:text-emerald-600 transition-colors">
                    {product.name}
                  </h3>
                  
                  {/* Price Bar - Gradient Style */}
                  <div className="mt-auto bg-gradient-to-l from-emerald-600 via-emerald-700 to-slate-800 rounded-xl p-3 flex items-center justify-between shadow-lg transition-transform duration-300 group-hover:scale-[1.02]">
                    <button 
                      className="flex items-center justify-center w-9 h-9 bg-white/20 hover:bg-white/30 rounded-full transition-all duration-300"
                      onClick={(e) => { e.stopPropagation(); }}
                    >
                      <ShoppingCart className="w-5 h-5 text-white" />
                    </button>
                    <div className="text-left">
                      <span className="text-[10px] text-emerald-200 block mb-0.5">السعر</span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-white text-lg font-bold">{product.price?.toLocaleString()}</span>
                        <span className="text-emerald-200 text-xs">ل.س</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white mt-12">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <ShoppingCart className="w-8 h-8 text-emerald-500" />
                <span className="text-xl font-bold">سوق سوريا</span>
              </div>
              <p className="text-gray-400 text-sm">منصة التسوق الإلكتروني الأولى في سوريا</p>
            </div>
            <div>
              <h4 className="font-bold mb-4">روابط سريعة</h4>
              <div className="flex flex-col gap-2 text-sm text-gray-400">
                <Link to="/about" className="hover:text-emerald-500">من نحن</Link>
                <Link to="/food" className="hover:text-emerald-500">الطعام والمطاعم</Link>
                <Link to="/market" className="hover:text-emerald-500">السوبرماركت</Link>
              </div>
            </div>
            <div>
              <h4 className="font-bold mb-4">تواصل معنا</h4>
              <div className="flex flex-col gap-2 text-sm text-gray-400">
                <a href="mailto:trendsyria926@gmail.com" className="hover:text-emerald-500">trendsyria926@gmail.com</a>
                <a href="https://www.instagram.com/trend.syria.offical" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-500">@trend.syria.offical</a>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-6 text-center text-sm text-gray-500">
            © 2025 سوق سوريا. جميع الحقوق محفوظة
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
