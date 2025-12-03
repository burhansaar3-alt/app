import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../App';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { ArrowRight, Plus, Edit, Trash2, Store } from 'lucide-react';
import { toast } from 'sonner';

const StoreDashboard = ({ user, logout }) => {
  const navigate = useNavigate();
  const [myStore, setMyStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showStoreDialog, setShowStoreDialog] = useState(false);
  const [showProductDialog, setShowProductDialog] = useState(false);
  const [storeData, setStoreData] = useState({
    store_name: '',
    description: ''
  });
  const [productData, setProductData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    category_id: '',
    images: [],
    sizes: [],
    colors: [],
    shoe_sizes: []
  });
  const [uploadingImages, setUploadingImages] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

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
          const productsRes = await api.get('/products', { params: { store_id: store.id } });
          setProducts(productsRes.data);
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
      // Upload images first
      let imageUrls = productData.images;
      if (selectedFiles.length > 0) {
        const uploadedUrls = await handleImageUpload(selectedFiles);
        imageUrls = [...imageUrls, ...uploadedUrls];
      }
      
      const data = {
        ...productData,
        price: parseFloat(productData.price),
        stock: parseInt(productData.stock),
        images: imageUrls
      };
      
      await api.post('/products', data);
      toast.success('تمت إضافة المنتج بنجاح');
      setShowProductDialog(false);
      setProductData({
        name: '',
        description: '',
        price: '',
        stock: '',
        category_id: '',
        images: [],
        sizes: [],
        colors: [],
        shoe_sizes: []
      });
      setSelectedFiles([]);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'حدث خطأ في إضافة المنتج');
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
            <h1 className="text-2xl font-bold text-gray-900">متجري</h1>
            <Button data-testid="logout-button" variant="outline" onClick={logout}>تسجيل الخروج</Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {!myStore ? (
          // No Store Yet
          <div className="text-center py-20">
            <Store className="w-24 h-24 mx-auto text-gray-300 mb-6" />
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">لم تفتح متجراً بعد</h2>
            <p className="text-gray-500 mb-8">ابدأ بفتح متجرك الخاص وبيع منتجاتك</p>
            <Dialog open={showStoreDialog} onOpenChange={setShowStoreDialog}>
              <DialogTrigger asChild>
                <Button data-testid="create-store-button" className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-5 h-5 ml-2" />
                  فتح متجر جديد
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>فتح متجر جديد</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateStore} className="space-y-4">
                  <div>
                    <Label htmlFor="store_name">اسم المتجر</Label>
                    <Input
                      id="store_name"
                      data-testid="store-name-input"
                      value={storeData.store_name}
                      onChange={(e) => setStoreData({ ...storeData, store_name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">وصف المتجر</Label>
                    <Textarea
                      id="description"
                      data-testid="store-description-input"
                      value={storeData.description}
                      onChange={(e) => setStoreData({ ...storeData, description: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <Button data-testid="submit-store" type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                    إرسال الطلب
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        ) : myStore.status === 'pending' ? (
          // Store Pending
          <div className="text-center py-20">
            <div className="bg-yellow-100 border border-yellow-300 rounded-xl p-8 max-w-md mx-auto">
              <h2 className="text-2xl font-semibold text-yellow-800 mb-4">بانتظار الموافقة</h2>
              <p className="text-yellow-700">
                تم إرسال طلب فتح متجرك <strong>{myStore.store_name}</strong> بنجاح.
                سيتم مراجعته من قبل الإدارة قريباً.
              </p>
            </div>
          </div>
        ) : myStore.status === 'rejected' ? (
          // Store Rejected
          <div className="text-center py-20">
            <div className="bg-red-100 border border-red-300 rounded-xl p-8 max-w-md mx-auto">
              <h2 className="text-2xl font-semibold text-red-800 mb-4">تم رفض الطلب</h2>
              <p className="text-red-700 mb-6">
                عذراً، تم رفض طلب فتح متجرك. يرجى التواصل مع الإدارة.
              </p>
            </div>
          </div>
        ) : (
          // Store Approved - Show Products
          <div>
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">{myStore.store_name}</h2>
                  <p className="text-gray-600">{myStore.description || 'لا يوجد وصف'}</p>
                </div>
                <Dialog open={showProductDialog} onOpenChange={setShowProductDialog}>
                  <DialogTrigger asChild>
                    <Button data-testid="add-product-button" className="bg-blue-600 hover:bg-blue-700">
                      <Plus className="w-5 h-5 ml-2" />
                      إضافة منتج
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>إضافة منتج جديد</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddProduct} className="space-y-4">
                      <div>
                        <Label htmlFor="product_name">اسم المنتج</Label>
                        <Input
                          id="product_name"
                          data-testid="product-name-input"
                          value={productData.name}
                          onChange={(e) => setProductData({ ...productData, name: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="product_description">الوصف</Label>
                        <Textarea
                          id="product_description"
                          data-testid="product-description-input"
                          value={productData.description}
                          onChange={(e) => setProductData({ ...productData, description: e.target.value })}
                          rows={3}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="price">السعر (ل.س)</Label>
                          <Input
                            id="price"
                            data-testid="product-price-input"
                            type="number"
                            value={productData.price}
                            onChange={(e) => setProductData({ ...productData, price: e.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="stock">الكمية</Label>
                          <Input
                            id="stock"
                            data-testid="product-stock-input"
                            type="number"
                            value={productData.stock}
                            onChange={(e) => setProductData({ ...productData, stock: e.target.value })}
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="category">الفئة</Label>
                        <select
                          id="category"
                          data-testid="product-category-select"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          value={productData.category_id}
                          onChange={(e) => setProductData({ ...productData, category_id: e.target.value })}
                          required
                        >
                          <option value="">اختر فئة</option>
                          {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>{cat.name_ar}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <Label htmlFor="product_images">صور المنتج (يمكن اختيار عدة صور)</Label>
                        <Input
                          id="product_images"
                          data-testid="product-images-input"
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={(e) => {
                            const files = Array.from(e.target.files);
                            setSelectedFiles(files);
                          }}
                          className="cursor-pointer"
                        />
                        {selectedFiles.length > 0 && (
                          <p className="text-sm text-gray-600 mt-2">
                            تم اختيار {selectedFiles.length} صورة
                          </p>
                        )}
                        {uploadingImages && (
                          <p className="text-sm text-blue-600 mt-2">جاري رفع الصور...</p>
                        )}
                      </div>
                      
                      <div>
                        <Label htmlFor="sizes">المقاسات (اختياري - مفصولة بفاصلة)</Label>
                        <Input
                          id="sizes"
                          data-testid="product-sizes-input"
                          placeholder="مثال: S, M, L, XL"
                          onChange={(e) => {
                            const sizes = e.target.value.split(',').map(s => s.trim()).filter(s => s);
                            setProductData({ ...productData, sizes });
                          }}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="shoe_sizes">مقاسات الأحذية (اختياري - مفصولة بفاصلة)</Label>
                        <Input
                          id="shoe_sizes"
                          data-testid="product-shoe-sizes-input"
                          placeholder="مثال: 38, 39, 40, 41, 42"
                          onChange={(e) => {
                            const shoe_sizes = e.target.value.split(',').map(s => s.trim()).filter(s => s);
                            setProductData({ ...productData, shoe_sizes });
                          }}
                        />
                      </div>
                      <Button data-testid="submit-product" type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                        إضافة المنتج
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Products List */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">منتجاتي ({products.length})</h3>
              {products.length === 0 ? (
                <p className="text-center text-gray-500 py-12">لم تضف أي منتجات بعد</p>
              ) : (
                <div className="product-grid">
                  {products.map((product) => (
                    <div key={product.id} data-testid={`product-${product.id}`} className="border border-gray-200 rounded-lg overflow-hidden">
                      <img
                        src={product.images[0] || 'https://via.placeholder.com/300'}
                        alt={product.name}
                        className="w-full h-48 object-cover"
                      />
                      <div className="p-4">
                        <h4 className="font-semibold text-gray-900 mb-2">{product.name}</h4>
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">{product.description}</p>
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-lg font-bold text-blue-600">{product.price.toLocaleString()} ل.س</span>
                          <span className="text-sm text-gray-600">مخزون: {product.stock}</span>
                        </div>
                        <Button
                          data-testid={`delete-product-${product.id}`}
                          variant="destructive"
                          size="sm"
                          className="w-full"
                          onClick={() => handleDeleteProduct(product.id)}
                        >
                          <Trash2 className="w-4 h-4 ml-2" />
                          حذف
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StoreDashboard;