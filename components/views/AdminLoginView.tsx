'use client';

import React, { useState } from 'react';
// ✅ นำเข้า signOut เพิ่มเพื่อใช้เตะคนที่ไม่อยู่ใน Whitelist ออก
import { auth } from '../../lib/firebase';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { Lock, ShieldCheck, ArrowLeft, Loader2, AlertCircle, Mail, Building2 } from 'lucide-react';

interface AdminLoginViewProps {
  setView: (view: string) => void;
  onLoginSuccess: () => void;
}

// 🔐 รายชื่ออีเมลที่ได้รับอนุญาตให้เข้าถึงระบบ (Whitelist)
const ALLOWED_EMAILS = [
  'rawai.cctv@gmail.com',
  'kittinanpolrob@gmail.com'
  // 📝 สามารถเพิ่มอีเมลของเจ้าหน้าที่คนอื่นๆ ที่นี่ได้เลยครับ
];

const AdminLoginView: React.FC<AdminLoginViewProps> = ({ setView, onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const brandGradient = "linear-gradient(90deg, hsla(222, 51%, 34%, 1) 0%, hsla(119, 37%, 45%, 1) 100%)";

  // 🛡️ ฟังก์ชันตรวจสอบอีเมล (Gatekeeper)
  const checkAccess = async (userEmail: string | null) => {
    if (userEmail && ALLOWED_EMAILS.includes(userEmail.toLowerCase())) {
      console.log("✅ Admin Access Granted:", userEmail);
      onLoginSuccess();
    } else {
      console.log("⛔ Unauthorized Access:", userEmail);
      await signOut(auth); // เตะออกจากระบบ Firebase ทันที
      setError(`ปฏิเสธการเข้าถึง: บัญชี ${userEmail || 'นี้'} ไม่มีสิทธิ์ในระบบ`);
      setLoading(false);
    }
  };

  // ✅ ฟังก์ชัน Login ด้วย Google
  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    const provider = new GoogleAuthProvider();
    
    try {
      const result = await signInWithPopup(auth, provider);
      // ส่งอีเมลไปตรวจสอบกับรายชื่อที่อนุญาต
      await checkAccess(result.user.email);
    } catch (err: any) {
      console.error("Google Login Error:", err.code);
      setError('ไม่สามารถเข้าสู่ระบบด้วย Google ได้ กรุณาลองใหม่อีกครั้ง');
      setLoading(false);
    }
  };

  // ✅ ฟังก์ชัน Login ด้วย Email/Password
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      // ส่งอีเมลไปตรวจสอบกับรายชื่อที่อนุญาต
      await checkAccess(result.user.email);
    } catch (err: any) {
      console.error("Email Login Error:", err);
      setError('อีเมลหรือรหัสผ่านไม่ถูกต้องครับ');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md animate-in zoom-in-95 duration-300">
        <button onClick={() => setView('home')} className="mb-8 inline-flex items-center gap-2 text-slate-400 hover:text-slate-600 transition-colors text-sm font-bold group">
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" /> กลับหน้าหลัก
        </button>

        <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden">
          <div className="p-10 text-center bg-slate-50/50 border-b border-slate-100">
            <div className="w-20 h-20 rounded-3xl bg-white shadow-md border border-slate-100 flex items-center justify-center mx-auto mb-6 text-blue-900">
              <Building2 className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Staff Access</h2>
            <p className="text-slate-500 text-[10px] font-black mt-1 uppercase tracking-[0.2em] opacity-70">ระบบจัดการดิจิทัลราไวย์</p>
          </div>

          <div className="p-10 space-y-6">
            {/* 🚨 แจ้งเตือน Error กรณีอีเมลไม่อยู่ใน Whitelist */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 text-red-600 text-xs font-bold animate-in shake">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="leading-relaxed">{error}</p>
              </div>
            )}

            {/* 🔴 ปุ่ม Login ด้วย Google */}
            <button 
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full py-4 bg-white border-2 border-slate-100 rounded-2xl flex items-center justify-center gap-3 hover:bg-slate-50 hover:border-slate-200 transition-all active:scale-95 disabled:opacity-50 shadow-sm"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
              <span className="font-bold text-slate-700">เข้าใช้งานด้วย Gmail</span>
            </button>

            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-slate-100"></div>
              <span className="flex-shrink mx-4 text-[10px] font-black text-slate-300 uppercase">หรือใช้รหัสผ่าน</span>
              <div className="flex-grow border-t border-slate-100"></div>
            </div>

            {/* ฟอร์ม Email/Password */}
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">อีเมลเจ้าหน้าที่</label>
                <div className="relative group">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5 group-focus-within:text-blue-600 transition-colors" />
                  <input required type="email" className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:bg-white outline-none transition-all font-bold text-slate-700" placeholder="admin@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">รหัสผ่าน</label>
                <div className="relative group">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5 group-focus-within:text-blue-600 transition-colors" />
                  <input required type="password" className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:bg-white outline-none transition-all font-bold text-slate-700 tracking-widest" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
              </div>
              <button type="submit" disabled={loading} className="w-full py-5 rounded-2xl text-white font-black text-lg shadow-xl transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 mt-4" style={{ background: brandGradient }}>
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <ShieldCheck className="w-6 h-6" />}
                {loading ? 'กำลังตรวจสอบ...' : 'เข้าสู่ระบบ'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginView;