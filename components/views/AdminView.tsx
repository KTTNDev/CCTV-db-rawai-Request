'use client';

import React, { useState, useEffect } from 'react';
import { 
  collection, query, onSnapshot, doc, updateDoc, 
  arrayUnion 
} from 'firebase/firestore';
/**
 * ✅ แก้ไขปัญหา Path Error โดยเปลี่ยนมาใช้ Relative Path
 * เพื่อให้แน่ใจว่าระบบสามารถค้นหาไฟล์พบในทุกสภาพแวดล้อมการ Build
 */
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
  Phone,
  Calendar,
  ExternalLink,
  ShieldCheck,
  Activity,
  Loader2
} from 'lucide-react';
import { CCTVRequest } from '../../types';

const AdminView = () => {
  const [requests, setRequests] = useState<CCTVRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<CCTVRequest | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [adminNote, setAdminNote] = useState('');

  const brandGradient = "linear-gradient(90deg, hsla(222, 51%, 34%, 1) 0%, hsla(119, 37%, 45%, 1) 100%)";

  // 1. ดึงข้อมูลคำร้องแบบ Real-time จาก Firestore
  useEffect(() => {
    if (!db) return;
    const q = collection(db, 'cctv_requests');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CCTVRequest[];
      
      // เรียงลำดับตามวันที่สร้าง (ใหม่สุดขึ้นก่อน)
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

  // 2. ฟังก์ชันอัปเดตสถานะและบันทึกประวัติการดำเนินการ (Audit Logs)
  const handleUpdateStatus = async (requestId: string, newStatus: string) => {
    setIsUpdating(true);
    try {
      const requestRef = doc(db, 'cctv_requests', requestId);
      await updateDoc(requestRef, {
        status: newStatus,
        adminNote: adminNote,
        statusHistory: arrayUnion({
          status: newStatus,
          timestamp: new Date(),
          note: adminNote || `ปรับเปลี่ยนสถานะเป็น: ${newStatus}`
        })
      });
      setAdminNote('');
      // อัปเดตสถานะในหน้า Modal ทันที
      if (selectedRequest && selectedRequest.id === requestId) {
        setSelectedRequest({ ...selectedRequest, status: newStatus as any });
      }
    } catch (error) {
      console.error("Error updating status:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  // 3. จัดการการกรองข้อมูล (Filtering Logic)
  const filteredRequests = requests.filter(req => {
    const matchesStatus = filterStatus === 'all' || req.status === filterStatus;
    const nameStr = req.name || '';
    const trackingIdStr = req.trackingId || '';
    const matchesSearch = 
      nameStr.toLowerCase().includes(searchQuery.toLowerCase()) || 
      trackingIdStr.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // กำหนดสไตล์และข้อความตามสถานะงาน
  const getStatusConfig = (status: string) => {
    const configs: any = {
      pending: { color: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock, label: 'รอตรวจสอบ' },
      verifying: { color: 'bg-blue-50 text-blue-700 border-blue-200', icon: ShieldCheck, label: 'ตรวจสอบเอกสาร' },
      searching: { color: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: Search, label: 'กำลังค้นหาภาพ' },
      completed: { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle, label: 'เสร็จสิ้น' },
      rejected: { color: 'bg-red-50 text-red-700 border-red-200', icon: XCircle, label: 'ปฏิเสธคำร้อง' },
    };
    return configs[status] || configs.pending;
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
          <p className="font-bold text-slate-500 animate-pulse uppercase tracking-widest text-xs">กำลังเตรียมข้อมูลระบบหลังบ้าน...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 font-sans text-slate-900">
      <div className="max-w-[1600px] mx-auto p-4 md:p-8">
        
        {/* ส่วนหัวแผงควบคุมและสถิติภาพรวม */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 flex items-center gap-3">
              <LayoutDashboard className="w-8 h-8 text-blue-900" />
              ระบบบริหารจัดการ <span className="text-blue-600">CCTV Portal</span>
            </h1>
            <p className="text-slate-500 font-medium mt-1">เจ้าหน้าที่เทศบาลตำบลราไวย์ (Admin & Staff Dashboard)</p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            {[
              { label: 'รอดำเนินการ', count: requests.filter(r => r.status === 'pending').length, bg: 'bg-amber-500' },
              { label: 'กำลังดำเนินการ', count: requests.filter(r => ['verifying', 'searching'].includes(r.status)).length, bg: 'bg-blue-500' },
              { label: 'สำเร็จแล้ว', count: requests.filter(r => r.status === 'completed').length, bg: 'bg-emerald-500' }
            ].map((stat, i) => (
              <div key={i} className="bg-white px-6 py-4 rounded-[1.5rem] border border-slate-200 shadow-sm flex items-center gap-5 min-w-[160px]">
                <div className={`w-3 h-3 rounded-full ${stat.bg} shadow-lg shadow-current/20`}></div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{stat.label}</p>
                  <p className="text-2xl font-black text-slate-900 leading-none">{stat.count}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* แถบเครื่องมือ: ค้นหาและคัดกรองสถานะ */}
        <div className="bg-white p-4 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="ค้นหาชื่อผู้ยื่นคำร้อง หรือ เลขที่คำร้อง (REQ-ID)..." 
              className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-50 focus:bg-white focus:border-blue-500 outline-none transition-all font-medium text-slate-800"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <select 
              className="px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none cursor-pointer hover:bg-slate-100 transition-colors"
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
            >
              <option value="all">แสดงงานทุกสถานะ</option>
              <option value="pending">รอการตรวจสอบ (New)</option>
              <option value="verifying">ตรวจสอบเอกสาร (Verifying)</option>
              <option value="searching">ค้นหาภาพ (Searching)</option>
              <option value="completed">เสร็จสิ้น (Completed)</option>
              <option value="rejected">ปฏิเสธแล้ว (Rejected)</option>
            </select>
          </div>
        </div>

        {/* การแสดงผลบน PC: รูปแบบตาราง (Table) */}
        <div className="hidden lg:block bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100">
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Tracking ID</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">ผู้ยื่นคำร้อง / ประเภท</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">วันเวลาเกิดเหตุ</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center">หลักฐาน</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">สถานะงาน</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredRequests.map((req) => {
                const status = getStatusConfig(req.status);
                const StatusIcon = status.icon;
                return (
                  <tr key={req.id} className="hover:bg-slate-50/50 transition-colors group cursor-pointer" onClick={() => setSelectedRequest(req)}>
                    <td className="px-8 py-7 font-mono font-bold text-blue-900 text-sm tracking-tight">{req.trackingId}</td>
                    <td className="px-8 py-7">
                      <p className="font-bold text-slate-900 text-base">{req.name}</p>
                      <p className="text-xs text-slate-400 mt-1 font-medium bg-slate-100 inline-block px-2 py-0.5 rounded-md">{req.eventType}</p>
                    </td>
                    <td className="px-8 py-7">
                      <p className="text-sm font-bold text-slate-700">{req.eventDate}</p>
                      <p className="text-xs text-slate-400 mt-1">{req.eventTimeStart} น. - {req.eventTimeEnd} น.</p>
                    </td>
                    <td className="px-8 py-7 text-center">
                      <div className="inline-flex gap-2">
                        <div title="บัตรประชาชน" className={`w-2.5 h-2.5 rounded-full ${req.attachments?.idCard ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'bg-slate-200'}`}></div>
                        <div title="ใบแจ้งความ" className={`w-2.5 h-2.5 rounded-full ${req.attachments?.report ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'bg-slate-200'}`}></div>
                        <div title="ภาพเหตุการณ์" className={`w-2.5 h-2.5 rounded-full ${req.attachments?.scene?.length ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-200'}`}></div>
                      </div>
                    </td>
                    <td className="px-8 py-7">
                       <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-sm ${status.color}`}>
                         <StatusIcon className="w-3.5 h-3.5" />
                         {status.label}
                       </span>
                    </td>
                    <td className="px-8 py-7 text-right">
                      <div className="flex justify-end">
                         <button className="p-3 bg-white border border-slate-200 hover:bg-blue-900 hover:text-white hover:border-blue-900 rounded-2xl transition-all shadow-sm group-hover:scale-110">
                            <Eye className="w-5 h-5" />
                         </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredRequests.length === 0 && (
            <div className="py-32 text-center">
               <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Search className="w-10 h-10 text-slate-200" />
               </div>
               <p className="text-slate-400 font-bold text-lg uppercase tracking-widest">ไม่พบข้อมูลคำร้อง</p>
            </div>
          )}
        </div>

        {/* การแสดงผลบนมือถือ: รูปแบบการ์ด (Cards) */}
        <div className="lg:hidden space-y-4">
          {filteredRequests.map((req) => {
            const status = getStatusConfig(req.status);
            return (
              <div 
                key={req.id} 
                onClick={() => setSelectedRequest(req)}
                className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm active:scale-[0.98] transition-all"
              >
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 block">ID: {req.trackingId}</span>
                    <h3 className="text-xl font-black text-slate-900 leading-tight">{req.name}</h3>
                  </div>
                  <span className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase border shadow-sm ${status.color}`}>
                    {status.label}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-y-4 mb-6">
                  <div className="flex items-center gap-3 text-xs font-bold text-slate-600">
                    <Calendar className="w-4 h-4 text-blue-500" /> {req.eventDate}
                  </div>
                  <div className="flex items-center gap-3 text-xs font-bold text-slate-600">
                    <Activity className="w-4 h-4 text-emerald-500" /> {req.eventType}
                  </div>
                </div>
                <button className="w-full py-4 bg-slate-50 text-blue-900 font-black text-xs uppercase tracking-[0.15em] rounded-2xl flex items-center justify-center gap-2 border border-slate-100 hover:bg-blue-50 transition-colors">
                  <Eye className="w-4 h-4" /> ตรวจสอบรายละเอียด
                </button>
              </div>
            );
          })}
        </div>

        {/* หน้าต่าง Modal: ตรวจสอบข้อมูลเชิงลึกและอัปเดตสถานะ */}
        {selectedRequest && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-6xl h-full md:max-h-[90vh] rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
              
              {/* Header ของ Modal */}
              <div className="p-6 md:p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shadow-md border border-slate-100">
                    <FileText className="w-7 h-7 text-blue-900" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 leading-tight">คำร้อง #{selectedRequest.trackingId}</h2>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1 italic">
                      Received at {selectedRequest.createdAt?.seconds ? new Date(selectedRequest.createdAt.seconds * 1000).toLocaleString('th-TH') : 'N/A'}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedRequest(null)} 
                  className="p-3 bg-white hover:bg-red-50 hover:text-red-500 rounded-full transition-all text-slate-300 shadow-sm border border-slate-100"
                >
                  <XCircle className="w-8 h-8" />
                </button>
              </div>

              {/* เนื้อหาหลักใน Modal */}
              <div className="flex-1 overflow-y-auto p-6 md:p-10">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                  
                  {/* คอลัมน์ซ้ายและกลาง: ส่วนแสดงข้อมูลของผู้แจ้ง */}
                  <div className="lg:col-span-2 space-y-12">
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                       <section>
                         <h4 className="text-[11px] font-black uppercase tracking-[0.25em] text-blue-600 mb-6 flex items-center gap-2">
                           <User className="w-3 h-3" /> ข้อมูลผู้ยื่นคำร้อง
                         </h4>
                         <div className="space-y-4 bg-slate-50 p-7 rounded-[2rem] border border-slate-100 shadow-inner">
                            <div className="flex items-center gap-4">
                               <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-300 shadow-sm border border-slate-50"><User className="w-5 h-5" /></div>
                               <div><p className="text-[10px] text-slate-400 font-black uppercase leading-none mb-1">ชื่อ-นามสกุล</p><p className="font-black text-slate-800">{selectedRequest.name}</p></div>
                            </div>
                            <div className="flex items-center gap-4">
                               <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-300 shadow-sm border border-slate-50"><ShieldCheck className="w-5 h-5" /></div>
                               <div><p className="text-[10px] text-slate-400 font-black uppercase leading-none mb-1">เลขบัตรประชาชน</p><p className="font-bold text-slate-800 font-mono tracking-tighter">{selectedRequest.nationalId}</p></div>
                            </div>
                            <div className="flex items-center gap-4">
                               <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-300 shadow-sm border border-slate-50"><Phone className="w-5 h-5" /></div>
                               <div><p className="text-[10px] text-slate-400 font-black uppercase leading-none mb-1">เบอร์ติดต่อ</p><p className="font-black text-slate-800">{selectedRequest.phone}</p></div>
                            </div>
                         </div>
                       </section>
                       
                       <section>
                         <h4 className="text-[11px] font-black uppercase tracking-[0.25em] text-blue-600 mb-6 flex items-center gap-2">
                           <Activity className="w-3 h-3" /> ข้อมูลเหตุการณ์
                         </h4>
                         <div className="space-y-4 bg-slate-50 p-7 rounded-[2rem] border border-slate-100 shadow-inner">
                            <div className="flex items-center gap-4">
                               <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-300 shadow-sm border border-slate-50"><Calendar className="w-5 h-5" /></div>
                               <div><p className="text-[10px] text-slate-400 font-black uppercase leading-none mb-1">วันเวลาเกิดเหตุ</p><p className="font-black text-slate-800">{selectedRequest.eventDate} ({selectedRequest.eventTimeStart} - {selectedRequest.eventTimeEnd} น.)</p></div>
                            </div>
                            <div className="flex items-center gap-4">
                               <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-300 shadow-sm border border-slate-50"><Activity className="w-5 h-5" /></div>
                               <div><p className="text-[10px] text-slate-400 font-black uppercase leading-none mb-1">ประเภทหลัก / ย่อย</p><p className="font-black text-slate-800">{selectedRequest.eventType} {selectedRequest.accidentSubtype && <span className="text-blue-600 ml-1">({selectedRequest.accidentSubtype})</span>}</p></div>
                            </div>
                         </div>
                       </section>
                    </div>

                    {/* ส่วนแสดงพิกัดและตำแหน่งเกิดเหตุ */}
                    <section>
                       <h4 className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-400 mb-5 flex items-center gap-3">
                         <MapPin className="w-4 h-4 text-red-500" /> พิกัดสถานที่เกิดเหตุบนแผนที่
                       </h4>
                       <div className="grid md:grid-cols-3 gap-6">
                          <div className="md:col-span-1 bg-white p-7 border border-slate-200 rounded-[2rem] flex flex-col justify-center shadow-sm">
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">สถานที่ระบุเพิ่มเติม</p>
                             <p className="font-black text-slate-800 text-lg leading-tight mb-4">{selectedRequest.location}</p>
                             <div className="pt-4 border-t border-slate-100">
                                <p className="text-[9px] font-bold text-slate-400 font-mono uppercase">LAT: {selectedRequest.latitude}</p>
                                <p className="text-[9px] font-bold text-slate-400 font-mono uppercase mt-0.5">LNG: {selectedRequest.longitude}</p>
                             </div>
                          </div>
                          <div className="md:col-span-2 h-64 rounded-[2rem] bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center relative shadow-inner group">
                             <div className="absolute inset-0 bg-slate-900/5 group-hover:bg-slate-900/0 transition-all"></div>
                             <p className="text-xs font-bold text-slate-400 uppercase tracking-widest italic z-10">Map Visualization Preview</p>
                             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                                <MapPin className="w-12 h-12 text-red-500 animate-bounce drop-shadow-lg" />
                             </div>
                          </div>
                       </div>
                    </section>

                    {/* ส่วนคลังภาพหลักฐาน (ID Card, Evidence Photos) */}
                    <section>
                       <h4 className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-400 mb-8 flex items-center gap-2">
                         <ImageIcon className="w-4 h-4" /> เอกสารและหลักฐานประกอบคำร้อง
                       </h4>
                       <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                          {[
                            { label: 'บัตรประชาชน', url: selectedRequest.attachments?.idCard, type: 'ID' },
                            { label: 'ใบแจ้งความ', url: selectedRequest.attachments?.report, type: 'Report' },
                            ...(selectedRequest.attachments?.scene || []).map((url: string, i: number) => ({ label: `ภาพเหตุการณ์ ${i+1}`, url, type: 'Evidence' }))
                          ].map((file, i) => file.url ? (
                            <a 
                              key={i} href={file.url} target="_blank" rel="noopener noreferrer"
                              className="group relative h-44 rounded-3xl overflow-hidden border-2 border-slate-100 bg-slate-50 transition-all hover:ring-8 hover:ring-blue-50/50 shadow-sm"
                            >
                               <div className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center z-10 p-4">
                                  <ExternalLink className="text-white w-7 h-7 mb-2" />
                                  <span className="text-[9px] text-white font-black uppercase tracking-[0.2em]">Open File</span>
                               </div>
                               <img src={file.url} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt={file.label} />
                               <div className="absolute bottom-0 left-0 right-0 p-3 bg-white/95 backdrop-blur-md text-[10px] font-black uppercase text-center border-t border-slate-100 text-slate-600">
                                 {file.label}
                               </div>
                            </a>
                          ) : null)}
                       </div>
                    </section>
                  </div>

                  {/* คอลัมน์ขวา: ส่วนสำหรับการดำเนินการของเจ้าหน้าที่ (Admin Controls) */}
                  <div className="space-y-10">
                    <div className="bg-slate-900 rounded-[2.5rem] p-9 text-white shadow-2xl shadow-blue-900/20 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none"><LayoutDashboard className="w-32 h-32" /></div>
                      <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-400 mb-8 relative z-10">Admin Control Unit</h4>
                      
                      <div className="space-y-8 relative z-10">
                        <div className="space-y-4">
                          <label className="text-[10px] font-black uppercase text-slate-500 block ml-1 tracking-[0.2em]">ปรับปรุงสถานะคำร้อง</label>
                          <div className="grid grid-cols-1 gap-2.5">
                             {[
                               { val: 'pending', label: 'รอการตรวจสอบ', color: 'hover:bg-amber-600' },
                               { val: 'verifying', label: 'ตรวจสอบเอกสาร', color: 'hover:bg-blue-600' },
                               { val: 'searching', label: 'กำลังค้นหาภาพ', color: 'hover:bg-indigo-600' },
                               { val: 'completed', label: 'ดำเนินการสำเร็จ', color: 'hover:bg-emerald-600' },
                               { val: 'rejected', label: 'ปฏิเสธ/ยกเลิก', color: 'hover:bg-red-600' }
                             ].map(opt => (
                               <button 
                                 key={opt.val}
                                 onClick={() => handleUpdateStatus(selectedRequest.id, opt.val)}
                                 disabled={isUpdating || selectedRequest.status === opt.val}
                                 className={`
                                   w-full py-4 px-6 rounded-2xl text-[11px] font-black text-left transition-all border border-white/5 uppercase tracking-widest
                                   ${selectedRequest.status === opt.val ? 'bg-white text-slate-900 scale-[1.02] shadow-xl' : 'text-slate-400 hover:text-white ' + opt.color}
                                   disabled:opacity-40 disabled:cursor-not-allowed
                                 `}
                               >
                                 {opt.label}
                               </button>
                             ))}
                          </div>
                        </div>

                        <div className="space-y-4">
                          <label className="text-[10px] font-black uppercase text-slate-500 block ml-1 tracking-[0.2em]">ตอบกลับผู้แจ้ง (Notes)</label>
                          <textarea 
                            rows={5}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-sm outline-none focus:ring-4 focus:ring-blue-500/20 focus:bg-white/10 transition-all font-medium placeholder:text-slate-700 leading-relaxed"
                            placeholder="ระบุหมายเหตุ เช่น พิกัดกล้องที่พบ หรือสาเหตุที่ไม่พบภาพ..."
                            value={adminNote}
                            onChange={e => setAdminNote(e.target.value)}
                          />
                        </div>

                        <div className="pt-6 border-t border-white/10 flex items-center gap-3">
                           <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                           <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest leading-loose">
                             ผู้แจ้งสามารถติดตามการอัปเดต <br/> ผ่านเลขที่ REQ-ID ได้ทันที
                           </p>
                        </div>
                      </div>
                    </div>

                    {/* แสดงประวัติการดำเนินการ (Audit Logs Timeline) */}
                    <div className="p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm">
                       <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 mb-10">Operation History</h4>
                       <div className="space-y-10">
                          {selectedRequest.statusHistory?.map((h, i) => (
                            <div key={i} className="relative pl-8">
                               {i !== selectedRequest.statusHistory.length - 1 && <div className="absolute left-[3px] top-6 bottom-[-40px] w-0.5 bg-slate-100"></div>}
                               <div className="absolute left-0 top-1.5 w-2 h-2 rounded-full bg-blue-600 ring-4 ring-blue-50"></div>
                               <div>
                                  <div className="flex justify-between items-start mb-2">
                                     <p className="text-xs font-black text-slate-800 uppercase tracking-tighter">{h.status}</p>
                                     <p className="text-[9px] text-slate-400 font-black uppercase">{h.timestamp?.seconds ? new Date(h.timestamp.seconds * 1000).toLocaleTimeString('th-TH') : ''}</p>
                                  </div>
                                  <p className="text-[9px] text-slate-400 font-bold mb-3 italic">
                                    {h.timestamp?.seconds ? new Date(h.timestamp.seconds * 1000).toLocaleDateString('th-TH') : 'Just now'}
                                  </p>
                                  <p className="text-xs text-slate-500 font-medium leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-inner italic">"{h.note}"</p>
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