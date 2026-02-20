// components/admin/FilterBar.tsx
import React from 'react';
import { 
  Search, Filter, Activity, ChevronRight, 
  Calendar, FilterX 
} from 'lucide-react';

// กำหนด Type ของ Props สำหรับตัวกรอง
interface FilterBarProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  filterStatus: string;
  setFilterStatus: (val: string) => void;
  filterEventType: string;
  setFilterEventType: (val: string) => void;
  startDate: string;
  setStartDate: (val: string) => void;
  endDate: string;
  setEndDate: (val: string) => void;
  isFiltering: boolean;
  clearFilters: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  searchQuery, setSearchQuery,
  filterStatus, setFilterStatus,
  filterEventType, setFilterEventType,
  startDate, setStartDate,
  endDate, setEndDate,
  isFiltering, clearFilters
}) => {
  return (
    <div className="bg-white p-4 md:p-6 rounded-2xl md:rounded-[2rem] border border-slate-200 shadow-sm flex flex-col gap-4 mb-6 md:mb-8">
      {/* ส่วนค้นหาและตัวเลือกหลัก */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4">
        {/* ช่องค้นหาชื่อ/เบอร์/ID */}
        <div className="relative md:col-span-4 lg:col-span-5">
          <Search className="absolute left-4 md:left-5 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 h-5 text-slate-300" />
          <input 
            type="text" 
            placeholder="ค้นหาชื่อ, เบอร์โทร หรือ ID..." 
            className="w-full pl-11 md:pl-12 pr-4 py-3 md:py-3.5 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-blue-50 outline-none transition-all font-medium text-slate-800 text-sm" 
            value={searchQuery} 
            onChange={e => setSearchQuery(e.target.value)} 
          />
        </div>
        
        {/* ตัวเลือกสถานะ */}
        <div className="relative md:col-span-4 lg:col-span-3">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <select 
            className="w-full pl-10 pr-10 py-3 md:py-3.5 bg-slate-50 border border-slate-100 rounded-xl font-bold text-slate-700 appearance-none cursor-pointer hover:bg-slate-100 transition-colors outline-none text-sm" 
            value={filterStatus} 
            onChange={e => setFilterStatus(e.target.value)}
          >
            <option value="all">สถานะทั้งหมด</option>
            <option value="pending">รอตรวจสอบ</option>
            <option value="verifying">ตรวจเอกสาร</option>
            <option value="searching">ค้นหาภาพ</option>
            <option value="completed">เสร็จสิ้น</option>
            <option value="rejected">ปฏิเสธแล้ว</option>
          </select>
          <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 rotate-90 pointer-events-none" />
        </div>

        {/* ตัวเลือกประเภทเหตุการณ์ */}
        <div className="relative md:col-span-4 lg:col-span-4">
          <Activity className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <select 
            className="w-full pl-10 pr-10 py-3 md:py-3.5 bg-slate-50 border border-slate-100 rounded-xl font-bold text-slate-700 appearance-none cursor-pointer hover:bg-slate-100 transition-colors outline-none text-sm" 
            value={filterEventType} 
            onChange={e => setFilterEventType(e.target.value)}
          >
            <option value="all">ประเภทเหตุการณ์ทั้งหมด</option>
            <option value="ACCIDENT">🚗 อุบัติเหตุจราจร</option>
            <option value="THEFT">🔓 การโจรกรรม / ลักทรัพย์</option>
            <option value="VANDALISM">🔨 การทำลายทรัพย์สิน</option>
            <option value="DISPUTE">⚖️ ข้อพิพาท / ทะเลาะวิวาท</option>
            <option value="OTHER">📋 อื่นๆ</option>
          </select>
          <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 rotate-90 pointer-events-none" />
        </div>
      </div>

      {/* ส่วนกรองวันที่และปุ่มล้างตัวกรอง */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between border-t border-slate-100 pt-4 mt-2">
        <div className="flex flex-col sm:flex-row gap-3 md:gap-4 w-full md:w-auto items-center">
           <span className="text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
             <Calendar className="w-4 h-4 inline mb-0.5 mr-1"/> วันที่ยื่นเรื่อง :
           </span>
           <div className="flex items-center gap-2 w-full sm:w-auto">
             <input 
               type="date" 
               className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 w-full sm:w-auto" 
               value={startDate} 
               onChange={e => setStartDate(e.target.value)} 
             />
             <span className="text-slate-400 font-bold">-</span>
             <input 
               type="date" 
               className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 w-full sm:w-auto" 
               value={endDate} 
               onChange={e => setEndDate(e.target.value)} 
             />
           </div>
        </div>
        
        {/* ปุ่มล้างการค้นหา (จะแสดงเมื่อมีการกรองข้อมูลเท่านั้น) */}
        {isFiltering && (
          <button 
            onClick={clearFilters} 
            className="flex items-center justify-center gap-2 text-xs font-bold text-red-500 hover:text-red-700 hover:bg-red-50 px-5 py-2.5 rounded-xl transition-all w-full md:w-auto border border-transparent hover:border-red-100"
          >
             <FilterX className="w-4 h-4" /> ล้างตัวกรองทั้งหมด
          </button>
        )}
      </div>
    </div>
  );
};