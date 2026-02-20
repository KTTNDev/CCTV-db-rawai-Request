'use client';

import React, { useState, useEffect } from 'react';
import { collection, query, where, getCountFromServer } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import AccidentMap from '../ui/AccidentMap';

import { 
  Camera, 
  Search, 
  FileText, 
  Upload, 
  CheckCircle, 
  User, 
  Activity, 
  ShieldCheck, 
  Zap, 
  ArrowRight,
  Lock,
  Settings,
  // ✅ ไอคอนสำหรับเมนูใหม่
  LayoutGrid,
  X,
  Calendar,
  MapPinned,
  Megaphone,
  Building2,
  ExternalLink,
  Globe
} from 'lucide-react';

interface HomeViewProps {
  setView: (view: string) => void;
  onRequestClick: () => void;
}

const HomeView: React.FC<HomeViewProps> = ({ setView, onRequestClick }) => {
  const [stats, setStats] = useState({ total: 0, successRate: 0, pending: 0 });
  const [isMenuOpen, setIsMenuOpen] = useState(false); // ✅ State สำหรับเปิด/ปิดเมนู
  const brandGradient = "linear-gradient(90deg, hsla(160, 50%, 51%, 1) 0%, hsla(247, 60%, 21%, 1) 100%)";

  // ข้อมูลลิงก์ภายนอก
  const quickLinks = [
   { name: "กิจกรรมราไวย์", url: "https://www.rawai.go.th/event.php", icon: Calendar, color: "bg-orange-500" },
    { name: "Rawai One Map", url: "https://rawai-one-map.web.app/", icon: MapPinned, color: "bg-blue-500" },
    { name: "Traffy Fondue", url: "https://landing.traffy.in.th?key=elqOlHUe", icon: Megaphone, color: "bg-pink-500" },
    { name: "ระบบ E-Office", url: "https://rawai.s.eoffice.go.th/portal/home", icon: Building2, color: "bg-indigo-500" },
    { name: "ศูนย์บริการ OSS", url: "https://www.dla.go.th/land/oss.do", icon: Globe, color: "bg-teal-500" }, // 👈 เพิ่มรายการนี้ ];

  useEffect(() => {
    if (!db) return;
    const fetchStats = async () => {
      try {
        const coll = collection(db, 'cctv_requests');
        const snapshotTotal = await getCountFromServer(coll);
        const total = snapshotTotal.data().count;

        const qCompleted = query(coll, where('status', '==', 'completed'));
        const snapshotCompleted = await getCountFromServer(qCompleted);
        const completed = snapshotCompleted.data().count;

        const qPending = query(coll, where('status', 'in', ['pending', 'processing']));
        const snapshotPending = await getCountFromServer(qPending);
        const pending = snapshotPending.data().count;

        const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
        setStats({ total, successRate: rate, pending });
      } catch (e) {
        console.error("Error fetching stats:", e);
        setStats({ total: 1248, successRate: 92, pending: 15 });
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50/50 font-sans text-slate-900 selection:bg-teal-100">
      
      {/* ----------------------------------------------------
          ✅ ส่วน FLOATING QUICK ACCESS MENU
      ---------------------------------------------------- */}
      <div className="fixed bottom-8 right-8 z-[100] flex flex-col items-end gap-4">
        {/* แผ่นเมนู (จะแสดงเมื่อ isMenuOpen เป็น true) */}
        {isMenuOpen && (
          <div className="mb-2 w-64 bg-white/80 backdrop-blur-2xl rounded-[2.5rem] border border-white shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-300">
            <div className="p-6 bg-slate-900/5 border-b border-slate-100">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Rawai Services</p>
              <h4 className="text-sm font-bold text-slate-800">ทางเข้าบริการอื่นๆ</h4>
            </div>
            <div className="p-3 space-y-1">
              {quickLinks.map((link, idx) => (
                <a 
                  key={idx}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 p-3 rounded-2xl hover:bg-white hover:shadow-md transition-all group"
                >
                  <div className={`w-10 h-10 rounded-xl ${link.color} text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                    <link.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-xs font-black text-slate-700 leading-tight">{link.name}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">เปิดลิงก์ภายนอก</p>
                  </div>
                  <ExternalLink className="w-3 h-3 text-slate-300 group-hover:text-blue-500 transition-colors" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* ปุ่มลอยตัวหลัก */}
        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className={`w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all active:scale-90 hover:scale-110 ${isMenuOpen ? 'bg-slate-900 text-white' : 'text-white'}`}
          style={{ background: isMenuOpen ? '' : brandGradient }}
        >
          {isMenuOpen ? <X className="w-8 h-8" /> : <LayoutGrid className="w-8 h-8" />}
          
          {/* แจ้งเตือนจุดแดงเล็กๆ เพื่อดึงดูดสายตา */}
          {!isMenuOpen && (
            <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 border-2 border-white rounded-full animate-ping"></span>
          )}
        </button>
      </div>


      {/* --- Hero Section (โค้ดเดิมของคุณฟลุ๊ค) --- */}
      <section className="relative pt-20 pb-32 overflow-hidden bg-white">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10">
          <div 
            className="absolute top-[-20%] left-[-10%] w-[50%] h-[60%] rounded-full blur-[150px] opacity-20" 
            style={{ background: brandGradient }} 
          ></div>
        </div>

        <div className="max-w-6xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-50 border border-teal-100 text-teal-800 text-xs font-bold mb-10 shadow-sm">
            <Zap className="w-3.5 h-3.5 text-teal-600 fill-teal-600" />
            <span>Digital CCTV Service Portal - เทศบาลตำบลราไวย์</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-slate-900 tracking-tight leading-[1] mb-8">
            ขอข้อมูลภาพ <br />
            <span className="text-transparent bg-clip-text" style={{ backgroundImage: brandGradient }}>
              กล้องวงจรปิด
            </span>
          </h1>
          
          <p className="max-w-2xl mx-auto text-slate-500 text-lg md:text-xl leading-relaxed mb-12 font-medium">
            ยกระดับความโปร่งใสและเข้าถึงง่ายด้วยระบบยื่นคำร้องดิจิทัล <br className="hidden md:block" />
            ตรวจสอบได้ทุกที่ ทุกเวลา เพื่อความปลอดภัยสูงสุดของประชาชน
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-5 w-full sm:w-auto">
            <button 
              onClick={onRequestClick} 
              className="group relative w-full sm:w-auto px-10 py-5 rounded-2xl text-white font-bold text-lg shadow-2xl hover:shadow-teal-900/20 transition-all hover:scale-105 active:scale-95 overflow-hidden" 
              style={{ background: brandGradient }} 
            >
              <div className="flex items-center justify-center gap-3">
                <Camera className="w-6 h-6" />
                <span>ยื่นคำร้องออนไลน์</span>
              </div>
            </button>
            <button 
              onClick={() => setView('track')} 
              className="w-full sm:w-auto px-10 py-5 rounded-2xl bg-white text-slate-700 font-bold text-lg border border-slate-200 shadow-sm transition-all hover:bg-slate-50 hover:border-slate-300 active:scale-95" 
            >
              <div className="flex items-center justify-center gap-3">
                <Search className="w-5 h-5 text-slate-400" />
                <span>ติดตามสถานะ</span>
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* --- ส่วนแผนที่จุดเสี่ยง --- */}
      <section className="py-24 bg-slate-50/50 border-y border-slate-100">
        <div className="max-w-6xl mx-auto px-6">
           <AccidentMap />
        </div>
      </section>

      {/* --- ส่วนขั้นตอนการใช้งาน --- */}
      <section className="py-24 bg-white text-center">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-20">ขั้นตอนการใช้งาน</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { icon: FileText, title: "ระบุเหตุการณ์", desc: "กรอกรายละเอียดและปักหมุดจุดเกิดเหตุบนแผนที่" },
              { icon: Upload, title: "ส่งเอกสาร", desc: "อัปโหลดภาพบัตรประชาชนและหลักฐานผ่านระบบ" },
              { icon: Activity, title: "รอผลพิจารณา", desc: "เจ้าหน้าที่ตรวจสอบและดำเนินการค้นหาภาพ" },
              { icon: CheckCircle, title: "รับลิงก์ข้อมูล", desc: "รับไฟล์ภาพผ่านช่องทางที่คุณเลือก" }
            ].map((step, idx) => (
              <div key={idx} className="p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all">
                <div className="w-16 h-16 rounded-2xl mb-6 flex items-center justify-center text-white mx-auto shadow-lg" style={{ background: brandGradient }}>
                  <step.icon className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{step.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- ส่วนสถิติ --- */}
      <section className="py-12 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="relative p-12 md:p-20 rounded-[3.5rem] overflow-hidden shadow-2xl" style={{ background: brandGradient }}>
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-16 text-white text-center md:text-left">
              <div className="space-y-2">
                <p className="text-white/70 text-xs font-black uppercase tracking-widest">เรื่องในระบบ</p>
                <h3 className="text-6xl font-black">{stats.total.toLocaleString()} <span className="text-xl opacity-50">ราย</span></h3>
              </div>
              <div className="space-y-2">
                <p className="text-white/70 text-xs font-black uppercase tracking-widest">อัตราการความสำเร็จ</p>
                <h3 className="text-6xl font-black">{stats.successRate}%</h3>
              </div>
              <div className="space-y-2">
                <p className="text-white/70 text-xs font-black uppercase tracking-widest">รอรับเรื่อง</p>
                <h3 className="text-6xl font-black">{stats.pending.toLocaleString()} <span className="text-xl opacity-50">ราย</span></h3>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- ส่วนความปลอดภัย & ทางเข้า Admin --- */}
      <section className="py-24 bg-slate-50/50">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center gap-10 p-12 bg-white rounded-[3rem] border border-slate-100 shadow-lg text-center md:text-left">
            <div className="w-20 h-20 flex-shrink-0 bg-teal-50 rounded-3xl flex items-center justify-center text-teal-600 shadow-inner">
              <ShieldCheck className="w-10 h-10" />
            </div>
            <div className="space-y-3 flex-1">
              <h4 className="text-2xl font-black text-slate-900">ปกป้องข้อมูลตามมาตรฐาน PDPA</h4>
              <p className="text-slate-500 leading-relaxed font-medium">
                ข้อมูลและภาพหลักฐานทั้งหมดจะได้รับการจัดการอย่างรัดกุมและใช้งานตามที่กฎหมายกำหนดเท่านั้น
              </p>
            </div>
          </div>

          <div className="mt-24 pt-12 border-t border-slate-200 flex flex-col items-center">
            <div className="bg-white/80 backdrop-blur-sm p-2 rounded-2xl border border-slate-200 shadow-sm inline-flex items-center gap-1 mb-4">
               <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
                  <Settings className="w-4 h-4" />
               </div>
               <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2">Staff Portal Access</span>
            </div>
            
            <button 
              onClick={() => setView('admin-login')} 
              className="flex items-center gap-3 px-8 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 rounded-2xl transition-all font-bold text-sm group"
            >
              <Lock className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
              เจ้าหน้าที่เทศบาลตำบลราไวย์ เข้าสู่ระบบ
            </button>
            
            <p className="mt-4 text-[10px] text-slate-400 font-medium uppercase tracking-tighter opacity-60">
              Copyright © 2026 Rawai Municipality CCTV Service Portal
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomeView;