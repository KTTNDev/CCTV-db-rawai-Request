// components/admin/MobileCardList.tsx
import React from 'react';
import { 
  Search, 
  ImageIcon, 
  ChevronRight, 
  Activity, 
  Calendar 
} from 'lucide-react';
import { 
  getMiniThumbnailLink, 
  formatEventDate, 
  EVENT_TYPE_TH, 
  getEventIcon 
} from './utils/formatters';

// ✅ Component ลายน้ำสำหรับ Mobile Card
const EventWatermark = ({ type, className }: { type: string, className?: string }) => {
    const Icon = getEventIcon(type);
    return <Icon className={`absolute pointer-events-none opacity-[0.04] z-0 text-slate-900 transform -rotate-12 ${className}`} />;
};

interface MobileCardListProps {
  requests: any[];
  onSelect: (req: any) => void;
  getStatusConfig: (status: string) => any;
}

export const MobileCardList: React.FC<MobileCardListProps> = ({ 
  requests, 
  onSelect, 
  getStatusConfig 
}) => {
  return (
    <div className="md:hidden space-y-4 mb-6">
      {requests.map((req) => { 
        const status = getStatusConfig(req.status);
        const previewUrl = req.attachments?.scene?.[0] || req.attachments?.report || req.attachments?.idCard || null;

        return (
          <div 
            key={req.id} 
            className={`p-5 rounded-3xl border shadow-sm active:scale-[0.98] transition-all relative overflow-hidden ${status.cardClass}`}
            onClick={() => onSelect(req)}
          >
            {/* ✅ ลายน้ำเหตุการณ์ */}
            <EventWatermark type={req.eventType || 'OTHER'} className="w-32 h-32 -right-6 -bottom-6" />

            <div className="relative z-10">
              {/* ส่วนหัวการ์ด: รูปภาพ, ID, ชื่อ และ Badge สถานะ */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white border border-slate-100 overflow-hidden shadow-sm flex items-center justify-center flex-shrink-0">
                    {previewUrl ? (
                      <img src={getMiniThumbnailLink(previewUrl)} alt="preview" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-5 h-5 text-slate-300" />
                    )}
                  </div>
                  <div>
                    <p className="font-mono font-bold text-blue-900 text-[10px] mb-0.5 uppercase tracking-wider">{req.trackingId}</p>
                    <h3 className="font-black text-slate-900 text-sm leading-tight">{req.name}</h3>
                  </div>
                </div>
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[9px] font-black uppercase border flex-shrink-0 bg-white shadow-sm ${status.color}`}>
                  <status.icon className="w-2.5 h-2.5" /> {status.label}
                </span>
              </div>

              {/* รายละเอียดเหตุการณ์ */}
              <div className="grid grid-cols-2 gap-4 mb-4 text-[11px] ml-[60px]">
                <div className="space-y-1">
                  <p className="text-slate-500 font-bold uppercase tracking-tight flex items-center gap-1">
                    <Activity className="w-3 h-3"/> ประเภทเหตุ
                  </p>
                  <p className="font-black text-slate-700">{EVENT_TYPE_TH[req.eventType || 'OTHER']}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-slate-500 font-bold uppercase tracking-tight flex items-center gap-1">
                    <Calendar className="w-3 h-3"/> วันที่เกิดเหตุ
                  </p>
                  <p className="font-black text-slate-700">{formatEventDate(req.eventDate)}</p>
                </div>
              </div>

              {/* ส่วนท้ายการ์ด: สถานะเอกสารและปุ่มรายละเอียด */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200/50">
                <div className="flex items-center gap-3">
                  <p className="text-[9px] font-black text-slate-500 uppercase">เอกสาร:</p>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${req.attachments?.idCard ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'bg-white border border-slate-300'}`} />
                    <div className={`w-2 h-2 rounded-full ${req.attachments?.report ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'bg-white border border-slate-300'}`} />
                    <div className={`w-2 h-2 rounded-full ${req.attachments?.scene && req.attachments.scene.length > 0 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-white border border-slate-300'}`} />
                  </div>
                </div>
                <button className="flex items-center gap-1 font-black text-blue-700 text-[10px] uppercase bg-white/60 px-2 py-1 rounded-md backdrop-blur-sm">
                  รายละเอียด <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        );
      })}

      {/* กรณีไม่พบข้อมูล */}
      {requests.length === 0 && (
        <div className="bg-white p-10 rounded-3xl border border-dashed border-slate-200 text-center text-slate-400 font-bold text-sm flex flex-col items-center justify-center gap-2">
          <Search className="w-8 h-8 opacity-20 mb-2" />
          ไม่พบข้อมูลคำร้อง
        </div>
      )}
    </div>
  );
};