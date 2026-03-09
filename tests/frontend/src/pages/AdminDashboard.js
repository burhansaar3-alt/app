import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../App';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { ArrowRight, Package, Store, Trash2, Check, X, Users, CreditCard, Truck, Settings, Plus, Edit, AlertTriangle, MessageSquare, Eye } from 'lucide-react';
import { toast } from 'sonner';

const AdminDashboard = ({ user, logout }) => {
  const navigate = useNavigate();
  const [stores, setStores] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [showEditProductDialog, setShowEditProductDialog] = useState(false);
  const [showComplaintDialog, setShowComplaintDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [complaintResponse, setComplaintResponse] = useState('');
  const [newCategoryData, setNewCategoryData] = useState({ name_ar: '', name_en: '', slug: '' });
  
  const [paymentMethods, setPaymentMethods] = useState({
    cash_on_delivery: true, sham_cash: true, bank_transfer: true, visa: false
  });
  const [shippingCompanies, setShippingCompanies] = useState([
    { id: 1, name: 'شحن داخلي', active: true },
    { id: 2, name: 'شحن خارجي', active: false }
  ]);

  // Check if user is viewer (read-only)
  const isViewer = user?.role === 'viewer';
  // Check if user is super admin (can manage roles)
  const isSuperAdmin = user?.email?.toLowerCase() === 'burhan.saar@trendsyria.com';

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [storesRes, ordersRes, categoriesRes, productsRes, complaintsRes] = await Promise.all([
        api.get('/stores'),
        api.get('/orders'),
        api.get('/categories'),
        api.get('/products'),
        api.get('/complaints').catch(() => ({ data: [] }))
      ]);
      setStores(storesRes.data);
      setOrders(ordersRes.data);
      setCategories(categoriesRes.data);
      setProducts(productsRes.data);
      setComplaints(complaintsRes.data || []);
      
      try {
        const usersRes = await api.get('/users');
        setUsers(usersRes.data);
      } catch (e) { console.log('Users endpoint not available'); }
      
      setLoading(false);
    } catch (error) {
      toast.error('حدث خطأ في تحميل البيانات');
      setLoading(false);
    }
  };

  const approveStore = async (storeId, status) => {
    if (isViewer) { toast.error('ليس لديك صلاحية لهذه العملية'); return; }
    try {
      await api.patch(`/stores/${storeId}/approve`, null, { params: { status } });
      toast.success(`تم ${status === 'approved' ? 'قبول' : 'رفض'} المتجر`);
      fetchData();
    } catch (error) { toast.error('حدث خطأ في العملية'); }
  };

  const deleteStore = async (storeId, storeName) => {
    if (isViewer) { toast.error('ليس لديك صلاحية لهذه العملية'); return; }
    if (!window.confirm(`هل أنت متأكد من حذف متجر "${storeName}"؟`)) return;
    try {
      const res = await api.delete(`/stores/${storeId}`);
      toast.success(`تم حذف المتجر بنجاح!`);
      fetchData();
    } catch (error) { toast.error('حدث خطأ في الحذف'); }
  };

  const deleteProduct = async (productId) => {
    if (isViewer) { toast.error('ليس لديك صلاحية لهذه العملية'); return; }
    if (!window.confirm('هل أنت متأكد من حذف هذا المنتج؟')) return;
    try {
      await api.delete(`/products/${productId}`);
      toast.success('تم حذف المنتج');
      fetchData();
    } catch (error) { toast.error('حدث خطأ في الحذف'); }
  };

  const updateProduct = async (e) => {
    e.preventDefault();
    if (isViewer) { toast.error('ليس لديك صلاحية لهذه العملية'); return; }
    try {
      await api.put(`/products/${editingProduct.id}`, {
        name: editingProduct.name, description: editingProduct.description,
        price: parseFloat(editingProduct.price), stock: parseInt(editingProduct.stock),
        status: editingProduct.status
      });
      toast.success('تم تحديث المنتج');
      setShowEditProductDialog(false);
      fetchData();
    } catch (error) { toast.error('حدث خطأ في التحديث'); }
  };

  const updateOrderStatus = async (orderId, status) => {
    if (isViewer) { toast.error('ليس لديك صلاحية لهذه العملية'); return; }
    try {
      await api.patch(`/orders/${orderId}/status`, null, { params: { status } });
      toast.success('تم تحديث حالة الطلب');
      fetchData();
    } catch (error) { toast.error('حدث خطأ في التحديث'); }
  };

  const addCategory = async (e) => {
    e.preventDefault();
    if (isViewer) { toast.error('ليس لديك صلاحية لهذه العملية'); return; }
    try {
      await api.post('/categories', newCategoryData);
      toast.success('تم إضافة التصنيف');
      setShowCategoryDialog(false);
      setNewCategoryData({ name_ar: '', name_en: '', slug: '' });
      fetchData();
    } catch (error) { toast.error('حدث خطأ في الإضافة'); }
  };

  const updateComplaint = async (status) => {
    if (isViewer) { toast.error('ليس لديك صلاحية لهذه العملية'); return; }
    if (!selectedComplaint) return;
    try {
      await api.patch(`/complaints/${selectedComplaint.id}`, {
        status,
        admin_response: complaintResponse || selectedComplaint.admin_response
      });
      toast.success('تم تحديث الشكوى');
      setShowComplaintDialog(false);
      setSelectedComplaint(null);
      setComplaintResponse('');
      fetchData();
    } catch (error) { toast.error('حدث خطأ في التحديث'); }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { label: 'قيد الانتظار', className: 'bg-yellow-100 text-yellow-800' },
      approved: { label: 'مقبول', className: 'bg-green-100 text-green-800' },
      rejected: { label: 'مرفوض', className: 'bg-red-100 text-red-800' },
      confirmed: { label: 'مؤكد', className: 'bg-blue-100 text-blue-800' },
      processing: { label: 'جاري التجهيز', className: 'bg-indigo-100 text-indigo-800' },
      shipped: { label: 'تم الشحن', className: 'bg-purple-100 text-purple-800' },
      out_for_delivery: { label: 'في الطريق', className: 'bg-orange-100 text-orange-800' },
      delivered: { label: 'مكتمل', className: 'bg-green-100 text-green-800' },
      cancelled: { label: 'ملغى', className: 'bg-gray-100 text-gray-800' },
      in_progress: { label: 'قيد المعالجة', className: 'bg-blue-100 text-blue-800' },
      resolved: { label: 'تم الحل', className: 'bg-green-100 text-green-800' },
      closed: { label: 'مغلق', className: 'bg-gray-100 text-gray-800' }
    };
    const config = statusMap[status] || statusMap.pending;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const getPaymentMethodLabel = (method) => {
    const methods = { cash_on_delivery: 'الدفع عند الاستلام', sham_cash: 'شام كاش', bank_transfer: 'تحويل بنكي', visa: 'فيزا' };
    return methods[method] || method;
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="text-xl font-medium text-gray-600">جاري التحميل...</div></div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-100">
      {/* Header */}
      <div className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => navigate('/')} className="flex items-center gap-2 text-white hover:bg-gray-800">
              <ArrowRight className="w-5 h-5" />العودة
            </Button>
            <div className="text-center">
              <h1 className="text-2xl font-bold">لوحة تحكم الأدمن</h1>
              {isViewer && <p className="text-sm text-yellow-400 flex items-center gap-1 justify-center"><Eye className="w-4 h-4" />وضع المشاهدة فقط</p>}
            </div>
            <Button variant="outline" onClick={logout} className="border-white text-white hover:bg-gray-800">تسجيل الخروج</Button>
          </div>
        </div>
      </div>

      {/* Viewer Warning Banner */}
      {isViewer && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2">
          <p className="text-center text-yellow-800 text-sm">
            <Eye className="w-4 h-4 inline ml-1" />
            أنت في وضع المشاهدة فقط - لا يمكنك إجراء أي تغييرات
          </p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-100 rounded-lg"><Store className="w-6 h-6 text-emerald-600" /></div>
              <div><p className="text-2xl font-bold text-gray-900">{stores.length}</p><p className="text-sm text-gray-600">المتاجر</p></div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg"><Package className="w-6 h-6 text-blue-600" /></div>
              <div><p className="text-2xl font-bold text-gray-900">{products.length}</p><p className="text-sm text-gray-600">المنتجات</p></div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-lg"><CreditCard className="w-6 h-6 text-purple-600" /></div>
              <div><p className="text-2xl font-bold text-gray-900">{orders.length}</p><p className="text-sm text-gray-600">الطلبات</p></div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-100 rounded-lg"><Users className="w-6 h-6 text-orange-600" /></div>
              <div><p className="text-2xl font-bold text-gray-900">{users.length || '-'}</p><p className="text-sm text-gray-600">المستخدمين</p></div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-100 rounded-lg"><AlertTriangle className="w-6 h-6 text-red-600" /></div>
              <div><p className="text-2xl font-bold text-gray-900">{complaints.filter(c => c.status === 'pending').length}</p><p className="text-sm text-gray-600">شكاوي جديدة</p></div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="stores" className="w-full">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8 mb-6">
            <TabsTrigger value="stores" className="flex items-center gap-1 text-xs"><Store className="w-4 h-4" />المتاجر</TabsTrigger>
            <TabsTrigger value="products" className="flex items-center gap-1 text-xs"><Package className="w-4 h-4" />المنتجات</TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-1 text-xs"><CreditCard className="w-4 h-4" />الطلبات</TabsTrigger>
            <TabsTrigger value="complaints" className="flex items-center gap-1 text-xs"><AlertTriangle className="w-4 h-4" />الشكاوي</TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-1 text-xs"><Users className="w-4 h-4" />الحسابات</TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-1 text-xs"><CreditCard className="w-4 h-4" />التقارير</TabsTrigger>
            <TabsTrigger value="shipping" className="flex items-center gap-1 text-xs"><Truck className="w-4 h-4" />الشحن</TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-1 text-xs"><Settings className="w-4 h-4" />الإعدادات</TabsTrigger>
          </TabsList>

          {/* Stores Tab */}
          <TabsContent value="stores">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">إدارة المتاجر ({stores.length})</h2>
              {stores.length === 0 ? <p className="text-center text-gray-500 py-12">لا توجد متاجر</p> : (
                <div className="space-y-4">
                  {stores.map((store) => (
                    <div key={store.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">{store.store_name}</h3>
                            {getStatusBadge(store.status)}
                          </div>
                          <p className="text-gray-600 text-sm mb-1">{store.description || 'لا يوجد وصف'}</p>
                        </div>
                        {!isViewer && (
                          <div className="flex gap-2">
                            {store.status === 'pending' && (
                              <>
                                <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => approveStore(store.id, 'approved')}><Check className="w-4 h-4 ml-1" />قبول</Button>
                                <Button size="sm" variant="destructive" onClick={() => approveStore(store.id, 'rejected')}><X className="w-4 h-4 ml-1" />رفض</Button>
                              </>
                            )}
                            <Button size="sm" variant="destructive" onClick={() => deleteStore(store.id, store.store_name)}><Trash2 className="w-4 h-4 ml-1" />حذف</Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">إدارة المنتجات ({products.length})</h2>
              {products.length === 0 ? <p className="text-center text-gray-500 py-12">لا توجد منتجات</p> : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">المنتج</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">السعر</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">المخزون</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {products.map((product) => (
                        <tr key={product.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <img src={product.images?.[0] || 'https://via.placeholder.com/50'} alt={product.name} className="w-12 h-12 object-cover rounded-lg" />
                              <p className="font-medium text-gray-900 line-clamp-1">{product.name}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-emerald-600 font-semibold">{product.price?.toLocaleString()} ل.س</td>
                          <td className="px-4 py-3">{product.stock}</td>
                          <td className="px-4 py-3">
                            {!isViewer && (
                              <div className="flex gap-1">
                                <Button size="sm" variant="outline" onClick={() => { setEditingProduct(product); setShowEditProductDialog(true); }}><Edit className="w-3 h-3" /></Button>
                                <Button size="sm" variant="destructive" onClick={() => deleteProduct(product.id)}><Trash2 className="w-3 h-3" /></Button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">إدارة الطلبات ({orders.length})</h2>
              {orders.length === 0 ? <p className="text-center text-gray-500 py-12">لا توجد طلبات</p> : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div key={order.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold">طلب #{order.id?.slice(0, 8)}</p>
                            {getStatusBadge(order.status)}
                          </div>
                          <p className="text-sm text-gray-600">العنوان: {order.shipping_address}</p>
                          <p className="text-sm text-gray-600">طريقة الدفع: {getPaymentMethodLabel(order.payment_method)}</p>
                        </div>
                        <p className="text-xl font-bold text-emerald-600">{(order.total_amount || order.total || 0).toLocaleString()} ل.س</p>
                      </div>
                      {!isViewer && (
                        <select className="px-3 py-2 border border-gray-300 rounded-md text-sm" value={order.status} onChange={(e) => updateOrderStatus(order.id, e.target.value)}>
                          <option value="pending">قيد الانتظار</option>
                          <option value="confirmed">مؤكد</option>
                          <option value="processing">جاري التجهيز</option>
                          <option value="shipped">تم الشحن</option>
                          <option value="out_for_delivery">في الطريق</option>
                          <option value="delivered">تم التسليم</option>
                          <option value="cancelled">ملغى</option>
                        </select>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Complaints Tab */}
          <TabsContent value="complaints">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">شكاوي الزبائن ({complaints.length})</h2>
              {complaints.length === 0 ? (
                <div className="text-center py-12">
                  <AlertTriangle className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">لا توجد شكاوي</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {complaints.map((complaint) => (
                    <div key={complaint.id} className={`border rounded-lg p-4 ${complaint.status === 'pending' ? 'border-red-200 bg-red-50' : 'border-gray-200'}`}>
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-gray-900">{complaint.subject}</p>
                            {getStatusBadge(complaint.status)}
                          </div>
                          <p className="text-sm text-gray-600">من: {complaint.customer_name} ({complaint.customer_email})</p>
                          <p className="text-xs text-gray-400">{new Date(complaint.created_at).toLocaleDateString('ar')}</p>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => { setSelectedComplaint(complaint); setShowComplaintDialog(true); }}>
                          <MessageSquare className="w-4 h-4 ml-1" />عرض
                        </Button>
                      </div>
                      <p className="text-gray-700 line-clamp-2">{complaint.message}</p>
                      {complaint.images?.length > 0 && (
                        <div className="flex gap-2 mt-2">
                          {complaint.images.map((img, idx) => (
                            <img key={idx} src={img} alt="" className="w-16 h-16 object-cover rounded-lg border" />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">إدارة الحسابات ({users.length})</h2>
              {isSuperAdmin && (
                <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <p className="text-sm text-emerald-800">✅ أنت المدير الأعلى - يمكنك تغيير صلاحيات الحسابات وحذفها</p>
                </div>
              )}
              {users.length === 0 ? <p className="text-center text-gray-500 py-12">لا يمكن عرض المستخدمين</p> : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">الاسم</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">البريد</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">الدور</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">تاريخ التسجيل</th>
                        {isSuperAdmin && <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">إجراءات</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {users.map((u) => (
                        <tr key={u.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium">{u.name}</td>
                          <td className="px-4 py-3 text-gray-600">{u.email}</td>
                          <td className="px-4 py-3">
                            {isSuperAdmin && u.id !== user?.id ? (
                              <select
                                className="px-2 py-1 border border-gray-300 rounded-md text-sm"
                                value={u.role}
                                onChange={async (e) => {
                                  const newRole = e.target.value;
                                  if (window.confirm(`هل تريد تغيير صلاحية "${u.name}" إلى "${newRole === 'admin' ? 'أدمن' : newRole === 'viewer' ? 'مشاهد' : newRole === 'store_owner' ? 'صاحب متجر' : 'عميل'}"؟`)) {
                                    try {
                                      await api.patch(`/users/${u.id}/role`, { role: newRole });
                                      toast.success('تم تغيير الصلاحية بنجاح');
                                      fetchData();
                                    } catch (error) {
                                      toast.error(error.response?.data?.detail || 'حدث خطأ في تغيير الصلاحية');
                                    }
                                  }
                                }}
                              >
                                <option value="customer">عميل</option>
                                <option value="store_owner">صاحب متجر</option>
                                <option value="viewer">مشاهد</option>
                                <option value="admin">أدمن</option>
                              </select>
                            ) : (
                              <Badge className={
                                u.role === 'admin' ? 'bg-red-100 text-red-800' : 
                                u.role === 'viewer' ? 'bg-yellow-100 text-yellow-800' :
                                u.role === 'store_owner' ? 'bg-blue-100 text-blue-800' : 
                                'bg-gray-100 text-gray-800'
                              }>
                                {u.role === 'admin' ? 'أدمن' : u.role === 'viewer' ? 'مشاهد' : u.role === 'store_owner' ? 'صاحب متجر' : 'عميل'}
                                {u.id === user?.id && ' (أنت)'}
                              </Badge>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">{new Date(u.created_at).toLocaleDateString('ar')}</td>
                          {isSuperAdmin && (
                            <td className="px-4 py-3">
                              {u.id !== user?.id && (
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={async () => {
                                    if (window.confirm(`هل أنت متأكد من حذف حساب "${u.name}"؟`)) {
                                      try {
                                        await api.delete(`/users/${u.id}`);
                                        toast.success('تم حذف الحساب');
                                        fetchData();
                                      } catch (error) {
                                        toast.error(error.response?.data?.detail || 'حدث خطأ في الحذف');
                                      }
                                    }
                                  }}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              )}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">ملخص المبيعات</h2>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-emerald-50 rounded-lg">
                    <span className="text-gray-700">إجمالي المبيعات</span>
                    <span className="text-2xl font-bold text-emerald-600">{orders.filter(o => o.status === 'delivered').reduce((sum, o) => sum + (o.total_amount || o.total || 0), 0).toLocaleString()} ل.س</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
                    <span className="text-gray-700">طلبات مكتملة</span>
                    <span className="text-2xl font-bold text-blue-600">{orders.filter(o => o.status === 'delivered').length}</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-yellow-50 rounded-lg">
                    <span className="text-gray-700">طلبات قيد الانتظار</span>
                    <span className="text-2xl font-bold text-yellow-600">{orders.filter(o => o.status === 'pending').length}</span>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">إحصائيات المنتجات</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <p className="text-3xl font-bold text-purple-600">{products.length}</p>
                    <p className="text-sm text-gray-600">إجمالي المنتجات</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-3xl font-bold text-green-600">{products.filter(p => p.stock > 0).length}</p>
                    <p className="text-sm text-gray-600">متوفرة</p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Shipping Tab */}
          <TabsContent value="shipping">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">إدارة شركات الشحن</h2>
              <div className="space-y-4">
                {shippingCompanies.map((company) => (
                  <div key={company.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Truck className="w-8 h-8 text-gray-400" />
                      <span className="font-medium">{company.name}</span>
                    </div>
                    {!isViewer && (
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={company.active} onChange={() => {
                          setShippingCompanies(prev => prev.map(c => c.id === company.id ? { ...c, active: !c.active } : c));
                          toast.success(company.active ? 'تم إلغاء التفعيل' : 'تم التفعيل');
                        }} className="w-5 h-5" />
                        <span className="text-sm text-gray-600">{company.active ? 'مفعل' : 'غير مفعل'}</span>
                      </label>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">طرق الدفع</h2>
                <div className="space-y-4">
                  {[
                    { key: 'cash_on_delivery', label: 'الدفع عند الاستلام', icon: '🚚' },
                    { key: 'sham_cash', label: 'شام كاش', icon: '📱' },
                    { key: 'bank_transfer', label: 'تحويل بنكي', icon: '🏦' },
                    { key: 'visa', label: 'فيزا', icon: '💳' }
                  ].map(method => (
                    <label key={method.key} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg cursor-pointer">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{method.icon}</span>
                        <span className="font-medium">{method.label}</span>
                      </div>
                      {!isViewer && (
                        <input type="checkbox" checked={paymentMethods[method.key]} onChange={() => setPaymentMethods(prev => ({ ...prev, [method.key]: !prev[method.key] }))} className="w-5 h-5" />
                      )}
                    </label>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-900">التصنيفات</h2>
                  {!isViewer && (
                    <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
                      <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 ml-1" />إضافة</Button></DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>إضافة تصنيف جديد</DialogTitle></DialogHeader>
                        <form onSubmit={addCategory} className="space-y-4">
                          <div><Label>الاسم بالعربية</Label><Input value={newCategoryData.name_ar} onChange={(e) => setNewCategoryData({ ...newCategoryData, name_ar: e.target.value })} required /></div>
                          <div><Label>الاسم بالإنجليزية</Label><Input value={newCategoryData.name_en} onChange={(e) => setNewCategoryData({ ...newCategoryData, name_en: e.target.value })} required /></div>
                          <div><Label>الرابط (slug)</Label><Input value={newCategoryData.slug} onChange={(e) => setNewCategoryData({ ...newCategoryData, slug: e.target.value })} required /></div>
                          <Button type="submit" className="w-full">إضافة التصنيف</Button>
                        </form>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
                <div className="space-y-2">
                  {categories.map((cat) => (
                    <div key={cat.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium">{cat.name_ar}</span>
                      <span className="text-sm text-gray-500">{cat.name_en}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Edit Product Dialog */}
        <Dialog open={showEditProductDialog} onOpenChange={setShowEditProductDialog}>
          <DialogContent>
            <DialogHeader><DialogTitle>تعديل المنتج</DialogTitle></DialogHeader>
            {editingProduct && (
              <form onSubmit={updateProduct} className="space-y-4">
                <div><Label>اسم المنتج</Label><Input value={editingProduct.name} onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })} required /></div>
                <div><Label>الوصف</Label><Textarea value={editingProduct.description || ''} onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })} rows={3} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>السعر (ل.س)</Label><Input type="number" value={editingProduct.price} onChange={(e) => setEditingProduct({ ...editingProduct, price: e.target.value })} required /></div>
                  <div><Label>المخزون</Label><Input type="number" value={editingProduct.stock} onChange={(e) => setEditingProduct({ ...editingProduct, stock: e.target.value })} required /></div>
                </div>
                <Button type="submit" className="w-full">حفظ التغييرات</Button>
              </form>
            )}
          </DialogContent>
        </Dialog>

        {/* Complaint Dialog */}
        <Dialog open={showComplaintDialog} onOpenChange={setShowComplaintDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>تفاصيل الشكوى</DialogTitle></DialogHeader>
            {selectedComplaint && (
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold">{selectedComplaint.subject}</h3>
                    <p className="text-sm text-gray-600">من: {selectedComplaint.customer_name}</p>
                    <p className="text-sm text-gray-600">{selectedComplaint.customer_email}</p>
                  </div>
                  {getStatusBadge(selectedComplaint.status)}
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700">{selectedComplaint.message}</p>
                </div>
                {selectedComplaint.images?.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">الصور المرفقة:</p>
                    <div className="flex gap-2 flex-wrap">
                      {selectedComplaint.images.map((img, idx) => (
                        <img key={idx} src={img} alt="" className="w-32 h-32 object-cover rounded-lg border cursor-pointer" onClick={() => window.open(img, '_blank')} />
                      ))}
                    </div>
                  </div>
                )}
                {selectedComplaint.admin_response && (
                  <div className="bg-emerald-50 rounded-lg p-4">
                    <p className="text-sm font-medium text-emerald-800 mb-1">رد الإدارة:</p>
                    <p className="text-gray-700">{selectedComplaint.admin_response}</p>
                  </div>
                )}
                {!isViewer && (
                  <div className="space-y-3 pt-4 border-t">
                    <div>
                      <Label>رد الإدارة</Label>
                      <Textarea value={complaintResponse} onChange={(e) => setComplaintResponse(e.target.value)} placeholder="اكتب ردك على الشكوى..." rows={3} />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => updateComplaint('in_progress')} variant="outline">قيد المعالجة</Button>
                      <Button onClick={() => updateComplaint('resolved')} className="bg-green-600 hover:bg-green-700">تم الحل</Button>
                      <Button onClick={() => updateComplaint('closed')} variant="outline">إغلاق</Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AdminDashboard;
