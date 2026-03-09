import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../App';
import { Button } from '../components/ui/button';
import { ArrowRight, Store as StoreIcon } from 'lucide-react';
import { toast } from 'sonner';

const StoreView = ({ user, logout }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStoreData();
  }, [id]);

  const fetchStoreData = async () => {
    try {
      const [storesRes, productsRes] = await Promise.all([
        api.get('/stores'),
        api.get('/products', { params: { store_id: id } })
      ]);
      
      const storeData = storesRes.data.find(s => s.id === id);
      setStore(storeData);
      setProducts(productsRes.data);
      setLoading(false);
    } catch (error) {
      toast.error('حدث خطأ في تحميل البيانات');
      setLoading(false);
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

  if (!store) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl font-medium text-gray-600">المتجر غير موجود</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50">
      {/* Header */}
      <div className="glass-effect border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Button
            data-testid="back-button"
            variant="ghost"
            onClick={() => navigate('/')}
            className="flex items-center gap-2"
          >
            <ArrowRight className="w-5 h-5" />
            العودة
          </Button>
        </div>
      </div>

      {/* Store Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-white rounded-full p-4">
              <StoreIcon className="w-12 h-12 text-blue-600" />
            </div>
            <div>
              <h1 className="text-4xl font-bold" data-testid="store-name">{store.store_name}</h1>
              <p className="text-blue-100 mt-2" data-testid="store-description">
                {store.description || 'متجر موثوق'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Products */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">منتجات المتجر</h2>
        {products.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">لا توجد منتجات حالياً</p>
          </div>
        ) : (
          <div className="product-grid">
            {products.map((product) => (
              <div
                key={product.id}
                data-testid={`product-${product.id}`}
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
    </div>
  );
};

export default StoreView;