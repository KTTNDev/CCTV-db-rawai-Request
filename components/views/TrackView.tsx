'use client';
import React, { useRef, useEffect } from 'react'

import { 
  ArrowLeft, Search, AlertCircle, Clock, CheckCircle, XCircle, 
  User, QrCode, Footprints, Camera, FileText, History, 
  CalendarDays, ShieldCheck, Activity, CheckCircle2, 
  ExternalLink, Phone, MapPin, Info, Clock3, Download, AlertTriangle
} from 'lucide-react';
interface TrackViewProps {
  trackingIdInput: string;
  setTrackingIdInput: (val: string) => void;
  handleTrackRequest: (e: React.FormEvent) => Promise<void>;
  trackResult: any;
  loading: boolean;
  error: string;
  setView: (view: string) => void;
}

const TrackView: React.FC<TrackViewProps> = ({ 
  trackingIdInput, 
  setTrackingIdInput, 
  handleTrackRequest, 
  trackResult, 
  loading, 
  error, 
  setView 
}) => {
  

  
  // ✅ ธีมสี Gradient ใหม่ (เขียวมิ้นต์ -> น้ำเงินเข้ม)
  const brandGradient = "linear-gradient(90deg, hsla(160, 50%, 51%, 1) 0%, hsla(247, 60%, 21%, 1) 100%)";
  const resultSectionRef = useRef<HTMLDivElement>(null); //

  useEffect(() => {
    if (trackResult && resultSectionRef.current) {
      resultSectionRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }
  }, [trackResult]);
  
  // ฟังก์ชันแสดงสถานะปัจจุบันแบบ Hero Card (Highlight)
  const renderCurrentStatusHero = (status: string) => {
    const config: any = {
      pending: { 
        bg: 'bg-amber-50', 
        border: 'border-amber-100',
        text: 'text-amber-800', 
        title: 'รอการตรวจสอบ', 
        desc: 'เจ้าหน้าที่กำลังตรวจสอบข้อมูลคำร้องของท่าน',
        icon: Clock,
        iconColor: 'text-amber-600',
        progress: 'w-1/3 bg-amber-500' 
      },
      processing: { 
        bg: 'bg-blue-50', 
        border: 'border-blue-100',
        text: 'text-blue-800', 
        title: 'กำลังดำเนินการ', 
        desc: 'เจ้าหน้าที่กำลังค้นหาภาพจากกล้องวงจรปิด',
        icon: Activity,
        iconColor: 'text-blue-600',
        progress: 'w-2/3 bg-blue-500'
      },
      completed: { 
        bg: 'bg-emerald-50', 
        border: 'border-emerald-100',
        text: 'text-emerald-800', 
        title: 'ดำเนินการเสร็จสิ้น', 
        desc: 'ค้นหาข้อมูลเรียบร้อยแล้ว กรุณาตรวจสอบช่องทางการรับไฟล์ด้านล่าง',
        icon: CheckCircle2,
        iconColor: 'text-emerald-600',
        progress: 'w-full bg-emerald-500'
      },
      rejected: { 
        bg: 'bg-red-50', 
        border: 'border-red-100',
        text: 'text-red-800', 
        title: 'คำร้องถูกปฏิเสธ', 
        desc: 'ขออภัย ไม่สามารถดำเนินการได้เนื่องจากข้อมูลไม่เพียงพอหรืออยู่นอกเหนืออำนาจหน้าที่',
        icon: XCircle,
        iconColor: 'text-red-600',
        progress: 'w-full bg-red-500'
      },
    };
    
    const current = config[status] || config.pending;
    const Icon = current.icon;

    return (
      <div className={`rounded-[2.5rem] p-8 md:p-10 border-2 ${current.border} ${current.bg} shadow-lg relative overflow-hidden mb-10 transition-all hover:shadow-xl`}>
        {/* Progress Bar ด้านบน */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gray-200/50">
           <div className={`h-full ${current.progress} transition-all duration-1000 ease-out`}></div>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
           <div className={`w-24 h-24 rounded-3xl bg-white flex items-center justify-center shadow-md ${current.iconColor}`}>
              <Icon className="w-12 h-12" />
           </div>
           <div className="flex-1 text-center md:text-left">
              <div className="inline-flex items-center gap-2 mb-2 px-3 py-1 bg-white/60 rounded-full border border-white/50 backdrop-blur-sm">
                <span className={`w-2 h-2 rounded-full ${current.progress.split(' ')[1]} animate-pulse`}></span>
                <p className="text-xs font-black uppercase tracking-widest opacity-70">Current Status</p>
              </div>
              <h3 className={`text-3xl md:text-4xl font-black mb-3 ${current.text} tracking-tight`}>{current.title}</h3>
              <p className="text-slate-600 font-medium text-lg leading-relaxed">{current.desc}</p>
           </div>
        </div>
      </div>
    );
  };

  return (
    
    <div className="max-w-4xl mx-auto animate-in slide-in-from-right duration-500 pt-12 pb-24 px-6 font-sans text-slate-900">
      {/* ปุ่มย้อนกลับ */}
      <button 
        onClick={() => setView('home')} 
        className="group mb-10 flex items-center text-slate-500 hover:text-slate-900 transition-colors font-bold text-sm"
      >
        <ArrowLeft className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1" /> 
        ย้อนกลับหน้าหลัก
      </button>

      {/* --- ส่วนหัวและการค้นหา (Search Header) --- */}
      <div className="bg-white rounded-[3rem] shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden mb-12 transition-all hover:shadow-2xl hover:shadow-slate-200/60">
        <div className="p-10 md:p-14 text-center">
            <div className="inline-flex p-4 bg-slate-50 rounded-3xl mb-6 text-slate-400 border border-slate-100">
                <Search className="w-10 h-10" />
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4 tracking-tight">ติดตามสถานะคำร้อง</h2>
            <p className="text-slate-500 mb-10 max-w-md mx-auto font-medium text-base">กรอกหมายเลขอ้างอิง (Tracking ID) ที่ได้รับจากการยื่นคำร้อง เพื่อตรวจสอบความคืบหน้า</p>
            
            <form onSubmit={handleTrackRequest} className="max-w-lg mx-auto flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative group">
                <input 
                  type="text" 
                  className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-teal-100 focus:bg-white focus:border-teal-500 outline-none transition-all text-xl font-mono font-black text-slate-800 placeholder:text-slate-300 uppercase tracking-wide text-center sm:text-left"
                  placeholder="REQ-2026XXXX"
                  value={trackingIdInput}
                  onChange={e => setTrackingIdInput(e.target.value.toUpperCase())}
                />
              </div>
              <button 
                type="submit" 
                disabled={loading}
                className="px-8 py-4 text-white font-bold rounded-2xl shadow-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center min-w-[140px] text-lg"
                style={{ background: brandGradient }}
              >
                {loading ? <span className="animate-pulse">...</span> : 'ค้นหา'}
              </button>
            </form>
            
            {error && (
              <div className="mt-8 p-4 bg-red-50 text-red-700 rounded-2xl text-sm font-bold flex items-center gap-3 justify-center border border-red-100 animate-in shake">
                <AlertCircle className="w-5 h-5" /> {error}
              </div>
            )}
        </div>
      </div>

      {/* --- ส่วนแสดงผลลัพธ์ (Result Card) --- */}
      {trackResult && (
 <div ref={resultSectionRef} className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 scroll-mt-10">
          {/* ✅ 1. ส่วนแสดงสถานะปัจจุบันที่เด่นชัด (Hero Status) */}
          {renderCurrentStatusHero(trackResult.status)}
{/* ✅ 1. กล้องสรุปการดำเนินการจากเจ้าหน้าที่ (Official Response) */}
          <div className="bg-slate-900 rounded-[2.5rem] p-8 md:p-10 text-white shadow-xl relative overflow-hidden">
             <div className="relative z-10">
                <p className="text-blue-400 text-[10px] font-black uppercase tracking-[0.3em] mb-4">Official Response</p>
                <div className="flex items-start gap-4">
                  <Info className="w-6 h-6 text-blue-400 shrink-0 mt-1" />
                  <div>
                    <h4 className="text-xl font-bold mb-3 italic">" {trackResult.adminNote || 'กำลังอยู่ระหว่างดำเนินการตรวจสอบข้อมูลจากกล้องวงจรปิด'} "</h4>
                    <p className="text-slate-400 text-sm font-medium">อัปเดตล่าสุดเมื่อ: {trackResult.statusHistory?.[trackResult.statusHistory.length-1]?.timestamp?.seconds ? new Date(trackResult.statusHistory[trackResult.statusHistory.length-1].timestamp.seconds * 1000).toLocaleString('th-TH') : 'N/A'}</p>
                  </div>
                </div>
              
             </div>
             <Activity className="absolute -right-6 -bottom-6 w-40 h-40 text-white/5" />
          </div>
          <div className="bg-white rounded-[3rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden transition-all">
            {/* Header ของ Card */}
            <div className="p-8 md:p-12 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-slate-50/30">
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Tracking ID</p>
                <h3 className="text-3xl md:text-4xl font-mono font-black text-transparent bg-clip-text tracking-tight" style={{ backgroundImage: brandGradient }}>
                  {trackResult.trackingId}
                </h3>
              </div>
              <div className="hidden md:block opacity-20">
                 <QrCode className="w-16 h-16" />
              </div>
            </div>

            <div className="p-8 md:p-12 grid grid-cols-1 md:grid-cols-2 gap-12 bg-white">
              {/* ข้อมูลผู้ยื่น */}
              <div className="space-y-6">
                <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 pb-4">
                  <User className="w-4 h-4 text-slate-400" /> ข้อมูลผู้ยื่นคำร้อง
                </h4>
                <div className="grid gap-6">
                  <div>
                      <span className="text-slate-400 text-xs font-bold uppercase block mb-1">ชื่อ-นามสกุล</span>
                      <span className="font-bold text-slate-900 text-xl">{trackResult.name}</span>
                  </div>
                  <div>
                      <span className="text-slate-400 text-xs font-bold uppercase block mb-2">ช่องทางรับผล</span>
                      <div className="flex flex-col gap-3">
                        <span className="inline-flex items-center gap-3 text-slate-800 font-bold bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 w-fit">
                            {trackResult.deliveryMethod === 'LINE' ? <QrCode className="w-5 h-5 text-emerald-600"/> : <Footprints className="w-5 h-5 text-blue-700"/>}
                            {trackResult.deliveryMethod === 'LINE' ? 'รับไฟล์ผ่าน LINE OA' : 'มารับด้วยตนเอง'}
                        </span>
                        
                        {/* ✅ เพิ่ม QR Code สำหรับ LINE OA ถ้าเลือกรับผ่าน LINE */}
                        {trackResult.deliveryMethod === 'LINE' && (
                           <div className="flex items-center gap-4 bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 w-fit animate-in fade-in slide-in-from-left-2">
                              <img 
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://lin.ee/VDA4zO8`} 
                                alt="Line OA QR" 
                                className="w-20 h-20 rounded-lg mix-blend-multiply border border-emerald-200" 
                              />
                              <div className="flex flex-col gap-1">
                                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wide">สแกนเพื่อติดต่อ</span>
                                <a 
                                  href="https://lin.ee/VDA4zO8" 
                                  target="_blank" 
                                  rel="noreferrer"
                                  className="text-sm font-black text-emerald-700 underline underline-offset-2 hover:text-emerald-900 flex items-center gap-1"
                                >
                                  แอดไลน์เจ้าหน้าที่ <ExternalLink className="w-3 h-3" />
                                </a>
                              </div>
                           </div>
                        )}
                      </div>
                  </div>
                </div>
              </div>

              {/* ข้อมูลเหตุการณ์ */}
              <div className="space-y-6">
                <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 pb-4">
                  <CalendarDays className="w-4 h-4 text-slate-400" /> รายละเอียดเหตุการณ์
                </h4>
                <div className="grid gap-6">
                  <div>
                      <span className="text-slate-400 text-xs font-bold uppercase block mb-1">วันและเวลา</span>
                      <span className="font-bold text-slate-900 text-lg leading-snug">
                          {trackResult.eventDate} <br/>
                          <span className="text-slate-500 text-base font-medium">เวลา {trackResult.eventTimeStart} - {trackResult.eventTimeEnd} น.</span>
                      </span>
                  </div>
                  <div>
                      <span className="text-slate-400 text-xs font-bold uppercase block mb-1">สถานที่</span>
                      <span className="text-slate-800 font-medium block bg-slate-50 p-3 rounded-xl border border-slate-100 text-sm">
                        {trackResult.location}
                      </span>
                  </div>
                  {/* ✅ ส่วนที่เพิ่ม: รายละเอียดเหตุการณ์ (Description) */}
               <div className="space-y-4 pt-6 border-t border-slate-100">
                  <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><FileText className="w-3 h-3" /> รายละเอียดที่แจ้งไว้</h5>
                  <div className="bg-slate-50 p-6 rounded-xl  border border-slate-100">
                    <p className="text-slate-700 leading-relaxed text-sm italic">"{trackResult.description || 'ไม่ได้ระบุรายละเอียดเพิ่มเติม'}"</p>
                  </div>
               </div>
                  {/* ✅ แสดงไฟล์แนบแบบปุ่มคลิกดูภาพ */}
                  {trackResult.attachments && (
                      <div className="flex flex-wrap gap-2 mt-2">
                         {trackResult.attachments.idCard && (
                           <a 
                             href={trackResult.attachments.idCard} 
                             target="_blank" 
                             rel="noreferrer" 
                             className="group text-xs bg-blue-50 text-blue-700 px-4 py-2 rounded-xl font-bold border border-blue-100 flex items-center gap-2 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all hover:-translate-y-0.5"
                           >
                             <FileText className="w-4 h-4"/> 
                             <span>ดูบัตร ปชช.</span>
                             <ExternalLink className="w-3 h-3 opacity-50 group-hover:opacity-100" />
                           </a>
                         )}
                         {trackResult.attachments.scene?.length > 0 && (
                           <a 
                             href={trackResult.attachments.scene[0]} 
                             target="_blank" 
                             rel="noreferrer" 
                             className="group text-xs bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl font-bold border border-emerald-100 flex items-center gap-2 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all hover:-translate-y-0.5"
                           >
                             <Camera className="w-4 h-4"/> 
                             <span>ดูภาพเหตุการณ์ ({trackResult.attachments.scene.length})</span>
                             <ExternalLink className="w-3 h-3 opacity-50 group-hover:opacity-100" />
                           </a>
                         )}
                      </div>
                  )}
                </div>
              </div>
            </div>

            {/* ✅ Timeline ที่ปรับปรุงให้ดูง่ายและเน้นสถานะล่าสุด */}
            <div className="bg-slate-50/50 p-8 md:p-12 border-t border-slate-100">
                <div className="flex items-center gap-3 mb-10">
                  <History className="w-5 h-5 text-slate-400" />
                  <h4 className="font-black text-slate-800 text-sm uppercase tracking-widest">ประวัติการดำเนินการ (Timeline)</h4>
                </div>
                
                <div className="space-y-0 relative pl-4">
                  {/* เส้น Timeline */}
                  <div className="absolute left-[7px] top-4 bottom-10 w-0.5 bg-slate-200"></div>
                  
                  {/* 🔥 แก้ไข: เรียงลำดับจาก ล่าสุด -> เก่าสุด (Newest -> Oldest) โดยใช้ reverse() */}
                  {[...(trackResult.statusHistory || [])].reverse().map((history: any, idx: number) => {
                      // ตัวแรกใน Array ที่กลับด้านแล้ว คือ "ล่าสุด" (Newest)
                      const isLatest = idx === 0;
                      return (
                      <div key={idx} className={`relative pl-10 pb-10 ${isLatest ? '' : 'opacity-60 grayscale hover:grayscale-0 transition-all'}`}>
                          {/* จุดวงกลม */}
                          <div 
                            className={`absolute left-0 top-1.5 w-4 h-4 rounded-full border-[3px] border-white shadow-md z-10 transition-transform ${
                              isLatest ? 'scale-150 ring-4 ring-teal-100/50' : 'bg-slate-300 scale-100'
                            }`}
                            style={isLatest ? { background: brandGradient } : {}}
                          ></div>
                          
                          <div className={`p-5 rounded-2xl border transition-all ${isLatest ? 'bg-white border-teal-100 shadow-lg transform -translate-y-1' : 'bg-transparent border-transparent'}`}>
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1">
                                <p className={`font-bold text-lg ${isLatest ? 'text-slate-900' : 'text-slate-600'}`}>
                                  {history.note}
                                </p>
                                <span className={`text-[11px] font-bold px-2 py-1 rounded-md w-fit ${isLatest ? 'bg-teal-50 text-teal-700' : 'bg-slate-200 text-slate-500'}`}>
                                    {history.timestamp?.seconds 
                                        ? new Date(history.timestamp.seconds * 1000).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })
                                        : 'เมื่อสักครู่'}
                                </span>
                              </div>
                              {isLatest && (
                                <p className="text-teal-600 text-xs font-bold flex items-center gap-1.5 mt-2 bg-teal-50/50 w-fit px-3 py-1 rounded-full">
                                  <Activity className="w-3.5 h-3.5" /> สถานะปัจจุบัน
                                </p>
                              )}
                          </div>
                      </div>
                  )})}
               </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 text-slate-400 text-xs font-black uppercase tracking-widest pt-4">
            <ShieldCheck className="w-4 h-4 text-slate-300" /> ข้อมูลปลอดภัยตามมาตรฐานสากล
          </div>
        </div>
      )}
    </div>
  );
};

export default TrackView;