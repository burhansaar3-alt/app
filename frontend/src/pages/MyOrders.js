import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../App';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { ArrowRight, Package, MapPin, Phone } from 'lucide-react';
import { toast } from 'sonner';

const MyOrders = ({ user, logout }) => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await api.get('/orders/my');
      setOrders(res.data);
      setLoading(false);
    } catch (error) {
      toast.error('حدث خطأ في تحميل الطلبات');
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { label: 'قيد الانتظار', className: 'bg-yellow-100 text-yellow-800' },
      confirmed: { label: 'مؤكد', className: 'bg-blue-100 text-blue-800' },
      shipped: { label: 'قيد الشحن', className: 'bg-purple-100 text-purple-800' },
      delivered: { label: 'مكتمل', className: 'bg-green-100 text-green-800' },
      cancelled: { label: 'ملغى', className: 'bg-gray-100 text-gray-800' }
    };
    const config = statusMap[status] || statusMap.pending;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl font-medium text-gray-600">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50">
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
            <h1 className="text-2xl font-bold text-gray-900">طلباتي</h1>
            <div className="w-20"></div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {orders.length === 0 ? (
          <div className="text-center py-20">
            <Package className="w-24 h-24 mx-auto text-gray-300 mb-6" />
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">لم تقم بأي طلبات بعد</h2>
            <p className="text-gray-500 mb-8">ابدأ بالتسوق الآن</p>
            <Button
              data-testid="continue-shopping"
              onClick={() => navigate('/')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              متابعة التسوق
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div
                key={order.id}
                data-testid={`order-${order.id}`}
                className="bg-white rounded-xl shadow-lg p-6"
              >
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">طلب #{order.id.slice(0, 8)}</h3>
                      {getStatusBadge(order.status)}
                    </div>
                    <p className="text-sm text-gray-500">
                      {new Date(order.created_at).toLocaleDateString('ar', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <div className="text-left">
                    <p className="text-3xl font-bold text-blue-600">{order.total_amount.toLocaleString()} ل.س</p>
                  </div>
                </div>

                {/* Products */}
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3">المنتجات:</h4>
                  <div className="space-y-3">
                    {order.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center bg-gray-50 rounded-lg p-3"
                      >
                        <div>
                          <p className="font-medium text-gray-900">{item.product_name}</p>
                          <p className="text-sm text-gray-600">الكمية: {item.quantity}</p>
                        </div>
                        <p className="font-semibold text-gray-900">
                          {(item.price * item.quantity).toLocaleString()} ل.س
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Delivery Info */}
                <div className="border-t border-gray-200 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-gray-400 mt-1" />
                      <div>
                        <p className="text-sm text-gray-600">عنوان التوصيل</p>
                        <p className="font-medium text-gray-900">{order.shipping_address}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Phone className="w-5 h-5 text-gray-400 mt-1" />
                      <div>
                        <p className="text-sm text-gray-600">رقم الهاتف</p>
                        <p className="font-medium text-gray-900">{order.phone}</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold">طريقة الدفع:</span>{' '}
                      {order.payment_method === 'cash_on_delivery' && 'الدفع عند الاستلام'}
                      {order.payment_method === 'cash' && 'الدفع باليد (نقداً) 💵'}
                      {order.payment_method === 'visa' && 'الدفع بالفيزا 💳'}
                    </p>
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

export default MyOrders;