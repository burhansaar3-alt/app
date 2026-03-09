import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../App';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { ArrowRight, ShoppingCart, Store, Plus, Minus, Star, Zap, MessageCircle, Send, X } from 'lucide-react';
import { toast } from 'sonner';

const ProductDetails = ({ user, logout }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [storeInfo, setStoreInfo] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedShoeSize, setSelectedShoeSize] = useState('');
  const [similarProducts, setSimilarProducts] = useState([]);
  const [mainImage, setMainImage] = useState('');
  
  // Chat State
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  const fetchProduct = async () => {
    try {
      const res = await api.get(`/products/${id}`);
      setProduct(res.data);
      
      // Fetch store info
      const storesRes = await api.get('/stores');
      const store = storesRes.data.find(s => s.id === res.data.store_id);
      setStoreInfo(store);
      
      setLoading(false);
    } catch (error) {
      toast.error('حدث خطأ في تحميل المنتج');
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const res = await api.get(`/products/${id}/reviews`);
      setReviews(res.data.reviews || []);
      setAverageRating(res.data.average_rating || 0);
      setTotalReviews(res.data.total_reviews || 0);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const fetchSimilarProducts = async () => {
    try {
      const res = await api.get(`/products/${id}/similar`);
      setSimilarProducts(res.data);
    } catch (error) {
      console.error('Error fetching similar products:', error);
    }
  };

  const fetchChatMessages = async () => {
    if (!user || !storeInfo) return;
    try {
      const res = await api.get(`/chat/${storeInfo.id}`);
      setMessages(res.data || []);
    } catch (error) {
      // Chat might not exist yet
      setMessages([]);
    }
  };

  useEffect(() => {
    fetchProduct();
    fetchReviews();
    fetchSimilarProducts();
  }, [id]);

  useEffect(() => {
    if (product?.images?.length > 0) {
      setMainImage(product.images[0]);
    }
  }, [product]);

  useEffect(() => {
    if (selectedColor?.image) {
      setMainImage(selectedColor.image);
    }
  }, [selectedColor]);

  useEffect(() => {
    if (showChat && user && storeInfo) {
      fetchChatMessages();
    }
  }, [showChat, user, storeInfo]);

  const submitReview = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('يرجى تسجيل الدخول لإضافة تقييم');
      navigate('/auth');
      return;
    }

    try {
      await api.post('/reviews', {
        product_id: id,
        rating: newReview.rating,
        comment: newReview.comment
      });
      toast.success('تم إضافة التقييم بنجاح');
      setNewReview({ rating: 5, comment: '' });
      setShowReviewForm(false);
      fetchReviews();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'حدث خطأ في إضافة التقييم');
    }
  };

  const renderStars = (rating, size = 'w-5 h-5') => {
    return [...Array(5)].map((_, index) => (
      <Star
        key={index}
        className={`${size} ${index < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
      />
    ));
  };

  const addToCart = async () => {
    if (!user) {
      toast.error('يرجى تسجيل الدخول أولاً');
      navigate('/auth');
      return;
    }

    try {
      await api.post('/cart/add', { 
        product_id: id, 
        quantity,
        selected_size: selectedSize,
        selected_color: selectedColor?.name,
        selected_shoe_size: selectedShoeSize
      });
      toast.success('تمت إضافة المنتج إلى السلة');
    } catch (error) {
      toast.error('حدث خطأ أثناء الإضافة');
    }
  };

  const buyNow = async () => {
    if (!user) {
      toast.error('يرجى تسجيل الدخول أولاً');
      navigate('/auth');
      return;
    }

    try {
      await api.post('/cart/add', { product_id: id, quantity });
      navigate('/checkout');
    } catch (error) {
      toast.error('حدث خطأ أثناء الإضافة');
    }
  };

  const openChat = () => {
    if (!user) {
      toast.error('يرجى تسجيل الدخول للتواصل مع المتجر');
      navigate('/auth');
      return;
    }
    setShowChat(true);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !storeInfo) return;
    
    setChatLoading(true);
    try {
      await api.post('/chat/send', {
        store_id: storeInfo.id,
        message: newMessage,
        product_id: id
      });
      setNewMessage('');
      fetchChatMessages();
      toast.success('تم إرسال الرسالة');
    } catch (error) {
      toast.error('حدث خطأ في إرسال الرسالة');
    } finally {
      setChatLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-green-50">
        <div className="text-xl font-medium text-gray-600">جاري التحميل...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-green-50">
        <div className="text-xl font-medium text-gray-600">المنتج غير موجود</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
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
            <h1 className="text-lg font-bold text-gray-900 hidden sm:block">تفاصيل المنتج</h1>
            {user && (
              <Button
                data-testid="cart-button"
                variant="outline"
                onClick={() => navigate('/cart')}
                className="border-emerald-600 text-emerald-600 hover:bg-emerald-50"
              >
                <ShoppingCart className="w-5 h-5 ml-2" />
                السلة
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Product Image - Full Width */}
      <div className="bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="aspect-square sm:aspect-[4/3] lg:aspect-[16/9] relative overflow-hidden">
            <img
              src={mainImage || product.images?.[0] || 'https://via.placeholder.com/800'}
              alt={product.name}
              className="w-full h-full object-contain bg-gray-50"
              data-testid="product-image"
            />
          </div>
          
          {/* Thumbnail Gallery */}
          {product.images && product.images.length > 1 && (
            <div className="flex gap-2 p-4 overflow-x-auto justify-center">
              {product.images.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setMainImage(img)}
                  className={`flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border-2 transition-all ${
                    mainImage === img ? 'border-emerald-600 ring-2 ring-emerald-200' : 'border-gray-200 hover:border-emerald-400'
                  }`}
                >
                  <img src={img} alt={`${product.name} ${index + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Product Info Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-2xl shadow-lg p-6 space-y-6">
          {/* Title & Store */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2" data-testid="product-name">
              {product.name}
            </h1>
            {storeInfo && (
              <Link
                to={`/store/${storeInfo.id}`}
                className="inline-flex items-center gap-2 text-emerald-600 hover:underline"
              >
                <Store className="w-4 h-4" />
                <span>{storeInfo.store_name}</span>
              </Link>
            )}
          </div>

          {/* Price & Stock */}
          <div className="flex items-center justify-between py-4 border-y border-gray-100">
            <div>
              <span className="text-sm text-gray-500">السعر</span>
              <p className="text-3xl font-bold text-emerald-600" data-testid="product-price">
                {product.price?.toLocaleString()} ل.س
              </p>
            </div>
            <div className="text-left">
              <span className="text-sm text-gray-500">المخزون</span>
              <p className={`text-lg font-semibold ${product.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {product.stock > 0 ? `${product.stock} قطعة` : 'نفذت الكمية'}
              </p>
            </div>
          </div>

          {/* Description */}
          {product.description && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">وصف المنتج</h3>
              <p className="text-gray-600 leading-relaxed">{product.description}</p>
            </div>
          )}

          {/* Variants Selection */}
          {product.stock > 0 && (
            <div className="space-y-4">
              {/* Colors */}
              {product.colors && product.colors.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">اختر اللون</h3>
                  <div className="flex gap-3 flex-wrap">
                    {product.colors.map((color, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedColor(color)}
                        className={`relative w-14 h-14 rounded-xl border-2 transition-all ${
                          selectedColor?.name === color.name
                            ? 'border-emerald-600 ring-2 ring-emerald-200 scale-105'
                            : 'border-gray-200 hover:border-emerald-400'
                        }`}
                        title={color.name}
                      >
                        {color.image ? (
                          <img src={color.image} alt={color.name} className="w-full h-full object-cover rounded-lg" />
                        ) : (
                          <div className="w-full h-full rounded-lg" style={{ backgroundColor: color.hex || '#ccc' }} />
                        )}
                        {selectedColor?.name === color.name && (
                          <div className="absolute inset-0 flex items-center justify-center bg-emerald-600/20 rounded-lg">
                            <span className="text-emerald-700 text-xl font-bold">✓</span>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                  {selectedColor && <p className="mt-2 text-sm text-emerald-600">اللون: {selectedColor.name}</p>}
                </div>
              )}

              {/* Sizes */}
              {product.sizes && product.sizes.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">اختر المقاس</h3>
                  <div className="flex gap-2 flex-wrap">
                    {product.sizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`px-5 py-2.5 rounded-xl border-2 font-medium transition-all ${
                          selectedSize === size
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                            : 'border-gray-200 hover:border-emerald-400 text-gray-700'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Shoe Sizes */}
              {product.shoe_sizes && product.shoe_sizes.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">اختر نمرة الحذاء</h3>
                  <div className="flex gap-2 flex-wrap">
                    {product.shoe_sizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedShoeSize(size)}
                        className={`w-12 h-12 rounded-xl border-2 font-semibold transition-all ${
                          selectedShoeSize === size
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                            : 'border-gray-200 hover:border-emerald-400 text-gray-700'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div className="flex items-center gap-4">
                <span className="text-gray-700 font-medium">الكمية:</span>
                <div className="flex items-center gap-2 bg-gray-100 rounded-xl p-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    className="h-10 w-10 rounded-lg"
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <span className="text-xl font-semibold w-12 text-center">{quantity}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    disabled={quantity >= product.stock}
                    className="h-10 w-10 rounded-lg"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
                <Button
                  size="lg"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-lg py-6 rounded-xl"
                  onClick={addToCart}
                >
                  <ShoppingCart className="w-5 h-5 ml-2" />
                  إضافة للسلة
                </Button>
                <Button
                  size="lg"
                  className="w-full bg-amber-500 hover:bg-amber-600 text-lg py-6 rounded-xl text-black font-bold"
                  onClick={buyNow}
                >
                  <Zap className="w-5 h-5 ml-2" />
                  اشتري الآن
                </Button>
              </div>

              {/* Contact Store Button */}
              {storeInfo && (
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full text-lg py-6 rounded-xl border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50"
                  onClick={openChat}
                >
                  <MessageCircle className="w-5 h-5 ml-2" />
                  تواصل مع المتجر
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Reviews Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mt-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">التقييمات والمراجعات</h2>
              {totalReviews > 0 && (
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex">{renderStars(Math.round(averageRating), 'w-5 h-5')}</div>
                  <span className="text-xl font-bold text-gray-900">{averageRating.toFixed(1)}</span>
                  <span className="text-gray-500">({totalReviews} تقييم)</span>
                </div>
              )}
            </div>
            {user && !showReviewForm && (
              <Button onClick={() => setShowReviewForm(true)} className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="w-4 h-4 ml-2" />
                إضافة تقييم
              </Button>
            )}
          </div>

          {/* Add Review Form */}
          {showReviewForm && (
            <form onSubmit={submitReview} className="bg-emerald-50 rounded-xl p-6 mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">إضافة تقييمك</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">التقييم</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setNewReview({ ...newReview, rating: star })}
                        className="focus:outline-none"
                      >
                        <Star
                          className={`w-8 h-8 ${star <= newReview.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">تعليقك</label>
                  <Textarea
                    value={newReview.comment}
                    onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                    placeholder="اكتب تعليقك هنا..."
                    rows={3}
                  />
                </div>
                <div className="flex gap-3">
                  <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">إرسال التقييم</Button>
                  <Button type="button" variant="outline" onClick={() => setShowReviewForm(false)}>إلغاء</Button>
                </div>
              </div>
            </form>
          )}

          {/* Reviews List */}
          {reviews.length === 0 ? (
            <p className="text-center text-gray-500 py-8">لا توجد تقييمات بعد. كن أول من يقيم هذا المنتج!</p>
          ) : (
            <div className="space-y-4">
              {reviews.map((review, index) => (
                <div key={index} className="border-b border-gray-100 pb-4 last:border-0">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                      <span className="text-emerald-600 font-bold">{review.user_name?.[0] || 'م'}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900">{review.user_name || 'مستخدم'}</span>
                        <div className="flex">{renderStars(review.rating, 'w-4 h-4')}</div>
                      </div>
                      <p className="text-gray-600">{review.comment}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(review.created_at).toLocaleDateString('ar')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Similar Products */}
        {similarProducts.length > 0 && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">منتجات مشابهة</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {similarProducts.map((sp) => (
                <div
                  key={sp.id}
                  onClick={() => navigate(`/product/${sp.id}`)}
                  className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition cursor-pointer"
                >
                  <div className="aspect-square overflow-hidden">
                    <img
                      src={sp.images?.[0] || 'https://via.placeholder.com/200'}
                      alt={sp.name}
                      className="w-full h-full object-cover hover:scale-105 transition"
                    />
                  </div>
                  <div className="p-3">
                    <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 mb-1">{sp.name}</h3>
                    <p className="text-emerald-600 font-bold">{sp.price?.toLocaleString()} ل.س</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Chat Dialog */}
      <Dialog open={showChat} onOpenChange={setShowChat}>
        <DialogContent className="max-w-md h-[80vh] flex flex-col p-0">
          <DialogHeader className="p-4 border-b bg-emerald-600 text-white rounded-t-lg">
            <DialogTitle className="flex items-center gap-2">
              <Store className="w-5 h-5" />
              محادثة مع {storeInfo?.store_name}
            </DialogTitle>
          </DialogHeader>
          
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <MessageCircle className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                <p>ابدأ محادثتك مع المتجر</p>
                <p className="text-sm mt-1">اسأل عن المنتج: {product?.name}</p>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.sender_id === user?.id ? 'justify-start' : 'justify-end'}`}
                >
                  <div
                    className={`max-w-[80%] px-4 py-2 rounded-2xl ${
                      msg.sender_id === user?.id
                        ? 'bg-emerald-600 text-white rounded-br-sm'
                        : 'bg-white text-gray-900 rounded-bl-sm shadow'
                    }`}
                  >
                    <p>{msg.message}</p>
                    <p className={`text-xs mt-1 ${msg.sender_id === user?.id ? 'text-emerald-100' : 'text-gray-400'}`}>
                      {new Date(msg.created_at).toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Input */}
          <div className="p-4 border-t bg-white">
            <div className="flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="اكتب رسالتك..."
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                className="flex-1"
              />
              <Button
                onClick={sendMessage}
                disabled={chatLoading || !newMessage.trim()}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductDetails;
