import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../App';
import { Input } from '../components/ui/input';
import { Search, Heart, ArrowRight, ShoppingBasket } from 'lucide-react';
import { toast } from 'sonner';

const MarketPage = ({ user, logout }) => {
  const [products, setProducts] = useState([]);
  const [marketCategory, setMarketCategory] = useState(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [wishlistIds, setWishlistIds] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMarketCategory();
    if (user) fetchWishlist();
  }, [user]);

  useEffect(() => {
    if (marketCategory) fetchProducts();
  }, [marketCategory, selectedSubcategory]);

  const fetchMarketCategory = async () => {
    try {
      const res = await api.get('/categories');
      const market = res.data.find(c => c.type === 'market');
      setMarketCategory(market);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const params = { category_id: marketCategory.id };
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
      setWishlistIds(res.data.products.map(p => p.id));
    } catch (error) {
      console.error('Error:', error);
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

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="min-h-screen bg-blue-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-500 to-blue-600 text-white sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link to="/" className="flex items-center gap-2 text-white hover:text-blue-100 transition">
                <ArrowRight className="w-6 h-6" />
                <span className="hidden md:inline">العودة للرئيسية</span>
              </Link>
              <div className="h-6 w-px bg-blue-400"></div>
              <div className="flex items-center gap-2">
                <ShoppingBasket className="w-8 h-8" />
                <span className="text-xl md:text-2xl font-bold">السوبرماركت</span>
              </div>
            </div>
            
            <div className="flex-1 max-w-md hidden md:block">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="ابحث عن المنتجات..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-2 rounded-lg border-0 text-gray-900"
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Mobile Search */}
        <div className="md:hidden mb-6">
          <div className="relative">
            <Input
              type="text"
              placeholder="ابحث..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-2 rounded-lg"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          </div>
        </div>

        {/* Subcategories */}
        {marketCategory?.subcategories?.length > 0 && (
          <div className="mb-8">
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
              <button
                onClick={() => setSelectedSubcategory(null)}
                className="flex flex-col items-center gap-2 min-w-[90px] group"
              >
                <div className={`w-18 h-18 md:w-20 md:h-20 rounded-full overflow-hidden transition-all duration-300 ${
                  !selectedSubcategory ? 'ring-4 ring-blue-500 shadow-xl scale-105' : 'ring-2 ring-blue-200 group-hover:ring-blue-400'
                }`}>
                  <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
                    <span className="text-white text-xl font-bold">الكل</span>
                  </div>
                </div>
                <span className={`text-xs md:text-sm font-medium ${!selectedSubcategory ? 'text-blue-600' : 'text-gray-700'}`}>الكل</span>
              </button>
              
              {marketCategory.subcategories.map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => setSelectedSubcategory(sub.id)}
                  className="flex flex-col items-center gap-2 min-w-[90px] group"
                >
                  <div className={`w-18 h-18 md:w-20 md:h-20 rounded-full overflow-hidden transition-all duration-300 ${
                    selectedSubcategory === sub.id ? 'ring-4 ring-blue-500 shadow-xl scale-105' : 'ring-2 ring-blue-200 group-hover:ring-blue-400'
                  }`}>
                    {sub.image ? (
                      <img src={sub.image} alt={sub.name_ar} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-blue-100 flex items-center justify-center text-3xl">{sub.icon}</div>
                    )}
                  </div>
                  <span className={`text-xs md:text-sm font-medium ${selectedSubcategory === sub.id ? 'text-blue-600' : 'text-gray-700'}`}>
                    {sub.name_ar}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Products */}
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          {selectedSubcategory 
            ? marketCategory?.subcategories?.find(s => s.id === selectedSubcategory)?.name_ar 
            : 'جميع المنتجات'}
          <span className="text-sm font-normal text-gray-500 mr-2">({filteredProducts.length})</span>
        </h2>

        {filteredProducts.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl">
            <ShoppingBasket className="w-16 h-16 mx-auto text-blue-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-600">لا توجد منتجات</h3>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition cursor-pointer group"
                onClick={() => navigate(`/product/${product.id}`)}
              >
                <div className="aspect-square bg-gray-100 overflow-hidden relative">
                  <img
                    src={product.images?.[0] || '/placeholder.jpg'}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {user && (
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleWishlist(product.id); }}
                      className="absolute top-2 right-2 p-2 bg-white rounded-full shadow"
                    >
                      <Heart className={`w-4 h-4 ${wishlistIds.includes(product.id) ? 'fill-blue-500 text-blue-500' : 'text-gray-400'}`} />
                    </button>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="text-sm font-medium text-gray-900 mb-2 line-clamp-2">{product.name}</h3>
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-2 text-center">
                    <span className="text-lg font-bold">{product.price?.toLocaleString()}</span>
                    <span className="text-xs mr-1">ل.س</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default MarketPage;
