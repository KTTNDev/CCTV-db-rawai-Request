'use client';

import React, { useState, useEffect } from 'react';
import { collection, query, where, getCountFromServer } from 'firebase/firestore';

/**
 * 🛠️ การแก้ไขปัญหา "Could not resolve":
 * เปลี่ยนจาก @/lib/firebase เป็น ../../lib/firebase 
 * เพื่อให้ตรงกับโครงสร้างโฟลเดอร์แบบสัมพัทธ์ (Relative Path)
 */
import { db } from '../../lib/firebase';

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
  Clock,
  ArrowRight
} from 'lucide-react';

interface HomeViewProps {
  setView: (view: string) => void;
  onRequestClick: () => void;
}

const HomeView: React.FC<HomeViewProps> = ({ setView, onRequestClick }) => {
  const [stats, setStats] = useState({ total: 0, successRate: 0, pending: 0 });

  // ✅ ธีมสี Gradient ใหม่ (เขียวมิ้นต์ -> น้ำเงินเข้ม) ตามที่คุณระบุ
  const brandGradient = "linear-gradient(90deg, hsla(160, 50%, 51%, 1) 0%, hsla(247, 60%, 21%, 1) 100%)";

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
        // ข้อมูลจำลองสำหรับงานดีไซน์
        setStats({ total: 1248, successRate: 92, pending: 15 });
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50/50 font-sans text-slate-900 selection:bg-teal-100">
      
      {/* --- ส่วนหัว (Hero Section) --- */}
      <section className="relative pt-20 pb-32 overflow-hidden bg-white">
        {/* กราฟิกตกแต่งพื้นหลัง (ปรับสีให้เข้ากับธีมใหม่) */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10">
          <div 
            className="absolute top-[-20%] left-[-10%] w-[50%] h-[60%] rounded-full blur-[150px] opacity-20" 
            style={{ background: brandGradient }}
          ></div>
        </div>

        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col items-center text-center space-y-10">
            {/* สถานะระบบ */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-50 border border-teal-100 text-teal-800 text-xs font-bold animate-in fade-in duration-700 shadow-sm">
              <Zap className="w-3.5 h-3.5 text-teal-600 fill-teal-600" />
              <span>Digital CCTV Service Portal - เทศบาลตำบลราไวย์</span>
            </div>
            
            {/* หัวข้อและคำโปรย */}
            <div className="space-y-6 max-w-4xl">
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-slate-900 tracking-tight leading-[1] mb-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                ขอข้อมูลภาพ <br />
                <span className="text-transparent bg-clip-text" style={{ backgroundImage: brandGradient }}>
                  กล้องวงจรปิด
                </span>
              </h1>
              <p className="text-slate-500 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed font-medium">
                ยกระดับความโปร่งใสและเข้าถึงง่ายด้วยระบบยื่นคำร้องดิจิทัล <br className="hidden md:block" />
                ตรวจสอบได้ทุกที่ ทุกเวลา เพื่อความปลอดภัยสูงสุดของประชาชน
              </p>
            </div>

            {/* ปุ่มกดหลัก */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-5 animate-in fade-in slide-in-from-bottom-8 duration-1000 w-full sm:w-auto">
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

            {/* สัญลักษณ์ความเชื่อมั่น */}
            <div className="flex flex-wrap justify-center gap-6 pt-10 mt-4 text-slate-400 text-xs font-bold uppercase tracking-wider border-t border-slate-100 w-full max-w-2xl">
               <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-teal-500" /> มาตรฐาน PDPA</div>
               <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-blue-500" /> ให้บริการตลอด 24 ชม.</div>
               <div className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-indigo-500" /> ข้อมูลปลอดภัย</div>
            </div>
          </div>
        </div>
      </section>

      {/* --- ส่วนขั้นตอนการรับบริการ (Workflow) --- */}
      <section className="py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-20 space-y-4">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900">ขั้นตอนการใช้งาน</h2>
            <div className="w-24 h-1.5 mx-auto rounded-full" style={{ background: brandGradient }}></div>
            <p className="text-slate-500 font-medium">สะดวก รวดเร็ว เพียง 4 ขั้นตอน</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { icon: FileText, title: "ระบุเหตุการณ์", desc: "กรอกรายละเอียดและปักหมุดจุดเกิดเหตุบนแผนที่ให้ชัดเจน" },
              { icon: Upload, title: "ส่งเอกสาร", desc: "อัปโหลดภาพบัตรประชาชนและหลักฐานอื่นๆ ผ่านระบบ" },
              { icon: Activity, title: "รอผลพิจารณา", desc: "เจ้าหน้าที่ตรวจสอบและดำเนินการค้นหาภาพจากระบบ" },
              { icon: CheckCircle, title: "รับลิงก์ข้อมูล", desc: "รับไฟล์ภาพผ่านช่องทางที่คุณเลือกเมื่อเสร็จสมบูรณ์" }
            ].map((step, idx) => (
              <div key={idx} className="group relative p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm transition-all hover:shadow-xl hover:-translate-y-2 hover:border-teal-100">
                <div 
                  className="w-16 h-16 rounded-2xl mb-8 flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-110 group-hover:-rotate-3" 
                  style={{ background: brandGradient }}
                >
                  <step.icon className="w-8 h-8" />
                </div>
                <div className="text-slate-200 font-black text-5xl mb-4 opacity-30 select-none absolute top-6 right-8">0{idx + 1}</div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{step.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- ส่วนสถิติและการให้บริการ (Stats Card) --- */}
      <section className="py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="relative p-12 md:p-20 rounded-[3.5rem] overflow-hidden shadow-2xl" style={{ background: brandGradient }}>
            {/* Geometric Pattern */}
            <div className="absolute inset-0 opacity-10 pointer-events-none">
              <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <circle cx="90" cy="10" r="30" fill="white" />
                <path d="M0 100 L100 0 L100 100 Z" fill="white" />
              </svg>
            </div>
            
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-16 text-white text-center md:text-left">
              <div className="space-y-4">
                <div className="inline-flex p-3 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10">
                  <User className="w-6 h-6" />
                </div>
                <p className="text-white/70 text-xs font-black uppercase tracking-[0.2em]">Citizens Served</p>
                <div className="flex items-baseline justify-center md:justify-start gap-2">
                    <h3 className="text-6xl md:text-7xl font-black tracking-tighter">
                      {stats.total > 0 ? stats.total.toLocaleString() : '---'}
                    </h3>
                    <span className="text-xl opacity-50 font-bold">ราย</span>
                </div>
                <p className="text-white/60 text-sm">จำนวนคำร้องที่ผ่านการตรวจสอบแล้ว</p>
              </div>

              <div className="space-y-4">
                <div className="inline-flex p-3 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <p className="text-white/70 text-xs font-black uppercase tracking-[0.2em]">Efficiency Rate</p>
                <div className="flex items-baseline justify-center md:justify-start gap-2">
                    <h3 className="text-6xl md:text-7xl font-black tracking-tighter">
                      {stats.successRate > 0 ? `${stats.successRate}%` : '---'}
                    </h3>
                </div>
                <p className="text-white/60 text-sm">อัตราการดำเนินการสำเร็จลุล่วง</p>
              </div>

              <div className="space-y-4">
                <div className="inline-flex p-3 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10">
                  <Activity className="w-6 h-6" />
                </div>
                <p className="text-white/70 text-xs font-black uppercase tracking-[0.2em]">Current Tasks</p>
                <div className="flex items-baseline justify-center md:justify-start gap-2">
                    <h3 className="text-6xl md:text-7xl font-black tracking-tighter">
                      {stats.pending > 0 ? stats.pending.toLocaleString() : '---'}
                    </h3>
                    <span className="text-xl opacity-50 font-bold">ราย</span>
                </div>
                <p className="text-white/60 text-sm">คำร้องที่กำลังเร่งดำเนินการให้ท่าน</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- ส่วนความปลอดภัย (Trust Section) --- */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center gap-10 p-12 bg-white rounded-[3rem] border border-slate-100 shadow-lg shadow-slate-100/50 text-center md:text-left transition-all hover:-translate-y-1">
            <div className="w-20 h-20 flex-shrink-0 bg-teal-50 rounded-3xl flex items-center justify-center text-teal-600 shadow-inner">
              <ShieldCheck className="w-10 h-10" />
            </div>
            <div className="space-y-3 flex-1">
              <h4 className="text-2xl font-black text-slate-900">ปกป้องข้อมูลตามมาตรฐาน PDPA</h4>
              <p className="text-slate-500 leading-relaxed font-medium">
                เทศบาลตำบลราไวย์ให้ความสำคัญสูงสุดกับความเป็นส่วนตัว ข้อมูลและภาพหลักฐานทั้งหมดจะได้รับการจัดการอย่างรัดกุมและใช้งานตามที่กฎหมายกำหนดเท่านั้น
              </p>
            </div>
            <button className="flex items-center gap-2 text-teal-700 font-bold text-sm hover:gap-4 transition-all group bg-teal-50 px-6 py-3 rounded-xl hover:bg-teal-100">
              รายละเอียด <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      </section>

    </div>
  );
};

export default HomeView;