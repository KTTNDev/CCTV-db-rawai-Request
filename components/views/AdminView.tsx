'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
// ✅ เพิ่ม getDocs, query, orderBy สำหรับดึงข้อมูลย้อนหลัง
import { collection, onSnapshot, doc, getDocs, query, where, orderBy } from 'firebase/firestore'; 
import { db } from '../../lib/firebase';
import { LayoutDashboard, LogOut, BarChart3, Loader2 } from 'lucide-react';

// ✅ Import Components ย่อย
import { StatsCards } from '../admin/StatsCards';
import { FilterBar } from '../admin/FilterBar';
import { RequestTable } from '../admin/RequestTable';
import { MobileCardList } from '../admin/MobileCardList';
import { DetailModal } from '../admin/DetailModal';
import { ReportModal } from '../admin/ReportModal';
import { Pagination } from '../admin/Pagination';

// ✅ Import Helpers และตัวแปลภาษา
import { STATUS_TH, EVENT_TYPE_TH } from '../admin/utils/formatters';
import { Clock, ShieldCheck, Search as SearchIcon, CheckCircle, XCircle } from 'lucide-react';

interface AdminViewProps {
  onLogout: () => void;
}

const AdminView: React.FC<AdminViewProps> = ({ onLogout }) => {
  // ---------------------------------------------------------
  // 1. States Management
  // ---------------------------------------------------------
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  
  const [visitorStats, setVisitorStats] = useState({ today: 0, total: 0 });
  // ✅ 1.2 เพิ่ม State สำหรับเก็บข้อมูลกราฟย้อนหลัง (YouTube Style)
  const [visitorHistory, setVisitorHistory] = useState<any[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterEventType, setFilterEventType] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showReport, setShowReport] = useState(false);

  // ---------------------------------------------------------
  // 2. Real-time Listeners (คำร้อง CCTV & สถิติผู้เข้าชม)
  // ---------------------------------------------------------
  useEffect(() => {
    if (!db) return;

    const q = collection(db, 'cctv_requests');
    const unsubRequests = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRequests(data.sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
      setLoading(false);
    }, (error) => {
      console.error("Firestore Error (Requests):", error);
      setLoading(false);
    });

    const todayStr = new Date().toLocaleDateString('en-CA'); // ใช้รูปแบบเดียวกับ HomeView
    
    const unsubToday = onSnapshot(doc(db, 'site_analytics', todayStr), (docSnap) => {
      if (docSnap.exists()) {
        setVisitorStats(prev => ({ ...prev, today: docSnap.data().visits || 0 }));
      }
    });

    const unsubTotal = onSnapshot(doc(db, 'site_analytics', 'global_stats'), (docSnap) => {
      if (docSnap.exists()) {
        setVisitorStats(prev => ({ ...prev, total: docSnap.data().totalVisits || 0 }));
      }
    });

    return () => {
      unsubRequests(); unsubToday(); unsubTotal();
    };
  }, []);

  // ---------------------------------------------------------
  // ✅ 3. ฟังก์ชันดึงข้อมูล Analytics ย้อนหลัง (YouTube Studio Engine)
  // ---------------------------------------------------------
  const fetchAnalyticsHistory = useCallback(async () => {
    if (!db) return;
    try {
      // ดึงข้อมูลยอดวิวรายวัน
      const analyticsRef = collection(db, 'site_analytics');
      const q = query(analyticsRef, orderBy('date', 'desc'), where('date', '!=', 'global_stats'));
      const snap = await getDocs(q);
      
      const history = snap.docs.map(doc => ({
        date: doc.id.split('-').slice(1).reverse().join('/'), // แปลง 2026-02-21 เป็น 21/02
        views: doc.data().visits || 0,
        requests: requests.filter(r => {
           if (!r.createdAt) return false;
           return new Date(r.createdAt.seconds * 1000).toLocaleDateString('en-CA') === doc.id;
        }).length
      })).reverse(); // เรียงจากเก่าไปใหม่สำหรับกราฟ

      setVisitorHistory(history);
    } catch (e) { console.error("History Fetch Error:", e); }
  }, [requests]);

  // ดึงข้อมูลใหม่เมื่อเปิด Report
  useEffect(() => {
    if (showReport) fetchAnalyticsHistory();
  }, [showReport, fetchAnalyticsHistory]);

  // ---------------------------------------------------------
  // 4. Data Processing
  // ---------------------------------------------------------
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

  const totalItems = filteredRequests.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRequests = filteredRequests.slice(startIndex, startIndex + itemsPerPage);

  // ---------------------------------------------------------
  // 5. UI Helpers & Templates
  // ---------------------------------------------------------
  const getStatusConfig = (status: string) => {
    const configs: any = {
      pending: { color: 'bg-orange-100 text-orange-700 border-orange-200', icon: Clock, label: 'รอตรวจสอบ' },
      verifying: { color: 'bg-blue-100 text-blue-700 border-blue-200', icon: ShieldCheck, label: 'ตรวจเอกสาร' },
      searching: { color: 'bg-indigo-100 text-indigo-700 border-indigo-200', icon: SearchIcon, label: 'กำลังหาภาพ' },
      completed: { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle, label: 'เสร็จสิ้น' },
      rejected: { color: 'bg-red-50 text-red-700 border-red-200', icon: XCircle, label: 'ปฏิเสธ' },
    };
    return configs[status] || configs.pending;
  };

  const messageTemplates = [
    { label: '🟢 พบภาพ (Line OA)', text: "พบภาพเหตุการณ์เรียบร้อยแล้ว กรุณาติดต่อผ่าน Line OA : @745jasmc พร้อมแจ้งเลขที่คำร้อง [ID] ครับ" },
    { label: '🔴 ไม่พบภาพ', text: "เจ้าหน้าที่ตรวจสอบแล้วไม่พบภาพเหตุการณ์เนื่องจากอยู่นอกรัศมีกล้อง ต้องขออภัยด้วยครับ" },
  ];

  const handleRefresh = () => { console.log("Stats Refreshing..."); fetchAnalyticsHistory(); };

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
    </div>
  );

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

        {/* 📊 1. Stats Cards */}
        <StatsCards requests={requests} visitorStats={visitorStats} onRefresh={handleRefresh} />

        {/* 🔍 2. Filters */}
        <FilterBar 
          searchQuery={searchQuery} setSearchQuery={setSearchQuery}
          filterStatus={filterStatus} setFilterStatus={setFilterStatus}
          filterEventType={filterEventType} setFilterEventType={setFilterEventType}
          startDate={startDate} setStartDate={setStartDate}
          endDate={endDate} setEndDate={setEndDate}
          isFiltering={!!(searchQuery || filterStatus !== 'all' || startDate)}
          clearFilters={() => { setSearchQuery(''); setFilterStatus('all'); setFilterEventType('all'); setStartDate(''); setEndDate(''); }}
        />

        {/* 📱 3. Mobile View */}
        <MobileCardList requests={paginatedRequests} onSelect={(req) => setSelectedRequest(req)} getStatusConfig={getStatusConfig} />

        {/* 💻 4. Desktop View */}
        <RequestTable requests={paginatedRequests} onSelect={(req) => setSelectedRequest(req)} getStatusConfig={getStatusConfig} />

        {/* 📑 5. Pagination */}
        <Pagination 
          currentPage={currentPage} totalPages={totalPages} totalItems={totalItems}
          startIndex={startIndex} itemsPerPage={itemsPerPage}
          setCurrentPage={setCurrentPage} setItemsPerPage={setItemsPerPage}
        />

        {/* 🛠 6. Detail Modal */}
        <DetailModal 
          isOpen={!!selectedRequest} data={selectedRequest} onClose={() => setSelectedRequest(null)} 
          getStatusConfig={getStatusConfig} messageTemplates={messageTemplates}
        />

        {/* 📈 7. Report Modal (✅ ส่ง visitorHistory เข้าไปเพื่อแสดงกราฟ) */}
        <ReportModal 
          isOpen={showReport} onClose={() => setShowReport(false)} 
          filteredRequests={filteredRequests} reportData={reportData} 
          startDate={startDate} endDate={endDate} 
          visitorHistory={visitorHistory} 
          visitorStats={visitorStats}
        />

      </div>
    </div>
  );
};

export default AdminView;