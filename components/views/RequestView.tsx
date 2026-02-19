'use client';

import React, { useCallback, useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  AlertCircle, 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  MapPin, 
  Loader2, 
  QrCode, 
  Footprints, 
  Info, 
  FileText, 
  Camera,
  CheckCircle2,
  FileCheck,
  MapPinIcon,
  ShieldCheck,
  ChevronRight,
  Upload,
  Trash2,
  Navigation
} from 'lucide-react';

import { FormDataState, FileState } from '@/types';
// ============================================================================
// ฟังก์ชันแปลง URL สำหรับแสดงภาพ Google Drive แบบเสถียรที่สุด
// ============================================================================
const getDirectDriveLink = (url: string | undefined | null): string => {
  if (!url) return '';
  
  // ตรวจสอบว่าเป็นลิงก์ Google Drive รูปแบบเดิมหรือไม่
  if (url.includes('drive.google.com/file/d/')) {
    // 1. ตัดเอาแค่รหัส ID ของไฟล์ออกมา
    const fileId = url.split('/d/')[1].split('/view')[0];
    
    // 2. นำไปต่อกับ URL สำหรับแสดงภาพตรงๆ ของ Google User Content
    return `https://lh3.googleusercontent.com/d/${fileId}`;
  }

  return url;
};
// ============================================================================
// 1. INTERNAL UI COMPONENTS 
// ============================================================================

const LoadingOverlay = () => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
    <div className="bg-white rounded-[2rem] p-10 shadow-2xl flex flex-col items-center max-w-xs w-full mx-6 text-center animate-in zoom-in-95 duration-300 border border-white/20">
      <div className="relative mb-8">
        <div className="w-20 h-20 rounded-full border-[5px] border-slate-100"></div>
        <div className="absolute top-0 left-0 w-20 h-20 rounded-full border-[5px] border-t-emerald-500 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
            <Upload className="w-8 h-8 text-emerald-500 animate-pulse" />
        </div>
      </div>
      <h3 className="text-xl font-bold text-slate-800 mb-2 tracking-tight">กำลังส่งข้อมูล</h3>
      <p className="text-slate-500 text-sm font-medium leading-relaxed">
        กรุณารอสักครู่... <br/>
        ระบบกำลังบันทึกข้อมูลของท่าน
      </p>
    </div>
  </div>
);

const FormSection = ({ title, children }: { title: string, children: React.ReactNode }) => (
  <div className="pt-10 mt-2 border-t border-slate-100 first:mt-0 first:pt-0 first:border-0">
    <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-3 tracking-tight">
      {title}
    </h3>
    <div className="space-y-6">{children}</div>
  </div>
);

