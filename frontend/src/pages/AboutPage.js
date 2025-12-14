import { Link } from 'react-router-dom';
import { ShoppingCart, Truck, Shield, MapPin, Phone, Mail, Instagram, Clock, Award } from 'lucide-react';

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-emerald-600 text-white py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="inline-block p-4 bg-white/20 rounded-full mb-6">
            <ShoppingCart className="w-16 h-16" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">سوق سوريا</h1>
          <p className="text-xl sm:text-2xl text-emerald-100 max-w-2xl mx-auto">
            منصة التجارة الإلكترونية الرائدة في سوريا
          </p>
          <div className="flex items-center justify-center gap-2 mt-4">
            <Award className="w-6 h-6 text-yellow-300" />
            <span className="text-lg font-semibold">✅ متجر موثوق ومعتمد</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* About Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">من نحن</h2>
          <div className="bg-gray-50 rounded-2xl p-6 sm:p-8">
            <p className="text-lg text-gray-700 leading-relaxed mb-4">
              <strong>سوق سوريا</strong> هي منصة تجارة إلكترونية متعددة البائعين تهدف إلى توفير تجربة تسوق سهلة وآمنة للعملاء في سوريا. 
              نوفر آلاف المنتجات من ملابس، أحذية، إلكترونيات، منتجات منزلية، وأكثر من ذلك بكثير.
            </p>
            <p className="text-lg text-gray-700 leading-relaxed mb-4">
              نحن نعمل مع متاجر موثوقة ومعتمدة لضمان جودة المنتجات وسرعة التوصيل. 
              رؤيتنا هي أن نصبح الوجهة الأولى للتسوق الإلكتروني في سوريا.
            </p>
            <div className="flex items-center gap-3 mt-6 bg-emerald-50 p-4 rounded-lg border-r-4 border-emerald-600">
              <Award className="w-12 h-12 text-emerald-600 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-gray-900 mb-1">متجر موثوق ومعتمد</h3>
                <p className="text-sm text-gray-600">
                  جميع البائعين لدينا يخضعون لمعايير صارمة للجودة والموثوقية. حسابنا على Instagram موثق ومعتمد.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">خدماتنا</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {/* Delivery Service */}
            <div className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-emerald-500 transition">
              <div className="inline-block p-3 bg-emerald-100 rounded-full mb-4">
                <Truck className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">التوصيل السريع</h3>
              <p className="text-gray-600 mb-4">
                نوفر خدمة توصيل سريعة إلى جميع المحافظات السورية. التوصيل يتم خلال 2-5 أيام عمل حسب الموقع.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-green-600" />
                  دمشق وريفها: 1-2 يوم
                </li>
                <li className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-green-600" />
                  باقي المحافظات: 3-5 أيام
                </li>
                <li className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-emerald-600" />
                  تتبع الشحنة عبر رقم الطلب
                </li>
              </ul>
            </div>

            {/* Secure Shopping */}
            <div className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-emerald-500 transition">
              <div className="inline-block p-3 bg-emerald-100 rounded-full mb-4">
                <Shield className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">تسوق آمن</h3>
              <p className="text-gray-600 mb-4">
                نضمن لك تجربة تسوق آمنة ومحمية. جميع المعاملات مشفرة وبياناتك محمية بالكامل.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-green-600" />
                  حماية كاملة للبيانات
                </li>
                <li className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-green-600" />
                  دفع آمن عند الاستلام
                </li>
                <li className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-green-600" />
                  ضمان استرجاع الأموال
                </li>
              </ul>
            </div>

            {/* Customer Support */}
            <div className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-emerald-500 transition">
              <div className="inline-block p-3 bg-emerald-100 rounded-full mb-4">
                <Phone className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">خدمة العملاء</h3>
              <p className="text-gray-600 mb-4">
                فريق خدمة العملاء لدينا جاهز لمساعدتك في أي وقت. تواصل معنا عبر الهاتف أو البريد الإلكتروني.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-emerald-600" />
                  +963 11 1234567
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-emerald-600" />
                  trendsyria926@gmail.com
                </li>
                <li className="flex items-center gap-2">
                  <Instagram className="w-4 h-4 text-emerald-600" />
                  @trend.syria.offical ✅
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Location Section with Google Maps */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">موقعنا</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <div className="bg-gray-50 rounded-xl p-6 mb-6">
                <div className="flex items-start gap-4 mb-4">
                  <MapPin className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-gray-900 mb-2">العنوان الرئيسي</h3>
                    <p className="text-gray-700">دمشق - المزة - شارع الجلاء</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 mb-4">
                  <Phone className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-gray-900 mb-2">الهاتف</h3>
                    <p className="text-gray-700 dir-ltr text-right">+963 11 1234567</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Clock className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-gray-900 mb-2">ساعات العمل</h3>
                    <p className="text-gray-700">السبت - الخميس: 9:00 ص - 8:00 م</p>
                    <p className="text-gray-700">الجمعة: مغلق</p>
                  </div>
                </div>
              </div>

              <div className="bg-emerald-50 rounded-xl p-6 border-r-4 border-emerald-600">
                <div className="flex items-center gap-3 mb-3">
                  <Instagram className="w-6 h-6 text-emerald-600" />
                  <Award className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">حساب Instagram موثق ✅</h3>
                <p className="text-gray-700 mb-3">
                  تابعنا على Instagram لآخر العروض والمنتجات الجديدة. حسابنا معتمد وموثق.
                </p>
                <a
                  href="https://www.instagram.com/trend.syria.offical"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-emerald-600 font-semibold hover:text-emerald-700 transition"
                >
                  <Instagram className="w-5 h-5" />
                  @trend.syria.offical
                  <Award className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Google Maps Embed */}
            <div className="rounded-xl overflow-hidden shadow-lg h-[400px]">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3325.3582!2d36.2765!3d33.5138!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x1518e6dc413cc6a7%3A0x6b9f66ebd1e394f2!2sDamascus%2C%20Syria!5e0!3m2!1sen!2s!4v1234567890"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="موقع سوق سوريا على الخريطة"
              ></iframe>
            </div>
          </div>
        </section>

        {/* Why Choose Us */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">لماذا تختار سوق سوريا؟</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="inline-block p-4 bg-emerald-100 rounded-full mb-4">
                <Award className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">موثوق ومعتمد</h3>
              <p className="text-sm text-gray-600">جميع البائعين معتمدين وموثوقين</p>
            </div>
            <div className="text-center">
              <div className="inline-block p-4 bg-emerald-100 rounded-full mb-4">
                <Truck className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">توصيل سريع</h3>
              <p className="text-sm text-gray-600">توصيل إلى جميع المحافظات</p>
            </div>
            <div className="text-center">
              <div className="inline-block p-4 bg-emerald-100 rounded-full mb-4">
                <Shield className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">دفع آمن</h3>
              <p className="text-sm text-gray-600">حماية كاملة لمعاملاتك</p>
            </div>
            <div className="text-center">
              <div className="inline-block p-4 bg-emerald-100 rounded-full mb-4">
                <Phone className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">دعم 24/7</h3>
              <p className="text-sm text-gray-600">فريق خدمة العملاء جاهز دائماً</p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl p-8 sm:p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">ابدأ التسوق الآن!</h2>
          <p className="text-xl text-emerald-100 mb-8 max-w-2xl mx-auto">
            اكتشف آلاف المنتجات من متاجر موثوقة وموثقة
          </p>
          <Link
            to="/"
            className="inline-block bg-white text-emerald-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition shadow-lg"
          >
            تصفح المنتجات →
          </Link>
        </section>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white mt-20 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-400">© 2025 سوق سوريا. جميع الحقوق محفوظة.</p>
        </div>
      </footer>
    </div>
  );
};

export default AboutPage;
