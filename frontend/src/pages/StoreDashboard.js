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
import { ArrowRight, Plus, Edit, Trash2, Store, Package, X, MessageCircle, TrendingUp, Star, Send, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const StoreDashboard = ({ user, logout }) => {
  const navigate = useNavigate();
  const [myStore, setMyStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showStoreDialog, setShowStoreDialog] = useState(false);
  const [showProductDialog, setShowProductDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showPromoteDialog, setShowPromoteDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [storeData, setStoreData] = useState({ store_name: '', description: '', phone: '' });
  const [productData, setProductData] = useState({
    name: '', description: '', price: '', stock: '', category_id: '',
    images: [], sizes: [], colors: [], shoe_sizes: []
  });
  const [uploadingImages, setUploadingImages] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);

  // Statistics
  const [stats, setStats] = useState({
    totalSales: 0,
    totalOrders: 0,
    pendingOrders: 0,
    topProducts: []
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [storesRes, categoriesRes] = await Promise.all([
        api.get('/stores/my'),
        api.get('/categories')
      ]);
      
      if (storesRes.data.length > 0) {
        const store = storesRes.data[0];
        setMyStore(store);
        
        if (store.status === 'approved') {
          const [productsRes, ordersRes, chatsRes] = await Promise.all([
            api.get('/products', { params: { store_id: store.id } }),
            api.get('/orders/store'),
            api.get('/chat/store/messages').catch(() => ({ data: [] }))
          ]);
          setProducts(productsRes.data);
          setOrders(ordersRes.data || []);
          setConversations(chatsRes.data || []);
          
          // Calculate stats
          const completedOrders = ordersRes.data.filter(o => o.status === 'delivered');
          const totalSales = completedOrders.reduce((sum, o) => sum + (o.total || 0), 0);
          const pendingOrders = ordersRes.data.filter(o => ['pending', 'confirmed'].includes(o.status)).length;
          
          // Top products by orders
          const productOrders = {};
          ordersRes.data.forEach(order => {
            (order.items || []).forEach(item => {
              productOrders[item.product_id] = (productOrders[item.product_id] || 0) + item.quantity;
            });
          });
          const topProducts = Object.entries(productOrders)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([id, count]) => {
              const prod = productsRes.data.find(p => p.id === id);
              return { id, name: prod?.name || 'منتج', count };
            });
          
          setStats({ totalSales, totalOrders: ordersRes.data.length, pendingOrders, topProducts });
        }
      }
      setCategories(categoriesRes.data);
      setLoading(false);
    } catch (error) {
      toast.error('حدث خطأ في تحميل البيانات');
      setLoading(false);
    }
  };

  const handleCreateStore = async (e) => {
    e.preventDefault();
    try {
      await api.post('/stores', storeData);
      toast.success('تم إرسال طلب فتح المتجر. بانتظار موافقة الإدارة.');
      setShowStoreDialog(false);
      fetchData();
    } catch (error) {
      toast.error('حدث خطأ في إنشاء المتجر');
    }
  };

  const handleImageUpload = async (files) => {
    if (!files || files.length === 0) return [];
    setUploadingImages(true);
    const uploadedUrls = [];
    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post('/upload-image', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        uploadedUrls.push(response.data.url);
      }
      toast.success(`تم رفع ${uploadedUrls.length} صورة بنجاح`);
      return uploadedUrls;
    } catch (error) {
      toast.error('حدث خطأ في رفع الصور');
      return [];
    } finally {
      setUploadingImages(false);
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      let imageUrls = productData.images;
      if (selectedFiles.length > 0) {
        const uploadedUrls = await handleImageUpload(selectedFiles);
        imageUrls = [...imageUrls, ...uploadedUrls];
      }
      const data = { ...productData, price: parseFloat(productData.price), stock: parseInt(productData.stock), images: imageUrls };
      await api.post('/products', data);
      toast.success('تمت إضافة المنتج بنجاح');
      setShowProductDialog(false);
      resetProductForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'حدث خطأ في إضافة المنتج');
    }
  };

  const handleEditProduct = async (e) => {
    e.preventDefault();
    try {
      let imageUrls = editingProduct.images || [];
      if (selectedFiles.length > 0) {
        const uploadedUrls = await handleImageUpload(selectedFiles);
        imageUrls = [...imageUrls, ...uploadedUrls];
      }
      const data = {
        name: editingProduct.name, description: editingProduct.description,
        price: parseFloat(editingProduct.price), stock: parseInt(editingProduct.stock),
        category_id: editingProduct.category_id, images: imageUrls,
        sizes: editingProduct.sizes || [], colors: editingProduct.colors || [],
        shoe_sizes: editingProduct.shoe_sizes || []
      };
      await api.put(`/products/${editingProduct.id}`, data);
      toast.success('تم تحديث المنتج بنجاح');
      setShowEditDialog(false);
      setEditingProduct(null);
      setSelectedFiles([]);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'حدث خطأ في تحديث المنتج');
    }
  };

  const handleDeleteImage = (imageIndex) => {
    if (editingProduct) {
      const newImages = [...editingProduct.images];
      newImages.splice(imageIndex, 1);
      setEditingProduct({ ...editingProduct, images: newImages });
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا المنتج؟')) return;
    try {
      await api.delete(`/products/${productId}`);
      toast.success('تم حذف المنتج');
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

  const sendReply = async () => {
    if (!replyMessage.trim() || !selectedConversation) return;
    try {
      await api.post('/chat/store/reply', {
        customer_id: selectedConversation.customer_id,
        message: replyMessage
      });
      toast.success('تم إرسال الرد');
      setReplyMessage('');
      fetchData();
    } catch (error) {
      toast.error('حدث خطأ في إرسال الرد');
    }
  };

  const resetProductForm = () => {
    setProductData({ name: '', description: '', price: '', stock: '', category_id: '', images: [], sizes: [], colors: [], shoe_sizes: [] });
    setSelectedFiles([]);
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { label: 'قيد الانتظار', className: 'bg-yellow-100 text-yellow-800' },
      confirmed: { label: 'مؤكد', className: 'bg-emerald-100 text-emerald-800' },
      processing: { label: 'جاري التجهيز', className: 'bg-indigo-100 text-indigo-800' },
      shipped: { label: 'تم الشحن', className: 'bg-purple-100 text-purple-800' },
      out_for_delivery: { label: 'في الطريق', className: 'bg-orange-100 text-orange-800' },
      delivered: { label: 'تم التسليم', className: 'bg-green-100 text-green-800' },
      cancelled: { label: 'ملغى', className: 'bg-red-100 text-red-800' }
    };
    return <Badge className={statusMap[status]?.className || statusMap.pending.className}>{statusMap[status]?.label || status}</Badge>;
  };

  const getPaymentMethodLabel = (method) => {
    const methods = { cash_on_delivery: 'الدفع عند الاستلام', sham_cash: 'شام كاش', bank_transfer: 'تحويل بنكي', visa: 'فيزا' };
    return methods[method] || method;
  };

  // Check for delayed orders (more than 3 days pending)
  const delayedOrders = orders.filter(o => {
    if (!['pending', 'confirmed'].includes(o.status)) return false;
    const orderDate = new Date(o.created_at);
    const now = new Date();
    const diffDays = (now - orderDate) / (1000 * 60 * 60 * 24);
    return diffDays > 3;
  });

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="text-xl font-medium text-gray-600">جاري التحميل...</div></div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => navigate('/')} className="flex items-center gap-2">
              <ArrowRight className="w-5 h-5" />العودة
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">لوحة تحكم المتجر</h1>
            <Button variant="outline" onClick={logout}>تسجيل الخروج</Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!myStore ? (
          <div className="text-center py-20">
            <Store className="w-24 h-24 mx-auto text-gray-300 mb-6" />
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">لم تفتح متجراً بعد</h2>
            <p className="text-gray-500 mb-8">ابدأ بفتح متجرك الخاص وبيع منتجاتك</p>
            <Dialog open={showStoreDialog} onOpenChange={setShowStoreDialog}>
              <DialogTrigger asChild>
                <Button className="bg-emerald-600 hover:bg-emerald-700"><Plus className="w-5 h-5 ml-2" />فتح متجر جديد</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>فتح متجر جديد</DialogTitle></DialogHeader>
                <form onSubmit={handleCreateStore} className="space-y-4">
                  <div><Label>اسم المتجر</Label><Input value={storeData.store_name} onChange={(e) => setStoreData({ ...storeData, store_name: e.target.value })} required /></div>
                  <div><Label>رقم الواتساب</Label><Input placeholder="963912345678" value={storeData.phone} onChange={(e) => setStoreData({ ...storeData, phone: e.target.value })} /></div>
                  <div><Label>وصف المتجر</Label><Textarea value={storeData.description} onChange={(e) => setStoreData({ ...storeData, description: e.target.value })} rows={3} /></div>
                  <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700">إرسال الطلب</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        ) : myStore.status === 'pending' ? (
          <div className="text-center py-20">
            <div className="bg-yellow-100 border border-yellow-300 rounded-xl p-8 max-w-md mx-auto">
              <h2 className="text-2xl font-semibold text-yellow-800 mb-4">بانتظار الموافقة</h2>
              <p className="text-yellow-700">تم إرسال طلب فتح متجرك <strong>{myStore.store_name}</strong>. سيتم مراجعته قريباً.</p>
            </div>
          </div>
        ) : (
          <div>
            {/* Delayed Orders Alert */}
            {delayedOrders.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-red-600" />
                <div>
                  <p className="font-semibold text-red-800">تنبيه: لديك {delayedOrders.length} طلبات متأخرة!</p>
                  <p className="text-sm text-red-600">هذه الطلبات في انتظار المعالجة منذ أكثر من 3 أيام</p>
                </div>
              </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-xl shadow p-4">
                <p className="text-sm text-gray-600">إجمالي المبيعات</p>
                <p className="text-2xl font-bold text-emerald-600">{stats.totalSales.toLocaleString()} ل.س</p>
              </div>
              <div className="bg-white rounded-xl shadow p-4">
                <p className="text-sm text-gray-600">عدد الطلبات</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
              </div>
              <div className="bg-white rounded-xl shadow p-4">
                <p className="text-sm text-gray-600">طلبات قيد الانتظار</p>
                <p className="text-2xl font-bold text-orange-600">{stats.pendingOrders}</p>
              </div>
              <div className="bg-white rounded-xl shadow p-4">
                <p className="text-sm text-gray-600">المنتجات</p>
                <p className="text-2xl font-bold text-gray-900">{products.length}</p>
              </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="products" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
                <TabsTrigger value="products" className="flex items-center gap-1"><Package className="w-4 h-4" />المنتجات</TabsTrigger>
                <TabsTrigger value="orders" className="flex items-center gap-1"><Store className="w-4 h-4" />الطلبات</TabsTrigger>
                <TabsTrigger value="messages" className="flex items-center gap-1"><MessageCircle className="w-4 h-4" />الرسائل</TabsTrigger>
                <TabsTrigger value="reports" className="flex items-center gap-1"><TrendingUp className="w-4 h-4" />التقارير</TabsTrigger>
              </TabsList>

              {/* Products Tab */}
              <TabsContent value="products">
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-gray-900">منتجاتي ({products.length})</h3>
                    <Dialog open={showProductDialog} onOpenChange={setShowProductDialog}>
                      <DialogTrigger asChild>
                        <Button className="bg-emerald-600 hover:bg-emerald-700"><Plus className="w-5 h-5 ml-2" />إضافة منتج</Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader><DialogTitle>إضافة منتج جديد</DialogTitle></DialogHeader>
                        <form onSubmit={handleAddProduct} className="space-y-4">
                          <div><Label>اسم المنتج</Label><Input value={productData.name} onChange={(e) => setProductData({ ...productData, name: e.target.value })} required /></div>
                          <div><Label>وصف المنتج</Label><Textarea value={productData.description} onChange={(e) => setProductData({ ...productData, description: e.target.value })} rows={3} placeholder="أضف وصفاً تفصيلياً..." /></div>
                          <div className="grid grid-cols-2 gap-4">
                            <div><Label>السعر (ل.س)</Label><Input type="number" value={productData.price} onChange={(e) => setProductData({ ...productData, price: e.target.value })} required /></div>
                            <div><Label>الكمية</Label><Input type="number" value={productData.stock} onChange={(e) => setProductData({ ...productData, stock: e.target.value })} required /></div>
                          </div>
                          <div><Label>الفئة</Label>
                            <select className="w-full px-3 py-2 border border-gray-300 rounded-md" value={productData.category_id} onChange={(e) => setProductData({ ...productData, category_id: e.target.value })} required>
                              <option value="">اختر فئة</option>
                              {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name_ar}</option>)}
                            </select>
                          </div>
                          <div><Label>صور المنتج (يمكنك اختيار عدة صور)</Label>
                            <Input type="file" accept="image/*" multiple onChange={(e) => setSelectedFiles(Array.from(e.target.files))} className="cursor-pointer" />
                            {selectedFiles.length > 0 && <p className="text-sm text-emerald-600 mt-2">تم اختيار {selectedFiles.length} صورة</p>}
                          </div>
                          <div><Label>المقاسات (اختياري - مفصولة بفواصل)</Label><Input placeholder="S, M, L, XL" onChange={(e) => setProductData({ ...productData, sizes: e.target.value.split(',').map(s => s.trim()).filter(s => s) })} /></div>
                          <div><Label>نمر الأحذية (اختياري)</Label><Input placeholder="38, 39, 40, 41, 42" onChange={(e) => setProductData({ ...productData, shoe_sizes: e.target.value.split(',').map(s => s.trim()).filter(s => s) })} /></div>
                          <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={uploadingImages}>{uploadingImages ? 'جاري الرفع...' : 'إضافة المنتج'}</Button>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                  {products.length === 0 ? <p className="text-center text-gray-500 py-12">لم تضف أي منتجات بعد</p> : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {products.map((product) => (
                        <div key={product.id} className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition">
                          <div className="relative h-48">
                            <img src={product.images?.[0] || 'https://via.placeholder.com/300'} alt={product.name} className="w-full h-full object-cover" />
                            {product.images?.length > 1 && <span className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">+{product.images.length - 1} صور</span>}
                            {product.promoted && <span className="absolute top-2 left-2 bg-amber-500 text-white text-xs px-2 py-1 rounded flex items-center gap-1"><Star className="w-3 h-3" />مميز</span>}
                          </div>
                          <div className="p-4">
                            <h4 className="font-semibold text-gray-900 mb-2 line-clamp-1">{product.name}</h4>
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description || 'لا يوجد وصف'}</p>
                            <div className="flex justify-between items-center mb-4">
                              <span className="text-lg font-bold text-emerald-600">{product.price?.toLocaleString()} ل.س</span>
                              <span className="text-sm text-gray-600">مخزون: {product.stock}</span>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" className="flex-1" onClick={() => { setEditingProduct(product); setShowEditDialog(true); }}><Edit className="w-4 h-4 ml-1" />تعديل</Button>
                              <Button variant="destructive" size="sm" className="flex-1" onClick={() => handleDeleteProduct(product.id)}><Trash2 className="w-4 h-4 ml-1" />حذف</Button>
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
                  <h3 className="text-xl font-bold text-gray-900 mb-6">طلبات المتجر ({orders.length})</h3>
                  {orders.length === 0 ? <p className="text-center text-gray-500 py-12">لا توجد طلبات</p> : (
                    <div className="space-y-4">
                      {orders.map((order) => (
                        <div key={order.id} className={`border rounded-xl p-4 ${delayedOrders.includes(order) ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}>
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <p className="font-semibold text-gray-900">طلب #{order.id?.slice(0, 8)}</p>
                              <p className="text-sm text-gray-600">{new Date(order.created_at).toLocaleDateString('ar-SY')}</p>
                              {delayedOrders.includes(order) && <p className="text-xs text-red-600 font-medium">⚠️ طلب متأخر</p>}
                            </div>
                            {getStatusBadge(order.status)}
                          </div>
                          <div className="bg-gray-50 rounded-lg p-3 mb-4">
                            <p className="text-sm"><strong>العنوان:</strong> {order.shipping_address}</p>
                            <p className="text-sm"><strong>الهاتف:</strong> {order.phone}</p>
                            <p className="text-sm"><strong>طريقة الدفع:</strong> {getPaymentMethodLabel(order.payment_method)}</p>
                            <p className="text-sm font-bold text-emerald-600"><strong>المجموع:</strong> {order.total?.toLocaleString()} ل.س</p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {order.status === 'pending' && (<><Button size="sm" onClick={() => updateOrderStatus(order.id, 'confirmed')}>تأكيد</Button><Button size="sm" variant="destructive" onClick={() => updateOrderStatus(order.id, 'cancelled')}>إلغاء</Button></>)}
                            {order.status === 'confirmed' && <Button size="sm" onClick={() => updateOrderStatus(order.id, 'processing')}>بدء التجهيز</Button>}
                            {order.status === 'processing' && <Button size="sm" onClick={() => updateOrderStatus(order.id, 'shipped')}>تم الشحن</Button>}
                            {order.status === 'shipped' && <Button size="sm" onClick={() => updateOrderStatus(order.id, 'out_for_delivery')}>في الطريق</Button>}
                            {order.status === 'out_for_delivery' && <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => updateOrderStatus(order.id, 'delivered')}>تم التسليم</Button>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Messages Tab */}
              <TabsContent value="messages">
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-6">رسائل العملاء ({conversations.length})</h3>
                  {conversations.length === 0 ? (
                    <div className="text-center py-12">
                      <MessageCircle className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                      <p className="text-gray-500">لا توجد رسائل</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        {conversations.map((conv) => (
                          <div key={conv.customer_id} onClick={() => setSelectedConversation(conv)}
                            className={`p-4 rounded-lg cursor-pointer transition ${selectedConversation?.customer_id === conv.customer_id ? 'bg-emerald-100 border-2 border-emerald-500' : 'bg-gray-50 hover:bg-gray-100'}`}>
                            <p className="font-semibold">{conv.customer_name}</p>
                            <p className="text-sm text-gray-600 line-clamp-1">{conv.last_message?.message}</p>
                            <p className="text-xs text-gray-400">{new Date(conv.last_message?.created_at).toLocaleDateString('ar')}</p>
                          </div>
                        ))}
                      </div>
                      {selectedConversation && (
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="font-semibold mb-4">محادثة مع {selectedConversation.customer_name}</h4>
                          <div className="h-64 overflow-y-auto space-y-2 mb-4">
                            {selectedConversation.messages?.map((msg, idx) => (
                              <div key={idx} className={`flex ${msg.sender_type === 'store_owner' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] px-4 py-2 rounded-xl ${msg.sender_type === 'store_owner' ? 'bg-emerald-600 text-white' : 'bg-white shadow'}`}>
                                  <p className="text-sm">{msg.message}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <Input value={replyMessage} onChange={(e) => setReplyMessage(e.target.value)} placeholder="اكتب ردك..." onKeyPress={(e) => e.key === 'Enter' && sendReply()} />
                            <Button onClick={sendReply} className="bg-emerald-600 hover:bg-emerald-700"><Send className="w-4 h-4" /></Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Reports Tab */}
              <TabsContent value="reports">
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-6">تقارير الأداء</h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-emerald-50 rounded-xl p-6">
                      <h4 className="font-semibold text-emerald-800 mb-4">ملخص المبيعات</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between"><span>إجمالي المبيعات</span><span className="font-bold text-emerald-600">{stats.totalSales.toLocaleString()} ل.س</span></div>
                        <div className="flex justify-between"><span>عدد الطلبات المكتملة</span><span className="font-bold">{orders.filter(o => o.status === 'delivered').length}</span></div>
                        <div className="flex justify-between"><span>متوسط قيمة الطلب</span><span className="font-bold">{stats.totalOrders > 0 ? Math.round(stats.totalSales / stats.totalOrders).toLocaleString() : 0} ل.س</span></div>
                      </div>
                    </div>
                    <div className="bg-amber-50 rounded-xl p-6">
                      <h4 className="font-semibold text-amber-800 mb-4">أكثر المنتجات مبيعاً</h4>
                      {stats.topProducts.length === 0 ? <p className="text-gray-500">لا توجد بيانات كافية</p> : (
                        <div className="space-y-2">
                          {stats.topProducts.map((p, idx) => (
                            <div key={p.id} className="flex justify-between items-center">
                              <span className="flex items-center gap-2"><span className="w-6 h-6 bg-amber-200 rounded-full flex items-center justify-center text-sm font-bold">{idx + 1}</span>{p.name}</span>
                              <span className="font-bold">{p.count} مبيعات</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {/* Edit Product Dialog */}
            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader><DialogTitle>تعديل المنتج</DialogTitle></DialogHeader>
                {editingProduct && (
                  <form onSubmit={handleEditProduct} className="space-y-4">
                    <div><Label>اسم المنتج</Label><Input value={editingProduct.name} onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })} required /></div>
                    <div><Label>وصف المنتج</Label><Textarea value={editingProduct.description || ''} onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })} rows={3} /></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><Label>السعر (ل.س)</Label><Input type="number" value={editingProduct.price} onChange={(e) => setEditingProduct({ ...editingProduct, price: e.target.value })} required /></div>
                      <div><Label>الكمية</Label><Input type="number" value={editingProduct.stock} onChange={(e) => setEditingProduct({ ...editingProduct, stock: e.target.value })} required /></div>
                    </div>
                    {editingProduct.images?.length > 0 && (
                      <div><Label>الصور الحالية</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {editingProduct.images.map((img, index) => (
                            <div key={index} className="relative w-20 h-20">
                              <img src={img} alt="" className="w-full h-full object-cover rounded-lg" />
                              <button type="button" onClick={() => handleDeleteImage(index)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"><X className="w-3 h-3" /></button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <div><Label>إضافة صور جديدة</Label><Input type="file" accept="image/*" multiple onChange={(e) => setSelectedFiles(Array.from(e.target.files))} className="cursor-pointer" /></div>
                    <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={uploadingImages}>{uploadingImages ? 'جاري الرفع...' : 'حفظ التغييرات'}</Button>
                  </form>
                )}
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>
    </div>
  );
};

export default StoreDashboard;