const FileUploader = ({ label, description, icon: Icon = Upload, multiple = false, files, onFileChange }: any) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      if (multiple) {
        onFileChange([...(Array.isArray(files) ? files : []), ...newFiles]);
      } else {
        onFileChange(newFiles[0]);
      }
    }
  };

  const removeFile = (index: number) => {
    if (multiple && Array.isArray(files)) {
      onFileChange(files.filter((_: any, i: number) => i !== index));
    } else {
      onFileChange(null);
    }
  };

  const fileList = multiple ? (Array.isArray(files) ? files : []) : (files ? [files] : []);

  return (
    <div className="w-full group">
      <label className="block text-[13px] font-semibold text-slate-600 mb-2 uppercase tracking-wider ml-1">{label}</label>
      
      <label className="mt-1 flex justify-center px-6 pt-8 pb-8 border-2 border-slate-200 border-dashed rounded-3xl bg-slate-50/50 hover:bg-blue-50/40 hover:border-blue-300 transition-all cursor-pointer relative group-hover:shadow-sm">
        <input 
          type="file" 
          className="sr-only" 
          multiple={multiple} 
          onChange={handleFileChange} 
          accept="image/*,.pdf" 
        />
        <div className="space-y-3 text-center">
          <div className="mx-auto w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 group-hover:scale-110 transition-transform duration-300">
             <Icon className="h-7 w-7 text-slate-400 group-hover:text-blue-600 transition-colors" />
          </div>
          <div className="flex flex-col items-center text-sm text-slate-600 justify-center gap-1">
            <span className="font-bold text-blue-700 hover:text-blue-600 text-base">
              คลิกเพื่ออัปโหลด
            </span>
            <span className="text-xs text-slate-400 font-medium">{description}</span>
          </div>
        </div>
      </label>
      
      {fileList.length > 0 && (
        <div className="mt-4 space-y-2">
          {fileList.map((file: any, index: number) => (
            <div key={index} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-2xl shadow-sm animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="p-2 bg-blue-50 rounded-xl flex-shrink-0 text-blue-600">
                    <FileText className="w-4 h-4" />
                </div>
                <span className="text-sm font-semibold text-slate-700 truncate max-w-[200px]">{file?.name}</span>
              </div>
              <button 
                type="button" 
                onClick={() => removeFile(index)} 
                className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-xl transition-colors flex-shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const LocationPicker = React.memo(({ onLocationSelect, initialLat, initialLng }: any) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [address, setAddress] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement("link");
      link.id = 'leaflet-css'; link.rel = "stylesheet"; link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }
    if (!(window as any).L) {
      const script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.async = true; script.onload = () => setMapLoaded(true);
      document.body.appendChild(script);
    } else {
      setMapLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (mapLoaded && mapContainerRef.current && !mapInstanceRef.current && typeof window !== 'undefined') {
      const L = (window as any).L;
      if (L.Icon.Default.prototype._getIconUrl) { delete L.Icon.Default.prototype._getIconUrl; }
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      });
      const defaultLat = initialLat || 7.7818; 
      const defaultLng = initialLng || 98.3125;
      const map = L.map(mapContainerRef.current).setView([defaultLat, defaultLng], 13);
      mapInstanceRef.current = map;
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap contributors' }).addTo(map);
      let marker: any = (initialLat && initialLng) ? L.marker([initialLat, initialLng]).addTo(map) : null;
      map.on('click', function(e: any) {
        const { lat, lng } = e.latlng;
        if (marker) { marker.setLatLng([lat, lng]); } else { marker = L.marker([lat, lng]).addTo(map); }
        setAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
        onLocationSelect(lat, lng);
      });
    }
  }, [mapLoaded, initialLat, initialLng, onLocationSelect]);

  return (
    <div className="space-y-3">
       <div className="relative w-full h-[320px] rounded-[2rem] border-2 border-slate-200 overflow-hidden z-0 bg-slate-50 shadow-sm group hover:border-blue-300 transition-colors">
          <div ref={mapContainerRef} className="w-full h-full" style={{ zIndex: 1 }} />
          {!mapLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-50 text-slate-500">
               <span className="flex items-center gap-2 text-sm font-medium animate-pulse">
                 <Navigation className="animate-spin w-5 h-5 text-blue-500"/> กำลังโหลดแผนที่...
               </span>
            </div>
          )}
       </div>
       <div className="flex justify-between items-center text-xs text-slate-500 font-medium px-2">
          <span className="flex items-center gap-1.5"><MapPinIcon className="w-3.5 h-3.5" /> แตะที่แผนที่เพื่อปักหมุด</span>
          <span className="bg-slate-100 px-3 py-1 rounded-full text-blue-700 tracking-wide font-mono font-bold border border-slate-200">
            {address || (initialLat ? `${initialLat.toFixed(6)}, ${initialLng.toFixed(6)}` : 'รอระบุพิกัด')}
          </span>
       </div>
    </div>
  );
});

