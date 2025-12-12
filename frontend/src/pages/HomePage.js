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
  const [showMegaMenu, setShowMegaMenu] = useState(false);
  const [hoveredMainCat, setHoveredMainCat] = useState(null);
  const [showGenderPopup, setShowGenderPopup] = useState(false);
  const [selectedGender, setSelectedGender] = useState(null);
  const navigate = useNavigate();

  // Check if user has selected gender before
  useEffect(() => {
    const savedGender = localStorage.getItem('preferredGender');
    if (savedGender) {
      setSelectedGender(savedGender);
    } else {
      // Show popup on first visit
      setShowGenderPopup(true);
    }
  }, []);

  // Define main category groups
  const mainCategories = [
    {
      id: 'women',
      name: 'أزياء نسائية',
      icon: '👗',
      keywords: ['نسائية', 'نساء']
    },
    {
      id: 'men',
      name: 'أزياء رجالية',
      icon: '👔',
      keywords: ['رجالية', 'رجال']
    },
    {
      id: 'shoes',
      name: 'أحذية',
      icon: '👟',
      keywords: ['أحذية', 'حذاء']
    },
    {
      id: 'bags',
      name: 'حقائب وإكسسوارات',
      icon: '👜',
      keywords: ['حقائب', 'منسوجات']
    },
    {
      id: 'electronics',
      name: 'إلكترونيات',
      icon: '💻',
      keywords: ['إلكترونيات']
    },
    {
      id: 'home',
      name: 'المنزل والمطبخ',
      icon: '🏠',
      keywords: ['منزلية', 'مطبخ']
    },
    {
      id: 'food',
      name: 'منتجات وعطام',
      icon: '🍽️',
      keywords: ['منتجات', 'عطام']
    },
    {
      id: 'brands',
      name: 'ماركات عالمية',
      icon: '✨',
      keywords: ['ماركات']
    }
  ];

  // Get categories for a main category
  const getCategoriesForMain = (mainCat) => {
    return categories.filter(c => 
      mainCat.keywords.some(keyword => c.name_ar.includes(keyword))
    );
  };

  // Get remaining categories
  const getRemainingCategories = () => {
    const allKeywords = mainCategories.flatMap(m => m.keywords);
    return categories.filter(c => 
      !allKeywords.some(keyword => c.name_ar.includes(keyword))
    );
  };

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
      
      // Filter by gender if selected
      if (selectedGender && !selectedCategory) {
        const genderKeywords = {
          'men': ['رجالية', 'رجال', 'للرجال'],
          'women': ['نسائية', 'نساء', 'للنساء']
        };
        
        // Get categories matching gender
        const matchingCategories = categories.filter(cat => 
          genderKeywords[selectedGender]?.some(keyword => cat.name_ar.includes(keyword))
        );
        
        if (matchingCategories.length > 0) {
          // Fetch products from gender-specific categories
          const categoryIds = matchingCategories.map(c => c.id);
          const allProducts = [];
          
          for (const catId of categoryIds) {
            const res = await api.get('/products', { params: { category_id: catId } });
            allProducts.push(...res.data);
          }
          
          setProducts(allProducts);
          return;
        }
      }
      
      const res = await api.get('/products', { params });
      setProducts(res.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleGenderSelection = (gender) => {
    setSelectedGender(gender);
    localStorage.setItem('preferredGender', gender);
    setShowGenderPopup(false);
    
    // Fetch products based on gender
    fetchProducts();
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
      {/* Gender Selection Popup */}
      {showGenderPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative">
            <button
              onClick={() => setShowGenderPopup(false)}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
            
            <div className="text-center mb-6">
              <div className="inline-block p-3 bg-orange-100 rounded-full mb-4">
                <ShoppingCart className="w-8 h-8 text-orange-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                مرحباً بك في سوق سوريا! 🛍️
              </h2>
              <p className="text-gray-600">
                اختر الفئة التي تفضل التسوق منها للحصول على توصيات مخصصة
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <button
                onClick={() => handleGenderSelection('women')}
                className="group flex flex-col items-center justify-center p-6 border-2 border-gray-200 rounded-xl hover:border-orange-500 hover:bg-orange-50 transition-all"
              >
                <div className="text-6xl mb-3">👗</div>
                <span className="text-lg font-semibold text-gray-900 group-hover:text-orange-600">
                  أزياء نسائية
                </span>
                <span className="text-sm text-gray-500 mt-1">للنساء</span>
              </button>

              <button
                onClick={() => handleGenderSelection('men')}
                className="group flex flex-col items-center justify-center p-6 border-2 border-gray-200 rounded-xl hover:border-orange-500 hover:bg-orange-50 transition-all"
              >
                <div className="text-6xl mb-3">👔</div>
                <span className="text-lg font-semibold text-gray-900 group-hover:text-orange-600">
                  أزياء رجالية
                </span>
                <span className="text-sm text-gray-500 mt-1">للرجال</span>
              </button>
            </div>

            <button
              onClick={() => setShowGenderPopup(false)}
              className="w-full text-sm text-gray-500 hover:text-gray-700 transition"
            >
              تخطي - عرض جميع المنتجات
            </button>
          </div>
        </div>
      )}

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
                className="flex items-center gap-1 hover:text-orange-600 transition group"
              >
                <Instagram className="w-4 h-4" />
                <span>@trend.syria.offical</span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500 text-white ml-1 group-hover:bg-blue-600 transition">
                  ✓ موثق
                </span>
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

        {/* Categories Navigation - Trendyol Style */}
        <div className="bg-gray-50 border-t border-gray-200 relative">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex gap-2 overflow-x-auto py-3 scrollbar-hide items-center">
              {/* Mega Menu Button */}
              <div className="relative">
                <button
                  onMouseEnter={() => setShowMegaMenu(true)}
                  className="px-4 py-2 rounded-lg font-medium whitespace-nowrap transition flex items-center gap-2 bg-orange-600 text-white hover:bg-orange-700"
                >
                  <Menu className="w-4 h-4" />
                  جميع التصنيفات
                </button>
              </div>

              {/* Category Pills */}
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition ${
                    selectedCategory === cat.id
                      ? 'bg-orange-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-orange-100'
                  }`}
                >
                  {cat.name_ar}
                </button>
              ))}
            </div>
          </div>

          {/* Mega Menu - Trendyol Style */}
          {showMegaMenu && (
            <div 
              className="absolute top-full left-0 right-0 bg-white shadow-2xl border-t border-gray-200 z-50"
              onMouseLeave={() => {
                setShowMegaMenu(false);
                setHoveredMainCat(null);
              }}
            >
              <div className="max-w-7xl mx-auto px-4 py-6">
                <div className="flex gap-6">
                  {/* Left Side - Main Categories */}
                  <div className="w-64 border-r border-gray-200 pr-6">
                    {mainCategories.map(mainCat => (
                      <div
                        key={mainCat.id}
                        onMouseEnter={() => setHoveredMainCat(mainCat.id)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition ${
                          hoveredMainCat === mainCat.id
                            ? 'bg-orange-50 text-orange-600'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <span className="text-2xl">{mainCat.icon}</span>
                        <span className="text-sm font-semibold">{mainCat.name}</span>
                        <ChevronRight className="w-4 h-4 ml-auto" />
                      </div>
                    ))}
                    {/* Other Categories */}
                    {getRemainingCategories().length > 0 && (
                      <div
                        onMouseEnter={() => setHoveredMainCat('other')}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition ${
                          hoveredMainCat === 'other'
                            ? 'bg-orange-50 text-orange-600'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <span className="text-2xl">📦</span>
                        <span className="text-sm font-semibold">تصنيفات أخرى</span>
                        <ChevronRight className="w-4 h-4 ml-auto" />
                      </div>
                    )}
                  </div>

                  {/* Right Side - Subcategories */}
                  <div className="flex-1">
                    {hoveredMainCat && hoveredMainCat !== 'other' && (
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-4">
                          {mainCategories.find(m => m.id === hoveredMainCat)?.name}
                        </h3>
                        <div className="grid grid-cols-3 gap-4">
                          {getCategoriesForMain(mainCategories.find(m => m.id === hoveredMainCat)).map(cat => (
                            <button
                              key={cat.id}
                              onClick={() => {
                                setSelectedCategory(cat.id);
                                setShowMegaMenu(false);
                                setHoveredMainCat(null);
                              }}
                              className="text-right px-3 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 rounded transition flex items-center justify-between group"
                            >
                              <span>{cat.name_ar}</span>
                              <ChevronRight className="w-3 h-3 text-gray-400 group-hover:text-orange-600" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {hoveredMainCat === 'other' && (
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-4">تصنيفات أخرى</h3>
                        <div className="grid grid-cols-3 gap-4">
                          {getRemainingCategories().map(cat => (
                            <button
                              key={cat.id}
                              onClick={() => {
                                setSelectedCategory(cat.id);
                                setShowMegaMenu(false);
                                setHoveredMainCat(null);
                              }}
                              className="text-right px-3 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 rounded transition flex items-center justify-between group"
                            >
                              <span>{cat.name_ar}</span>
                              <ChevronRight className="w-3 h-3 text-gray-400 group-hover:text-orange-600" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {!hoveredMainCat && (
                      <div className="flex items-center justify-center h-full text-gray-400">
                        <div className="text-center">
                          <Menu className="w-16 h-16 mx-auto mb-4 opacity-20" />
                          <p>حرك الماوس على الفئة لرؤية التصنيفات</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
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

        {/* Products Grid - Premium Syrian Design */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="group bg-white rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-500 cursor-pointer relative border-2 border-transparent hover:border-orange-500"
              onClick={() => navigate(`/product/${product.id}`)}
            >
              {/* Badges Container */}
              <div className="absolute top-3 left-3 right-3 z-20 flex justify-between items-start">
                {/* Stock Badge */}
                {product.stock > 0 ? (
                  <div className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1">
                    <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                    متوفر
                  </div>
                ) : (
                  <div className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                    نفذت الكمية
                  </div>
                )}

                {/* Wishlist Button */}
                {user && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleWishlist(product.id);
                    }}
                    className="p-2.5 bg-white rounded-full shadow-lg hover:scale-110 transition-transform duration-300 backdrop-blur-sm"
                  >
                    <Heart
                      className={`w-5 h-5 ${
                        wishlistIds.includes(product.id)
                          ? 'fill-orange-600 text-orange-600 animate-pulse'
                          : 'text-gray-600'
                      }`}
                    />
                  </button>
                )}
              </div>

              {/* Product Image with Gradient Overlay */}
              <div className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden relative">
                <img
                  src={product.images[0] || 'https://via.placeholder.com/300'}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </div>

              {/* Product Info */}
              <div className="p-4">
                {/* Product Name */}
                <h3 className="text-sm font-medium text-gray-900 mb-3 line-clamp-2 min-h-[40px] group-hover:text-orange-600 transition-colors">
                  {product.name}
                </h3>

                {/* Price Section - Premium Design */}
                <div className="relative">
                  {/* Decorative Background */}
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl opacity-50"></div>
                  
                  {/* Price Content */}
                  <div className="relative bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl p-3 shadow-lg transform group-hover:scale-105 transition-all duration-300">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-[10px] font-medium opacity-90 mb-0.5">السعر</div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-black">{product.price.toLocaleString()}</span>
                          <span className="text-xs font-bold opacity-90">ل.س</span>
                        </div>
                      </div>
                      <div className="bg-white/20 rounded-full p-2 backdrop-blur-sm">
                        <ShoppingCart className="w-4 h-4" />
                      </div>
                    </div>
                  </div>

                  {/* Shimmer Effect */}
                  <div className="absolute inset-0 overflow-hidden rounded-xl">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  </div>
                </div>

                {/* Quick View Hint */}
                <div className="mt-3 text-center">
                  <span className="text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    اضغط للتفاصيل →
                  </span>
                </div>
              </div>

              {/* Hover Border Glow */}
              <div className="absolute inset-0 rounded-2xl border-2 border-orange-500 opacity-0 group-hover:opacity-20 transition-opacity duration-500 pointer-events-none"></div>
            </div>
          ))}
        </div>

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
                <li><Link to="/about" className="hover:text-orange-500 transition">عن المتجر</Link></li>
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