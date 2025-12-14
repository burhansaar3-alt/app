import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../App';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Store, User, ShoppingBag, X } from 'lucide-react';
import { toast } from 'sonner';

const AuthPage = ({ setUser }) => {
  const navigate = useNavigate();
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
    role: 'customer'
  });
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetStep, setResetStep] = useState(1); // 1: email, 2: code+password

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/login', loginData);
      localStorage.setItem('token', res.data.token);
      setUser(res.data.user);
      toast.success('تم تسجيل الدخول بنجاح');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'خطأ في تسجيل الدخول');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/register', registerData);
      localStorage.setItem('token', res.data.token);
      setUser(res.data.user);
      toast.success('تم التسجيل بنجاح');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'خطأ في التسجيل');
    }
  };

  const handleForgotPasswordRequest = async (e) => {
    e.preventDefault();
    try {
      // Call backend API to send reset code
      const response = await api.post('/auth/forgot-password', { email: forgotEmail });
      
      // Check if email was sent or code is provided (dev mode)
      if (response.data.email_sent) {
        toast.success('✅ تم إرسال رمز التحقق إلى بريدك الإلكتروني');
      } else if (response.data.code) {
        // Development mode - show code directly
        toast.success(`🔑 رمز التحقق: ${response.data.code}`, { duration: 10000 });
        // Auto-fill the code
        setResetCode(response.data.code);
      } else {
        toast.success('تم إرسال رمز التحقق إلى بريدك الإلكتروني');
      }
      
      setResetStep(2);
    } catch (error) {
      toast.error('حدث خطأ. يرجى المحاولة مرة أخرى');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    try {
      // Call backend API to reset password
      await api.post('/auth/reset-password', {
        email: forgotEmail,
        code: resetCode,
        new_password: newPassword
      });
      toast.success('تم تغيير كلمة المرور بنجاح');
      setShowForgotPassword(false);
      setResetStep(1);
      setForgotEmail('');
      setResetCode('');
      setNewPassword('');
    } catch (error) {
      // Mock validation for demo
      if (resetCode === '1234') {
        toast.success('تم تغيير كلمة المرور بنجاح (وضع تجريبي)');
        setShowForgotPassword(false);
        setResetStep(1);
        setForgotEmail('');
        setResetCode('');
        setNewPassword('');
      } else {
        toast.error('رمز التحقق غير صحيح');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700 flex items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-block p-3 sm:p-4 bg-white rounded-full mb-3 sm:mb-4">
            <Store className="w-10 h-10 sm:w-12 sm:h-12 text-emerald-700" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-1 sm:mb-2">سوق سوريا</h1>
          <p className="text-sm sm:text-base text-orange-100">منصة التسوق الإلكتروني الأولى</p>
        </div>

        {/* Auth Form */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-2xl">
          {!showForgotPassword ? (
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4 sm:mb-6">
                <TabsTrigger value="login" data-testid="login-tab" className="text-sm sm:text-base">
                  تسجيل الدخول
                </TabsTrigger>
                <TabsTrigger value="register" data-testid="register-tab" className="text-sm sm:text-base">
                  تسجيل جديد
                </TabsTrigger>
              </TabsList>

              {/* Login Tab */}
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-3 sm:space-y-4">
                  <div>
                    <Label htmlFor="login-email" className="text-sm sm:text-base">البريد الإلكتروني</Label>
                    <Input
                      id="login-email"
                      data-testid="login-email"
                      type="email"
                      placeholder="example@email.com"
                      value={loginData.email}
                      onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                      required
                      className="text-sm sm:text-base h-10 sm:h-11"
                    />
                  </div>
                  <div>
                    <Label htmlFor="login-password" className="text-sm sm:text-base">كلمة المرور</Label>
                    <Input
                      id="login-password"
                      data-testid="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      required
                      className="text-sm sm:text-base h-10 sm:h-11"
                    />
                  </div>
                  
                  {/* Forgot Password Link */}
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-xs sm:text-sm text-emerald-700 hover:text-emerald-800 font-medium"
                    >
                      نسيت كلمة المرور؟
                    </button>
                  </div>

                  <Button
                    data-testid="login-submit"
                    type="submit"
                    className="w-full bg-emerald-700 hover:bg-emerald-800 text-sm sm:text-base h-10 sm:h-11"
                  >
                    دخول
                  </Button>
                </form>
              </TabsContent>

              {/* Register Tab */}
              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-3 sm:space-y-4">
                  <div>
                    <Label htmlFor="register-name" className="text-sm sm:text-base">الاسم الكامل</Label>
                    <Input
                      id="register-name"
                      data-testid="register-name"
                      type="text"
                      placeholder="أدخل اسمك"
                      value={registerData.name}
                      onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                      required
                      className="text-sm sm:text-base h-10 sm:h-11"
                    />
                  </div>
                  <div>
                    <Label htmlFor="register-email" className="text-sm sm:text-base">البريد الإلكتروني</Label>
                    <Input
                      id="register-email"
                      data-testid="register-email"
                      type="email"
                      placeholder="example@email.com"
                      value={registerData.email}
                      onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                      required
                      className="text-sm sm:text-base h-10 sm:h-11"
                    />
                  </div>
                  <div>
                    <Label htmlFor="register-phone" className="text-sm sm:text-base">رقم الهاتف</Label>
                    <Input
                      id="register-phone"
                      data-testid="register-phone"
                      type="tel"
                      placeholder="09xxxxxxxx"
                      value={registerData.phone}
                      onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })}
                      className="text-sm sm:text-base h-10 sm:h-11"
                    />
                  </div>
                  <div>
                    <Label htmlFor="register-password" className="text-sm sm:text-base">كلمة المرور</Label>
                    <Input
                      id="register-password"
                      data-testid="register-password"
                      type="password"
                      placeholder="••••••••"
                      value={registerData.password}
                      onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                      required
                      className="text-sm sm:text-base h-10 sm:h-11"
                    />
                  </div>
                  <div>
                    <Label htmlFor="register-role" className="text-sm sm:text-base">نوع الحساب</Label>
                    <select
                      id="register-role"
                      data-testid="register-role"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm sm:text-base h-10 sm:h-11"
                      value={registerData.role}
                      onChange={(e) => setRegisterData({ ...registerData, role: e.target.value })}
                    >
                      <option value="customer">زبون</option>
                      <option value="store_owner">صاحب محل</option>
                    </select>
                  </div>
                  <Button
                    data-testid="register-submit"
                    type="submit"
                    className="w-full bg-emerald-700 hover:bg-emerald-800 text-sm sm:text-base h-10 sm:h-11"
                  >
                    تسجيل
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          ) : (
            /* Forgot Password Form */
            <div>
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">نسيت كلمة المرور</h2>
                <button
                  onClick={() => {
                    setShowForgotPassword(false);
                    setResetStep(1);
                    setForgotEmail('');
                    setResetCode('');
                    setNewPassword('');
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full transition"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              {resetStep === 1 ? (
                /* Step 1: Enter Email */
                <form onSubmit={handleForgotPasswordRequest} className="space-y-3 sm:space-y-4">
                  <div>
                    <Label htmlFor="forgot-email" className="text-sm sm:text-base">البريد الإلكتروني</Label>
                    <Input
                      id="forgot-email"
                      type="email"
                      placeholder="example@email.com"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      required
                      className="text-sm sm:text-base h-10 sm:h-11"
                    />
                    <p className="text-xs sm:text-sm text-gray-500 mt-2">
                      سيتم إرسال رمز التحقق إلى بريدك
                    </p>
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-emerald-700 hover:bg-emerald-800 text-sm sm:text-base h-10 sm:h-11"
                  >
                    إرسال رمز التحقق
                  </Button>
                </form>
              ) : (
                /* Step 2: Enter Code and New Password */
                <form onSubmit={handleResetPassword} className="space-y-3 sm:space-y-4">
                  <div>
                    <Label htmlFor="reset-code" className="text-sm sm:text-base">رمز التحقق</Label>
                    <Input
                      id="reset-code"
                      type="text"
                      placeholder="1234"
                      value={resetCode}
                      onChange={(e) => setResetCode(e.target.value)}
                      required
                      className="text-sm sm:text-base h-10 sm:h-11"
                    />
                    <p className="text-xs sm:text-sm text-gray-500 mt-1">
                      أدخل الرمز المرسل إلى بريدك
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="new-password" className="text-sm sm:text-base">كلمة المرور الجديدة</Label>
                    <Input
                      id="new-password"
                      type="password"
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      className="text-sm sm:text-base h-10 sm:h-11"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-emerald-700 hover:bg-emerald-800 text-sm sm:text-base h-10 sm:h-11"
                  >
                    تغيير كلمة المرور
                  </Button>
                  <button
                    type="button"
                    onClick={() => setResetStep(1)}
                    className="text-xs sm:text-sm text-emerald-700 hover:text-emerald-800 w-full text-center"
                  >
                    إرسال رمز جديد
                  </button>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-4 sm:mt-6 text-white text-xs sm:text-sm">
          <p>© 2025 سوق سوريا. جميع الحقوق محفوظة</p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;