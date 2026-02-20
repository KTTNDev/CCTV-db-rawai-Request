// components/admin/RequestTable.tsx
import React from 'react';
import { Eye, ImageIcon, FilterX } from 'lucide-react';
import { 
  getMiniThumbnailLink, 
  formatSubmitDate, 
  formatEventDate,
  EVENT_TYPE_TH,
  getEventIcon
} from './utils/formatters';

// ✅ Component ลายน้ำภายในช่องตาราง
const EventWatermark = ({ type, className }: { type: string, className?: string }) => {
    const Icon = getEventIcon(type);
    return <Icon className={`absolute pointer-events-none opacity-[0.04] z-0 text-slate-900 transform -rotate-12 ${className}`} />;
};

interface RequestTableProps {
  requests: any[];
  onSelect: (req: any) => void;
  getStatusConfig: (status: string) => any;
}

export const RequestTable: React.FC<RequestTableProps> = ({ 
  requests, 
  onSelect, 
  getStatusConfig 
}) => {
  return (
    <div className="hidden md:block bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden mb-6">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-100">
            <th className="px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center w-24">วันที่ยื่น</th>
            <th className="px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">ผู้ยื่นคำร้อง</th>
            <th className="px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">เหตุการณ์</th>
            <th className="px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center">รับไฟล์</th>
            <th className="px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">เอกสาร</th>
            <th className="px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">สถานะ</th>
            <th className="px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">จัดการ</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {requests.map((req) => { 
            const status = getStatusConfig(req.status);
            const previewUrl = req.attachments?.scene?.[0] || req.attachments?.report || req.attachments?.idCard || null;

            return (
              <tr 
                key={req.id} 
                className={`transition-colors group cursor-pointer ${status.rowClass}`} 
                onClick={() => onSelect(req)}
              >
                {/* 1. วันที่ยื่น */}
                <td className="px-6 py-7 text-center border-r border-white/40">
                    <span className="text-xs font-bold text-slate-500">{formatSubmitDate(req.createdAt)}</span>
                </td>

                {/* 2. ผู้ยื่นคำร้อง */}
                <td className="px-6 py-7">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 overflow-hidden flex items-center justify-center shadow-sm flex-shrink-0">
                            {previewUrl ? (
                                <img src={getMiniThumbnailLink(previewUrl)} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                                <ImageIcon className="w-4 h-4 text-slate-300" />
                            )}
                        </div>
                        <div>
                            <p className="font-mono font-bold text-blue-900 text-xs mb-0.5">{req.trackingId}</p>
                            <p className="font-black text-slate-900 text-sm leading-tight">{req.name}</p>
                        </div>
                    </div>
                </td>
                
                {/* 3. เหตุการณ์พร้อมลายน้ำ */}
                <td className="px-6 py-7 relative overflow-hidden">
                    <EventWatermark type={req.eventType || 'OTHER'} className="w-20 h-20 right-[-10px] top-[-10px]" />
                    <div className="relative z-10">
                        <span className="font-bold text-slate-700 text-xs bg-white/70 backdrop-blur-sm px-2 py-1 rounded-md mb-1 inline-block shadow-sm">
                            {EVENT_TYPE_TH[req.eventType || 'OTHER']}
                        </span>
                        <div className="text-[10px] text-slate-500 font-mono bg-white/50 backdrop-blur-sm inline-block px-1.5 py-0.5 rounded shadow-sm">
                            {formatEventDate(req.eventDate)}
                        </div>
                    </div>
                </td>

                {/* 4. วิธีรับไฟล์ */}
                <td className="px-6 py-7 text-center">
                    {req.deliveryMethod === 'LINE' ? 
                        <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-50 px-2 py-1.5 rounded-lg border border-emerald-100 shadow-sm">LINE OA</span> : 
                        <span className="text-[10px] font-black uppercase text-blue-700 bg-[#eff6ff] px-2 py-1.5 rounded-lg border border-blue-100 shadow-sm">รับด้วยตนเอง</span>
                    }
                </td>

                {/* 5. สถานะเอกสาร (จุดสี) */}
                <td className="px-6 py-7">
                    <div className="flex items-center gap-1.5 bg-white/60 inline-flex p-1.5 rounded-full shadow-sm backdrop-blur-sm">
                       <div className={`w-2 h-2 rounded-full ${req.attachments?.idCard ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]' : 'bg-white border border-slate-300'}`} title="บัตรประชาชน" />
                       <div className={`w-2 h-2 rounded-full ${req.attachments?.report ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]' : 'bg-white border border-slate-300'}`} title="ใบแจ้งความ" />
                       <div className={`w-2 h-2 rounded-full ${req.attachments?.scene && req.attachments.scene.length > 0 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'bg-white border border-slate-300'}`} title="ภาพเหตุการณ์" />
                    </div>
                </td>

                {/* 6. สถานะคำร้อง */}
                <td className="px-6 py-7">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase border bg-white shadow-sm ${status.color}`}>
                      <status.icon className="w-3 h-3" /> {status.label}
                    </span>
                </td>

                {/* 7. ปุ่มจัดการ */}
                <td className="px-6 py-7 text-right">
                  <button className="p-2.5 bg-white border border-slate-200 hover:border-blue-900 hover:text-blue-900 hover:bg-[#eff6ff] rounded-xl transition-all shadow-sm">
                    <Eye className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* กรณีไม่มีข้อมูล */}
      {requests.length === 0 && (
            <div className="p-24 flex flex-col items-center justify-center text-slate-400 font-bold gap-3">
                <FilterX className="w-10 h-10 opacity-30" />
                ไม่พบข้อมูลคำร้องที่ตรงกับเงื่อนไข
            </div>
      )}
    </div>
  );
};