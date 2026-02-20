// components/admin/DetailModal.tsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  XCircle, FileText, Copy, User, Activity, AlertCircle, 
  MapPin, MapPinned, ImageIcon, ExternalLink, MessageSquare, 
  ChevronDown, Save, Loader2, 
  CheckCircle // ✅ เพิ่มไอคอนติ๊กถูก
} from 'lucide-react';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { 
  EVENT_TYPE_TH, STATUS_TH, formatPhoneNumber, 
  formatNationalId, formatEventDate, getDirectDriveLink, 
  getEventIcon 
} from './utils/formatters';

// ✅ Component ลายน้ำขนาดใหญ่สำหรับ Modal
const EventWatermark = ({ type, className }: { type: string, className?: string }) => {
    const Icon = getEventIcon(type);
    return <Icon className={`absolute pointer-events-none opacity-[0.03] z-0 text-slate-900 transform -rotate-12 ${className}`} />;
};

interface DetailModalProps {
  isOpen: boolean;
  data: any;
  onClose: () => void;
  getStatusConfig: (status: string) => any;
  messageTemplates: { label: string; text: string }[];
}

export const DetailModal: React.FC<DetailModalProps> = ({ 
  isOpen, 
  data, 
  onClose, 
  getStatusConfig,
  messageTemplates 
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [adminNote, setAdminNote] = useState('');
  const [tempStatus, setTempStatus] = useState<string>('');
  const [showSuccessToast, setShowSuccessToast] = useState(false); // ✅ State สำหรับควบคุม Toast
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);

  // ✅ 1. จัดการเรื่องแผนที่จุดเกิดเหตุ
  useEffect(() => {
    if (isOpen && data && mapContainerRef.current && typeof window !== 'undefined') {
      const initMap = () => {
        const L = (window as any).L;
        if (!L) return;
        if (mapRef.current) mapRef.current.remove();
        
        const lat = data.latitude || 7.7858;
        const lng = data.longitude || 98.3225;
        const map = L.map(mapContainerRef.current).setView([lat, lng], 16);
        mapRef.current = map;
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
        L.marker([lat, lng]).addTo(map).bindPopup(data.location || 'จุดเกิดเหตุ').openPopup();
      };

      if (!(window as any).L) {
        const script = document.createElement("script");
        script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
        script.onload = initMap;
        document.body.appendChild(script);
      } else {
        initMap();
      }
    }
    if (data) setTempStatus(data.status);
  }, [isOpen, data]);

  if (!isOpen || !data) return null;

  // ✅ 2. ฟังก์ชันบันทึกการเปลี่ยนแปลง (Update Firestore)
  const handleSaveChanges = async () => {
    if (!tempStatus) return;
    setIsUpdating(true);
    try {
      const requestRef = doc(db, 'cctv_requests', data.id);
      const newHistoryItem = {
        status: tempStatus,
        timestamp: new Date(),
        note: adminNote || `อัปเดตสถานะเป็น: ${STATUS_TH[tempStatus] || tempStatus}`
      };
      
      await updateDoc(requestRef, {
        status: tempStatus,
        adminNote: adminNote,
        statusHistory: arrayUnion(newHistoryItem)
      });
      
      setAdminNote('');
      
      // ✅ เปลี่ยนจาก alert เป็นการแสดง Toast แจ้งเตือน
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000); // หายไปเองใน 3 วินาที

    } catch (error) {
      console.error("Update Error:", error);
      alert("เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    // ✅ สามารถเปลี่ยน alert ตรงนี้เป็น Toast เล็กๆ ได้เหมือนกันถ้าต้องการ
    alert(`คัดลอก: ${text} เรียบร้อยแล้ว`);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 md:p-10 bg-slate-900/70 backdrop-blur-md">
      
      {/* ✅ Success Toast Notification (ลอยอยู่เหนือ Modal) */}
      {showSuccessToast && (
        <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[200] animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-white/80 backdrop-blur-xl border border-emerald-100 px-8 py-4 rounded-[2rem] shadow-2xl shadow-emerald-100/50 flex items-center gap-4">
            <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-200 animate-bounce">
              <CheckCircle className="text-white w-6 h-6" />
            </div>
            <div>
              <p className="text-slate-900 font-black text-sm uppercase tracking-wider">บันทึกสำเร็จ</p>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-tight">อัปเดตสถานะคำร้องเรียบร้อยแล้ว</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white w-full max-w-6xl h-[95vh] md:h-full md:max-h-[90vh] rounded-3xl md:rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 md:p-8 border-b border-slate-100 flex justify-between items-center bg-[#f8fafc] relative overflow-hidden shrink-0">
          <EventWatermark type={data.eventType || 'OTHER'} className="w-48 h-48 -right-10 -top-10" />
          <div className="flex items-center gap-3 md:gap-5 relative z-10">
            <div className="w-10 h-10 md:w-14 h-14 rounded-xl md:rounded-2xl bg-white flex items-center justify-center shadow-md border border-slate-100 text-blue-900">
              <FileText className="w-5 h-5 md:w-7 h-7" />
            </div>
            <div>
              <h2 className="text-lg md:text-2xl font-black text-slate-900 leading-tight flex items-center gap-2">
                  คำร้อง #{data.trackingId}
                  <button onClick={() => handleCopy(data.trackingId || '')} className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors">
                      <Copy className="w-4 h-4" />
                  </button>
              </h2>
              <p className="text-[9px] md:text-xs text-slate-400 font-bold uppercase mt-0.5">
                ยื่นเมื่อ {data.createdAt?.seconds ? new Date(data.createdAt.seconds * 1000).toLocaleString('th-TH') : 'N/A'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 md:p-3 bg-white hover:bg-red-50 hover:text-red-500 rounded-full transition-all text-slate-300 border border-slate-100 shadow-sm relative z-10">
            <XCircle className="w-7 h-7 md:w-8 h-8" />
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-5 md:p-10 custom-scrollbar">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12">
            
            {/* Left/Middle Column: Info & Map */}
            <div className="lg:col-span-2 space-y-8 md:space-y-12">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
                  {/* ส่วนข้อมูลผู้ยื่น */}
                  <section className="space-y-4">
                    <h4 className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.25em] text-blue-600 mb-2 flex items-center gap-2">
                      <User className="w-3 h-3" /> ข้อมูลผู้ยื่น
                    </h4>
                    <div className="space-y-4 bg-slate-50 p-5 md:p-7 rounded-2xl md:rounded-[2rem] border border-slate-100">
                      <div><p className="text-[9px] text-slate-400 font-black uppercase">ชื่อ-นามสกุล</p><p className="font-black text-slate-800 text-sm md:text-base">{data.name}</p></div>
                      <div><p className="text-[9px] text-slate-400 font-black uppercase">เลขบัตรประชาชน</p><p className="font-bold text-slate-800 font-mono">{formatNationalId(data.nationalId)}</p></div>
                      <div>
                          <p className="text-[9px] text-slate-400 font-black uppercase">เบอร์ติดต่อ</p>
                          <div className="flex items-center gap-2">
                              <p className="font-black text-slate-800">{formatPhoneNumber(data.phone)}</p>
                              <button onClick={() => handleCopy(data.phone || '')} className="text-slate-400 hover:text-blue-600 transition-colors"><Copy className="w-3 h-3" /></button>
                          </div>
                      </div>
                      <div className="pt-3 mt-1 border-t border-slate-200/60">
                          <p className="text-[9px] text-slate-400 font-black uppercase">ความประสงค์รับไฟล์</p>
                          <p className="font-black text-blue-700">{data.deliveryMethod === 'LINE' ? '📱 LINE OA' : '🏢 รับด้วยตนเองที่ศูนย์'}</p>
                      </div>
                    </div>
                  </section>

                  {/* ส่วนข้อมูลเหตุการณ์ */}
                  <section className="space-y-4">
                    <h4 className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.25em] text-blue-600 mb-2 flex items-center gap-2">
                      <Activity className="w-3 h-3" /> ข้อมูลเหตุการณ์
                    </h4>
                    <div className="space-y-4 bg-slate-50 p-5 md:p-7 rounded-2xl md:rounded-[2rem] border border-slate-100">
                      <div><p className="text-[9px] text-slate-400 font-black uppercase">วันเวลาเกิดเหตุ</p><p className="font-black text-slate-800 text-sm md:text-base">{formatEventDate(data.eventDate)} ({data.eventTimeStart} - {data.eventTimeEnd})</p></div>
                      <div><p className="text-[9px] text-slate-400 font-black uppercase">ลักษณะเหตุ</p><p className="font-black text-slate-800">{EVENT_TYPE_TH[data.eventType || 'OTHER']}</p></div>
                      <div className="pt-4 mt-2 border-t border-slate-200/60">
                          <p className="text-[9px] text-slate-400 font-black mb-2 flex items-center gap-1 uppercase"><AlertCircle className="w-3 h-3" /> รายละเอียดเพิ่มเติม</p>
                          <div className="bg-white/80 p-4 rounded-xl border border-slate-100 text-xs md:text-sm text-slate-700 leading-relaxed font-medium">
                              {data.description || "ไม่ได้ระบุรายละเอียดเพิ่มเติม"}
                          </div>
                      </div>
                    </div>
                  </section>
              </div>

              {/* ส่วนแผนที่พิกัด */}
              <section>
                  <h4 className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.25em] text-slate-400 mb-4 flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-red-500" /> พิกัดสถานที่เกิดเหตุ
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                    <div className="md:col-span-1 bg-white p-5 border border-slate-200 rounded-2xl md:rounded-[2rem] flex flex-col justify-center">
                        <p className="font-black text-slate-800 text-base md:text-lg leading-tight mb-4">{data.location}</p>
                        <div className="pt-4 border-t border-slate-100 text-[8px] text-slate-400 font-mono">
                          <p>LAT: {data.latitude}</p><p>LNG: {data.longitude}</p>
                        </div>
                        <a href={`https://www.google.com/maps?q=${data.latitude},${data.longitude}`} target="_blank" rel="noopener noreferrer" className="mt-5 flex items-center justify-center gap-2 w-full py-2.5 bg-[#eff6ff] text-blue-700 font-black text-xs uppercase rounded-xl border border-blue-100 hover:bg-blue-600 hover:text-white transition-all">
                            <MapPinned className="w-4 h-4" /> ดูใน Google Maps
                        </a>
                    </div>
                    <div className="md:col-span-2 h-48 md:h-64 rounded-2xl md:rounded-[2rem] bg-slate-100 border border-slate-200 overflow-hidden relative shadow-inner z-0">
                        <div ref={mapContainerRef} className="w-full h-full" />
                    </div>
                  </div>
              </section>

              {/* ส่วนไฟล์แนบ */}
              <section className="pb-10 md:pb-0">
                <h4 className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.25em] text-slate-400 mb-6 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" /> เอกสารและหลักฐาน
                </h4>
                <div className="grid grid-cols-2 xs:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6">
                  {[
                    { label: 'บัตรประชาชน', url: data.attachments?.idCard },
                    { label: 'ใบแจ้งความ', url: data.attachments?.report },
                    ...(data.attachments?.scene || []).map((url: string, i: number) => ({ label: `ภาพเหตุการณ์ ${i+1}`, url }))
                  ].map((file, i) => file.url ? (
                      <div key={i} className="group relative h-32 md:h-44 rounded-2xl md:rounded-3xl overflow-hidden border-2 border-slate-100 shadow-sm transition-all hover:ring-8 hover:ring-blue-50/50">
                         <img src={getDirectDriveLink(file.url)} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt={file.label} />
                         <div className="absolute bottom-0 left-0 right-0 p-2 bg-white/95 backdrop-blur-md text-[8px] md:text-[10px] font-black uppercase text-center border-t text-slate-600">
                           {file.label}
                         </div>
                         <a href={file.url} target="_blank" rel="noopener noreferrer" className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
                            <ExternalLink className="text-white w-5 h-5 md:w-7 h-7" />
                         </a>
                      </div>
                    ) : (
                      <div key={i} className="h-32 md:h-44 rounded-2xl md:rounded-3xl bg-slate-50 border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-300">
                          <ImageIcon className="w-6 h-6 mb-1" />
                          <span className="text-[8px] font-bold uppercase">ไม่มีข้อมูล</span>
                      </div>
                    )
                  )}
                </div>
              </section>
            </div>

            {/* Right Column: Admin Tools & History */}
            <div className="space-y-8 md:space-y-10">
              {/* Admin Control Panel */}
              <div className="bg-slate-900 rounded-3xl md:rounded-[2.5rem] p-6 md:p-9 text-white shadow-2xl relative overflow-hidden">
                <h4 className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em] text-blue-400 mb-6 md:mb-8 relative z-10 uppercase">Admin Control</h4>
                <div className="space-y-6 md:space-y-8 relative z-10">
                  <div className="space-y-3">
                    <label className="text-[9px] md:text-[10px] font-black uppercase text-slate-500 block tracking-[0.2em] ml-1">เลือกสถานะ</label>
                    <div className="grid grid-cols-1 gap-2">
                       {['pending', 'verifying', 'searching', 'completed', 'rejected'].map(opt => (
                         <button 
                            key={opt} 
                            onClick={() => setTempStatus(opt)} 
                            className={`w-full py-3 md:py-4 px-5 rounded-xl md:rounded-2xl text-[10px] md:text-[11px] font-black text-left transition-all border border-white/5 uppercase tracking-widest ${tempStatus === opt ? 'bg-white text-slate-900 shadow-xl' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                         >
                             {STATUS_TH[opt]}
                         </button>
                       ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[9px] md:text-[10px] font-black uppercase text-slate-500 block flex items-center gap-2 tracking-[0.2em] ml-1">
                      <MessageSquare className="w-3 h-3" /> ข้อความรวดเร็ว
                    </label>
                    <div className="relative group">
                      <select 
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[10px] font-bold text-slate-300 outline-none appearance-none cursor-pointer pr-10"
                        onChange={(e) => {
                          const val = e.target.value;
                          if(val) setAdminNote(val.replace('[ID]', data.trackingId || ''));
                          e.target.value = "";
                        }}
                      >
                        <option value="" className="bg-slate-900">-- เลือกข้อความรวดเร็ว --</option>
                        {messageTemplates.map((t, idx) => <option key={idx} value={t.text} className="bg-slate-900 text-white">{t.label}</option>)}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                    </div>
                    <textarea rows={4} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-xs md:text-sm outline-none focus:ring-4 focus:ring-blue-500/20 focus:bg-white/10 transition-all font-medium placeholder:text-slate-700" placeholder="ระบุรายละเอียด..." value={adminNote} onChange={e => setAdminNote(e.target.value)} />
                  </div>

                  <button onClick={handleSaveChanges} disabled={isUpdating || !tempStatus} className="w-full py-4 rounded-xl md:rounded-2xl bg-blue-600 text-white font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-blue-500 disabled:opacity-50 flex items-center justify-center gap-3 transition-all">
                    {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {isUpdating ? 'กำลังบันทึก...' : 'บันทึกการอัปเดต'}
                  </button>
                </div>
              </div>

              {/* History Timeline */}
              <div className="p-6 md:p-8 bg-white rounded-3xl md:rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
                  <h4 className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 mb-8 uppercase">ประวัติการดำเนินการ</h4>
                  <div className="space-y-8 relative z-10">
                    {data.statusHistory?.map((h: any, i: number) => (
                      <div key={i} className="relative pl-7 md:pl-8">
                         {i !== (data.statusHistory?.length || 0) - 1 && <div className="absolute left-[3px] top-6 bottom-[-32px] w-0.5 bg-slate-100"></div>}
                         <div className="absolute left-0 top-1.5 w-2 h-2 rounded-full bg-blue-600 ring-4 ring-blue-50"></div>
                         <div>
                            <p className="text-[10px] md:text-xs font-black text-slate-800 uppercase tracking-tight">{STATUS_TH[h.status] || h.status}</p>
                            <p className="text-[8px] md:text-[9px] text-slate-400 font-bold mb-2">{h.timestamp?.seconds ? new Date(h.timestamp.seconds * 1000).toLocaleString('th-TH') : 'Just now'}</p>
                            <p className="text-[10px] md:text-xs text-slate-500 font-medium leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100 italic shadow-sm">"{h.note}"</p>
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
  );
};