// ============================================================================
// 2. MAIN COMPONENT (RequestView)
// ============================================================================

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
  formData, 
  setFormData, 
  files, 
  setFiles, 
  handleSubmitRequest, 
  setView, 
  loading, 
  error 
}) => {
  
  const brandGradient = "linear-gradient(90deg, hsla(222, 51%, 34%, 1) 0%, hsla(119, 37%, 45%, 1) 100%)";

  const handleLocationSelect = useCallback((lat: number, lng: number) => {
    setFormData((prev) => ({ ...prev, latitude: lat, longitude: lng }));
  }, [setFormData]);

  return (
    <>
      {loading && <LoadingOverlay />}

      <div className="max-w-5xl mx-auto animate-in slide-in-from-right duration-500 pb-28 pt-12 px-6 font-sans text-slate-900">
        <button 
          onClick={() => setView('home')} 
          className="group mb-8 flex items-center text-slate-500 hover:text-slate-800 transition-colors font-medium text-sm"
        >
          <ArrowLeft className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1" /> 
          ย้อนกลับหน้าหลัก
        </button>

        <div className="bg-white rounded-[3rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden transition-all">
          <div className="p-12 md:p-16 text-center border-b border-slate-100 bg-slate-50/30">
            <div className="inline-flex p-4 bg-white rounded-3xl shadow-sm mb-6 text-blue-900 border border-slate-100">
               <Camera className="w-10 h-10" />
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">ยื่นคำร้องขอภาพ CCTV</h2>
            <p className="text-slate-500 max-w-xl mx-auto font-normal leading-relaxed text-lg">
              ระบุรายละเอียดเหตุการณ์และแนบเอกสารสำคัญ <br className="hidden md:block" /> 
              เพื่อให้เจ้าหน้าที่ดำเนินการตรวจสอบได้อย่างแม่นยำ
            </p>
          </div>

          <form onSubmit={handleSubmitRequest} className="p-8 md:p-16 space-y-16">
            {error && (
              <div className="p-6 bg-red-50 text-red-900 rounded-3xl flex items-start gap-4 border border-red-100 animate-in zoom-in-95 shadow-sm">
                <AlertCircle className="w-6 h-6 flex-shrink-0 mt-0.5 text-red-600" />
                <div>
                  <p className="font-bold text-lg mb-1">พบข้อผิดพลาด</p>
                  <p className="font-medium text-sm opacity-90">{error}</p>
                </div>
              </div>
            )}

            {/* 1. ข้อมูลผู้ยื่นคำร้อง */}
            <FormSection title="1. ข้อมูลผู้ยื่นคำร้อง">
              <div className="grid md:grid-cols-2 gap-x-8 gap-y-6">
                <div className="space-y-2">
                  <label className="block text-[13px] font-semibold text-slate-600 uppercase tracking-wider ml-1">ชื่อ-นามสกุลจริง <span className="text-red-500">*</span></label>
                  <div className="relative group">
                    <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 transition-colors group-focus-within:text-blue-600" />
                    <input 
                      required type="text" 
                      className="w-full pl-14 pr-6 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all font-medium text-slate-800 placeholder:font-normal placeholder:text-slate-400 text-base shadow-sm"
                      placeholder="ระบุชื่อและนามสกุล"
                      value={formData.name} 
                      onChange={e => setFormData({...formData, name: e.target.value})} 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-[13px] font-semibold text-slate-600 uppercase tracking-wider ml-1">เลขประจำตัวประชาชน <span className="text-red-500">*</span></label>
                  <input 
                    required type="text" maxLength={13} placeholder="X-XXXX-XXXXX-XX-X" 
                    className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all font-mono font-medium text-slate-800 placeholder:font-normal placeholder:text-slate-400 text-base shadow-sm"
                    value={formData.nationalId} 
                    onChange={e => setFormData({...formData, nationalId: e.target.value.replace(/[^0-9]/g, '')})} 
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[13px] font-semibold text-slate-600 uppercase tracking-wider ml-1">เบอร์โทรศัพท์ <span className="text-red-500">*</span></label>
                  <div className="relative group">
                    <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 transition-colors group-focus-within:text-blue-600" />
                    <input 
                      required type="tel" placeholder="08X-XXX-XXXX" 
                      className="w-full pl-14 pr-6 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all font-medium text-slate-800 placeholder:font-normal placeholder:text-slate-400 text-base shadow-sm"
                      value={formData.phone} 
                      onChange={e => setFormData({...formData, phone: e.target.value})} 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-[13px] font-semibold text-slate-600 uppercase tracking-wider ml-1">อีเมลติดต่อ <span className="text-slate-400 font-normal normal-case tracking-normal">(ถ้ามี)</span></label>
                  <div className="relative group">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 transition-colors group-focus-within:text-blue-600" />
                    <input 
                      type="email" 
                      className="w-full pl-14 pr-6 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all font-medium text-slate-800 placeholder:font-normal placeholder:text-slate-400 text-base shadow-sm"
                      placeholder="example@email.com"
                      value={formData.email} 
                      onChange={e => setFormData({...formData, email: e.target.value})} 
                    />
                  </div>
                </div>
              </div>
            </FormSection>

            {/* 2. รายละเอียดเหตุการณ์ */}
            <FormSection title="2. รายละเอียดเหตุการณ์">
              <div className="grid md:grid-cols-2 gap-x-8 gap-y-6 mb-8">
                <div className="space-y-2">
                  <label className="block text-[13px] font-semibold text-slate-600 uppercase tracking-wider ml-1">วันที่เกิดเหตุ <span className="text-red-500">*</span></label>
                  <div className="relative group">
                    <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input 
                      required type="date" 
                      className="w-full pl-14 pr-6 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all font-medium text-slate-800 text-base shadow-sm"
                      value={formData.eventDate} 
                      onChange={e => setFormData({...formData, eventDate: e.target.value})} 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-[13px] font-semibold text-slate-600 uppercase tracking-wider ml-1">ช่วงเวลาที่เกิดเหตุ <span className="text-red-500">*</span></label>
                  <div className="flex items-center gap-4">
                    <input 
                      required type="time" 
                      className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all font-medium text-slate-800 text-base shadow-sm text-center"
                      value={formData.eventTimeStart} 
                      onChange={e => setFormData({...formData, eventTimeStart: e.target.value})} 
                    />
                    <span className="font-medium text-slate-400 text-sm">ถึง</span>
                    <input 
                      required type="time" 
                      className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all font-medium text-slate-800 text-base shadow-sm text-center"
                      value={formData.eventTimeEnd} 
                      onChange={e => setFormData({...formData, eventTimeEnd: e.target.value})} 
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-8">
                <label className="block text-[13px] font-semibold text-slate-600 uppercase tracking-wider ml-1 flex items-center gap-2">
                  <MapPinIcon className="w-4 h-4 text-blue-600" /> ปักหมุดตำแหน่งที่เกิดเหตุบนแผนที่ <span className="text-red-500">*</span>
                </label>
                <div className="rounded-3xl overflow-hidden border-2 border-slate-200 shadow-md">
                  <LocationPicker initialLat={formData.latitude} initialLng={formData.longitude} onLocationSelect={handleLocationSelect} />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-x-8 gap-y-6">
                  <div className="space-y-2">
                      <label className="block text-[13px] font-semibold text-slate-600 uppercase tracking-wider ml-1">สถานที่ / จุดสังเกตโดยรอบ <span className="text-red-500">*</span></label>
                      <div className="relative group">
                          <MapPin className="absolute left-5 top-5 text-slate-400 w-5 h-5 transition-colors group-focus-within:text-blue-600" />
                          <input 
                              required type="text" 
                              className="w-full pl-14 pr-6 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all font-medium text-slate-800 placeholder:font-normal placeholder:text-slate-400 text-base shadow-sm"
                              placeholder="เช่น หน้าเสาไฟฟ้าต้นที่ 3 ฝั่งตรงข้าม 7-11"
                              value={formData.location} 
                              onChange={e => setFormData({...formData, location: e.target.value})} 
                          />
                      </div>
                  </div>
                  <div className="space-y-2">
                      <label className="block text-[13px] font-semibold text-slate-600 uppercase tracking-wider ml-1">ประเภทเหตุการณ์ <span className="text-red-500">*</span></label>
                      <div className="relative group">
                        <select 
                            required className="w-full px-8 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all font-medium text-slate-800 appearance-none text-base shadow-sm cursor-pointer"
                            value={formData.eventType} 
                            onChange={e => setFormData({...formData, eventType: e.target.value, accidentSubtype: ''})} // รีเซ็ต subtype เมื่อเปลี่ยนประเภทหลัก
                        >
                            <option value="">-- เลือกประเภทเหตุการณ์ --</option>
                            <option value="ACCIDENT">🚗 อุบัติเหตุจราจร</option>
                            <option value="THEFT">🔓 การโจรกรรม / ลักทรัพย์</option>
                            <option value="VANDALISM">🔨 การทำลายทรัพย์สิน</option>
                            <option value="DISPUTE">⚖️ ข้อพิพาท / ทะเลาะวิวาท</option>
                            <option value="OTHER">📋 อื่นๆ (ระบุรายละเอียดด้านล่าง)</option>
                        </select>
                        <ChevronRight className="absolute right-6 top-6 w-5 h-5 text-slate-400 rotate-90 pointer-events-none" />
                      </div>
                  </div>
              </div>

              {/* ✅ เพิ่มช่องเลือกลักษณะการเกิดเหตุเฉพาะกรณีอุบัติเหตุ (ACCIDENT) */}
              {formData.eventType === 'ACCIDENT' && (
                <div className="mt-8 animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="block text-[13px] font-bold text-blue-700 uppercase tracking-wider ml-1 mb-2">ลักษณะการเกิดอุบัติเหตุ <span className="text-red-500">*</span></label>
                  <div className="relative group">
                    <select 
                      required 
                      className="w-full px-8 py-4 bg-blue-50/50 border-2 border-blue-200 rounded-2xl appearance-none font-bold text-blue-900 shadow-sm cursor-pointer focus:ring-4 focus:ring-blue-100 outline-none"
                      value={formData.accidentSubtype || ''}
                      onChange={e => setFormData({...formData, accidentSubtype: e.target.value})}
                    >
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
              )}

              <div className="mt-8 space-y-2">
                <label className="block text-[13px] font-semibold text-slate-600 uppercase tracking-wider ml-1">รายละเอียดเหตุการณ์เพิ่มเติม <span className="text-red-500">*</span></label>
                <textarea 
                  required rows={4} 
                  className="w-full px-8 py-5 bg-white border border-slate-200 rounded-[2rem] focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all font-normal text-slate-800 placeholder:text-slate-400 leading-relaxed text-base shadow-sm resize-none"
                  placeholder="อธิบายลักษณะเหตุการณ์, สีรถ, ทะเบียนรถ หรือลักษณะเด่นของบุคคลที่เกี่ยวข้อง..."
                  value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} 
                />
              </div>
            </FormSection>

            {/* 3. เอกสารประกอบ */}
            <FormSection title="3. เอกสารประกอบ">
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <FileUploader 
                      label="รูปถ่ายบัตรประชาชน *" 
                      description="เห็นข้อมูลหน้าบัตรและชื่อชัดเจน" 
                      icon={User}
                      files={files.idCard}
                      onFileChange={(f: any) => setFiles((prev) => ({ ...prev, idCard: f }))}
                  />
                </div>
                <div className="space-y-4">
                  <FileUploader 
                      label="ใบแจ้งความ (แนะนำ)" 
                      description="ใช้เพื่อประกอบการพิจารณาให้รวดเร็วขึ้น" 
                      icon={FileText}
                      files={files.report}
                      onFileChange={(f: any) => setFiles((prev) => ({ ...prev, report: f }))}
                  />
                </div>
              </div>
              <div className="mt-10">
                <FileUploader 
                  label="ภาพเหตุการณ์หรือสภาพแวดล้อม (ถ้ามี)" 
                  description="แนบภาพถ่ายจุดเกิดเหตุเพื่อให้เจ้าหน้าที่ระบุตำแหน่งกล้องได้แม่นยำ" 
                  icon={Camera}
                  multiple={true}
                  files={files.scene}
                  onFileChange={(f: any) => setFiles((prev) => ({ ...prev, scene: f }))}
                />
              </div>
            </FormSection>

            {/* 4. ช่องทางการรับไฟล์ข้อมูล */}
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
                  <ShieldCheck className="w-5 h-5 text-blue-700" />
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">มาตรฐานการคุ้มครองข้อมูล PDPA 100%</p>
              </div>
              <div className="flex gap-4 w-full sm:w-auto">
                  <button type="button" onClick={() => setView('home')} className="flex-1 sm:flex-none px-10 py-4 bg-white border-2 border-slate-200 text-slate-600 font-bold rounded-2xl hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-95 text-sm">ยกเลิก</button>
                  <button type="submit" disabled={loading} className="flex-1 sm:flex-none px-12 py-4 text-white font-bold rounded-2xl shadow-xl shadow-blue-900/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 text-sm" style={{ background: brandGradient }}>
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