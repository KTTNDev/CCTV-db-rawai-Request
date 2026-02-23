'use client';

import React, { useCallback, useState } from 'react';
import { 
  ArrowLeft, AlertCircle, User, Phone, Mail, Calendar, 
  Camera, CheckCircle2, FileCheck, ShieldCheck, ChevronRight,
  Loader2, QrCode, Footprints, Info, MapPin, FileText, X 
} from 'lucide-react';

// ✅ Import ชิ้นส่วนที่เราสร้างแยกไว้
import FormSection from '../forms/FormSection';
import LoadingOverlay from '../forms/LoadingOverlay';
import FileUploader from '../forms/FileUploader';
import LocationPicker from '../forms/LocationPicker';

import { FormDataState, FileState } from '@/types';

interface RequestViewProps {
  formData: FormDataState;
  setFormData: React.Dispatch<React.SetStateAction<FormDataState>>;
  files: FileState;
  setFiles: React.Dispatch<React.SetStateAction<FileState>>;
  handleSubmitRequest: (e: React.FormEvent) => Promise<void>;
  setView: (view: string) => void;
  loading: boolean;
  error: string;
}

const RequestView: React.FC<RequestViewProps> = ({ 
  formData, setFormData, files, setFiles, 
  handleSubmitRequest, setView, loading, error 
}) => {
  
  const brandGradient = "linear-gradient(90deg, hsla(222, 51%, 34%, 1) 0%, hsla(119, 37%, 45%, 1) 100%)";

  // 🔔 1. State สำหรับระบบแจ้งเตือน Toast สุดคลีน
  const [notification, setNotification] = useState<{message: string, type: 'error' | 'success'} | null>(null);

  const showToast = (message: string, type: 'error' | 'success' = 'error') => {
    setNotification({ message, type });
    // ตั้งเวลาให้หายไปเองภายใน 4 วินาที
    setTimeout(() => setNotification(null), 4000);
  };

  const handleLocationSelect = useCallback((lat: number, lng: number) => {
    setFormData((prev) => ({ ...prev, latitude: lat, longitude: lng }));
  }, [setFormData]);

  // 🛡️ 2. ฟังก์ชันตรวจสอบข้อมูล (Validation Gatekeeper) ฉบับบังคับ 2 เอกสาร
  const handleLocalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // เช็ครูปถ่ายบัตรประชาชน (บังคับ)
    if (!files.idCard) {
      showToast("กรุณาอัปโหลดรูปถ่ายบัตรประชาชนเพื่อยืนยันตัวตน");
      return;
    }
    
    // เช็คใบแจ้งความ (บังคับใหม่)
    if (!files.report) {
      showToast("กรุณาอัปโหลดใบแจ้งความเพื่อใช้ประกอบการพิจารณา");
      return;
    }

    // เช็คการปักหมุดแผนที่
    if (!formData.latitude || !formData.longitude) {
      showToast("กรุณาปักหมุดตำแหน่งที่เกิดเหตุบนแผนที่");
      return;
    }

    // เช็คความครบถ้วนของข้อมูลส่วนตัว
    if (formData.nationalId.length !== 13) {
      showToast("กรุณากรอกเลขประจำตัวประชาชนให้ครบ 13 หลัก");
      return;
    }
    if (formData.phone.length < 9) {
      showToast("กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง");
      return;
    }

    // เช็คประเภทเหตุการณ์
    if (formData.eventType === 'ACCIDENT' && !formData.accidentSubtype) {
      showToast("กรุณาระบุลักษณะการเกิดอุบัติเหตุ");
      return;
    }
// ✅ เพิ่มการเช็คชาวต่างชาติ เฉพาะเคสอุบัติเหตุ
  if (formData.eventType === 'ACCIDENT' && !formData.involvedForeigner) {
    showToast("กรุณาระบุว่ามีคู่กรณีเกี่ยวข้องกับชาวต่างชาติหรือไม่");
    return;
  }
    // ✅ ถ้าผ่านทุกด่าน ให้ส่งข้อมูลจริง
    await handleSubmitRequest(e);
  };

  return (
    <>
      {loading && <LoadingOverlay />}

      {/* 🔔 UI ระบบแจ้งเตือน Floating Toast (โผล่จากด้านบน) */}
      {notification && (
        <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[200] animate-in fade-in slide-in-from-top-4 duration-300 px-6 w-full max-w-md">
          <div className={`px-6 py-4 rounded-[1.5rem] shadow-2xl backdrop-blur-xl border flex items-center gap-4 ${
            notification.type === 'error' 
              ? 'bg-red-50/90 border-red-200 text-red-800' 
              : 'bg-emerald-50/90 border-emerald-200 text-emerald-800'
          }`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
              notification.type === 'error' ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'
            }`}>
              {notification.type === 'error' ? <AlertCircle className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-0.5 text-slate-500">System Notification</p>
              <p className="font-bold text-sm leading-tight">{notification.message}</p>
            </div>
            <button onClick={() => setNotification(null)} className="p-1 hover:bg-black/5 rounded-lg transition-colors">
              <X className="w-4 h-4 opacity-30" />
            </button>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto animate-in slide-in-from-right duration-500 pb-28 pt-12 px-6 font-sans text-slate-900">
        <button onClick={() => setView('home')} className="group mb-8 flex items-center text-slate-500 hover:text-slate-800 transition-colors font-medium text-sm">
          <ArrowLeft className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1" /> ย้อนกลับหน้าหลัก
        </button>

        <div className="bg-white rounded-[3rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden transition-all">
          <div className="p-12 md:p-16 text-center border-b border-slate-100 bg-slate-50/30">
            <div className="inline-flex p-4 bg-white rounded-3xl shadow-sm mb-6 text-blue-900 border border-slate-100"><Camera className="w-10 h-10" /></div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">ยื่นคำร้องขอภาพ CCTV</h2>
            <p className="text-slate-500 max-w-xl mx-auto font-normal leading-relaxed text-lg">ระบุรายละเอียดเหตุการณ์และแนบเอกสารสำคัญ เพื่อให้เจ้าหน้าที่ดำเนินการตรวจสอบได้อย่างแม่นยำ</p>
          </div>

          <form onSubmit={handleLocalSubmit} className="p-8 md:p-16 space-y-16">
            {/* 🚩 แสดง Error จาก Firebase (ถ้ามี) */}
            {error && (
              <div className="p-6 bg-red-50 text-red-900 rounded-3xl flex items-start gap-4 border border-red-100 animate-in zoom-in-95 shadow-sm">
                <AlertCircle className="w-6 h-6 flex-shrink-0 mt-0.5 text-red-600" />
                <div><p className="font-bold text-lg mb-1">พบข้อผิดพลาดจากระบบ</p><p className="font-medium text-sm opacity-90">{error}</p></div>
              </div>
            )}

            {/* ส่วนที่ 1: ข้อมูลผู้ยื่น */}
            <FormSection title="1. ข้อมูลผู้ยื่นคำร้อง">
              <div className="grid md:grid-cols-2 gap-x-8 gap-y-6">
                <div className="space-y-2">
                  <label className="block text-[13px] font-semibold text-slate-600 uppercase tracking-wider ml-1">ชื่อ-นามสกุลจริง <span className="text-red-500">*</span></label>
                  <div className="relative group">
                    <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 transition-colors group-focus-within:text-blue-600" />
                    <input required type="text" className="w-full pl-14 pr-6 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-50 outline-none transition-all font-medium" placeholder="ระบุชื่อและนามสกุล" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-[13px] font-semibold text-slate-600 uppercase tracking-wider ml-1">เลขประจำตัวประชาชน <span className="text-red-500">*</span></label>
                  <input required type="text" maxLength={13} placeholder="X-XXXX-XXXXX-XX-X" className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-50 outline-none transition-all font-mono" value={formData.nationalId} onChange={e => setFormData({...formData, nationalId: e.target.value.replace(/[^0-9]/g, '')})} />
                </div>
                {/* ... (โทรศัพท์/อีเมล คงเดิม) ... */}
                <div className="space-y-2">
                  <label className="block text-[13px] font-semibold text-slate-600 uppercase tracking-wider ml-1">เบอร์โทรศัพท์ <span className="text-red-500">*</span></label>
                  <div className="relative group">
                    <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 transition-colors group-focus-within:text-blue-600" />
                    <input required type="tel" placeholder="08X-XXX-XXXX" className="w-full pl-14 pr-6 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-50 outline-none transition-all font-medium" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-[13px] font-semibold text-slate-600 uppercase tracking-wider ml-1">อีเมลติดต่อ (ถ้ามี)</label>
                  <div className="relative group">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 transition-colors group-focus-within:text-blue-600" />
                    <input type="email" className="w-full pl-14 pr-6 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-50 outline-none transition-all" placeholder="example@email.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                  </div>
                </div>
              </div>
            </FormSection>

            {/* ส่วนที่ 2: รายละเอียดเหตุการณ์ */}
            <FormSection title="2. รายละเอียดเหตุการณ์">
              <div className="grid md:grid-cols-2 gap-x-8 gap-y-6 mb-8">
                <div className="space-y-2">
                  <label className="block text-[13px] font-semibold text-slate-600 uppercase tracking-wider ml-1">วันที่เกิดเหตุ <span className="text-red-500">*</span></label>
                  <div className="relative group"><Calendar className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" /><input required type="date" className="w-full pl-14 pr-6 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-50 outline-none" value={formData.eventDate} onChange={e => setFormData({...formData, eventDate: e.target.value})} /></div>
                </div>
                <div className="space-y-2">
                  <label className="block text-[13px] font-semibold text-slate-600 uppercase tracking-wider ml-1">ช่วงเวลาที่เกิดเหตุ <span className="text-red-500">*</span></label>
                  <div className="flex items-center gap-4">
                    <input required type="time" className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-50 outline-none text-center" value={formData.eventTimeStart} onChange={e => setFormData({...formData, eventTimeStart: e.target.value})} />
                    <span className="font-medium text-slate-400 text-sm">ถึง</span>
                    <input required type="time" className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-50 outline-none text-center" value={formData.eventTimeEnd} onChange={e => setFormData({...formData, eventTimeEnd: e.target.value})} />
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-8">
                <label className="block text-[13px] font-semibold text-slate-600 uppercase tracking-wider ml-1 flex items-center gap-2">ปักหมุดตำแหน่งที่เกิดเหตุบนแผนที่ <span className="text-red-500">*</span></label>
                <div className="rounded-3xl overflow-hidden border-2 border-slate-200 shadow-md">
                <LocationPicker 
  initialLat={formData.latitude} 
  initialLng={formData.longitude} 
  onLocationSelect={handleLocationSelect} 
/>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-x-8 gap-y-6">
                <div className="space-y-2">
                  <label className="block text-[13px] font-semibold text-slate-600 uppercase tracking-wider ml-1">สถานที่ / จุดสังเกตโดยรอบ <span className="text-red-500">*</span></label>
                  <div className="relative group"><MapPin className="absolute left-5 top-5 text-slate-400 w-5 h-5" /><input required type="text" className="w-full pl-14 pr-6 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-50 outline-none" placeholder="หน้าเสาไฟฟ้า, ฝั่งตรงข้าม..." value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} /></div>
                </div>
                <div className="space-y-2">
                  <label className="block text-[13px] font-semibold text-slate-600 uppercase tracking-wider ml-1">ประเภทเหตุการณ์ <span className="text-red-500">*</span></label>
                  <div className="relative group">
                    <select required className="w-full px-8 py-4 bg-white border border-slate-200 rounded-2xl appearance-none cursor-pointer" value={formData.eventType} onChange={e => setFormData({...formData, eventType: e.target.value, accidentSubtype: ''})}>
                      <option value="">-- เลือกประเภทเหตุการณ์ --</option>
                      <option value="ACCIDENT">🚗 อุบัติเหตุจราจร</option>
                      <option value="THEFT">🔓 การโจรกรรม / ลักทรัพย์</option>
                      <option value="VANDALISM">🔨 การทำลายทรัพย์สิน</option>
                      <option value="DISPUTE">⚖️ ข้อพิพาท / ทะเลาะวิวาท</option>
                      <option value="OTHER">📋 อื่นๆ</option>
                    </select>
                    <ChevronRight className="absolute right-6 top-6 w-5 h-5 text-slate-400 rotate-90 pointer-events-none" />
                  </div>
                </div>
              </div>

        {formData.eventType === 'ACCIDENT' && (
  <div className="mt-8 space-y-8 animate-in fade-in slide-in-from-top-2">
    
    {/* ส่วนเลือก: ลักษณะการเกิดอุบัติเหตุ (ของเดิมที่จารย์ฟลุ๊คมีอยู่แล้ว) */}
    <div>
      <label className="block text-[13px] font-bold text-blue-700 uppercase tracking-wider ml-1 mb-2">
        ลักษณะการเกิดอุบัติเหตุ <span className="text-red-500">*</span>
      </label>
      <div className="relative group">
        <select required className="w-full px-8 py-4 bg-blue-50/50 border-2 border-blue-200 rounded-2xl appearance-none" value={formData.accidentSubtype || ''} onChange={e => setFormData({...formData, accidentSubtype: e.target.value})}>
          <option value="">-- เลือกลักษณะการเกิดเหตุ --</option>
          <option value="MC_VS_MC">1. รถจักรยานยนต์ ชน รถจักรยานยนต์</option>
          <option value="MC_VS_CAR">2. รถจักรยานยนต์ ชน รถยนต์</option>
          <option value="CAR_VS_CAR">3. รถยนต์ ชน รถยนต์</option>
          <option value="PEDESTRIAN">4. ชนคนเดินเท้า</option>
          <option value="HIT_AND_RUN">5. ชนแล้วหนี</option>
          <option value="OTHER">6. อื่นๆ</option>
        </select>
        <ChevronRight className="absolute right-6 top-6 w-5 h-5 text-blue-400 rotate-90 pointer-events-none" />
      </div>
    </div>

    {/* ✅ ส่วนที่เพิ่มใหม่: เกี่ยวข้องกับต่างชาติ (จะแสดงเฉพาะเคสอุบัติเหตุ) */}
    <div className="space-y-3">
      <label className="block text-[13px] font-bold text-blue-700 uppercase tracking-wider ml-1">
        เหตุการณ์นี้มีชาวต่างชาติหรือไม่? <span className="text-red-500">*</span>
      </label>
   <div className="grid grid-cols-3 gap-4">
  {[
    { id: 'yes', label: 'มี', color: 'border-red-200 bg-red-50 text-red-700' },
    { id: 'no', label: 'ไม่มี', color: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
    { id: 'unknown', label: 'ไม่แน่ใจ', color: 'border-slate-200 bg-slate-50 text-slate-500' }
  ].map((option) => (
    <button
      key={option.id}
      type="button"
      onClick={() => setFormData({ ...formData, involvedForeigner: option.id as any })}
      className={`p-4 rounded-2xl border-2 font-bold text-sm transition-all ${
        formData.involvedForeigner === option.id 
          ? option.color + ' ring-4 ring-offset-2 ring-blue-100 shadow-sm scale-[1.02]' 
          : 'border-slate-100 bg-white text-slate-400 hover:border-slate-300 hover:bg-slate-50'
      }`}
    >
      {option.label}
    </button>
  ))}
</div>
    </div>

  </div>
)}
              <div className="mt-8 space-y-2">
                <label className="block text-[13px] font-semibold text-slate-600 uppercase tracking-wider ml-1">รายละเอียดเพิ่มเติม <span className="text-red-500">*</span></label>
                <textarea required rows={4} className="w-full px-8 py-5 bg-white border border-slate-200 rounded-[2rem] focus:ring-4 focus:ring-blue-50 outline-none resize-none shadow-sm" placeholder="อธิบายลักษณะเหตุการณ์, สีรถ, ทะเบียน..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>
            </FormSection>

            {/* ส่วนที่ 3: เอกสารประกอบ (อัปเดตดอกจันใหม่ตามคำขอ) */}
            <FormSection title="3. เอกสารประกอบ">
              <div className="grid md:grid-cols-2 gap-8">
                {/* 📌 บัตรประชาชน (บังคับ) */}
                <FileUploader 
                  label="รูปถ่ายบัตรประชาชน *" 
                  description="เห็นข้อมูลหน้าบัตรและชื่อชัดเจน" 
                  icon={User} 
                  files={files.idCard} 
                  onFileChange={(f: any) => setFiles((prev) => ({ ...prev, idCard: f }))} 
                />
                {/* 📌 ใบแจ้งความ (บังคับ) */}
                <FileUploader 
                  label="ใบแจ้งความ *" 
                  description="ต้องมีตราประทับจากสถานีตำรวจ" 
                  icon={FileText} 
                  files={files.report} 
                  onFileChange={(f: any) => setFiles((prev) => ({ ...prev, report: f }))} 
                />
              </div>
              <div className="mt-10">
                {/* 📌 ภาพเหตุการณ์ (ไม่บังคับ) */}
                <FileUploader 
                  label="ภาพเหตุการณ์หรือสภาพแวดล้อม (ถ้ามี)" 
                  description="แนบภาพถ่ายจุดเกิดเหตุเพื่อให้เจ้าหน้าที่หาตำแหน่งกล้องได้แม่นยำ" 
                  icon={Camera} 
                  multiple={true} 
                  files={files.scene} 
                  onFileChange={(f: any) => setFiles((prev) => ({ ...prev, scene: f }))} 
                />
              </div>
            </FormSection>

            {/* ส่วนที่ 4: การรับไฟล์ (คงเดิม) */}
            <FormSection title="4. ช่องทางการรับไฟล์ข้อมูล">
              <p className="text-sm font-medium text-slate-500 mb-6 ml-1">เลือกวิธีการที่ท่านสะดวกรับข้อมูล <span className="text-red-500">*</span></p>
              <div className="grid sm:grid-cols-2 gap-6">
                <label className={`group flex items-center p-6 rounded-[2rem] border-2 cursor-pointer transition-all shadow-sm hover:shadow-md ${formData.deliveryMethod === 'LINE' ? 'border-blue-600 bg-blue-50/30 shadow-inner' : 'border-slate-100 bg-white hover:border-slate-300'}`}>
                  <input type="radio" name="deliveryMethod" value="LINE" checked={formData.deliveryMethod === 'LINE'} onChange={e => setFormData({...formData, deliveryMethod: e.target.value})} className="h-5 w-5 text-blue-600 focus:ring-blue-600 border-slate-300" />
                  <span className="ml-4 font-bold text-slate-800 flex items-center gap-3 text-lg"><QrCode className="w-6 h-6 text-emerald-600" /> LINE OA (แนะนำ)</span>
                </label>
                <label className={`group flex items-center p-6 rounded-[2rem] border-2 cursor-pointer transition-all shadow-sm hover:shadow-md ${formData.deliveryMethod === 'WALKIN' ? 'border-blue-600 bg-blue-50/30 shadow-inner' : 'border-slate-100 bg-white hover:border-slate-300'}`}>
                  <input type="radio" name="deliveryMethod" value="WALKIN" checked={formData.deliveryMethod === 'WALKIN'} onChange={e => setFormData({...formData, deliveryMethod: e.target.value})} className="h-5 w-5 text-blue-600 focus:ring-blue-600 border-slate-300" />
                  <span className="ml-4 font-bold text-slate-800 flex items-center gap-3 text-lg"><Footprints className="w-6 h-6 text-blue-600" /> รับด้วยตนเอง</span>
                </label>
              </div>

              <div className="mt-8 animate-in fade-in slide-in-from-top-4 duration-500">
                  {formData.deliveryMethod === 'LINE' ? (
                  <div className="p-8 bg-emerald-50/40 rounded-[2.5rem] border border-emerald-100 flex flex-col md:flex-row items-center gap-8 shadow-sm">
                      <div className="w-32 h-32 bg-white rounded-3xl flex items-center justify-center border border-emerald-100 shadow-sm flex-shrink-0">
                          <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://lin.ee/VDA4zO8`} alt="Line OA QR" className="w-24 h-24 object-contain mix-blend-multiply" />
                      </div>
                      <div className="text-center md:text-left space-y-2">
                          <p className="font-bold text-emerald-900 text-lg">ขั้นตอนรับไฟล์ผ่าน LINE</p>
                          <ul className="text-emerald-900 font-medium space-y-2 text-sm opacity-90">
                              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" /> 1. สแกน QR Code เพื่อเพิ่มเพื่อนระบบอัตโนมัติ</li>
                              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" /> 2. ส่งข้อความแจ้ง <span className="text-blue-800 underline underline-offset-4 font-bold bg-white/50 px-2 rounded">"เลขที่คำร้อง"</span> ของท่าน</li>
                              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" /> 3. ระบบส่งลิงก์ดาวน์โหลดให้ท่านตรวจสอบ</li>
                          </ul>
                      </div>
                  </div>
                  ) : (
                  <div className="p-8 bg-blue-50/40 rounded-[2.5rem] border border-blue-100 flex flex-col md:flex-row items-center gap-8 shadow-sm">
                      <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-blue-900 shadow-sm border border-blue-50 flex-shrink-0"><Info className="w-10 h-10" /></div>
                      <div className="space-y-2 text-center md:text-left">
                          <p className="font-bold text-blue-900 text-lg">เงื่อนไขการมารับด้วยตนเอง</p>
                          <p className="text-slate-700 font-normal leading-relaxed text-sm">กรุณานำอุปกรณ์เก็บข้อมูล <span className="text-blue-900 font-bold decoration-blue-800 underline underline-offset-2">(Flash Drive / External HDD)</span> มาติดต่อที่ศูนย์ CCTV ณ สำนักงานเทศบาลตำบลราไวย์ ในวันและเวลาทำการ <br className="hidden md:block" /> <span className="bg-white px-4 py-1.5 rounded-lg border border-blue-100 shadow-sm mt-3 inline-block font-bold text-blue-900 text-sm tracking-tight">จันทร์-ศุกร์ | 08:30 - 16:30 น.</span></p>
                      </div>
                  </div>
                  )}
              </div>
            </FormSection>

            <div className="pt-12 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-8">
              <div className="flex items-center gap-3 bg-slate-50 px-6 py-3 rounded-full border border-slate-100 shadow-inner">
                <ShieldCheck className="w-5 h-5 text-blue-700" /><p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">มาตรฐานความปลอดภัย PDPA 100%</p>
              </div>
              <div className="flex gap-4 w-full sm:w-auto">
                <button type="button" onClick={() => setView('home')} className="flex-1 sm:flex-none px-10 py-4 bg-white border-2 border-slate-200 text-slate-600 font-bold rounded-2xl hover:bg-slate-50 transition-all text-sm">ยกเลิก</button>
                <button type="submit" disabled={loading} className="flex-1 sm:flex-none px-12 py-4 text-white font-bold rounded-2xl shadow-xl transition-all hover:scale-105 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 text-sm" style={{ background: brandGradient }}>
                  {loading ? (<><Loader2 className="w-5 h-5 animate-spin" /> กำลังประมวลผล...</>) : (<><FileCheck className="w-5 h-5" /> ยืนยันและยื่นคำร้อง</>)}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default RequestView;