import React, { useState, useEffect } from 'react';
import { 
  Phone, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2
} from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess: (phone: string, rememberDevice: boolean) => void;
}

const VALID_PHONE = '0964184548';
const VALID_PASSWORD = '0964184548';
const SAVED_CREDS_KEY = 'sode_pro_saved_creds_v1';

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load remembered credentials on device if previously saved
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SAVED_CREDS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.phone) setPhone(parsed.phone);
        if (parsed.password) setPassword(parsed.password);
        if (typeof parsed.rememberDevice === 'boolean') {
          setRememberDevice(parsed.rememberDevice);
        }
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanPhone = phone.replace(/\s+/g, '').trim();
    const cleanPass = password.trim();

    if (!cleanPhone) {
      setError('Vui lòng nhập số điện thoại đăng nhập!');
      return;
    }

    if (!cleanPass) {
      setError('Vui lòng nhập mật khẩu!');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      if (cleanPhone === VALID_PHONE && cleanPass === VALID_PASSWORD) {
        try {
          if (rememberDevice) {
            localStorage.setItem(
              SAVED_CREDS_KEY,
              JSON.stringify({
                phone: cleanPhone,
                password: cleanPass,
                rememberDevice: true,
              })
            );
          } else {
            localStorage.removeItem(SAVED_CREDS_KEY);
          }
        } catch {
          // ignore storage errors
        }
        setIsSubmitting(false);
        onLoginSuccess(cleanPhone, rememberDevice);
      } else {
        setIsSubmitting(false);
        setError('Số điện thoại hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại!');
      }
    }, 250);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
      {/* Ambient Subtle Glow */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden relative z-10 p-6 sm:p-8">
        <div>
          <div className="mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Đăng Nhập Sổ Cược
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Nhập số điện thoại và mật khẩu chủ sổ để truy cập hệ thống
            </p>
          </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-200 flex items-center gap-2.5 text-xs animate-in fade-in duration-150">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Phone Number Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Số Điện Thoại Đăng Nhập
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Nhập SĐT (VD: 0964184548)"
                    autoComplete="username"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white font-mono placeholder-slate-600 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Mật Khẩu Bảo Mật
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Nhập mật khẩu..."
                    autoComplete="current-password"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white font-mono placeholder-slate-600 focus:outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1"
                    title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Device Checkbox */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2.5 cursor-pointer select-none group">
                  <div className="relative flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={rememberDevice}
                      onChange={(e) => setRememberDevice(e.target.checked)}
                      className="sr-only"
                    />
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                        rememberDevice
                          ? 'bg-amber-500 border-amber-400 text-slate-950'
                          : 'bg-slate-950 border-slate-700 group-hover:border-slate-500'
                      }`}
                    >
                      {rememberDevice && <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />}
                    </div>
                  </div>
                  <span className="text-xs font-medium text-slate-300 group-hover:text-white transition-colors">
                    Ghi nhớ đăng nhập trên thiết bị này
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 py-3 px-5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold text-sm rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.99] disabled:opacity-60"
              >
                <span>{isSubmitting ? 'Đang xác thực...' : 'Đăng Nhập Vào Sổ Cược'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
        </div>
      </div>
    </div>
  );
};
