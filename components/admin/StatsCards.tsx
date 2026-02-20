// components/admin/StatsCards.tsx
import React from 'react';
import { 
  BarChart3, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Users, 
  Activity,
  RefreshCw // ✅ เพิ่มไอคอนรีเฟรช
} from 'lucide-react';

interface StatsCardsProps {
  requests: any[];
  visitorStats: { 
    today: number; 
    total: number; 
  };
  onRefresh: () => void; // ✅ รับฟังก์ชันสำหรับกดรีเฟรช
}

export const StatsCards: React.FC<StatsCardsProps> = ({ requests, visitorStats, onRefresh }) => {
  // 📈 Logic คำนวณคำร้อง CCTV
  const totalCount = requests.length;
  const pendingCount = requests.filter(r => ['pending', 'verifying', 'searching'].includes(r.status)).length;
  const completedCount = requests.filter(r => r.status === 'completed').length;
  const rejectedCount = requests.filter(r => r.status === 'rejected').length;

  return (
    <div className="relative group mb-6 md:mb-8">
      {/* 🔄 ส่วนหัวและปุ่ม Refresh เฉพาะจุด */}
      <div className="flex justify-between items-center mb-4 px-1">
        <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Live Statistics</span>
        </div>
        <button 
          onClick={onRefresh}
          className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-xl hover:border-blue-300 hover:text-blue-600 transition-all duration-300 shadow-sm group/btn active:scale-95"
          title="อัปเดตสถิติ"
        >
          <span className="text-[10px] font-black uppercase hidden sm:block">Refresh Data</span>
          <RefreshCw className="w-3.5 h-3.5 group-hover/btn:rotate-180 transition-transform duration-700" />
        </button>
      </div>

      {/* 📊 แผงสถิติ 6 กล่อง */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        
        {/* 1. คำร้องทั้งหมด */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3 transition-all hover:shadow-md">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">คำร้องทั้งหมด</p>
            <h3 className="text-xl font-black text-slate-800">{totalCount.toLocaleString()}</h3>
          </div>
        </div>

        {/* 2. กำลังดำเนินการ */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3 transition-all hover:shadow-md">
          <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">รอดำเนินการ</p>
            <h3 className="text-xl font-black text-slate-800">{pendingCount.toLocaleString()}</h3>
          </div>
        </div>

        {/* 3. เสร็จสิ้นแล้ว */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3 transition-all hover:shadow-md">
          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">สำเร็จ</p>
            <h3 className="text-xl font-black text-slate-800">{completedCount.toLocaleString()}</h3>
          </div>
        </div>

        {/* 4. ปฏิเสธ / ยกเลิก */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3 transition-all hover:shadow-md">
          <div className="p-2 bg-red-50 text-red-600 rounded-xl">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">ปฏิเสธ</p>
            <h3 className="text-xl font-black text-slate-800">{rejectedCount.toLocaleString()}</h3>
          </div>
        </div>

        {/* 5. ผู้เข้าชมวันนี้ (ดีไซน์เน้นสีสัน) */}
        <div className="bg-emerald-500 p-4 rounded-2xl shadow-lg shadow-emerald-100 flex items-center gap-3 transition-all hover:scale-[1.03]">
          <div className="p-2 bg-white/20 text-white rounded-xl backdrop-blur-md">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-emerald-100 font-bold uppercase tracking-wider">ผู้เข้าชมวันนี้</p>
            <h3 className="text-xl font-black text-white">{visitorStats.today.toLocaleString()}</h3>
          </div>
        </div>

        {/* 6. ยอดสะสมทั้งหมด */}
        <div className="bg-slate-900 p-4 rounded-2xl shadow-lg shadow-slate-200 flex items-center gap-3 transition-all hover:scale-[1.03]">
          <div className="p-2 bg-white/10 text-blue-400 rounded-xl backdrop-blur-md">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">สะสมทั้งหมด</p>
            <h3 className="text-xl font-black text-white">{visitorStats.total.toLocaleString()}</h3>
          </div>
        </div>

      </div>
    </div>
  );
};