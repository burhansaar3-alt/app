import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../App';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { ArrowRight, Package, Store, Trash2, Check, X } from 'lucide-react';
import { toast } from 'sonner';

const AdminDashboard = ({ user, logout }) => {
  const navigate = useNavigate();
  const [stores, setStores] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [storesRes, ordersRes] = await Promise.all([
        api.get('/stores'),
        api.get('/orders')
      ]);
      setStores(storesRes.data);
      setOrders(ordersRes.data);
      setLoading(false);
    } catch (error) {
      toast.error('حدث خطأ في تحميل البيانات');
      setLoading(false);
    }
  };

  const approveStore = async (storeId, status) => {
    try {
      await api.patch(`/stores/${storeId}/approve`, null, { params: { status } });
      toast.success(`تم ${status === 'approved' ? 'قبول' : 'رفض'} المتجر`);
      fetchData();
    } catch (error) {
      toast.error('حدث خطأ في العملية');
    }
  };

  const deleteStore = async (storeId, storeName) => {
    if (!window.confirm(`هل أنت متأكد من حذف متجر "${storeName}"؟\n\nسيتم حذف المتجر وجميع منتجاته بشكل نهائي!`)) {
      return;
    }
    
    try {
      const res = await api.delete(`/stores/${storeId}`);
      toast.success(`تم حذف المتجر بنجاح! (${res.data.products_deleted} منتج تم حذفه)`);
      fetchData();
    } catch (error) {
      toast.error('حدث خطأ في الحذف');
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      await api.patch(`/orders/${orderId}/status`, null, { params: { status } });
      toast.success('تم تحديث حالة الطلب');
      fetchData();
    } catch (error) {
      toast.error('حدث خطأ في التحديث');
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { label: 'قيد الانتظار', className: 'bg-yellow-100 text-yellow-800' },
      approved: { label: 'مقبول', className: 'bg-green-100 text-green-800' },
      rejected: { label: 'مرفوض', className: 'bg-red-100 text-red-800' },
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
            <h1 className="text-2xl font-bold text-gray-900">لوحة الإدارة</h1>
            <Button data-testid="logout-button" variant="outline" onClick={logout}>تسجيل الخروج</Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Tabs defaultValue="stores" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="stores" data-testid="stores-tab">
              <Store className="w-5 h-5 ml-2" />
              المتاجر
            </TabsTrigger>
            <TabsTrigger value="orders" data-testid="orders-tab">
              <Package className="w-5 h-5 ml-2" />
              الطلبات
            </TabsTrigger>
          </TabsList>

          {/* Stores Tab */}
          <TabsContent value="stores">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">طلبات فتح متاجر</h2>
              {stores.length === 0 ? (
                <p className="text-center text-gray-500 py-12">لا توجد متاجر</p>
              ) : (
                <div className="space-y-4">
                  {stores.map((store) => (
                    <div
                      key={store.id}
                      data-testid={`store-${store.id}`}
                      className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-semibold text-gray-900">{store.store_name}</h3>
                            {getStatusBadge(store.status)}
                          </div>
                          <p className="text-gray-600 mb-2">{store.description || 'لا يوجد وصف'}</p>
                          <p className="text-sm text-gray-500">تاريخ الطلب: {new Date(store.created_at).toLocaleDateString('ar')}</p>
                        </div>
                        <div className="flex gap-2">
                          {store.status === 'pending' && (
                            <>
                              <Button
                                data-testid={`approve-store-${store.id}`}
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => approveStore(store.id, 'approved')}
                              >
                                <Check className="w-4 h-4 ml-1" />
                                قبول
                              </Button>
                              <Button
                                data-testid={`reject-store-${store.id}`}
                                size="sm"
                                variant="destructive"
                                onClick={() => approveStore(store.id, 'rejected')}
                              >
                                <X className="w-4 h-4 ml-1" />
                                رفض
                              </Button>
                            </>
                          )}
                          <Button
                            data-testid={`delete-store-${store.id}`}
                            size="sm"
                            variant="destructive"
                            className="bg-red-600 hover:bg-red-700"
                            onClick={() => deleteStore(store.id, store.store_name)}
                          >
                            <Trash2 className="w-4 h-4 ml-1" />
                            حذف
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">جميع الطلبات</h2>
              {orders.length === 0 ? (
                <p className="text-center text-gray-500 py-12">لا توجد طلبات</p>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      data-testid={`order-${order.id}`}
                      className="border border-gray-200 rounded-lg p-6"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">طلب #{order.id.slice(0, 8)}</h3>
                            {getStatusBadge(order.status)}
                          </div>
                          <p className="text-sm text-gray-600">العنوان: {order.shipping_address}</p>
                          <p className="text-sm text-gray-600">الهاتف: {order.phone}</p>
                        </div>
                        <div className="text-left">
                          <p className="text-2xl font-bold text-blue-600">{order.total_amount.toLocaleString()} ل.س</p>
                          <p className="text-sm text-gray-500">{new Date(order.created_at).toLocaleDateString('ar')}</p>
                        </div>
                      </div>
                      <div className="mb-4">
                        <p className="text-sm font-semibold text-gray-700 mb-2">المنتجات:</p>
                        <div className="space-y-1">
                          {order.items.map((item, idx) => (
                            <p key={idx} className="text-sm text-gray-600">
                              {item.product_name} x {item.quantity} - {item.price.toLocaleString()} ل.س
                            </p>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <select
                          data-testid={`order-status-${order.id}`}
                          className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                          value={order.status}
                          onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                        >
                          <option value="pending">قيد الانتظار</option>
                          <option value="confirmed">مؤكد</option>
                          <option value="shipped">قيد الشحن</option>
                          <option value="delivered">مكتمل</option>
                          <option value="cancelled">ملغى</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;