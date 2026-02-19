import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../App';
import { Button } from '../components/ui/button';
import { Trash2, ArrowRight, ShoppingBag, Plus, Minus } from 'lucide-react';
import { toast } from 'sonner';

const CartPage = ({ user, logout }) => {
  const navigate = useNavigate();
  const [cart, setCart] = useState({ items: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const res = await api.get('/cart');
      setCart(res.data);
      setLoading(false);
    } catch (error) {
      toast.error('حدث خطأ في تحميل السلة');
      setLoading(false);
    }
  };

  const removeItem = async (productId) => {
    try {
      await api.delete(`/cart/${productId}`);
      toast.success('تم حذف المنتج');
      fetchCart();
    } catch (error) {
      toast.error('حدث خطأ أثناء الحذف');
    }
  };

  const updateQuantity = async (productId, newQuantity) => {
    try {
      await api.delete(`/cart/${productId}`);
      if (newQuantity > 0) {
        await api.post('/cart/add', { product_id: productId, quantity: newQuantity });
      }
      fetchCart();
    } catch (error) {
      toast.error('حدث خطأ في التحديث');
    }
  };

  const calculateTotal = () => {
    return cart.items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
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
            <h1 className="text-2xl font-bold text-gray-900">سلة التسوق</h1>
            <div className="w-20"></div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {cart.items.length === 0 ? (
          <div className="text-center py-20">
            <ShoppingBag className="w-24 h-24 mx-auto text-gray-300 mb-6" />
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">سلتك فارغة</h2>
            <p className="text-gray-500 mb-8">ابدأ بإضافة منتجات إلى سلتك</p>
            <Button
              data-testid="continue-shopping"
              onClick={() => navigate('/')}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              متابعة التسوق
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cart.items.map((item) => (
                <div
                  key={item.product.id}
                  data-testid={`cart-item-${item.product.id}`}
                  className="bg-white rounded-xl shadow-md p-6 flex gap-6"
                >
                  <Link to={`/product/${item.product.id}`}>
                    <img
                      src={item.product.images[0] || 'https://via.placeholder.com/150'}
                      alt={item.product.name}
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                  </Link>
                  <div className="flex-1">
                    <Link
                      to={`/product/${item.product.id}`}
                      className="text-lg font-semibold text-gray-900 hover:text-emerald-600"
                    >
                      {item.product.name}
                    </Link>
                    <p className="text-gray-600 mt-1">
                      {item.product.price.toLocaleString()} ل.س
                    </p>
                    <div className="flex items-center gap-3 mt-3">
                      <Button
                        data-testid={`decrease-${item.product.id}`}
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <span className="text-lg font-medium w-8 text-center" data-testid={`quantity-${item.product.id}`}>
                        {item.quantity}
                      </span>
                      <Button
                        data-testid={`increase-${item.product.id}`}
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        disabled={item.quantity >= item.product.stock}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-col justify-between items-end">
                    <Button
                      data-testid={`remove-${item.product.id}`}
                      variant="ghost"
                      size="icon"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => removeItem(item.product.id)}
                    >
                      <Trash2 className="w-5 h-5" />
                    </Button>
                    <p className="text-xl font-bold text-gray-900" data-testid={`item-total-${item.product.id}`}>
                      {(item.product.price * item.quantity).toLocaleString()} ل.س
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-lg p-6 sticky top-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">ملخص الطلب</h2>
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-gray-600">
                    <span>عدد المنتجات</span>
                    <span data-testid="items-count">{cart.items.length}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex justify-between text-xl font-bold text-gray-900">
                      <span>المجموع</span>
                      <span data-testid="cart-total">{calculateTotal().toLocaleString()} ل.س</span>
                    </div>
                  </div>
                </div>
                <Button
                  data-testid="checkout-button"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-lg py-6 rounded-xl"
                  onClick={() => navigate('/checkout')}
                >
                  إتمام الطلب
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartPage;