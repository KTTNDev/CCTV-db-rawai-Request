'use client';

import React, { useState, useEffect } from 'react';
// ✅ เพิ่ม onSnapshot เพื่อให้หน้านี้โชว์เลขคนเข้าชมแบบ Real-time
import { collection, query, where, getCountFromServer, doc, setDoc, increment, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import AccidentMap from '../ui/AccidentMap';
import LiveCCTVGallery from '../ui/LiveCCTVGallery';


import { 
  Camera, Search, FileText, Upload, CheckCircle, User, Activity, 
  ShieldCheck, Zap, Lock, Settings, LayoutGrid, X, Calendar, 
  MapPinned, Megaphone, Building2, ExternalLink, Globe, Users
} from 'lucide-react';

interface HomeViewProps {
  setView: (view: string) => void;
  onRequestClick: () => void;
}

const HomeView: React.FC<HomeViewProps> = ({ setView, onRequestClick }) => {
  const [stats, setStats] = useState({ total: 0, successRate: 0, pending: 0 });
  const [visitorStats, setVisitorStats] = useState({ today: 0, total: 0 }); // ✅ สถิติผู้เข้าชม
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const brandGradient = "linear-gradient(90deg, hsla(160, 50%, 51%, 1) 0%, hsla(247, 60%, 21%, 1) 100%)";

  const quickLinks = [
    { name: "กิจกรรมราไวย์", url: "https://www.rawai.go.th/event.php", icon: Calendar, color: "bg-orange-500" },
    { name: "Rawai One Map", url: "https://rawai-one-map.web.app/", icon: MapPinned, color: "bg-blue-500" },
    { name: "Traffy Fondue", url: "https://landing.traffy.in.th?key=elqOlHUe", icon: Megaphone, color: "bg-pink-500" },
    { name: "ระบบ E-Office", url: "https://rawai.s.eoffice.go.th/portal/home", icon: Building2, color: "bg-indigo-500" },
    { name: "ศูนย์บริการ OSS", url: "https://www.dla.go.th/land/oss.do", icon: Globe, color: "bg-teal-500" }
  ];

  useEffect(() => {
    if (!db) return;

    // ✅ 1. ระบบดักนับผู้เข้าชม (แก้ไขให้ใช้เวลาประเทศไทย)
    const trackVisit = async () => {
      try {
        const hasVisited = sessionStorage.getItem('rawai_v_2026');
        if (!hasVisited) {
          // ใช้ Format YYYY-MM-DD ตามเวลาท้องถิ่น
          const today = new Date().toLocaleDateString('en-CA'); 
          const dailyRef = doc(db, 'site_analytics', today);
          const globalRef = doc(db, 'site_analytics', 'global_stats');

          await Promise.all([
            setDoc(dailyRef, { visits: increment(1), date: today }, { merge: true }),
            setDoc(globalRef, { totalVisits: increment(1) }, { merge: true })
          ]);
          sessionStorage.setItem('rawai_v_2026', 'true');
        }
      } catch (e) { console.error("Tracking Error:", e); }
    };

    // ✅ 2. ระบบฟังผลสถิติผู้เข้าชมแบบ Real-time เพื่อโชว์ในหน้านี้
    const todayStr = new Date().toLocaleDateString('en-CA');
    const unsubToday = onSnapshot(doc(db, 'site_analytics', todayStr), (docSnap) => {
      if (docSnap.exists()) setVisitorStats(prev => ({ ...prev, today: docSnap.data().visits || 0 }));
    });
    const unsubTotal = onSnapshot(doc(db, 'site_analytics', 'global_stats'), (docSnap) => {
      if (docSnap.exists()) setVisitorStats(prev => ({ ...prev, total: docSnap.data().totalVisits || 0 }));
    });

    // 3. ระบบดึงสถิติคำร้อง CCTV
    const fetchStats = async () => {
      try {
        const coll = collection(db, 'cctv_requests');
        const snapshotTotal = await getCountFromServer(coll);
        const total = snapshotTotal.data().count;
        const qCompleted = query(coll, where('status', '==', 'completed'));
        const snapshotCompleted = await getCountFromServer(qCompleted);
        const rate = total > 0 ? Math.round((snapshotCompleted.data().count / total) * 100) : 0;
        const qPending = query(coll, where('status', 'in', ['pending', 'processing', 'verifying', 'searching']));
        const snapshotPending = await getCountFromServer(qPending);
        setStats({ total, successRate: rate, pending: snapshotPending.data().count });
      } catch (e) { console.error(e); }
    };

    trackVisit();
    fetchStats();
    return () => { unsubToday(); unsubTotal(); };
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50/50 font-sans text-slate-900 selection:bg-teal-100">
      
      {/* 🛠️ Floating Menu (5 รายการ) */}
      <div className="fixed bottom-8 right-8 z-[100] flex flex-col items-end gap-4">
        {isMenuOpen && (
          <div className="mb-2 w-64 bg-white/80 backdrop-blur-2xl rounded-[2.5rem] border border-white shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-300">
            <div className="p-6 bg-slate-900/5 border-b border-slate-100">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Rawai Services</p>
              <h4 className="text-sm font-bold text-slate-800">ทางเข้าบริการอื่นๆ</h4>
            </div>
            <div className="p-3 space-y-1">
              {quickLinks.map((link, idx) => (
                <a key={idx} href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-3 rounded-2xl hover:bg-white hover:shadow-md transition-all group">
                  <div className={`w-10 h-10 rounded-xl ${link.color} text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}><link.icon className="w-5 h-5" /></div>
                  <div className="flex-1 text-left"><p className="text-xs font-black text-slate-700 leading-tight">{link.name}</p><p className="text-[10px] text-slate-400 font-bold uppercase">External Link</p></div>
                  <ExternalLink className="w-3 h-3 text-slate-300" />
                </a>
              ))}
            </div>
          </div>
        )}
        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all active:scale-90 hover:scale-110 text-white" style={{ background: isMenuOpen ? '#0f172a' : brandGradient }}>
          {isMenuOpen ? <X className="w-8 h-8" /> : <LayoutGrid className="w-8 h-8" />}
          {!isMenuOpen && <span className="absolute top-0 right-0 w-4 h-4 bg-red-50 border-2 border-white rounded-full animate-ping"></span>}
        </button>
      </div>

      {/* --- Section: Hero --- */}
      <section className="relative pt-20 pb-32 overflow-hidden bg-white">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10">
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[60%] rounded-full blur-[150px] opacity-20" style={{ background: brandGradient }}></div>
        </div>
        <div className="max-w-6xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-50 border border-teal-100 text-teal-800 text-xs font-bold mb-10 shadow-sm">
            <Zap className="w-3.5 h-3.5 text-teal-600 fill-teal-600" />
            <span>Digital CCTV Service Portal - เทศบาลตำบลราไวย์</span>
          </div>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-slate-900 tracking-tight leading-[1] mb-8">ขอข้อมูลภาพ <br /><span className="text-transparent bg-clip-text" style={{ backgroundImage: brandGradient }}>กล้องวงจรปิด</span></h1>
          <p className="max-w-2xl mx-auto text-slate-500 text-lg md:text-xl leading-relaxed mb-12 font-medium">ยกระดับความปลอดภัยด้วยระบบยื่นคำร้องดิจิทัล สะดวก รวดเร็ว และตรวจสอบได้</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
            <button onClick={onRequestClick} className="group relative w-full sm:w-auto px-10 py-5 rounded-2xl text-white font-bold text-lg shadow-2xl transition-all hover:scale-105 active:scale-95 overflow-hidden" style={{ background: brandGradient }}>
              <div className="flex items-center justify-center gap-3"><Camera className="w-6 h-6" /><span>ยื่นคำร้องออนไลน์</span></div>
            </button>
            <button onClick={() => setView('track')} className="w-full sm:w-auto px-10 py-5 rounded-2xl bg-white text-slate-700 font-bold text-lg border border-slate-200 shadow-sm transition-all hover:bg-slate-50">
              <div className="flex items-center justify-center gap-3"><Search className="w-5 h-5 text-slate-400" /><span>ติดตามสถานะ</span></div>
            </button>
          </div>
        </div>
      </section>

      {/* --- Section: แผนที่ --- */}
      <section className="py-24 bg-slate-50/50 border-y border-slate-100">
        <div className="max-w-6xl mx-auto px-6"><AccidentMap /></div>
        <LiveCCTVGallery /> {/* 👈 เพิ่มตรงนี้ครับ */}
      </section>

      {/* --- Section: สถิติหลัก (CCTV) --- */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="relative p-12 md:p-20 rounded-[3.5rem] overflow-hidden shadow-2xl" style={{ background: brandGradient }}>
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-16 text-white text-center md:text-left">
              <div><p className="text-white/70 text-xs font-black uppercase tracking-widest">เรื่องในระบบ</p><h3 className="text-6xl font-black">{stats.total.toLocaleString()} <span className="text-xl opacity-50">ราย</span></h3></div>
              <div><p className="text-white/70 text-xs font-black uppercase tracking-widest">ความสำเร็จ</p><h3 className="text-6xl font-black">{stats.successRate}%</h3></div>
              <div><p className="text-white/70 text-xs font-black uppercase tracking-widest">กำลังดำเนินการ</p><h3 className="text-6xl font-black">{stats.pending.toLocaleString()} <span className="text-xl opacity-50">ราย</span></h3></div>
            </div>
          </div>
        </div>
      </section>

      {/* --- Section: ท้ายหน้า & สถิติผู้ใช้งาน --- */}
      <section className="py-20 bg-slate-50/50">
        <div className="max-w-4xl mx-auto px-6 text-center">
          
          <div className="flex flex-col md:flex-row items-center gap-10 p-12 bg-white rounded-[3rem] border border-slate-100 shadow-lg text-left mb-16">
            <div className="w-20 h-20 bg-teal-50 rounded-3xl flex items-center justify-center text-teal-600 flex-shrink-0"><ShieldCheck className="w-10 h-10" /></div>
            <div><h4 className="text-2xl font-black text-slate-900">ปกป้องข้อมูลมาตรฐาน PDPA</h4><p className="text-slate-500 font-medium">ข้อมูลของท่านจะได้รับการจัดการอย่างรัดกุมตามกฎหมายความปลอดภัยข้อมูลส่วนบุคคล</p></div>
          </div>

          <div className="pt-12 border-t border-slate-200">
            {/* ✅ แสดงจำนวนผู้เข้าชมแบบ Real-time (ดีไซน์คลีนๆ) */}
            <div className="flex items-center justify-center gap-6 mb-8 text-slate-400">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-[11px] font-black uppercase tracking-widest">เข้าชมวันนี้: {visitorStats.today.toLocaleString()}</span>
              </div>
              <div className="w-px h-3 bg-slate-200"></div>
              <div className="flex items-center gap-2">
                <Globe className="w-3 h-3" />
                <span className="text-[11px] font-black uppercase tracking-widest">สะสมทั้งหมด: {visitorStats.total.toLocaleString()}</span>
              </div>
            </div>

            <button onClick={() => setView('admin-login')} className="flex items-center gap-3 px-8 py-4 bg-white border border-slate-200 text-slate-500 hover:text-slate-900 rounded-2xl transition-all font-bold text-sm mx-auto shadow-sm hover:shadow-md group">
              <Lock className="w-4 h-4 group-hover:text-blue-600" />เจ้าหน้าที่ เข้าสู่ระบบ
            </button>
            <p className="mt-6 text-[10px] text-slate-300 font-bold uppercase tracking-widest">Copyright © 2026 Rawai Municipality CCTV Service Portal</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomeView;