'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  collection, query, onSnapshot, doc, updateDoc, 
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
  ChevronRight, 
  Filter, 
  Save, 
  MessageSquare, 
  ChevronDown,
  ShieldCheck,
  ExternalLink // ✅ เพิ่ม Import นี้เพื่อให้ Error หายไป
} from 'lucide-react';
import { CCTVRequest } from '../../types';

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

  // ✅ รายการข้อความสำเร็จรูป (Templates)
  const messageTemplates = [
    { label: '🟢 พบภาพ (Line OA)', text: "เจ้าหน้าที่ได้ตรวจสอบกล้องวงจรปิดเรียบร้อยแล้ว 'พบภาพเหตุการณ์' ตามที่ท่านแจ้ง กรุณาติดต่อขอรับลิงก์ดาวน์โหลดไฟล์ภาพผ่านทาง Line OA :@745jasmc หรือ QR-Code ที่ปรากฏ โดยแจ้งเลขที่คำร้อง [ID] ให้เจ้าหน้าที่ทราบครับ/ค่ะ" },
    { label: '🟢 พบภาพ (รับเอง)', text: "ตรวจสอบพบภาพเหตุการณ์เรียบร้อยแล้วครับ/ค่ะ ท่านสามารถนำอุปกรณ์จัดเก็บข้อมูลมาติดต่อรับไฟล์ภาพได้ที่ ศูนย์ CCTV เทศบาลตำบลราไวย์ ในวันและเวลาทำการ โปรดเตรียมบัตรประชาชนตัวจริงมาแสดงด้วยครับ/ค่ะ" },
    { label: '🟡 ขอพิกัดเพิ่ม', text: "เจ้าหน้าที่ได้รับคำร้องของท่านแล้ว แต่เพื่อความแม่นยำในการระบุตำแหน่งกล้อง รบกวนท่านส่ง 'ภาพถ่ายสถานที่เกิดเหตุจริง' หรือจุดสังเกตเพิ่มเติมเข้ามาทาง Line OA พร้อมแจ้งเลขที่คำร้องด้วยครับ/ค่ะ" },
    { label: '🟡 ขอเวลาเพิ่ม', text: "เนื่องจากช่วงเวลาที่ท่านแจ้งค่อนข้างกว้าง รบกวนท่านระบุ 'ช่วงเวลาที่เกิดเหตุให้แคบลง' (บวกลบไม่เกิน 30 นาที) เพื่อความรวดเร็วในการค้นหาครับ/ค่ะ" },
    { label: '🔴 ไม่พบภาพ (นอกรัศมี)', text: "เจ้าหน้าที่ดำเนินการตรวจสอบกล้องบริเวณดังกล่าวอย่างละเอียดแล้ว 'ไม่พบภาพเหตุการณ์' เนื่องจากจุดที่เกิดเหตุอยู่นอกรัศมีการทำงานของกล้องวงจรปิดในบริเวณนั้น ต้องขออภัยมา ณ ที่นี้ด้วยครับ/ค่ะ" },
    { label: '🔴 ไม่พบภาพ (บันทึกทับ)', text: "จากการตรวจสอบ พบว่าเหตุการณ์ที่ท่านแจ้งเกิดขึ้นนานเกินกว่าระยะเวลาที่ระบบจัดเก็บข้อมูลไว้ ทำให้ข้อมูลเดิมถูกบันทึกทับไปแล้ว จึงไม่สามารถกู้คืนภาพได้ครับ/ค่ะ" },
    { label: '❌ ปฏิเสธ (ขาดใบแจ้งความ)', text: "ไม่สามารถดำเนินการให้ได้เนื่องจากจำเป็นต้องมี 'ใบแจ้งความจากสถานีตำรวจ' แนบมาด้วยเพื่อเป็นหลักฐานทางกฎหมาย รบกวนท่านแนบเอกสารเพิ่มและยื่นคำร้องใหม่อีกครั้งครับ/ค่ะ" },
  ];

  // 1. ดึงข้อมูลแบบ Real-time
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
      console.error("Firestore Listen Error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. จัดการแผนที่ Leaflet
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

  // 3. ฟังก์ชันบันทึกการเปลี่ยนแปลง
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
      console.error("Error updating status:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredRequests = requests.filter(req => {
    const matchesStatus = filterStatus === 'all' || req.status === filterStatus;
    const nameStr = req.name || '';
    const trackingIdStr = req.trackingId || '';
    const matchesSearch = nameStr.toLowerCase().includes(searchQuery.toLowerCase()) || trackingIdStr.toLowerCase().includes(searchQuery.toLowerCase());
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

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50/50 font-sans text-slate-900 selection:bg-blue-100">
      <div className="max-w-[1600px] mx-auto p-4 md:p-8">
        
        {/* Top Header */}
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-3">
              <LayoutDashboard className="w-7 h-7 text-blue-900" />
              แผงควบคุมเจ้าหน้าที่ <span className="text-blue-600">CCTV RAWAI</span>
            </h1>
          </div>
          <button onClick={onLogout} className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-500 font-bold text-xs hover:text-red-600 transition-all shadow-sm">
            <LogOut className="w-4 h-4" /> ออกจากระบบ
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
            <input type="text" placeholder="ค้นหาชื่อผู้แจ้ง หรือ ID..." className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-50 outline-none transition-all font-medium text-slate-800" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </div>
          <div className="relative">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select className="pl-10 pr-10 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 appearance-none cursor-pointer hover:bg-slate-100 transition-colors outline-none" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
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

        {/* Main Table */}
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden mb-12">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Tracking ID</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">ผู้ยื่นคำร้อง</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">สถานะ</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">ดำเนินการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredRequests.map((req) => {
                const status = getStatusConfig(req.status);
                return (
                  <tr key={req.id} className="hover:bg-slate-50/50 transition-colors group cursor-pointer" onClick={() => { setSelectedRequest(req); setTempStatus(req.status); }}>
                    <td className="px-8 py-7 font-mono font-bold text-blue-900 text-sm">{req.trackingId}</td>
                    <td className="px-8 py-7 font-black text-slate-900">{req.name}</td>
                    <td className="px-8 py-7">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase border ${status.color}`}>
                          <status.icon className="w-3 h-3" /> {status.label}
                        </span>
                    </td>
                    <td className="px-8 py-7 text-right">
                      <button className="p-3 bg-white border border-slate-200 hover:border-blue-900 hover:text-blue-900 rounded-2xl transition-all shadow-sm">
                        <Eye className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Modal: Full Details */}
        {selectedRequest && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-6xl h-full md:max-h-[90vh] rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
              
              <div className="p-6 md:p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shadow-md border border-slate-100 text-blue-900"><FileText className="w-7 h-7" /></div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-900">คำร้อง #{selectedRequest.trackingId}</h2>
                    <p className="text-xs text-slate-400 font-bold uppercase mt-1 italic">ได้รับเมื่อ {selectedRequest.createdAt?.seconds ? new Date(selectedRequest.createdAt.seconds * 1000).toLocaleString('th-TH') : 'N/A'}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedRequest(null)} className="p-3 bg-white hover:bg-red-50 hover:text-red-500 rounded-full transition-all text-slate-300 border border-slate-100"><XCircle className="w-8 h-8" /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 md:p-10 custom-scrollbar">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                  
                  <div className="lg:col-span-2 space-y-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <section className="space-y-4">
                          <h4 className="text-[11px] font-black uppercase tracking-[0.25em] text-blue-600 mb-6 flex items-center gap-2"><User className="w-3 h-3" /> ข้อมูลผู้ยื่น</h4>
                          <div className="space-y-4 bg-slate-50 p-7 rounded-[2rem] border border-slate-100">
                            <div><p className="text-[10px] text-slate-400 font-black mb-1">ชื่อ-นามสกุล</p><p className="font-black text-slate-800">{selectedRequest.name}</p></div>
                            <div><p className="text-[10px] text-slate-400 font-black mb-1">เลขบัตรประชาชน</p><p className="font-bold text-slate-800 font-mono">{selectedRequest.nationalId}</p></div>
                            <div><p className="text-[10px] text-slate-400 font-black mb-1">เบอร์ติดต่อ</p><p className="font-black text-slate-800">{selectedRequest.phone}</p></div>
                          </div>
                        </section>
                        <section className="space-y-4">
                          <h4 className="text-[11px] font-black uppercase tracking-[0.25em] text-blue-600 mb-6 flex items-center gap-2"><Activity className="w-3 h-3" /> ข้อมูลเหตุการณ์</h4>
                          <div className="space-y-4 bg-slate-50 p-7 rounded-[2rem] border border-slate-100">
                            <div><p className="text-[10px] text-slate-400 font-black mb-1">วันเวลาเกิดเหตุ</p><p className="font-black text-slate-800">{selectedRequest.eventDate} ({selectedRequest.eventTimeStart}-{selectedRequest.eventTimeEnd})</p></div>
                            <div><p className="text-[10px] text-slate-400 font-black mb-1">ลักษณะเหตุ</p><p className="font-black text-slate-800">{selectedRequest.eventType} {selectedRequest.accidentSubtype && `(${selectedRequest.accidentSubtype})`}</p></div>
                          </div>
                        </section>
                    </div>

                    {/* Live Map */}
                    <section>
                        <h4 className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-400 mb-6 flex items-center gap-3"><MapPin className="w-4 h-4 text-red-500" /> พิกัดสถานที่เกิดเหตุ</h4>
                        <div className="grid md:grid-cols-3 gap-6">
                          <div className="md:col-span-1 bg-white p-7 border border-slate-200 rounded-[2rem] flex flex-col justify-center">
                              <p className="font-black text-slate-800 text-lg leading-tight mb-4">{selectedRequest.location}</p>
                              <div className="pt-4 border-t border-slate-100 text-[9px] text-slate-400 font-mono"><p>LAT: {selectedRequest.latitude}</p><p>LNG: {selectedRequest.longitude}</p></div>
                          </div>
                          <div className="md:col-span-2 h-64 rounded-[2rem] bg-slate-100 border border-slate-200 overflow-hidden relative shadow-inner">
                              <div ref={mapContainerRef} className="w-full h-full z-0" />
                          </div>
                        </div>
                    </section>

                    {/* Evidence Images */}
                    <section>
                        <h4 className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-400 mb-8 flex items-center gap-2"><ImageIcon className="w-4 h-4" /> เอกสารและหลักฐาน</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                          {[
                            { label: 'บัตรประชาชน', url: selectedRequest.attachments?.idCard },
                            { label: 'ใบแจ้งความ', url: selectedRequest.attachments?.report },
                            ...(selectedRequest.attachments?.scene || []).map((url: string, i: number) => ({ label: `ภาพเหตุการณ์ ${i+1}`, url }))
                          ].map((file, i) => file.url ? (
                            <a key={i} href={file.url} target="_blank" rel="noopener noreferrer" className="group relative h-44 rounded-3xl overflow-hidden border-2 border-slate-100 bg-slate-50 shadow-sm transition-all hover:ring-8 hover:ring-blue-50/50">
                               <div className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10"><ExternalLink className="text-white w-7 h-7" /></div>
                               <img src={file.url} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt={file.label} />
                               <div className="absolute bottom-0 left-0 right-0 p-3 bg-white/95 backdrop-blur-md text-[10px] font-black uppercase text-center border-t border-slate-100 text-slate-600">{file.label}</div>
                            </a>
                          ) : <div key={i} className="h-44 rounded-3xl bg-slate-50 border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-300"><ImageIcon className="w-8 h-8 mb-1" /><span className="text-[9px] font-bold">ไม่มีข้อมูล</span></div>)}
                        </div>
                    </section>
                  </div>

                  {/* Right Column: Admin Control */}
                  <div className="space-y-10">
                    <div className="bg-slate-900 rounded-[2.5rem] p-9 text-white shadow-2xl relative overflow-hidden">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-400 mb-8 relative z-10">Admin Control Panel</h4>
                      <div className="space-y-8 relative z-10">
                        <div className="space-y-4">
                          <label className="text-[10px] font-black uppercase text-slate-500 block ml-1 tracking-[0.2em]">เลือกสถานะ</label>
                          <div className="grid grid-cols-1 gap-2.5">
                             {[
                               { val: 'pending', label: 'รอการตรวจสอบ', color: 'hover:bg-amber-600' },
                               { val: 'verifying', label: 'ตรวจสอบเอกสาร', color: 'hover:bg-blue-600' },
                               { val: 'searching', label: 'กำลังค้นหาภาพ', color: 'hover:bg-indigo-600' },
                               { val: 'completed', label: 'ดำเนินการสำเร็จ', color: 'hover:bg-emerald-600' },
                               { val: 'rejected', label: 'ปฏิเสธ/ยกเลิก', color: 'hover:bg-red-600' }
                             ].map(opt => (
                               <button key={opt.val} onClick={() => setTempStatus(opt.val)} className={`w-full py-4 px-6 rounded-2xl text-[11px] font-black text-left transition-all border border-white/5 uppercase tracking-widest ${tempStatus === opt.val ? 'bg-white text-slate-900 shadow-xl' : 'text-slate-400 hover:text-white ' + opt.color}`}>{opt.label}</button>
                             ))}
                          </div>
                        </div>

                        {/* Template Section */}
                        <div className="space-y-4">
                          <label className="text-[10px] font-black uppercase text-slate-500 block ml-1 flex items-center gap-2 tracking-[0.2em]">
                            <MessageSquare className="w-3 h-3" /> ข้อความตอบกลับสำเร็จรูป
                          </label>
                          <div className="relative group">
                            <select 
                              className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-xs font-bold text-slate-300 outline-none appearance-none cursor-pointer hover:bg-white/10 transition-all pr-12"
                              onChange={(e) => {
                                const val = e.target.value;
                                if(val) setAdminNote(val.replace('[ID]', selectedRequest.trackingId));
                                e.target.value = "";
                              }}
                            >
                              <option value="" className="bg-slate-900 text-slate-500">-- เลือกข้อความรวดเร็ว --</option>
                              {messageTemplates.map((t, idx) => (
                                <option key={idx} value={t.text} className="bg-slate-900 text-white py-2">{t.label}</option>
                              ))}
                            </select>
                            <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                          </div>
                          
                          <textarea 
                            rows={4}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-sm outline-none focus:ring-4 focus:ring-blue-500/20 focus:bg-white/10 transition-all font-medium placeholder:text-slate-700 leading-relaxed"
                            placeholder="ระบุรายละเอียด หรือใช้ข้อความสำเร็จรูปด้านบน..."
                            value={adminNote}
                            onChange={e => setAdminNote(e.target.value)}
                          />
                        </div>

                        <button onClick={handleSaveChanges} disabled={isUpdating || !tempStatus} className="w-full py-5 rounded-2xl bg-blue-600 text-white font-black text-sm uppercase tracking-[0.2em] shadow-xl hover:bg-blue-500 disabled:opacity-50 flex items-center justify-center gap-3 transition-all">
                          {isUpdating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                          {isUpdating ? 'กำลังบันทึก...' : 'บันทึกการอัปเดต'}
                        </button>
                      </div>
                    </div>

                    {/* History */}
                    <div className="p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm">
                        <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 mb-10">ประวัติการดำเนินการ</h4>
                        <div className="space-y-10">
                          {selectedRequest.statusHistory?.map((h, i) => (
                            <div key={i} className="relative pl-8">
                               {/* ✅ แก้ไขตรงนี้: เพิ่ม || 0 เพื่อกัน error ถ้า statusHistory เป็น undefined */}
                               {i !== (selectedRequest.statusHistory?.length || 0) - 1 && <div className="absolute left-[3px] top-6 bottom-[-40px] w-0.5 bg-slate-100"></div>}
                               <div className="absolute left-0 top-1.5 w-2 h-2 rounded-full bg-blue-600 ring-4 ring-blue-50"></div>
                               <div>
                                  <p className="text-xs font-black text-slate-800 uppercase">{h.status}</p>
                                  <p className="text-[9px] text-slate-400 font-bold mb-3">{h.timestamp?.seconds ? new Date(h.timestamp.seconds * 1000).toLocaleString('th-TH') : 'Just now'}</p>
                                  <p className="text-xs text-slate-500 font-medium leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100 italic">"{h.note}"</p>
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