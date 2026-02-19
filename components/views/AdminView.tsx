'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  collection, onSnapshot, doc, updateDoc, 
  arrayUnion 
} from 'firebase/firestore';
import { db } from '../../lib/firebase'; 
import { 
  LayoutDashboard, 
  Search, 
  Eye, 
  CheckCircle, 
  Clock, 
  XCircle, 
  FileText, 
  MapPin, 
  User, 
  Activity, 
  Loader2, 
  LogOut, 
  Image as ImageIcon, 
  Filter, 
  Save, 
  MessageSquare, 
  ChevronDown,
  ShieldCheck,
  ExternalLink,
  ChevronRight,
  AlertCircle,
  Calendar,
  // ✅ ไอคอนใหม่ที่เพิ่มเข้ามา
  Copy,
  MapPinned,
  BarChart3
} from 'lucide-react';

import { FormDataState, FileState } from '@/types';

// ============================================================================
// ฟังก์ชันแปลง URL สำหรับแสดงภาพ Google Drive แบบเสถียรที่สุด
// ============================================================================
const getDirectDriveLink = (url: string | undefined | null): string => {
  if (!url) return '';
  if (url.includes('drive.google.com/file/d/')) {
    const fileId = url.split('/d/')[1].split('/')[0];
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
  }
  return url;
};

// --- Type Definitions ---
interface StatusHistoryItem {
  status: string;
  timestamp: any;
  note: string;
}

interface Attachments {
  idCard?: string;
  report?: string;
  scene?: string[];
}

interface CCTVRequest {
  id: string;
  trackingId?: string;
  name?: string;
  nationalId?: string;
  phone?: string;
  createdAt?: any;
  eventDate?: string;
  eventTimeStart?: string;
  eventTimeEnd?: string;
  eventType?: string;
  accidentSubtype?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  description?: string; 
  status: string;
  deliveryMethod?: string; // ✅ เพิ่ม deliveryMethod
  adminNote?: string;
  statusHistory?: StatusHistoryItem[];
  attachments?: Attachments;
  [key: string]: any;
}

interface AdminViewProps {
  onLogout: () => void;
}

