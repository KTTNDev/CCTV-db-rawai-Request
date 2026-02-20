// components/admin/StatsCards.tsx
import React from 'react';
import { BarChart3, Clock, CheckCircle, XCircle } from 'lucide-react';

// กำหนด Type ของ Props ที่ Component นี้ต้องการ
interface StatsCardsProps {
  requests: any[]; // รับข้อมูลคำร้องทั้งหมดมาคำนวณ
}

export const StatsCards: React.FC<StatsCardsProps> = ({ requests }) => {
  // ✅ Logic การคำนวณตัวเลขสรุป
  const totalCount = requests.length;
  const pendingCount = requests.filter(r => ['pending', 'verifying', 'searching'].includes(r.status)).length;
  const completedCount = requests.filter(r => r.status === 'completed').length;
  const rejectedCount = requests.filter(r => r.status === 'rejected').length;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 md:mb-8">
      {/* 1. คำร้องทั้งหมด */}
      <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3 md:gap-4 transition-all hover:shadow-md">
        <div className="p-2 md:p-3 bg-[#eff6ff] text-blue-600 rounded-xl">
          <BarChart3 className="w-5 h-5 md:w-6 h-6" />
        </div>
        <div>
          <p className="text-[10px] md:text-xs text-slate-500 font-bold uppercase tracking-wider">คำร้องทั้งหมด</p>
          <h3 className="text-xl md:text-2xl font-black text-slate-800">{totalCount}</h3>
        </div>
      </div>

      {/* 2. กำลังดำเนินการ */}
      <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3 md:gap-4 transition-all hover:shadow-md">
        <div className="p-2 md:p-3 bg-amber-50 text-amber-600 rounded-xl">
          <Clock className="w-5 h-5 md:w-6 h-6" />
        </div>
        <div>
          <p className="text-[10px] md:text-xs text-slate-500 font-bold uppercase tracking-wider">กำลังดำเนินการ</p>
          <h3 className="text-xl md:text-2xl font-black text-slate-800">{pendingCount}</h3>
        </div>
      </div>

      {/* 3. เสร็จสิ้นแล้ว */}
      <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3 md:gap-4 transition-all hover:shadow-md">
        <div className="p-2 md:p-3 bg-emerald-50 text-emerald-600 rounded-xl">
          <CheckCircle className="w-5 h-5 md:w-6 h-6" />
        </div>
        <div>
          <p className="text-[10px] md:text-xs text-slate-500 font-bold uppercase tracking-wider">เสร็จสิ้นแล้ว</p>
          <h3 className="text-xl md:text-2xl font-black text-slate-800">{completedCount}</h3>
        </div>
      </div>

      {/* 4. ปฏิเสธ / ยกเลิก */}
      <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3 md:gap-4 transition-all hover:shadow-md">
        <div className="p-2 md:p-3 bg-red-50 text-red-600 rounded-xl">
          <XCircle className="w-5 h-5 md:w-6 h-6" />
        </div>
        <div>
          <p className="text-[10px] md:text-xs text-slate-500 font-bold uppercase tracking-wider">ปฏิเสธ / ยกเลิก</p>
          <h3 className="text-xl md:text-2xl font-black text-slate-800">{rejectedCount}</h3>
        </div>
      </div>
    </div>
  );
};