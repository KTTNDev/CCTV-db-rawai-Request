'use client';

import React, { useState } from 'react';
import { Lock, ShieldCheck, ArrowLeft, Loader2, AlertCircle, KeyRound } from 'lucide-react';

interface AdminLoginViewProps {
  setView: (view: string) => void;
  onLoginSuccess: () => void;
}

const AdminLoginView: React.FC<AdminLoginViewProps> = ({ setView, onLoginSuccess }) => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const brandGradient = "linear-gradient(90deg, hsla(222, 51%, 34%, 1) 0%, hsla(119, 37%, 45%, 1) 100%)";

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // ✅ ตรวจสอบรหัสผ่าน (สามารถแก้คำว่า rawai2024 เป็นรหัสที่ต้องการได้)
    setTimeout(() => {
      if (password === 'rawai2024') { 
        onLoginSuccess();
      } else {
        setError('รหัสผ่านไม่ถูกต้อง สำหรับเจ้าหน้าที่เท่านั้น');
        setLoading(false);
      }
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md animate-in zoom-in-95 duration-300">
        <button 
          onClick={() => setView('home')}
          className="mb-8 inline-flex items-center gap-2 text-slate-400 hover:text-slate-600 transition-colors text-sm font-bold group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" /> กลับหน้าหลัก
        </button>

        <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden">
          <div className="p-10 text-center bg-slate-50/50 border-b border-slate-100">
            <div className="w-20 h-20 rounded-3xl bg-white shadow-md border border-slate-100 flex items-center justify-center mx-auto mb-6 text-blue-900">
              <KeyRound className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-black text-slate-900">Staff Access</h2>
            <p className="text-slate-500 text-xs font-bold mt-1 uppercase tracking-widest opacity-70">สำหรับเจ้าหน้าที่เทศบาล</p>
          </div>

          <form onSubmit={handleLogin} className="p-10 space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-sm font-bold animate-in shake">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                {error}
              </div>
            )}
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">รหัสผ่านเข้าใช้งาน</label>
              <input 
                required type="password" 
                className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none transition-all font-bold text-center text-xl tracking-widest"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button 
              type="submit" disabled={loading}
              className="w-full py-4 rounded-2xl text-white font-bold text-lg shadow-xl transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
              style={{ background: brandGradient }}
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
              {loading ? 'กำลังตรวจสอบ...' : 'เข้าสู่ระบบ'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginView;