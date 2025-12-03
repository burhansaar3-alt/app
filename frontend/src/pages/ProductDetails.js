import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../App';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { ArrowRight, ShoppingCart, Store, Plus, Minus, Star } from 'lucide-react';
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

  useEffect(() => {
    fetchProduct();
    fetchReviews();
    fetchSimilarProducts();
  }, [id]);

  const fetchSimilarProducts = async () => {
    try {
      const res = await api.get(`/products/${id}/similar`);
      setSimilarProducts(res.data);
    } catch (error) {
      console.error('Error fetching similar products:', error);
    }
  };

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
      await api.post('/cart/add', { product_id: id, quantity });
      toast.success('تمت إضافة المنتج إلى السلة');
      navigate('/cart');
    } catch (error) {
      toast.error('حدث خطأ أثناء الإضافة');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl font-medium text-gray-600">جاري التحميل...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl font-medium text-gray-600">المنتج غير موجود</div>
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
            {user && (
              <Button
                data-testid="cart-button"
                variant="outline"
                onClick={() => navigate('/cart')}
              >
                <ShoppingCart className="w-5 h-5 ml-2" />
                سلة التسوق
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Product Details */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="bg-white rounded-3xl overflow-hidden shadow-lg h-[500px]">
              <img
                src={product.images[0] || 'https://via.placeholder.com/500'}
                alt={product.name}
                className="w-full h-full object-cover"
                data-testid="product-image"
              />
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4" data-testid="product-name">
                {product.name}
              </h1>
              <p className="text-gray-600 text-lg leading-relaxed" data-testid="product-description">
                {product.description || 'وصف المنتج'}
              </p>
            </div>

            {storeInfo && (
              <div className="bg-blue-50 rounded-xl p-4 flex items-center gap-3">
                <Store className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">من</p>
                  <Link
                    to={`/store/${storeInfo.id}`}
                    className="font-semibold text-blue-600 hover:underline"
                    data-testid="store-link"
                  >
                    {storeInfo.store_name}
                  </Link>
                </div>
              </div>
            )}

            <div className="border-t border-b border-gray-200 py-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-600 text-lg">السعر</span>
                <span className="text-4xl font-bold text-blue-600" data-testid="product-price">
                  {product.price.toLocaleString()} ل.س
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 text-lg">المخزون</span>
                <span
                  className={`font-semibold ${product.stock > 0 ? 'text-green-600' : 'text-red-600'}`}
                  data-testid="product-stock"
                >
                  {product.stock > 0 ? `${product.stock} قطعة متوفرة` : 'نفذت الكمية'}
                </span>
              </div>
            </div>

            {product.stock > 0 && (
              <>
                <div className="flex items-center gap-4">
                  <span className="text-gray-700 font-medium">الكمية</span>
                  <div className="flex items-center gap-3">
                    <Button
                      data-testid="decrease-quantity"
                      variant="outline"
                      size="icon"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span className="text-xl font-semibold w-12 text-center" data-testid="quantity-value">
                      {quantity}
                    </span>
                    <Button
                      data-testid="increase-quantity"
                      variant="outline"
                      size="icon"
                      onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                      disabled={quantity >= product.stock}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <Button
                  data-testid="add-to-cart-button"
                  size="lg"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-lg py-6 rounded-xl"
                  onClick={addToCart}
                >
                  <ShoppingCart className="w-5 h-5 ml-2" />
                  إضافة إلى السلة
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Reviews Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 mt-8">
          <div className="bg-white rounded-3xl shadow-lg p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">التقييمات والمراجعات</h2>
                {totalReviews > 0 && (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      {renderStars(Math.round(averageRating))}
                    </div>
                    <span className="text-2xl font-bold text-gray-900">{averageRating.toFixed(1)}</span>
                    <span className="text-gray-600">({totalReviews} تقييم)</span>
                  </div>
                )}
              </div>
              {user && !showReviewForm && (
                <Button
                  onClick={() => setShowReviewForm(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                  data-testid="add-review-button"
                >
                  <Plus className="w-5 h-5 ml-2" />
                  إضافة تقييم
                </Button>
              )}
            </div>

            {/* Add Review Form */}
            {showReviewForm && (
              <form onSubmit={submitReview} className="bg-blue-50 rounded-xl p-6 mb-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4">إضافة تقييمك</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">التقييم</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setNewReview({ ...newReview, rating: star })}
                          className="transition-transform hover:scale-110"
                          data-testid={`rating-star-${star}`}
                        >
                          <Star
                            className={`w-8 h-8 ${star <= newReview.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">التعليق (اختياري)</label>
                    <Textarea
                      value={newReview.comment}
                      onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                      placeholder="شاركنا رأيك في المنتج..."
                      rows={4}
                      data-testid="review-comment"
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700"
                      data-testid="submit-review"
                    >
                      إرسال التقييم
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowReviewForm(false);
                        setNewReview({ rating: 5, comment: '' });
                      }}
                      data-testid="cancel-review"
                    >
                      إلغاء
                    </Button>
                  </div>
                </div>
              </form>
            )}

            {/* Reviews List */}
            {reviews.length === 0 ? (
              <div className="text-center py-12">
                <Star className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 text-lg">لا توجد تقييمات بعد</p>
                <p className="text-gray-400 mt-2">كن أول من يقيّم هذا المنتج</p>
              </div>
            ) : (
              <div className="space-y-6">
                {reviews.map((review) => (
                  <div
                    key={review.id}
                    className="border-b border-gray-200 pb-6 last:border-0"
                    data-testid={`review-${review.id}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-bold text-lg">
                            {review.user_name?.charAt(0) || 'ز'}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{review.user_name || 'زبون'}</p>
                          <div className="flex items-center gap-1">
                            {renderStars(review.rating, 'w-4 h-4')}
                          </div>
                        </div>
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(review.created_at).toLocaleDateString('ar-SY', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                    {review.comment && (
                      <p className="text-gray-700 leading-relaxed">{review.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;