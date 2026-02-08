import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../App';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { ArrowRight, Package, MapPin, Phone, Truck, CheckCircle, Clock, XCircle } from 'lucide-react';
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

  const getStatusConfig = (status) => {
    const statusMap = {
      pending: { label: 'قيد الانتظار', className: 'bg-yellow-100 text-yellow-800', icon: Clock, color: 'text-yellow-600' },
      confirmed: { label: 'تم التأكيد', className: 'bg-blue-100 text-blue-800', icon: CheckCircle, color: 'text-blue-600' },
      processing: { label: 'جاري التجهيز', className: 'bg-indigo-100 text-indigo-800', icon: Package, color: 'text-indigo-600' },
      shipped: { label: 'تم الشحن', className: 'bg-purple-100 text-purple-800', icon: Truck, color: 'text-purple-600' },
      out_for_delivery: { label: 'في الطريق إليك', className: 'bg-orange-100 text-orange-800', icon: Truck, color: 'text-orange-600' },
      delivered: { label: 'تم التسليم', className: 'bg-green-100 text-green-800', icon: CheckCircle, color: 'text-green-600' },
      cancelled: { label: 'ملغى', className: 'bg-red-100 text-red-800', icon: XCircle, color: 'text-red-600' }
    };
    return statusMap[status] || statusMap.pending;
  };

  const getPaymentMethodLabel = (method) => {
    const methods = {
      cash_on_delivery: { label: 'الدفع عند الاستلام', icon: '🚚' },
      sham_cash: { label: 'شام كاش', icon: '📱' },
      bank_transfer: { label: 'تحويل بنكي', icon: '🏦' },
      visa: { label: 'فيزا', icon: '💳' },
      cash: { label: 'نقداً', icon: '💵' }
    };
    return methods[method] || { label: method, icon: '💰' };
  };

  // Order tracking steps
  const trackingSteps = [
    { key: 'pending', label: 'تم الطلب' },
    { key: 'confirmed', label: 'تم التأكيد' },
    { key: 'processing', label: 'جاري التجهيز' },
    { key: 'shipped', label: 'تم الشحن' },
    { key: 'out_for_delivery', label: 'في الطريق' },
    { key: 'delivered', label: 'تم التسليم' }
  ];

  const getStepIndex = (status) => {
    const index = trackingSteps.findIndex(s => s.key === status);
    return index >= 0 ? index : 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl font-medium text-gray-600">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
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

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {orders.length === 0 ? (
          <div className="text-center py-20">
            <Package className="w-24 h-24 mx-auto text-gray-300 mb-6" />
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">لم تقم بأي طلبات بعد</h2>
            <p className="text-gray-500 mb-8">ابدأ بالتسوق الآن</p>
            <Button
              data-testid="continue-shopping"
              onClick={() => navigate('/')}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              متابعة التسوق
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              const statusConfig = getStatusConfig(order.status);
              const StatusIcon = statusConfig.icon;
              const paymentMethod = getPaymentMethodLabel(order.payment_method);
              const currentStep = getStepIndex(order.status);

              return (
                <div
                  key={order.id}
                  data-testid={`order-${order.id}`}
                  className="bg-white rounded-xl shadow-lg overflow-hidden"
                >
                  {/* Order Header */}
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <StatusIcon className={`w-6 h-6 ${statusConfig.color}`} />
                        <div>
                          <p className="font-semibold text-gray-900">طلب #{order.id.slice(0, 8)}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(order.created_at).toLocaleDateString('ar', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                      <Badge className={statusConfig.className}>{statusConfig.label}</Badge>
                    </div>
                  </div>

                  <div className="p-6">
                    {/* Order Tracking - Visual Progress */}
                    {order.status !== 'cancelled' && (
                      <div className="mb-6">
                        <h4 className="font-semibold text-gray-900 mb-4">تتبع الطلب</h4>
                        <div className="relative">
                          <div className="flex justify-between items-center">
                            {trackingSteps.map((step, index) => (
                              <div key={step.key} className="flex flex-col items-center flex-1">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                  index <= currentStep 
                                    ? 'bg-emerald-600 text-white' 
                                    : 'bg-gray-200 text-gray-500'
                                }`}>
                                  {index <= currentStep ? '✓' : index + 1}
                                </div>
                                <p className={`text-xs mt-2 text-center ${
                                  index <= currentStep ? 'text-emerald-600 font-medium' : 'text-gray-400'
                                }`}>
                                  {step.label}
                                </p>
                              </div>
                            ))}
                          </div>
                          {/* Progress Line */}
                          <div className="absolute top-4 left-4 right-4 h-0.5 bg-gray-200 -z-10">
                            <div 
                              className="h-full bg-emerald-600 transition-all duration-500"
                              style={{ width: `${(currentStep / (trackingSteps.length - 1)) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Products */}
                    <div className="mb-6">
                      <h4 className="font-semibold text-gray-900 mb-3">المنتجات</h4>
                      <div className="space-y-2">
                        {order.items?.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex justify-between items-center bg-gray-50 rounded-lg p-3"
                          >
                            <div>
                              <p className="font-medium text-gray-900">{item.product_name}</p>
                              <p className="text-sm text-gray-600">الكمية: {item.quantity}</p>
                            </div>
                            <p className="font-semibold text-emerald-600">
                              {(item.price * item.quantity).toLocaleString()} ل.س
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Total */}
                    <div className="flex justify-between items-center py-4 border-t border-b border-gray-200 mb-6">
                      <span className="text-lg font-bold text-gray-900">المجموع الكلي</span>
                      <span className="text-2xl font-bold text-emerald-600">
                        {(order.total_amount || order.total || 0).toLocaleString()} ل.س
                      </span>
                    </div>

                    {/* Delivery Info */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-start gap-3 bg-gray-50 rounded-lg p-3">
                        <MapPin className="w-5 h-5 text-emerald-600 mt-0.5" />
                        <div>
                          <p className="text-xs text-gray-500">عنوان التوصيل</p>
                          <p className="font-medium text-gray-900 text-sm">{order.shipping_address}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 bg-gray-50 rounded-lg p-3">
                        <Phone className="w-5 h-5 text-emerald-600 mt-0.5" />
                        <div>
                          <p className="text-xs text-gray-500">رقم الهاتف</p>
                          <p className="font-medium text-gray-900 text-sm">{order.phone}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 bg-gray-50 rounded-lg p-3">
                        <span className="text-xl">{paymentMethod.icon}</span>
                        <div>
                          <p className="text-xs text-gray-500">طريقة الدفع</p>
                          <p className="font-medium text-gray-900 text-sm">{paymentMethod.label}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyOrders;
