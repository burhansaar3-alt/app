import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../App';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { ShoppingCart, Search, Heart, ArrowRight, Package, UtensilsCrossed } from 'lucide-react';
import { toast } from 'sonner';

const FoodPage = ({ user, logout }) => {
  const [products, setProducts] = useState([]);
  const [foodCategory, setFoodCategory] = useState(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [wishlistIds, setWishlistIds] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchFoodCategory();
    if (user) fetchWishlist();
  }, [user]);

  useEffect(() => {
    if (foodCategory) fetchProducts();
  }, [foodCategory, selectedSubcategory]);

  const fetchFoodCategory = async () => {
    try {
      const res = await api.get('/categories');
      const food = res.data.find(c => c.type === 'food');
      setFoodCategory(food);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const params = { category_id: foodCategory.id };
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
    <div className="min-h-screen bg-orange-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-orange-500 to-orange-600 text-white sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link to="/" className="flex items-center gap-2 text-white hover:text-orange-100 transition">
                <ArrowRight className="w-6 h-6" />
                <span className="hidden md:inline">العودة للرئيسية</span>
              </Link>
              <div className="h-6 w-px bg-orange-400"></div>
              <div className="flex items-center gap-2">
                <UtensilsCrossed className="w-8 h-8" />
                <span className="text-xl md:text-2xl font-bold">الطعام والمطاعم</span>
              </div>
            </div>
            
            <div className="flex-1 max-w-md hidden md:block">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="ابحث عن المطاعم والوجبات..."
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
        {foodCategory?.subcategories?.length > 0 && (
          <div className="mb-8">
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
              <button
                onClick={() => setSelectedSubcategory(null)}
                className="flex flex-col items-center gap-2 min-w-[90px] group"
              >
                <div className={`w-18 h-18 md:w-20 md:h-20 rounded-full overflow-hidden transition-all duration-300 ${
                  !selectedSubcategory ? 'ring-4 ring-orange-500 shadow-xl scale-105' : 'ring-2 ring-orange-200 group-hover:ring-orange-400'
                }`}>
                  <div className="w-full h-full bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center">
                    <span className="text-white text-xl font-bold">الكل</span>
                  </div>
                </div>
                <span className={`text-xs md:text-sm font-medium ${!selectedSubcategory ? 'text-orange-600' : 'text-gray-700'}`}>الكل</span>
              </button>
              
              {foodCategory.subcategories.map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => setSelectedSubcategory(sub.id)}
                  className="flex flex-col items-center gap-2 min-w-[90px] group"
                >
                  <div className={`w-18 h-18 md:w-20 md:h-20 rounded-full overflow-hidden transition-all duration-300 ${
                    selectedSubcategory === sub.id ? 'ring-4 ring-orange-500 shadow-xl scale-105' : 'ring-2 ring-orange-200 group-hover:ring-orange-400'
                  }`}>
                    {sub.image ? (
                      <img src={sub.image} alt={sub.name_ar} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-orange-100 flex items-center justify-center text-3xl">{sub.icon}</div>
                    )}
                  </div>
                  <span className={`text-xs md:text-sm font-medium ${selectedSubcategory === sub.id ? 'text-orange-600' : 'text-gray-700'}`}>
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
            ? foodCategory?.subcategories?.find(s => s.id === selectedSubcategory)?.name_ar 
            : 'جميع الوجبات'}
          <span className="text-sm font-normal text-gray-500 mr-2">({filteredProducts.length})</span>
        </h2>

        {filteredProducts.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl">
            <UtensilsCrossed className="w-16 h-16 mx-auto text-orange-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-600">لا توجد وجبات</h3>
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
                      <Heart className={`w-4 h-4 ${wishlistIds.includes(product.id) ? 'fill-orange-500 text-orange-500' : 'text-gray-400'}`} />
                    </button>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="text-sm font-medium text-gray-900 mb-2 line-clamp-2">{product.name}</h3>
                  <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg p-2 text-center">
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

export default FoodPage;
