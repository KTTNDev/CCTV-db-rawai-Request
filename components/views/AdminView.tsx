'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { LayoutDashboard, LogOut, BarChart3, Loader2 } from 'lucide-react';

// ✅ 1. Import Components ย่อยที่แยกไว้
import { StatsCards } from '../admin/StatsCards';
import { FilterBar } from '../admin/FilterBar';
import { RequestTable } from '../admin/RequestTable';
import { MobileCardList } from '../admin/MobileCardList';
import { DetailModal } from '../admin/DetailModal';
import { ReportModal } from '../admin/ReportModal';
import { Pagination } from '../admin/Pagination';

// ✅ 2. Import Helpers และตัวแปลภาษา
import { STATUS_TH, EVENT_TYPE_TH, COLORS } from '../admin/utils/formatters';
import { Clock, ShieldCheck, Search as SearchIcon, CheckCircle, XCircle } from 'lucide-react';

interface AdminViewProps {
  onLogout: () => void;
}

const AdminView: React.FC<AdminViewProps> = ({ onLogout }) => {
  // ---------------------------------------------------------
  // 3. States Management
  // ---------------------------------------------------------
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterEventType, setFilterEventType] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showReport, setShowReport] = useState(false);

  // ---------------------------------------------------------
  // 4. Firebase Real-time Listener
  // ---------------------------------------------------------
  useEffect(() => {
    if (!db) return;
    const q = collection(db, 'cctv_requests');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRequests(data.sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
      setLoading(false);
    }, (error) => {
      console.error("Firestore Error:", error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // ---------------------------------------------------------
  // 5. Data Processing (Filtering, Stats & Pagination)
  // ---------------------------------------------------------
  
  // ✅ 5.1 บล็อกกรองข้อมูลตามเงื่อนไขที่เลือก
  const filteredRequests = useMemo(() => {
    return requests.filter(req => {
      const matchesStatus = filterStatus === 'all' || req.status === filterStatus;
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = (req.name || '').toLowerCase().includes(searchLower) || 
                            (req.trackingId || '').toLowerCase().includes(searchLower) || 
                            (req.phone || '').includes(searchLower);
      const matchesEventType = filterEventType === 'all' || req.eventType === filterEventType;

      let matchesDate = true;
      if (startDate || endDate) {
        if (req.createdAt?.seconds) {
          const reqDate = new Date(req.createdAt.seconds * 1000);
          reqDate.setHours(0, 0, 0, 0);
          if (startDate && reqDate < new Date(new Date(startDate).setHours(0,0,0,0))) matchesDate = false;
          if (endDate && reqDate > new Date(new Date(endDate).setHours(23,59,59,999))) matchesDate = false;
        } else { matchesDate = false; }
      }
      return matchesStatus && matchesSearch && matchesEventType && matchesDate;
    });
  }, [requests, filterStatus, searchQuery, filterEventType, startDate, endDate]);

  // ✅ 5.2 คำนวณสถิติสำหรับรายงาน (แปลเป็นภาษาไทยให้เรียบร้อย)
  const reportData = useMemo(() => {
    const eventCounts: any = {};
    const statusCounts: any = {};
    
    filteredRequests.forEach(req => {
        const eventLabel = EVENT_TYPE_TH[req.eventType || 'OTHER'] || '📋 อื่นๆ';
        const statusLabel = STATUS_TH[req.status] || req.status;
        
        eventCounts[eventLabel] = (eventCounts[eventLabel] || 0) + 1;
        statusCounts[statusLabel] = (statusCounts[statusLabel] || 0) + 1;
    });

    return {
        chartData: Object.keys(eventCounts).map(name => ({ name, value: eventCounts[name] })),
        pieData: Object.keys(statusCounts).map(name => ({ name, value: statusCounts[name] }))
    };
  }, [filteredRequests]);

  // ✅ 5.3 คำนวณตัวแปรสำหรับ Pagination
  const totalItems = filteredRequests.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRequests = filteredRequests.slice(startIndex, startIndex + itemsPerPage);

  // ---------------------------------------------------------
  // 6. UI Helpers
  // ---------------------------------------------------------
  const getStatusConfig = (status: string) => {
    const configs: any = {
      pending: { color: 'bg-orange-100 text-orange-700 border-orange-200', icon: Clock, label: 'รอตรวจสอบ', cardClass: 'bg-orange-50/50 border-orange-200 shadow-orange-100/50', rowClass: 'bg-orange-50/60 hover:bg-orange-100/60' },
      verifying: { color: 'bg-blue-100 text-blue-700 border-blue-200', icon: ShieldCheck, label: 'ตรวจเอกสาร', cardClass: 'bg-[#eff6ff]/40 border-blue-100', rowClass: 'bg-[#eff6ff]/40 hover:bg-[#eff6ff]/80' },
      searching: { color: 'bg-indigo-100 text-indigo-700 border-indigo-200', icon: SearchIcon, label: 'กำลังหาภาพ', cardClass: 'bg-indigo-50/40 border-indigo-100', rowClass: 'bg-indigo-50/40 hover:bg-indigo-50/80' },
      completed: { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle, label: 'เสร็จสิ้น', cardClass: 'bg-white border-slate-100', rowClass: 'bg-white hover:bg-slate-50' },
      rejected: { color: 'bg-red-50 text-red-700 border-red-200', icon: XCircle, label: 'ปฏิเสธ', cardClass: 'bg-slate-50 border-slate-100 opacity-80', rowClass: 'bg-[#f8fafc] hover:bg-slate-100' },
    };
    return configs[status] || configs.pending;
  };

  const messageTemplates = [
    { label: '🟢 พบภาพ (Line OA)', text: "เจ้าหน้าที่ได้ตรวจสอบกล้องวงจรปิดเรียบร้อยแล้ว 'พบภาพเหตุการณ์' ตามที่ท่านแจ้ง กรุณาติดต่อขอรับลิงก์ดาวน์โหลดไฟล์ภาพผ่านทาง Line OA :@745jasmc หรือ QR-Code ที่ปรากฏ โดยแจ้งเลขที่คำร้อง [ID] ให้เจ้าหน้าที่ทราบครับ/ค่ะ" },
    { label: '🟢 พบภาพ (รับเอง)', text: "ตรวจสอบพบภาพเหตุการณ์เรียบร้อยแล้วครับ/ค่ะ ท่านสามารถนำอุปกรณ์จัดเก็บข้อมูลมาติดต่อรับไฟล์ภาพได้ที่ ศูนย์ CCTV เทศบาลตำบลราไวย์ ในวันและเวลาทำการ โปรดเตรียมบัตรประชาชนตัวจริงมาแสดงด้วยครับ/ค่ะ" },
    { label: '🟡 ขอพิกัดเพิ่ม', text: "เจ้าหน้าที่ได้รับคำร้องของท่านแล้ว แต่เพื่อความแม่นยำในการระบุตำแหน่งกล้อง รบกวนท่านส่ง 'ภาพถ่ายสถานที่เกิดเหตุจริง' หรือจุดสังเกตเพิ่มเติมเข้ามาทาง Line OA พร้อมแจ้งเลขที่คำร้องด้วยครับ/ค่ะ" },
    { label: '🟡 ขอเวลาเพิ่ม', text: "เนื่องจากช่วงเวลาที่ท่านแจ้งค่อนข้างกว้าง รบกวนท่านระบุ 'ช่วงเวลาที่เกิดเหตุให้แคบลง' (บวกลบไม่เกิน 30 นาที) เพื่อความรวดเร็วในการค้นหาครับ/ค่ะ" },
    { label: '🔴 ไม่พบภาพ', text: "เจ้าหน้าที่ตรวจสอบแล้วไม่พบภาพเหตุการณ์เนื่องจากอยู่นอกรัศมี หรือข้อมูลถูกบันทึกทับไปแล้ว ต้องขออภัยมา ณ ที่นี้ด้วยครับ/ค่ะ" },
    { label: '❌ ปฏิเสธ (ขาดใบแจ้งความ)', text: "ไม่สามารถดำเนินการให้ได้เนื่องจากขาด 'ใบแจ้งความจากสถานีตำรวจ' รบกวนท่านแนบเอกสารเพิ่มและยื่นคำร้องใหม่อีกครั้งครับ/ค่ะ" },
  ];

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
    </div>
  );

  // ---------------------------------------------------------
  // 7. Main Render
  // ---------------------------------------------------------
  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-slate-900 pb-12 selection:bg-blue-100">
      <div className="max-w-[1600px] mx-auto p-4 md:p-8">
        
        {/* Header Section */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-xl md:text-2xl font-black text-slate-900 flex items-center gap-3">
            <LayoutDashboard className="w-7 h-7 text-blue-900" /> แผงควบคุม <span className="text-blue-600">CCTV RAWAI</span>
          </h1>
          <div className="flex items-center gap-3">
            <button onClick={() => setShowReport(true)} className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-lg shadow-emerald-200 transition-all">
              <BarChart3 className="w-4 h-4" /> ดูรายงานสถิติ
            </button>
            <button onClick={onLogout} className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-500 font-bold text-xs hover:text-red-600 shadow-sm transition-all">
              <LogOut className="w-4 h-4" /> ออกจากระบบ
            </button>
          </div>
        </div>

        {/* 📊 1. Stats Cards Section */}
        <StatsCards requests={requests} />

        {/* 🔍 2. Filters Section */}
        <FilterBar 
          searchQuery={searchQuery} setSearchQuery={setSearchQuery}
          filterStatus={filterStatus} setFilterStatus={setFilterStatus}
          filterEventType={filterEventType} setFilterEventType={setFilterEventType}
          startDate={startDate} setStartDate={setStartDate}
          endDate={endDate} setEndDate={setEndDate}
          isFiltering={!!(searchQuery || filterStatus !== 'all' || startDate)}
          clearFilters={() => { setSearchQuery(''); setFilterStatus('all'); setFilterEventType('all'); setStartDate(''); setEndDate(''); }}
        />

        {/* 📱 3. Mobile Cards View */}
        <MobileCardList 
          requests={paginatedRequests} 
          onSelect={(req) => setSelectedRequest(req)} 
          getStatusConfig={getStatusConfig} 
        />

        {/* 💻 4. Desktop Table View */}
        <RequestTable 
          requests={paginatedRequests} 
          onSelect={(req) => setSelectedRequest(req)} 
          getStatusConfig={getStatusConfig} 
        />

        {/* 📑 5. Pagination Component */}
        <Pagination 
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          startIndex={startIndex}
          itemsPerPage={itemsPerPage}
          setCurrentPage={setCurrentPage}
          setItemsPerPage={setItemsPerPage}
        />

        {/* 🛠 6. Detail Modal */}
        <DetailModal 
          isOpen={!!selectedRequest} 
          data={selectedRequest} 
          onClose={() => setSelectedRequest(null)} 
          getStatusConfig={getStatusConfig}
          messageTemplates={messageTemplates}
        />

        {/* 📈 7. Report Modal */}
        <ReportModal 
          isOpen={showReport} 
          onClose={() => setShowReport(false)} 
          filteredRequests={filteredRequests} 
          reportData={reportData} 
          startDate={startDate} 
          endDate={endDate} 
        />

      </div>
    </div>
  );
};

export default AdminView;