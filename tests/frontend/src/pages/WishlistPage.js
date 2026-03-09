import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../App';
import { Button } from '../components/ui/button';
import { Heart, ArrowRight, Trash2, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';

const WishlistPage = ({ user, logout }) => {
  const navigate = useNavigate();
  const [wishlist, setWishlist] = useState({ products: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    try {
      const res = await api.get('/wishlist');
      setWishlist(res.data);
      setLoading(false);
    } catch (error) {
      toast.error('حدث خطأ في تحميل المفضلات');
      setLoading(false);
    }
  };

  const removeFromWishlist = async (productId) => {
    try {
      await api.delete(`/wishlist/remove/${productId}`);
      toast.success('تم الحذف من المفضلات');
      fetchWishlist();
    } catch (error) {
      toast.error('حدث خطأ');
    }
  };

  const addToCart = async (productId) => {
    try {
      await api.post('/cart/add', { product_id: productId, quantity: 1 });
      toast.success('تمت إضافة المنتج إلى السلة');
    } catch (error) {
      toast.error('حدث خطأ أثناء الإضافة');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl font-medium text-gray-600">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-50">
      {/* Header */}
      <div className="glass-effect border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Button
              data-testid="back-button"
              variant="ghost"
              onClick={() => navigate('/')}
              className="flex items-center gap-2"
            >
              <ArrowRight className="w-5 h-5" />
              العودة
            </Button>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Heart className="w-6 h-6 text-red-500 fill-red-500" />
              المفضلات
            </h1>
            <div className="w-20"></div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {wishlist.products.length === 0 ? (
          <div className="text-center py-20">
            <Heart className="w-24 h-24 mx-auto text-gray-300 mb-6" />
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">قائمة المفضلات فارغة</h2>
            <p className="text-gray-500 mb-8">أضف منتجات إلى المفضلات لتجدها هنا</p>
            <Button
              data-testid="continue-shopping"
              onClick={() => navigate('/')}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              متابعة التسوق
            </Button>
          </div>
        ) : (
          <div className="product-grid">
            {wishlist.products.map((product) => (
              <div
                key={product.id}
                data-testid={`wishlist-product-${product.id}`}
                className="bg-white rounded-2xl overflow-hidden shadow-md card-hover"
              >
                <div className="relative">
                  <Link to={`/product/${product.id}`}>
                    <img
                      src={product.images[0] || 'https://via.placeholder.com/300'}
                      alt={product.name}
                      className="w-full h-64 object-cover"
                    />
                  </Link>
                  <button
                    onClick={() => removeFromWishlist(product.id)}
                    className="absolute top-2 left-2 bg-white rounded-full p-2 shadow-lg hover:bg-red-50 transition-colors"
                    data-testid={`remove-wishlist-${product.id}`}
                  >
                    <Trash2 className="w-5 h-5 text-red-500" />
                  </button>
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 truncate">
                    {product.name}
                  </h3>
                  <p className="text-2xl font-bold text-emerald-600 mb-3">
                    {product.price.toLocaleString()} ل.س
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                      onClick={() => addToCart(product.id)}
                      disabled={product.stock === 0}
                      data-testid={`add-to-cart-${product.id}`}
                    >
                      <ShoppingCart className="w-4 h-4 ml-1" />
                      أضف للسلة
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WishlistPage;