import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../App';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

const CheckoutPage = ({ user, logout }) => {
  const navigate = useNavigate();
  const [cart, setCart] = useState({ items: [] });
  const [formData, setFormData] = useState({
    shipping_address: '',
    phone: user?.phone || '',
    payment_method: 'cash_on_delivery',
    coupon_code: ''
  });
  const [loading, setLoading] = useState(false);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponApplied, setCouponApplied] = useState(false);

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const res = await api.get('/cart');
      setCart(res.data);
      if (res.data.items.length === 0) {
        navigate('/cart');
      }
    } catch (error) {
      toast.error('حدث خطأ في تحميل السلة');
    }
  };

  const calculateTotal = () => {
    return cart.items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post('/orders', formData);
      toast.success('تم إرسال طلبك بنجاح!');
      navigate('/orders');
    } catch (error) {
      toast.error('حدث خطأ في إرسال الطلب');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50">
      {/* Header */}
      <div className="glass-effect border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Button
              data-testid="back-button"
              variant="ghost"
              onClick={() => navigate('/cart')}
              className="flex items-center gap-2"
            >
              <ArrowRight className="w-5 h-5" />
              العودة
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">إتمام الطلب</h1>
            <div className="w-20"></div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Shipping Info */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">معلومات التوصيل</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="phone">رقم الهاتف</Label>
                <Input
                  id="phone"
                  data-testid="phone-input"
                  type="tel"
                  placeholder="09xxxxxxxx"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="address">العنوان الكامل</Label>
                <Textarea
                  id="address"
                  data-testid="address-input"
                  placeholder="المحافظة، المدينة، الشارع، رقم البناء..."
                  value={formData.shipping_address}
                  onChange={(e) => setFormData({ ...formData, shipping_address: e.target.value })}
                  rows={4}
                  required
                />
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">ملخص الطلب</h2>
            <div className="space-y-4">
              {cart.items.map((item) => (
                <div key={item.product.id} className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <img
                      src={item.product.images[0] || 'https://via.placeholder.com/50'}
                      alt={item.product.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                    <div>
                      <p className="font-medium text-gray-900">{item.product.name}</p>
                      <p className="text-sm text-gray-600">الكمية: {item.quantity}</p>
                    </div>
                  </div>
                  <p className="font-semibold text-gray-900">
                    {(item.product.price * item.quantity).toLocaleString()} ل.س
                  </p>
                </div>
              ))}
              <div className="border-t border-gray-200 pt-4 mt-4">
                <div className="flex justify-between items-center text-xl font-bold text-gray-900">
                  <span>المجموع الكلي</span>
                  <span data-testid="total-amount">{calculateTotal().toLocaleString()} ل.س</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">طريقة الدفع</h2>
            <div className="space-y-4">
              {/* Cash on Delivery */}
              <label
                className={`flex items-center gap-4 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  formData.payment_method === 'cash_on_delivery'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-green-300'
                }`}
              >
                <input
                  type="radio"
                  name="payment_method"
                  value="cash_on_delivery"
                  checked={formData.payment_method === 'cash_on_delivery'}
                  onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                  className="w-5 h-5"
                  data-testid="payment-cash-delivery"
                />
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">الدفع عند الاستلام</p>
                  <p className="text-sm text-gray-600">ادفع عند استلام طلبك</p>
                </div>
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </label>

              {/* Cash Payment */}
              <label
                className={`flex items-center gap-4 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  formData.payment_method === 'cash'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <input
                  type="radio"
                  name="payment_method"
                  value="cash"
                  checked={formData.payment_method === 'cash'}
                  onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                  className="w-5 h-5"
                  data-testid="payment-cash"
                />
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">الدفع باليد (نقداً)</p>
                  <p className="text-sm text-gray-600">الدفع نقداً مباشرة</p>
                </div>
                <span className="text-2xl">💵</span>
              </label>

              {/* Visa Payment */}
              <label
                className={`flex items-center gap-4 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  formData.payment_method === 'visa'
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-purple-300'
                }`}
              >
                <input
                  type="radio"
                  name="payment_method"
                  value="visa"
                  checked={formData.payment_method === 'visa'}
                  onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                  className="w-5 h-5"
                  data-testid="payment-visa"
                />
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">الدفع بالفيزا</p>
                  <p className="text-sm text-gray-600">الدفع ببطاقة الفيزا أو الماستركارد</p>
                </div>
                <span className="text-2xl">💳</span>
              </label>
            </div>
          </div>

          <Button
            data-testid="confirm-order-button"
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-lg py-6 rounded-xl"
          >
            {loading ? 'جاري الإرسال...' : 'تأكيد الطلب'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default CheckoutPage;