const AdminView: React.FC<AdminViewProps> = ({ onLogout }) => {
  const [requests, setRequests] = useState<CCTVRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<CCTVRequest | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [adminNote, setAdminNote] = useState('');
  const [tempStatus, setTempStatus] = useState<string>('');
  
  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const messageTemplates = [
    { label: '🟢 พบภาพ (Line OA)', text: "เจ้าหน้าที่ได้ตรวจสอบกล้องวงจรปิดเรียบร้อยแล้ว 'พบภาพเหตุการณ์' ตามที่ท่านแจ้ง กรุณาติดต่อขอรับลิงก์ดาวน์โหลดไฟล์ภาพผ่านทาง Line OA :@745jasmc หรือ QR-Code ที่ปรากฏ โดยแจ้งเลขที่คำร้อง [ID] ให้เจ้าหน้าที่ทราบครับ/ค่ะ" },
    { label: '🟢 พบภาพ (รับเอง)', text: "ตรวจสอบพบภาพเหตุการณ์เรียบร้อยแล้วครับ/ค่ะ ท่านสามารถนำอุปกรณ์จัดเก็บข้อมูลมาติดต่อรับไฟล์ภาพได้ที่ ศูนย์ CCTV เทศบาลตำบลราไวย์ ในวันและเวลาทำการ โปรดเตรียมบัตรประชาชนตัวจริงมาแสดงด้วยครับ/ค่ะ" },
    { label: '🟡 ขอพิกัดเพิ่ม', text: "เจ้าหน้าที่ได้รับคำร้องของท่านแล้ว แต่เพื่อความแม่นยำในการระบุตำแหน่งกล้อง รบกวนท่านส่ง 'ภาพถ่ายสถานที่เกิดเหตุจริง' หรือจุดสังเกตเพิ่มเติมเข้ามาทาง Line OA พร้อมแจ้งเลขที่คำร้องด้วยครับ/ค่ะ" },
    { label: '🟡 ขอเวลาเพิ่ม', text: "เนื่องจากช่วงเวลาที่ท่านแจ้งค่อนข้างกว้าง รบกวนท่านระบุ 'ช่วงเวลาที่เกิดเหตุให้แคบลง' (บวกลบไม่เกิน 30 นาที) เพื่อความรวดเร็วในการค้นหาครับ/ค่ะ" },
    { label: '🔴 ไม่พบภาพ (นอกรัศมี)', text: "เจ้าหน้าที่ดำเนินการตรวจสอบกล้องบริเวณดังกล่าวอย่างละเอียดแล้ว 'ไม่พบภาพเหตุการณ์' เนื่องจากจุดที่เกิดเหตุอยู่นอกรัศมีการทำงานของกล้องวงจรปิดในบริเวณนั้น ต้องขออภัยมา ณ ที่นี้ด้วยครับ/ค่ะ" },
    { label: '🔴 ไม่พบภาพ (บันทึกทับ)', text: "จากการตรวจสอบ พบว่าเหตุการณ์ที่ท่านแจ้งเกิดขึ้นนานเกินกว่าระยะเวลาที่ระบบจัดเก็บข้อมูลไว้ ทำให้ข้อมูลเดิมถูกบันทึกทับไปแล้ว จึงไม่สามารถกู้คืนภาพได้ครับ/ค่ะ" },
    { label: '❌ ปฏิเสธ (ขาดใบแจ้งความ)', text: "ไม่สามารถดำเนินการให้ได้เนื่องจากจำเป็นต้องมี 'ใบแจ้งความจากสถานีตำรวจ' แนบมาด้วยเพื่อเป็นหลักฐานทางกฎหมาย รบกวนท่านแนบเอกสารเพิ่มและยื่นคำร้องใหม่อีกครั้งครับ/ค่ะ" },
  ];

  useEffect(() => {
    if (!db) return;
    const q = collection(db, 'cctv_requests');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CCTVRequest[];
      
      setRequests(data.sort((a, b) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA;
      }));
      setLoading(false);
    }, (error) => {
      console.error("Firestore Error:", error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (selectedRequest && mapContainerRef.current && typeof window !== 'undefined') {
      const initMap = () => {
        const L = (window as any).L;
        if (!L) return;
        if (mapRef.current) mapRef.current.remove();
        const lat = selectedRequest.latitude || 7.7858;
        const lng = selectedRequest.longitude || 98.3225;
        const map = L.map(mapContainerRef.current).setView([lat, lng], 16);
        mapRef.current = map;
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
        L.marker([lat, lng]).addTo(map).bindPopup(selectedRequest.location || 'จุดเกิดเหตุ').openPopup();
      };

      if (!(window as any).L) {
        const link = document.createElement("link");
        link.rel = "stylesheet"; link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
        const script = document.createElement("script");
        script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
        script.async = true; script.onload = initMap;
        document.body.appendChild(script);
      } else {
        initMap();
      }
    }
  }, [selectedRequest]);

  const handleSaveChanges = async () => {
    if (!selectedRequest || !tempStatus) return;
    setIsUpdating(true);
    try {
      const requestRef = doc(db, 'cctv_requests', selectedRequest.id);
      const newHistoryItem = {
        status: tempStatus,
        timestamp: new Date(),
        note: adminNote || `อัปเดตสถานะเป็น: ${tempStatus}`
      };
      await updateDoc(requestRef, {
        status: tempStatus,
        adminNote: adminNote,
        statusHistory: arrayUnion(newHistoryItem)
      });
      setSelectedRequest({
        ...selectedRequest,
        status: tempStatus,
        adminNote: adminNote,
        statusHistory: [...(selectedRequest.statusHistory || []), newHistoryItem]
      });
      setAdminNote('');
    } catch (error) {
      console.error("Update Error:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  // ✅ ฟังก์ชันอำนวยความสะดวก: คัดลอกข้อความ
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    alert(`คัดลอก: ${text} เรียบร้อยแล้ว`);
  };

  // ✅ ปรับปรุงการค้นหา ให้หาจากเบอร์โทรได้ด้วย
  const filteredRequests = requests.filter(req => {
    const matchesStatus = filterStatus === 'all' || req.status === filterStatus;
    const nameStr = req.name || '';
    const trackingIdStr = req.trackingId || '';
    const phoneStr = req.phone || '';
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = nameStr.toLowerCase().includes(searchLower) || trackingIdStr.toLowerCase().includes(searchLower) || phoneStr.includes(searchLower);
    return matchesStatus && matchesSearch;
  });

  const getStatusConfig = (status: string) => {
    const configs: any = {
      pending: { color: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock, label: 'รอตรวจสอบ' },
      verifying: { color: 'bg-blue-50 text-blue-700 border-blue-200', icon: ShieldCheck, label: 'ตรวจเอกสาร' },
      searching: { color: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: Search, label: 'กำลังหาภาพ' },
      completed: { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle, label: 'เสร็จสิ้น' },
      rejected: { color: 'bg-red-50 text-red-700 border-red-200', icon: XCircle, label: 'ปฏิเสธ' },
    };
    return configs[status] || configs.pending;
  };

  // Helper ฟอร์แมตวันที่ยื่นคำร้อง
  const formatDate = (timestamp: any) => {
    if (!timestamp?.seconds) return 'N/A';
    return new Date(timestamp.seconds * 1000).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: '2-digit' });
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50/50 font-sans text-slate-900 selection:bg-blue-100">
      <div className="max-w-[1600px] mx-auto p-4 md:p-8">
        
        {/* Top Header */}
        <div className="flex justify-between items-center mb-6 md:mb-8">
          <div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-3">
              <LayoutDashboard className="w-6 h-6 md:w-7 h-7 text-blue-900" />
              แผงควบคุม <span className="hidden sm:inline text-blue-600">CCTV RAWAI</span>
              <span className="sm:hidden text-blue-600">Admin</span>
            </h1>
          </div>
          <button onClick={onLogout} className="flex items-center gap-2 px-4 py-2 md:px-5 md:py-2.5 bg-white border border-slate-200 rounded-xl text-slate-500 font-bold text-[10px] md:text-xs hover:text-red-600 transition-all shadow-sm">
            <LogOut className="w-4 h-4" /> <span className="hidden xs:inline">ออกจากระบบ</span>
          </button>
        </div>

        {/* ✅ Dashboard Summary Stats (เพิ่มใหม่) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 md:mb-8">
            <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3 md:gap-4">
                <div className="p-2 md:p-3 bg-blue-50 text-blue-600 rounded-xl"><BarChart3 className="w-5 h-5 md:w-6 h-6"/></div>
                <div><p className="text-[10px] md:text-xs text-slate-500 font-bold uppercase tracking-wider">คำร้องทั้งหมด</p><h3 className="text-xl md:text-2xl font-black text-slate-800">{requests.length}</h3></div>
            </div>
            <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3 md:gap-4">
                <div className="p-2 md:p-3 bg-amber-50 text-amber-600 rounded-xl"><Clock className="w-5 h-5 md:w-6 h-6"/></div>
                <div><p className="text-[10px] md:text-xs text-slate-500 font-bold uppercase tracking-wider">กำลังดำเนินการ</p><h3 className="text-xl md:text-2xl font-black text-slate-800">{requests.filter(r => ['pending','verifying','searching'].includes(r.status)).length}</h3></div>
            </div>
            <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3 md:gap-4">
                <div className="p-2 md:p-3 bg-emerald-50 text-emerald-600 rounded-xl"><CheckCircle className="w-5 h-5 md:w-6 h-6"/></div>
                <div><p className="text-[10px] md:text-xs text-slate-500 font-bold uppercase tracking-wider">เสร็จสิ้นแล้ว</p><h3 className="text-xl md:text-2xl font-black text-slate-800">{requests.filter(r => r.status === 'completed').length}</h3></div>
            </div>
            <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3 md:gap-4">
                <div className="p-2 md:p-3 bg-red-50 text-red-600 rounded-xl"><XCircle className="w-5 h-5 md:w-6 h-6"/></div>
                <div><p className="text-[10px] md:text-xs text-slate-500 font-bold uppercase tracking-wider">ปฏิเสธ / ยกเลิก</p><h3 className="text-xl md:text-2xl font-black text-slate-800">{requests.filter(r => r.status === 'rejected').length}</h3></div>
            </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-3 md:p-4 rounded-2xl md:rounded-[2rem] border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 md:gap-4 mb-6 md:mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-4 md:left-5 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 h-5 text-slate-300" />
            <input type="text" placeholder="ค้นหาชื่อ, เบอร์โทร หรือ ID..." className="w-full pl-11 md:pl-14 pr-6 py-3 md:py-4 bg-slate-50 border border-slate-100 rounded-xl md:rounded-2xl focus:ring-4 focus:ring-blue-50 outline-none transition-all font-medium text-slate-800 text-sm md:text-base" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </div>
          <div className="relative">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select className="w-full pl-10 pr-10 py-3 md:py-4 bg-slate-50 border border-slate-100 rounded-xl md:rounded-2xl font-bold text-slate-700 appearance-none cursor-pointer hover:bg-slate-100 transition-colors outline-none text-sm md:text-base" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="all">สถานะทั้งหมด</option>
              <option value="pending">รอตรวจสอบ</option>
              <option value="verifying">ตรวจเอกสาร</option>
              <option value="searching">ค้นหาภาพ</option>
              <option value="completed">เสร็จสิ้น</option>
              <option value="rejected">ปฏิเสธแล้ว</option>
            </select>
            <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 rotate-90 pointer-events-none" />
          </div>
        </div>

        {/* --- Mobile View: Cards Layout --- */}
        <div className="md:hidden space-y-4 mb-12">
            {filteredRequests.map((req) => {
                const status = getStatusConfig(req.status);
                return (
                    <div 
                        key={req.id} 
                        className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm active:scale-[0.98] transition-all"
                        onClick={() => { setSelectedRequest(req); setTempStatus(req.status); }}
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="font-mono font-bold text-blue-900 text-xs mb-1 uppercase tracking-wider">{req.trackingId}</p>
                                <h3 className="font-black text-slate-900 text-base">{req.name}</h3>
                            </div>
                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[9px] font-black uppercase border ${status.color}`}>
                                <status.icon className="w-2.5 h-2.5" /> {status.label}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4 text-[11px]">
                            <div className="space-y-1">
                                <p className="text-slate-400 font-bold uppercase tracking-tight flex items-center gap-1"><Activity className="w-3 h-3"/> ประเภทเหตุ</p>
                                <p className="font-black text-slate-700">{req.eventType}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-slate-400 font-bold uppercase tracking-tight flex items-center gap-1"><Calendar className="w-3 h-3"/> วันที่เกิดเหตุ</p>
                                <p className="font-black text-slate-700">{req.eventDate}</p>
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                            <div className="flex items-center gap-3">
                                <p className="text-[9px] font-black text-slate-300 uppercase">เอกสาร:</p>
                                <div className="flex items-center gap-1.5">
                                    <div className={`w-2 h-2 rounded-full ${req.attachments?.idCard ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'bg-slate-200'}`} />
                                    <div className={`w-2 h-2 rounded-full ${req.attachments?.report ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'bg-slate-200'}`} />
                                    <div className={`w-2 h-2 rounded-full ${req.attachments?.scene && req.attachments.scene.length > 0 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-200'}`} />
                                </div>
                            </div>
                            <button className="flex items-center gap-1 font-black text-blue-600 text-[10px] uppercase">
                                รายละเอียด <ChevronRight className="w-3 h-3" />
                            </button>
                        </div>
                    </div>
                );
            })}
            {filteredRequests.length === 0 && (
                <div className="bg-white p-10 rounded-3xl border border-dashed border-slate-200 text-center text-slate-400 font-bold text-sm">
                    ไม่พบข้อมูลคำร้อง
                </div>
            )}
        </div>

        {/* --- Desktop View: Table Layout --- */}
        <div className="hidden md:block bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden mb-12">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center">วันที่ยื่น</th>
                <th className="px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Tracking ID</th>
                <th className="px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">ผู้ยื่นคำร้อง</th>
                <th className="px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">เหตุการณ์</th>
                <th className="px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center">รับไฟล์</th>
                <th className="px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">เอกสาร</th>
                <th className="px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">สถานะ</th>
                <th className="px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredRequests.map((req) => {
                const status = getStatusConfig(req.status);
                return (
                  <tr key={req.id} className="hover:bg-slate-50/50 transition-colors group cursor-pointer" onClick={() => { setSelectedRequest(req); setTempStatus(req.status); }}>
                    {/* ✅ เพิ่มวันที่ยื่นคำร้อง */}
                    <td className="px-6 py-7 text-center">
                        <span className="text-xs font-bold text-slate-500">{formatDate(req.createdAt)}</span>
                    </td>
                    <td className="px-6 py-7 font-mono font-bold text-blue-900 text-sm">{req.trackingId}</td>
                    <td className="px-6 py-7 font-black text-slate-900">{req.name}</td>
                    <td className="px-6 py-7">
                        <span className="font-bold text-slate-700 text-xs bg-slate-100 px-2 py-1 rounded-md mb-1 inline-block">{req.eventType}</span>
                        <div className="text-[10px] text-slate-400 font-mono">{req.eventDate}</div>
                    </td>
                    {/* ✅ เพิ่มช่องทางการรับไฟล์ */}
                    <td className="px-6 py-7 text-center">
                        {req.deliveryMethod === 'LINE' ? 
                            <span className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-50 px-2 py-1.5 rounded-lg border border-emerald-100">LINE OA</span> : 
                            <span className="text-[10px] font-black uppercase text-blue-600 bg-blue-50 px-2 py-1.5 rounded-lg border border-blue-100">รับด้วยตนเอง</span>
                        }
                    </td>
                    <td className="px-6 py-7">
                        <div className="flex items-center gap-1.5">
                           <div className={`w-2 h-2 rounded-full ${req.attachments?.idCard ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'bg-slate-200'}`} title="บัตรประชาชน" />
                           <div className={`w-2 h-2 rounded-full ${req.attachments?.report ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'bg-slate-200'}`} title="ใบแจ้งความ" />
                           <div className={`w-2 h-2 rounded-full ${req.attachments?.scene && req.attachments.scene.length > 0 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-200'}`} title="ภาพเหตุการณ์" />
                        </div>
                    </td>
                    <td className="px-6 py-7">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase border ${status.color}`}>
                          <status.icon className="w-3 h-3" /> {status.label}
                        </span>
                    </td>
                    <td className="px-6 py-7 text-right">
                      <button className="p-2.5 bg-white border border-slate-200 hover:border-blue-900 hover:text-blue-900 hover:bg-blue-50 rounded-xl transition-all shadow-sm">
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredRequests.length === 0 && (
                <div className="p-20 text-center text-slate-300 font-bold">ไม่พบข้อมูลคำร้องที่ค้นหา</div>
          )}
        </div>

        {/* Modal: Full Details */}
        {selectedRequest && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 md:p-10 bg-slate-900/70 backdrop-blur-md">
            <div className="bg-white w-full max-w-6xl h-[95vh] md:h-full md:max-h-[90vh] rounded-3xl md:rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
              
              <div className="p-5 md:p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center gap-3 md:gap-5">
                  <div className="w-10 h-10 md:w-14 h-14 rounded-xl md:rounded-2xl bg-white flex items-center justify-center shadow-md border border-slate-100 text-blue-900"><FileText className="w-5 h-5 md:w-7 h-7" /></div>
                  <div>
                    {/* ✅ เพิ่มปุ่ม Copy สำหรับ Tracking ID */}
                    <h2 className="text-lg md:text-2xl font-black text-slate-900 leading-tight flex items-center gap-2">
                        คำร้อง #{selectedRequest.trackingId}
                        <button onClick={() => handleCopy(selectedRequest.trackingId || '')} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="คัดลอก ID">
                            <Copy className="w-4 h-4" />
                        </button>
                    </h2>
                    <p className="text-[9px] md:text-xs text-slate-400 font-bold uppercase mt-0.5 italic">ได้รับเมื่อ {selectedRequest.createdAt?.seconds ? new Date(selectedRequest.createdAt.seconds * 1000).toLocaleString('th-TH') : 'N/A'}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedRequest(null)} className="p-1 md:p-3 bg-white hover:bg-red-50 hover:text-red-500 rounded-full transition-all text-slate-300 border border-slate-100 shadow-sm"><XCircle className="w-7 h-7 md:w-8 h-8" /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 md:p-10 custom-scrollbar">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12">
                  <div className="lg:col-span-2 space-y-8 md:space-y-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
                        <section className="space-y-4">
                          <h4 className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.25em] text-blue-600 mb-2 md:mb-6 flex items-center gap-2"><User className="w-3 h-3" /> ข้อมูลผู้ยื่น</h4>
                          <div className="space-y-4 bg-slate-50 p-5 md:p-7 rounded-2xl md:rounded-[2rem] border border-slate-100">
                            <div><p className="text-[9px] md:text-[10px] text-slate-400 font-black mb-1 uppercase">ชื่อ-นามสกุล</p><p className="font-black text-slate-800 text-sm md:text-base">{selectedRequest.name}</p></div>
                            <div><p className="text-[9px] md:text-[10px] text-slate-400 font-black mb-1 uppercase">เลขบัตรประชาชน</p><p className="font-bold text-slate-800 font-mono text-sm md:text-base">{selectedRequest.nationalId}</p></div>
                            <div>
                                <p className="text-[9px] md:text-[10px] text-slate-400 font-black mb-1 uppercase">เบอร์ติดต่อ</p>
                                {/* ✅ เพิ่มปุ่ม Copy สำหรับเบอร์โทรศัพท์ */}
                                <div className="flex items-center gap-2">
                                    <p className="font-black text-slate-800 text-sm md:text-base">{selectedRequest.phone}</p>
                                    <button onClick={() => handleCopy(selectedRequest.phone || '')} className="text-slate-400 hover:text-blue-600 transition-colors" title="คัดลอกเบอร์โทร"><Copy className="w-3 h-3" /></button>
                                </div>
                            </div>
                            {/* ✅ ข้อมูลช่องทางรับไฟล์ */}
                            <div className="pt-3 mt-1 border-t border-slate-200/60">
                                <p className="text-[9px] md:text-[10px] text-slate-400 font-black mb-1 uppercase">ความประสงค์รับไฟล์</p>
                                <p className="font-black text-blue-700 text-sm">{selectedRequest.deliveryMethod === 'LINE' ? '📱 รับผ่านทาง LINE OA' : '🏢 มารับด้วยตนเองที่ศูนย์'}</p>
                            </div>
                          </div>
                        </section>
                        <section className="space-y-4">
                          <h4 className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.25em] text-blue-600 mb-2 md:mb-6 flex items-center gap-2"><Activity className="w-3 h-3" /> ข้อมูลเหตุการณ์</h4>
                          <div className="space-y-4 bg-slate-50 p-5 md:p-7 rounded-2xl md:rounded-[2rem] border border-slate-100">
                            <div><p className="text-[9px] md:text-[10px] text-slate-400 font-black mb-1 uppercase">วันเวลาเกิดเหตุ</p><p className="font-black text-slate-800 text-sm md:text-base">{selectedRequest.eventDate} ({selectedRequest.eventTimeStart} - {selectedRequest.eventTimeEnd})</p></div>
                            <div><p className="text-[9px] md:text-[10px] text-slate-400 font-black mb-1 uppercase">ลักษณะเหตุ</p><p className="font-black text-slate-800 text-sm md:text-base">{selectedRequest.eventType}</p></div>
                            
                            <div className="pt-4 mt-2 border-t border-slate-200/60">
                                <p className="text-[9px] md:text-[10px] text-slate-400 font-black mb-2 flex items-center gap-1 uppercase"><AlertCircle className="w-3 h-3" /> รายละเอียดเพิ่มเติม</p>
                                <div className="bg-white/80 p-4 rounded-xl md:rounded-2xl border border-slate-100 text-xs md:text-sm text-slate-700 leading-relaxed font-medium min-h-[60px] md:min-h-[80px]">
                                    {selectedRequest.description || "ไม่ได้ระบุรายละเอียดเพิ่มเติม"}
                                </div>
                            </div>
                          </div>
                        </section>
                    </div>

                    <section>
                        <h4 className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.25em] text-slate-400 mb-4 md:mb-6 flex items-center gap-3"><MapPin className="w-4 h-4 text-red-500" /> พิกัดสถานที่เกิดเหตุ</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                          <div className="md:col-span-1 bg-white p-5 md:p-7 border border-slate-200 rounded-2xl md:rounded-[2rem] flex flex-col justify-center">
                              <p className="font-black text-slate-800 text-base md:text-lg leading-tight mb-4">{selectedRequest.location}</p>
                              <div className="pt-4 border-t border-slate-100 text-[8px] md:text-[9px] text-slate-400 font-mono"><p>LAT: {selectedRequest.latitude}</p><p>LNG: {selectedRequest.longitude}</p></div>
                              
                              {/* ✅ ปุ่มเปิดดูพิกัดใน Google Maps จริง */}
                              <a href={`https://www.google.com/maps?q=${selectedRequest.latitude},${selectedRequest.longitude}`} target="_blank" rel="noopener noreferrer" className="mt-5 flex items-center justify-center gap-2 w-full py-2.5 bg-blue-50 text-blue-700 font-black text-[10px] md:text-xs uppercase tracking-wide rounded-xl border border-blue-100 hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                                  <MapPinned className="w-4 h-4" /> เปิดดูใน Google Maps
                              </a>
                          </div>
                          <div className="md:col-span-2 h-48 md:h-64 rounded-2xl md:rounded-[2rem] bg-slate-100 border border-slate-200 overflow-hidden relative shadow-inner">
                              <div ref={mapContainerRef} className="w-full h-full z-0" />
                          </div>
                        </div>
                    </section>

                    <section className="pb-10 md:pb-0">
                      <h4 className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.25em] text-slate-400 mb-6 md:mb-8 flex items-center gap-2">
                          <ImageIcon className="w-4 h-4" /> เอกสารและหลักฐาน
                      </h4>
                      <div className="grid grid-cols-2 xs:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6">
                        {[
                          { label: 'บัตรประชาชน', url: selectedRequest.attachments?.idCard },
                          { label: 'ใบแจ้งความ', url: selectedRequest.attachments?.report },
                          ...(selectedRequest.attachments?.scene || []).map((url: string, i: number) => ({ label: `ภาพเหตุการณ์ ${i+1}`, url }))
                        ].map((file, i) => {
                          if (!file.url) {
                            return (
                              <div key={i} className="h-32 md:h-44 rounded-2xl md:rounded-3xl bg-slate-50 border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-300">
                                <ImageIcon className="w-6 h-6 md:w-8 h-8 mb-1" />
                                <span className="text-[8px] md:text-[9px] font-bold uppercase">ไม่มีข้อมูล</span>
                              </div>
                            );
                          }

                          let imageUrl = file.url;
                          if (file.url.includes('drive.google.com/file/d/')) {
                              const fileId = file.url.split('/file/d/')[1].split('/')[0];
                              imageUrl = `https://lh3.googleusercontent.com/d/${fileId}`; 
                          }

                          return (
                            <div key={i} className="group relative h-32 md:h-44 rounded-2xl md:rounded-3xl overflow-hidden border-2 border-slate-100 bg-slate-50 shadow-sm transition-all hover:ring-8 hover:ring-blue-50/50">
                               <img 
                                  src={imageUrl} 
                                  className="w-full h-full object-cover transition-transform group-hover:scale-110" 
                                  alt={file.label} 
                                  onError={(e) => {
                                      e.currentTarget.src = `https://drive.google.com/thumbnail?id=${file.url.split('/file/d/')[1]?.split('/')[0]}&sz=w1000`;
                                  }}
                               />
                               <div className="absolute bottom-0 left-0 right-0 p-2 md:p-3 bg-white/95 backdrop-blur-md text-[8px] md:text-[10px] font-black uppercase text-center border-t border-slate-100 text-slate-600">
                                 {file.label}
                               </div>
                               <a href={file.url} target="_blank" rel="noopener noreferrer" className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10" title="เปิดดูรูปเต็ม">
                                  <ExternalLink className="text-white w-5 h-5 md:w-7 h-7" />
                               </a>
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  </div>

                  <div className="space-y-8 md:space-y-10">
                    <div className="bg-slate-900 rounded-3xl md:rounded-[2.5rem] p-6 md:p-9 text-white shadow-2xl relative overflow-hidden">
                      <h4 className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em] text-blue-400 mb-6 md:mb-8 relative z-10">Admin Control Panel</h4>
                      <div className="space-y-6 md:space-y-8 relative z-10">
                        <div className="space-y-3 md:space-y-4">
                          <label className="text-[9px] md:text-[10px] font-black uppercase text-slate-500 block ml-1 tracking-[0.2em]">เลือกสถานะ</label>
                          <div className="grid grid-cols-1 gap-2">
                             {[
                               { val: 'pending', label: 'รอการตรวจสอบ', color: 'hover:bg-amber-600' },
                               { val: 'verifying', label: 'ตรวจสอบเอกสาร', color: 'hover:bg-blue-600' },
                               { val: 'searching', label: 'กำลังค้นหาภาพ', color: 'hover:bg-indigo-600' },
                               { val: 'completed', label: 'ดำเนินการสำเร็จ', color: 'hover:bg-emerald-600' },
                               { val: 'rejected', label: 'ปฏิเสธ/ยกเลิก', color: 'hover:bg-red-600' }
                             ].map(opt => (
                               <button key={opt.val} onClick={() => setTempStatus(opt.val)} className={`w-full py-3 md:py-4 px-5 md:px-6 rounded-xl md:rounded-2xl text-[10px] md:text-[11px] font-black text-left transition-all border border-white/5 uppercase tracking-widest ${tempStatus === opt.val ? 'bg-white text-slate-900 shadow-xl' : 'text-slate-400 hover:text-white ' + opt.color}`}>{opt.label}</button>
                             ))}
                          </div>
                        </div>

                        <div className="space-y-3 md:space-y-4">
                          <label className="text-[9px] md:text-[10px] font-black uppercase text-slate-500 block ml-1 flex items-center gap-2 tracking-[0.2em]">
                            <MessageSquare className="w-3 h-3" /> ข้อความตอบกลับสำเร็จรูป
                          </label>
                          <div className="relative group">
                            <select 
                              className="w-full bg-white/5 border border-white/10 rounded-xl md:rounded-2xl px-4 md:px-5 py-3 md:py-4 text-[10px] md:text-xs font-bold text-slate-300 outline-none appearance-none cursor-pointer hover:bg-white/10 transition-all pr-12"
                              onChange={(e) => {
                                const val = e.target.value;
                                if(val) setAdminNote(val.replace('[ID]', selectedRequest?.trackingId || 'N/A'));
                                e.target.value = "";
                              }}
                            >
                              <option value="" className="bg-slate-900 text-slate-500">-- เลือกข้อความรวดเร็ว --</option>
                              {messageTemplates.map((t, idx) => (
                                <option key={idx} value={t.text} className="bg-slate-900 text-white py-2">{t.label}</option>
                              ))}
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                          </div>
                          <textarea rows={4} className="w-full bg-white/5 border border-white/10 rounded-xl md:rounded-2xl p-4 md:p-5 text-xs md:text-sm outline-none focus:ring-4 focus:ring-blue-500/20 focus:bg-white/10 transition-all font-medium placeholder:text-slate-700 leading-relaxed" placeholder="ระบุรายละเอียด..." value={adminNote} onChange={e => setAdminNote(e.target.value)} />
                        </div>

                        <button onClick={handleSaveChanges} disabled={isUpdating || !tempStatus} className="w-full py-4 md:py-5 rounded-xl md:rounded-2xl bg-blue-600 text-white font-black text-xs md:text-sm uppercase tracking-[0.2em] shadow-xl hover:bg-blue-500 disabled:opacity-50 flex items-center justify-center gap-3 transition-all">
                          {isUpdating ? <Loader2 className="w-4 h-4 md:w-5 h-5 animate-spin" /> : <Save className="w-4 h-4 md:w-5 h-5" />}
                          {isUpdating ? 'กำลังบันทึก...' : 'บันทึกการอัปเดต'}
                        </button>
                      </div>
                    </div>

                    <div className="p-6 md:p-8 bg-white rounded-3xl md:rounded-[2.5rem] border border-slate-100 shadow-sm">
                        <h4 className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 mb-8 md:mb-10 uppercase">ประวัติการดำเนินการ</h4>
                        <div className="space-y-8 md:space-y-10">
                          {selectedRequest.statusHistory?.map((h, i) => (
                            <div key={i} className="relative pl-7 md:pl-8">
                               {i !== (selectedRequest.statusHistory?.length || 0) - 1 && <div className="absolute left-[3px] top-6 bottom-[-32px] md:bottom-[-40px] w-0.5 bg-slate-100"></div>}
                               <div className="absolute left-0 top-1.5 w-2 h-2 rounded-full bg-blue-600 ring-4 ring-blue-50"></div>
                               <div>
                                  <p className="text-[10px] md:text-xs font-black text-slate-800 uppercase">{h.status}</p>
                                  <p className="text-[8px] md:text-[9px] text-slate-400 font-bold mb-3">{h.timestamp?.seconds ? new Date(h.timestamp.seconds * 1000).toLocaleString('th-TH') : 'Just now'}</p>
                                  <p className="text-[10px] md:text-xs text-slate-500 font-medium leading-relaxed bg-slate-50 p-3 md:p-4 rounded-xl md:rounded-2xl border border-slate-100 italic">"{h.note}"</p>
                               </div>
                            </div>
                          ))}
                        </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminView;