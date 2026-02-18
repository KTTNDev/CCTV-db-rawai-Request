'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  collection, query, onSnapshot, doc, updateDoc, 
  arrayUnion 
} from 'firebase/firestore';
/**
 * 🛠️ Fixed Import Path Error:
 * Switching from alias "@/" to relative path "../../" to ensure
 * successful compilation in this environment.
 */
import { db } from '../../lib/firebase';
import { 
  LayoutDashboard, Search, Eye, CheckCircle, Clock, XCircle, 
  FileText, MapPin, User, Phone, Calendar, ExternalLink, 
  ShieldCheck, Activity, Loader2, LogOut, Image as ImageIcon, 
  ChevronRight, Filter, Save, MessageSquare, ChevronDown,
  BarChart3, PieChart as PieChartIcon, TrendingUp, Info, AlertTriangle
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { CCTVRequest } from '../../types';

interface AdminViewProps {
  onLogout: () => void;
}

// ✅ แผนผังการแปลงรหัสข้อมูลเป็นภาษาไทยที่เป็นทางการ
const eventTypeMap: Record<string, string> = {
  'ACCIDENT': 'อุบัติเหตุจราจร',
  'THEFT': 'ลักทรัพย์',
  'VANDALISM': 'ทำลายทรัพย์สิน',
  'DISPUTE': 'ทะเลาะวิวาท',
  'OTHER': 'อื่นๆ'
};

const accidentSubtypeMap: Record<string, string> = {
  'MC_VS_MC': 'รถจักรยานยนต์ ชน รถจักรยานยนต์',
  'MC_VS_CAR': 'รถจักรยานยนต์ ชน รถยนต์',
  'CAR_VS_CAR': 'รถยนต์ ชน รถยนต์',
  'PEDESTRIAN': 'ชนคนเดินเท้า',
  'HIT_AND_RUN': 'ชนแล้วหนี',
  'OTHER': 'อื่นๆ'
};

const statusMap: Record<string, string> = {
  'pending': 'รอการตรวจสอบ',
  'verifying': 'ตรวจสอบเอกสาร',
  'searching': 'กำลังค้นหาภาพ',
  'completed': 'ดำเนินการเสร็จสิ้น',
  'rejected': 'ปฏิเสธคำร้อง'
};

const COLORS = ['#1e3a8a', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const AdminView: React.FC<AdminViewProps> = ({ onLogout }) => {
  const [requests, setRequests] = useState<CCTVRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'list' | 'stats'>('list');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<CCTVRequest | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [adminNote, setAdminNote] = useState('');
  const [tempStatus, setTempStatus] = useState<string>('');
  
  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const messageTemplates = [
    { label: '🟢 พบภาพ (Line OA)', text: "เจ้าหน้าที่ได้ตรวจสอบกล้องวงจรปิดเรียบร้อยแล้ว 'พบภาพเหตุการณ์' ตามที่ท่านแจ้ง กรุณาติดต่อขอรับลิงก์ดาวน์โหลดไฟล์ภาพผ่านทาง Line OA [ระบุไอดีไลน์] โดยแจ้งเลขที่คำร้อง [ID] ให้เจ้าหน้าที่ทราบครับ" },
    { label: '🟡 ขอพิกัดเพิ่ม', text: "เจ้าหน้าที่ได้รับคำร้องของท่านแล้ว แต่เพื่อความแม่นยำในการระบุตำแหน่งกล้อง รบกวนท่านส่ง 'ภาพถ่ายสถานที่เกิดเหตุจริง' หรือจุดสังเกตเพิ่มเติมเข้ามาทาง Line OA พร้อมแจ้งเลขที่คำร้องด้วยครับ" },
    { label: '🔴 ไม่พบภาพ (นอกรัศมี)', text: "เจ้าหน้าที่ดำเนินการตรวจสอบกล้องบริเวณดังกล่าวอย่างละเอียดแล้ว 'ไม่พบภาพเหตุการณ์' เนื่องจากจุดที่เกิดเหตุอยู่นอกรัศมีการทำงานของกล้องวงจรปิดในบริเวณนั้น ต้องขออภัยมา ณ ที่นี้ด้วยครับ" },
    { label: '❌ ปฏิเสธ (เอกสารไม่ครบ)', text: "ไม่สามารถดำเนินการให้ได้เนื่องจากเอกสารหลักฐานไม่ครบถ้วน รบกวนท่านแนบเอกสารเพิ่มเติมและยื่นคำร้องใหม่อีกครั้งครับ" },
  ];

  // Fetching real-time data
  useEffect(() => {
    if (!db) return;
    const q = collection(db, 'cctv_requests');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as CCTVRequest[];
      setRequests(data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Data Analysis calculations
  const statsData = useMemo(() => {
    const eventCounts: Record<string, number> = {};
    const statusCounts: Record<string, number> = {};
    const deliveryCounts: Record<string, number> = {};
    
    requests.forEach(req => {
      const type = eventTypeMap[req.eventType] || 'อื่นๆ';
      eventCounts[type] = (eventCounts[type] || 0) + 1;
      
      const status = statusMap[req.status] || req.status;
      statusCounts[status] = (statusCounts[status] || 0) + 1;
      
      const method = req.deliveryMethod === 'LINE' ? 'รับผ่าน LINE' : 'รับด้วยตนเอง';
      deliveryCounts[method] = (deliveryCounts[method] || 0) + 1;
    });

    return {
      eventChart: Object.entries(eventCounts).map(([name, value]) => ({ name, value })),
      statusChart: Object.entries(statusCounts).map(([name, value]) => ({ name, value })),
      deliveryChart: Object.entries(deliveryCounts).map(([name, value]) => ({ name, value })),
      total: requests.length
    };
  }, [requests]);

  // Leaflet Map logic
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
        const script = document.createElement("script");
        script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
        script.async = true; script.onload = initMap;
        document.body.appendChild(script);
      } else { initMap(); }
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
        note: adminNote || `อัปเดตสถานะเป็น: ${statusMap[tempStatus] || tempStatus}` 
      };
      await updateDoc(requestRef, { status: tempStatus, adminNote: adminNote, statusHistory: arrayUnion(newHistoryItem) });
      setSelectedRequest({ ...selectedRequest, status: tempStatus as any, adminNote: adminNote, statusHistory: [...(selectedRequest.statusHistory || []), newHistoryItem] });
      setAdminNote('');
    } catch (error) { console.error(error); } finally { setIsUpdating(false); }
  };

  const filteredRequests = requests.filter(req => {
    const matchesStatus = filterStatus === 'all' || req.status === filterStatus;
    const search = searchQuery.toLowerCase();
    return matchesStatus && (req.name.toLowerCase().includes(search) || req.trackingId.toLowerCase().includes(search));
  });

  const getStatusConfig = (status: string) => {
    const configs: any = {
      pending: { color: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock },
      verifying: { color: 'bg-blue-50 text-blue-700 border-blue-200', icon: ShieldCheck },
      searching: { color: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: Search },
      completed: { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle },
      rejected: { color: 'bg-red-50 text-red-700 border-red-200', icon: XCircle },
    };
    return configs[status] || configs.pending;
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-blue-600 w-10 h-10" /></div>;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-blue-100 antialiased">
      <div className="max-w-[1400px] mx-auto p-4 md:p-6">
        
        {/* --- Header & Tabs --- */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-900 flex items-center justify-center text-white shadow-xl">
              <LayoutDashboard className="w-6 h-6" />
            </div>
            <div>
               <h1 className="text-2xl font-black tracking-tight leading-none uppercase">CCTV Admin Portal</h1>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Municipality Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <div className="flex p-1 bg-slate-200/50 rounded-xl overflow-hidden">
                <button onClick={() => setActiveTab('list')} className={`px-4 py-2 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all ${activeTab === 'list' ? 'bg-white text-blue-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>List View</button>
                <button onClick={() => setActiveTab('stats')} className={`px-4 py-2 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all ${activeTab === 'stats' ? 'bg-white text-blue-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Analytics</button>
             </div>
             <button onClick={onLogout} className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-red-600 transition-all shadow-sm active:scale-95"><LogOut className="w-5 h-5" /></button>
          </div>
        </div>

        {activeTab === 'list' ? (
          <>
            {/* --- Toolbar --- */}
            <div className="bg-white p-3 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                <input type="text" placeholder="ค้นหาชื่อ หรือ Tracking ID..." className="w-full pl-11 pr-6 py-2.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-50 outline-none font-bold text-sm text-slate-800" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
              </div>
              <div className="relative">
                <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <select className="pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-100 rounded-2xl font-black text-[11px] text-slate-700 appearance-none cursor-pointer hover:bg-white outline-none uppercase tracking-widest" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                  <option value="all">ทุกสถานะ</option>
                  {Object.entries(statusMap).map(([key, val]) => <option key={key} value={key}>{val}</option>)}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* --- List Table --- */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden mb-8">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-6 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Tracking ID</th>
                    <th className="px-6 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">ผู้ยื่นคำร้อง</th>
                    <th className="px-6 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">สถานะ</th>
                    <th className="px-6 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-sm font-medium">
                  {filteredRequests.map((req) => {
                    const statusConfig = getStatusConfig(req.status);
                    return (
                      <tr key={req.id} className="hover:bg-slate-50/80 transition-colors cursor-pointer group" onClick={() => { setSelectedRequest(req); setTempStatus(req.status); }}>
                        <td className="px-6 py-4 font-mono font-bold text-blue-900 text-xs tracking-tighter uppercase">{req.trackingId}</td>
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-900">{req.name}</p>
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest font-mono mt-0.5">{req.phone}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase border tracking-widest shadow-sm ${statusConfig.color}`}>
                            <statusConfig.icon className="w-3 h-3" /> {statusMap[req.status] || req.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="inline-flex p-2 bg-white border border-slate-200 text-slate-400 group-hover:text-blue-900 group-hover:border-blue-900 rounded-xl transition-all shadow-sm">
                            <Eye className="w-4 h-4" />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filteredRequests.length === 0 && (
                <div className="py-20 text-center">
                  <Search className="w-12 h-12 text-slate-200 mx-auto mb-2" />
                  <p className="text-slate-400 font-black uppercase tracking-widest text-[9px] italic">ไม่พบข้อมูลที่ค้นหา</p>
                </div>
              )}
            </div>
          </>
        ) : (
          /* --- Analytics Section --- */
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { label: 'คำร้องสะสม', val: statsData.total, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
                { label: 'รอดำเนินการ', val: requests.filter(r => r.status === 'pending').length, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
                { label: 'สำเร็จแล้ว', val: requests.filter(r => r.status === 'completed').length, icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                { label: 'รับผ่าน LINE', val: `${Math.round((requests.filter(r => r.deliveryMethod === 'LINE').length / statsData.total) * 100 || 0)}%`, icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
              ].map((c, i) => (
                <div key={i} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm group">
                  <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center mb-3 ${c.color} group-hover:scale-110 transition-transform`}><c.icon className="w-5 h-5" /></div>
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">{c.label}</p>
                  <p className="text-2xl font-black text-slate-900 tracking-tighter">{c.val}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3 mb-6 border-b pb-4">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-xl"><BarChart3 className="w-4 h-4" /></div>
                  <h3 className="font-black text-xs uppercase tracking-widest text-slate-700">สัดส่วนประเภทเหตุการณ์</h3>
                </div>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={statsData.eventChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#cbd5e1' }} />
                      <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '10px' }} />
                      <Bar dataKey="value" fill="#1e3a8a" radius={[6, 6, 0, 0]} barSize={32} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3 mb-6 border-b pb-4">
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl"><PieChartIcon className="w-4 h-4" /></div>
                  <h3 className="font-black text-xs uppercase tracking-widest text-slate-700">ช่องทางการรับข้อมูล</h3>
                </div>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={statsData.deliveryChart} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                        {statsData.deliveryChart.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '9px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="bg-blue-900 rounded-[2.5rem] p-8 text-white shadow-xl relative overflow-hidden">
               <div className="relative z-10">
                  <h3 className="text-sm font-black mb-6 flex items-center gap-3 uppercase tracking-widest">
                    <TrendingUp className="w-5 h-5 text-emerald-400" /> ข้อมูลวิเคราะห์เชิงลึก (Analytics Insight)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                     <div className="p-5 bg-white/5 rounded-2xl border border-white/10">
                        <p className="text-[9px] font-black uppercase tracking-widest text-blue-300 mb-2">Area Hotspot</p>
                        <p className="text-xs leading-relaxed font-medium">พบความหนาแน่นของ "อุบัติเหตุ" บริเวณหน้าหาดราไวย์ แนะนำการตรวจสอบมุมกล้องและส่องสว่างเชิงรุก</p>
                     </div>
                     <div className="p-5 bg-white/5 rounded-2xl border border-white/10">
                        <p className="text-[9px] font-black uppercase tracking-widest text-blue-300 mb-2">Service Success</p>
                        <p className="text-xs leading-relaxed font-medium">ประชาชนกว่า 80% เลือกรับผ่าน LINE สะท้อนถึงประสิทธิภาพการเข้าถึงบริการดิจิทัลที่สะดวกขึ้น</p>
                     </div>
                     <div className="p-5 bg-white/5 rounded-2xl border border-white/10">
                        <p className="text-[9px] font-black uppercase tracking-widest text-blue-300 mb-2">Resource Utilization</p>
                        <p className="text-xs leading-relaxed font-medium">ช่วงวันหยุดมีปริมาณคำร้องพุ่งสูงขึ้น 1.5 เท่า ควรจัดเตรียมกำลังเจ้าหน้าที่ตรวจสอบในช่วงเวลาดังกล่าว</p>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        )}

        {/* --- Detail Modal --- */}
        {selectedRequest && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 md:p-6 bg-slate-900/90 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-6xl h-full md:max-h-[92vh] rounded-[2rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 border border-white/20">
              
              <div className="px-6 py-4 md:px-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-md border border-slate-100 text-blue-900">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-slate-900 tracking-tight leading-none mb-1">
                      คำร้อง <span className="font-mono text-blue-600 uppercase">{selectedRequest.trackingId}</span>
                    </h2>
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest bg-white px-2 py-0.5 rounded-lg border border-slate-100 inline-block">
                      {selectedRequest.createdAt?.seconds ? new Date(selectedRequest.createdAt.seconds * 1000).toLocaleString('th-TH') : 'N/A'}
                    </p>
                  </div>
                </div>
                <button onClick={() => setSelectedRequest(null)} className="p-2 bg-white hover:bg-red-50 text-slate-300 hover:text-red-500 rounded-full transition-all border border-slate-100 shadow-sm">
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                  
                  <div className="lg:col-span-2 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <section className="space-y-3">
                         <h4 className="text-[9px] font-black uppercase tracking-[0.3em] text-blue-600 flex items-center gap-2 border-l-3 border-blue-600 pl-3 uppercase">Applicant info</h4>
                         <div className="space-y-4 bg-slate-50/50 p-6 rounded-3xl border border-slate-100 shadow-inner">
                            <div><p className="text-[8px] text-slate-400 font-black uppercase tracking-widest mb-1">Full Name</p><p className="font-bold text-slate-900 text-base">{selectedRequest.name}</p></div>
                            <div className="grid grid-cols-2 gap-2">
                              <div><p className="text-[8px] text-slate-400 font-black uppercase tracking-widest mb-1">National ID</p><p className="font-bold text-slate-800 font-mono text-sm tracking-tight">{selectedRequest.nationalId}</p></div>
                              <div><p className="text-[8px] text-slate-400 font-black uppercase tracking-widest mb-1">Phone</p><p className="font-bold text-slate-800 text-sm font-mono">{selectedRequest.phone}</p></div>
                            </div>
                         </div>
                       </section>
                       <section className="space-y-3">
                         <h4 className="text-[9px] font-black uppercase tracking-[0.3em] text-blue-600 flex items-center gap-2 border-l-3 border-blue-600 pl-3 uppercase">Incident details</h4>
                         <div className="space-y-4 bg-slate-50/50 p-6 rounded-3xl border border-slate-100 shadow-inner">
                            <div><p className="text-[8px] text-slate-400 font-black uppercase tracking-widest mb-1">Schedule</p><p className="font-bold text-slate-800 text-sm">{selectedRequest.eventDate} ({selectedRequest.eventTimeStart}-{selectedRequest.eventTimeEnd})</p></div>
                            <div>
                                <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest mb-1">Incident Category</p>
                                <p className="font-bold text-slate-800 text-sm">
                                    {eventTypeMap[selectedRequest.eventType] || selectedRequest.eventType} 
                                    {selectedRequest.accidentSubtype && (
                                        <span className="text-blue-500 font-black ml-1 text-[10px]">
                                            ({accidentSubtypeMap[selectedRequest.accidentSubtype] || selectedRequest.accidentSubtype})
                                        </span>
                                    )}
                                </p>
                            </div>
                         </div>
                       </section>
                    </div>

                    <section className="space-y-4">
                       <h4 className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 flex items-center gap-2 border-l-3 border-slate-200 pl-3">Location Data</h4>
                       <div className="grid md:grid-cols-3 gap-4">
                          <div className="md:col-span-1 bg-white p-6 border border-slate-200 rounded-3xl flex flex-col justify-center shadow-md">
                             <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest mb-2">Location Notes</p>
                             <p className="font-bold text-slate-800 text-base leading-tight mb-4">{selectedRequest.location}</p>
                             <div className="pt-4 border-t border-slate-100 text-[9px] text-slate-400 font-mono font-bold space-y-1">
                                <p>LAT: {selectedRequest.latitude}</p>
                                <p>LNG: {selectedRequest.longitude}</p>
                             </div>
                          </div>
                          <div className="md:col-span-2 h-[220px] rounded-3xl bg-slate-100 border border-slate-200 overflow-hidden relative shadow-inner">
                             <div ref={mapContainerRef} className="w-full h-full z-0 grayscale hover:grayscale-0 transition-all duration-500" />
                          </div>
                       </div>
                    </section>

                    <section className="space-y-4">
                       <h4 className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 flex items-center gap-2 border-l-3 border-slate-200 pl-3">Official Proofs</h4>
                       <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {[
                            { label: 'ID CARD', url: selectedRequest.attachments?.idCard },
                            { label: 'REPORT', url: selectedRequest.attachments?.report },
                            ...(selectedRequest.attachments?.scene || []).map((url: string, i: number) => ({ label: `PHOTO ${i+1}`, url }))
                          ].map((file, i) => file.url ? (
                            <a key={i} href={file.url} target="_blank" rel="noopener noreferrer" className="group relative h-36 rounded-2xl overflow-hidden border border-slate-100 bg-slate-50 transition-all hover:ring-4 hover:ring-blue-500/10 shadow-sm">
                               <div className="absolute inset-0 bg-blue-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10"><ExternalLink className="text-white w-4 h-4" /></div>
                               <img src={file.url} className="w-full h-full object-cover" alt={file.label} />
                               <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-white/95 backdrop-blur-md text-[7px] font-black uppercase text-center border-t border-slate-100 text-slate-500 tracking-widest">{file.label}</div>
                            </a>
                          ) : (
                            <div key={i} className="h-36 rounded-2xl bg-slate-50 border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-300">
                                <ImageIcon className="w-5 h-5 mb-1 opacity-20" />
                                <span className="text-[7px] font-black uppercase tracking-widest opacity-40">Empty</span>
                            </div>
                          ))}
                       </div>
                    </section>
                  </div>

                  {/* Sidebar Panel */}
                  <div className="space-y-8">
                    <div className="bg-slate-900 rounded-[2rem] p-6 text-white shadow-2xl relative overflow-hidden border border-white/5">
                      <h4 className="text-[9px] font-black uppercase tracking-[0.4em] text-blue-400 mb-8 relative z-10 border-b border-white/10 pb-3">Admin Console</h4>
                      <div className="space-y-6 relative z-10">
                        <div className="space-y-4">
                          <label className="text-[9px] font-black uppercase text-slate-500 block ml-1 tracking-widest">Update Status</label>
                          <div className="grid grid-cols-1 gap-1.5">
                             {Object.entries(statusMap).map(([key, val]) => (
                               <button 
                                 key={key} 
                                 onClick={() => setTempStatus(key)} 
                                 className={`w-full py-3 px-6 rounded-lg text-[10px] font-black text-left transition-all border border-white/5 uppercase tracking-widest ${tempStatus === key ? 'bg-white text-slate-900 shadow-xl scale-[1.02]' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                               >
                                 {val}
                               </button>
                             ))}
                          </div>
                        </div>

                        <div className="space-y-4">
                          <label className="text-[9px] font-black uppercase text-slate-500 block ml-1 flex items-center gap-2 tracking-widest">
                            <MessageSquare className="w-3 h-3" /> Quick Template
                          </label>
                          <div className="relative group">
                            <select 
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-[10px] font-black text-slate-300 outline-none appearance-none cursor-pointer hover:bg-white/10 transition-all uppercase tracking-widest"
                              onChange={(e) => {
                                const val = e.target.value;
                                if(val) setAdminNote(val.replace('[ID]', selectedRequest.trackingId));
                                e.target.value = "";
                              }}
                            >
                              <option value="" className="bg-slate-900 text-slate-500">-- SELECT --</option>
                              {messageTemplates.map((t, idx) => (
                                <option key={idx} value={t.text} className="bg-slate-900 text-white font-sans normal-case">{t.label}</option>
                              ))}
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
                          </div>
                          
                          <textarea 
                            rows={3}
                            className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-[12px] outline-none focus:ring-4 focus:ring-blue-500/20 transition-all font-medium placeholder:text-slate-700 leading-relaxed text-slate-200"
                            placeholder="ระบุรายละเอียด..."
                            value={adminNote}
                            onChange={e => setAdminNote(e.target.value)}
                          />
                        </div>

                        <button 
                          onClick={handleSaveChanges} 
                          disabled={isUpdating || !tempStatus} 
                          className="w-full py-4.5 rounded-xl bg-blue-600 text-white font-black text-[11px] uppercase tracking-[0.3em] shadow-xl hover:bg-blue-500 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 transition-all"
                        >
                          {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                          {isUpdating ? 'SAVING...' : 'SAVE CHANGES'}
                        </button>
                      </div>
                    </div>

                    {/* Timeline: Optimized Spacing & Priority */}
                    <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm">
                       <h4 className="text-[8px] font-black uppercase tracking-[0.4em] text-slate-400 mb-6 border-b pb-2">Operational History</h4>
                       <div className="space-y-4">
                          {selectedRequest.statusHistory?.slice().reverse().map((h, i) => (
                            <div key={i} className={`relative pl-6 transition-all duration-300 ${i === 0 ? 'opacity-100' : 'opacity-40 scale-[0.98] origin-left'}`}>
                               {i !== selectedRequest.statusHistory.length - 1 && <div className="absolute left-[3px] top-5 bottom-[-20px] w-0.5 bg-slate-50"></div>}
                               <div className={`absolute left-0 top-1 w-2 h-2 rounded-full ${i === 0 ? 'bg-blue-600 ring-2 ring-blue-50' : 'bg-slate-300'}`}></div>
                               <div>
                                  <div className="flex justify-between items-center mb-0.5">
                                    <p className={`text-[9px] font-black uppercase tracking-widest ${i === 0 ? 'text-slate-900' : 'text-slate-500'}`}>
                                      {statusMap[h.status] || h.status}
                                    </p>
                                    <p className="text-[7px] text-slate-400 font-black font-mono">
                                      {h.timestamp?.seconds ? new Date(h.timestamp.seconds * 1000).toLocaleString('th-TH', { hour: '2-digit', minute: '2-digit' }) : 'NOW'}
                                    </p>
                                  </div>
                                  <div className={`text-[11px] font-medium leading-normal rounded-lg border italic ${i === 0 ? 'bg-slate-900 text-white p-3 border-slate-800 shadow-sm' : 'bg-slate-50 text-slate-500 p-2 border-slate-100'}`}>
                                    "{h.note}"
                                  </div>
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