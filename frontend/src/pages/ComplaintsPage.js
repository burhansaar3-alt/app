import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../App';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { ArrowRight, AlertTriangle, Plus, Upload, X, CheckCircle, Clock, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

const ComplaintsPage = ({ user }) => {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [formData, setFormData] = useState({
    subject: '',
    message: '',
    order_id: '',
    images: []
  });
  const [selectedFiles, setSelectedFiles] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [complaintsRes, ordersRes] = await Promise.all([
        api.get('/complaints'),
        api.get('/orders/my')
      ]);
      setComplaints(complaintsRes.data);
      setOrders(ordersRes.data);
      setLoading(false);
    } catch (error) {
      toast.error('حدث خطأ في تحميل البيانات');
      setLoading(false);
    }
  };

  const handleImageUpload = async (files) => {
    if (!files || files.length === 0) return [];
    setUploadingImages(true);
    const uploadedUrls = [];
    
    try {
      for (const file of files) {
        const formDataImg = new FormData();
        formDataImg.append('file', file);
        const response = await api.post('/upload-image', formDataImg, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        uploadedUrls.push(response.data.url);
      }
      toast.success(`تم رفع ${uploadedUrls.length} صورة`);
      return uploadedUrls;
    } catch (error) {
      toast.error('حدث خطأ في رفع الصور');
      return [];
    } finally {
      setUploadingImages(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.subject || !formData.message) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    try {
      let imageUrls = [];
      if (selectedFiles.length > 0) {
        imageUrls = await handleImageUpload(selectedFiles);
      }

      await api.post('/complaints', {
        subject: formData.subject,
        message: formData.message,
        order_id: formData.order_id || null,
        images: imageUrls
      });

      toast.success('تم إرسال شكواك بنجاح');
      setShowDialog(false);
      setFormData({ subject: '', message: '', order_id: '', images: [] });
      setSelectedFiles([]);
      fetchData();
    } catch (error) {
      toast.error('حدث خطأ في إرسال الشكوى');
    }
  };

  const getStatusConfig = (status) => {
    const configs = {
      pending: { label: 'قيد الانتظار', className: 'bg-yellow-100 text-yellow-800', icon: Clock },
      in_progress: { label: 'قيد المعالجة', className: 'bg-blue-100 text-blue-800', icon: MessageSquare },
      resolved: { label: 'تم الحل', className: 'bg-green-100 text-green-800', icon: CheckCircle },
      closed: { label: 'مغلق', className: 'bg-gray-100 text-gray-800', icon: X }
    };
    return configs[status] || configs.pending;
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl mb-4">يرجى تسجيل الدخول للوصول لهذه الصفحة</p>
          <Button onClick={() => navigate('/auth')}>تسجيل الدخول</Button>
        </div>
      </div>
    );
  }

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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => navigate('/')} className="flex items-center gap-2">
              <ArrowRight className="w-5 h-5" />
              العودة
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">الشكاوي والاقتراحات</h1>
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
              <DialogTrigger asChild>
                <Button className="bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="w-5 h-5 ml-2" />
                  شكوى جديدة
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>تقديم شكوى</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="subject">عنوان الشكوى *</Label>
                    <Input
                      id="subject"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      placeholder="مثال: مشكلة في المنتج"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="order_id">الطلب المتعلق (اختياري)</Label>
                    <select
                      id="order_id"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      value={formData.order_id}
                      onChange={(e) => setFormData({ ...formData, order_id: e.target.value })}
                    >
                      <option value="">-- اختر الطلب --</option>
                      {orders.map((order) => (
                        <option key={order.id} value={order.id}>
                          طلب #{order.id.slice(0, 8)} - {(order.total || 0).toLocaleString()} ل.س
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="message">تفاصيل الشكوى *</Label>
                    <Textarea
                      id="message"
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="اشرح مشكلتك بالتفصيل..."
                      rows={4}
                      required
                    />
                  </div>

                  <div>
                    <Label>صور توضيحية (اختياري)</Label>
                    <div className="mt-2">
                      <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-emerald-400 transition">
                        <Upload className="w-5 h-5 text-gray-400" />
                        <span className="text-gray-600">اختر صور للمشكلة</span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={(e) => setSelectedFiles(Array.from(e.target.files))}
                        />
                      </label>
                      {selectedFiles.length > 0 && (
                        <div className="mt-2 flex gap-2 flex-wrap">
                          {selectedFiles.map((file, idx) => (
                            <div key={idx} className="relative">
                              <img
                                src={URL.createObjectURL(file)}
                                alt=""
                                className="w-16 h-16 object-cover rounded-lg"
                              />
                              <button
                                type="button"
                                onClick={() => setSelectedFiles(files => files.filter((_, i) => i !== idx))}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                    disabled={uploadingImages}
                  >
                    {uploadingImages ? 'جاري الإرسال...' : 'إرسال الشكوى'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {complaints.length === 0 ? (
          <div className="text-center py-20">
            <AlertTriangle className="w-24 h-24 mx-auto text-gray-300 mb-6" />
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">لم تقدم أي شكاوي بعد</h2>
            <p className="text-gray-500 mb-8">إذا واجهت أي مشكلة، يمكنك تقديم شكوى وسنعمل على حلها</p>
          </div>
        ) : (
          <div className="space-y-4">
            {complaints.map((complaint) => {
              const statusConfig = getStatusConfig(complaint.status);
              const StatusIcon = statusConfig.icon;

              return (
                <div
                  key={complaint.id}
                  className="bg-white rounded-xl shadow-lg overflow-hidden cursor-pointer hover:shadow-xl transition"
                  onClick={() => setSelectedComplaint(selectedComplaint?.id === complaint.id ? null : complaint)}
                >
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <StatusIcon className={`w-6 h-6 ${statusConfig.className.replace('bg-', 'text-').replace('-100', '-600')}`} />
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{complaint.subject}</h3>
                          <p className="text-sm text-gray-500">
                            {new Date(complaint.created_at).toLocaleDateString('ar', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                      <Badge className={statusConfig.className}>{statusConfig.label}</Badge>
                    </div>

                    <p className="text-gray-600 line-clamp-2">{complaint.message}</p>

                    {complaint.images?.length > 0 && (
                      <div className="flex gap-2 mt-3">
                        {complaint.images.slice(0, 3).map((img, idx) => (
                          <img key={idx} src={img} alt="" className="w-16 h-16 object-cover rounded-lg" />
                        ))}
                        {complaint.images.length > 3 && (
                          <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 text-sm">
                            +{complaint.images.length - 3}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Expanded Details */}
                    {selectedComplaint?.id === complaint.id && (
                      <div className="mt-6 pt-6 border-t border-gray-200">
                        <div className="bg-gray-50 rounded-lg p-4 mb-4">
                          <h4 className="font-semibold text-gray-900 mb-2">تفاصيل الشكوى:</h4>
                          <p className="text-gray-700 whitespace-pre-wrap">{complaint.message}</p>
                        </div>

                        {complaint.images?.length > 0 && (
                          <div className="mb-4">
                            <h4 className="font-semibold text-gray-900 mb-2">الصور المرفقة:</h4>
                            <div className="flex gap-3 flex-wrap">
                              {complaint.images.map((img, idx) => (
                                <img
                                  key={idx}
                                  src={img}
                                  alt=""
                                  className="w-32 h-32 object-cover rounded-lg border cursor-pointer hover:opacity-80"
                                  onClick={(e) => { e.stopPropagation(); window.open(img, '_blank'); }}
                                />
                              ))}
                            </div>
                          </div>
                        )}

                        {complaint.admin_response && (
                          <div className="bg-emerald-50 rounded-lg p-4">
                            <h4 className="font-semibold text-emerald-800 mb-2">رد الإدارة:</h4>
                            <p className="text-gray-700">{complaint.admin_response}</p>
                          </div>
                        )}
                      </div>
                    )}
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

export default ComplaintsPage;
