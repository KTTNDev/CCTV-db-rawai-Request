// components/admin/ReportModal.tsx
import React, { useRef, useEffect, useState } from 'react';
import { XCircle, FileBarChart, Download, Loader2 } from 'lucide-react'; 
import { 
  CartesianGrid, XAxis, YAxis, Tooltip as ChartTooltip, 
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend 
} from 'recharts';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { EVENT_TYPE_TH, STATUS_TH, COLORS } from './utils/formatters';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  filteredRequests: any[];
  reportData: { chartData: any[]; pieData: any[] };
  startDate: string;
  endDate: string;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen, onClose, filteredRequests, reportData, startDate, endDate
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  const analyticsMapRef = useRef<HTMLDivElement>(null);
  const leafletAnalyticsInstance = useRef<any>(null);

  useEffect(() => {
    if (isOpen && analyticsMapRef.current && typeof window !== 'undefined') {
      const initAnalyticsMap = () => {
        const L = (window as any).L;
        if (!L) return;
        if (leafletAnalyticsInstance.current) leafletAnalyticsInstance.current.remove();
        const map = L.map(analyticsMapRef.current).setView([7.7858, 98.3225], 14);
        leafletAnalyticsInstance.current = map;
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
        filteredRequests.forEach(req => {
          if (req.latitude && req.longitude) {
            const color = req.status === 'completed' ? '#10b981' : '#3b82f6';
            L.circleMarker([req.latitude, req.longitude], {
              radius: 8, fillColor: color, color: "#fff", weight: 2, opacity: 1, fillOpacity: 0.8
            }).addTo(map).bindPopup(`<b>${req.trackingId}</b><br>${EVENT_TYPE_TH[req.eventType || 'OTHER']}`);
          }
        });
      };
      if (!(window as any).L) {
        const script = document.createElement("script");
        script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
        script.onload = initAnalyticsMap;
        document.body.appendChild(script);
      } else { setTimeout(initAnalyticsMap, 100); }
    }
  }, [isOpen, filteredRequests]);

  const exportPDF = async () => {
    if (!reportRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(reportRef.current, { 
        scale: 2, useCORS: true, backgroundColor: "#ffffff", logging: false 
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`CCTV_Report_${new Date().getTime()}.pdf`);
    } catch (e) { console.error(e); } finally { setIsExporting(false); }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md overflow-hidden">
      <div className="bg-white w-full max-w-5xl h-[90vh] rounded-[3rem] shadow-2xl flex flex-col my-8 animate-in zoom-in-95 duration-300">
        
        {/* Header Section */}
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-[#f8fafc] rounded-t-[3rem] shrink-0">
          <div>
            <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
              <FileBarChart className="text-blue-600 w-8 h-8" /> รายงานสรุปผล CCTV
            </h2>
            <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-tight">
              ช่วงวันที่: {startDate || 'เริ่มต้น'} ถึง {endDate || 'ปัจจุบัน'} | พบ {filteredRequests.length} รายการ
            </p>
          </div>
          <div className="flex gap-3">
            <button onClick={exportPDF} disabled={isExporting} className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-xs hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center gap-2">
              {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} EXPORT PDF
            </button>
            <button onClick={onClose} className="p-3 bg-white text-slate-400 hover:text-red-500 rounded-2xl border border-slate-200 transition-all"><XCircle className="w-6 h-6"/></button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div ref={reportRef} className="p-10 space-y-12 bg-white min-h-full">
            
            {/* Report Banner */}
            <div className="text-center space-y-2 border-b-2 border-blue-600 pb-8">
                <h1 className="text-3xl font-black text-slate-900">CCTV ANALYTICS REPORT</h1>
                <p className="text-lg font-bold text-blue-600">เทศบาลตำบลราไวย์ จังหวัดภูเก็ต</p>
                <p className="text-[10px] text-slate-400 font-mono uppercase">วันที่ออกรายงาน: {new Date().toLocaleString('th-TH')}</p>
            </div>

            {/* Summary Statistics */}
            <div className="grid grid-cols-4 gap-6 text-center">
              <div className="p-6 bg-[#f8fafc] rounded-[2rem] border border-slate-100"><p className="text-[10px] font-black text-slate-400 mb-2 uppercase">ทั้งหมด</p><p className="text-4xl font-black text-blue-600">{filteredRequests.length}</p></div>
              <div className="p-6 bg-emerald-50 rounded-[2rem] border border-emerald-100"><p className="text-[10px] font-black text-emerald-600 mb-2 uppercase">สำเร็จ</p><p className="text-4xl font-black text-emerald-700">{filteredRequests.filter(r => r.status === 'completed').length}</p></div>
              <div className="p-6 bg-orange-50 rounded-[2rem] border border-orange-100"><p className="text-[10px] font-black text-orange-600 mb-2 uppercase">รอตรวจ</p><p className="text-4xl font-black text-orange-700">{filteredRequests.filter(r => r.status === 'pending').length}</p></div>
              <div className="p-6 bg-red-50 rounded-[2rem] border border-red-100"><p className="text-[10px] font-black text-red-600 mb-2 uppercase">ปฏิเสธ</p><p className="text-4xl font-black text-red-700">{filteredRequests.filter(r => r.status === 'rejected').length}</p></div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-2 gap-10">
              <div className="space-y-6">
                <h3 className="text-sm font-black text-slate-800 border-l-4 border-blue-600 pl-4 uppercase">ประเภทเหตุการณ์ (สถิติรวม)</h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reportData.chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" tick={{fontSize: 10, fontWeight: 'bold'}} />
                      <YAxis tick={{fontSize: 10}} />
                      <ChartTooltip />
                      <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} barSize={40} label={{ position: 'top', fontSize: 10, fontWeight: 'black' }} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="space-y-6">
                <h3 className="text-sm font-black text-slate-800 border-l-4 border-emerald-600 pl-4 uppercase">สถานะการดำเนินงาน</h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={reportData.pieData} innerRadius={60} outerRadius={90} paddingAngle={8} dataKey="value">
                        {reportData.pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <ChartTooltip />
                      <Legend verticalAlign="bottom" wrapperStyle={{fontSize: '10px', fontWeight: 'bold'}} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Map Section */}
            <div className="space-y-6 pt-6 border-t border-slate-100">
              <h3 className="text-lg font-black text-slate-800 border-l-4 border-red-500 pl-4 uppercase">SPATIAL INCIDENT ANALYSIS</h3>
              <div ref={analyticsMapRef} className="h-[450px] w-full rounded-[2.5rem] border-8 border-slate-50 shadow-inner z-0" />
            </div>

            {/* Table Section (แก้ไขให้แสดงครบถ้วน) */}
            <div className="space-y-4 pt-6 border-t border-slate-100 pb-10">
              <h3 className="text-lg font-black text-slate-800 uppercase">Detailed Data Records</h3>
              <table className="w-full text-left border-collapse rounded-2xl overflow-hidden shadow-sm border border-slate-100">
                <thead className="bg-slate-900 text-white">
                  <tr>
                    <th className="p-4 text-[10px] font-black uppercase">Tracking ID</th>
                    <th className="p-4 text-[10px] font-black uppercase">ผู้แจ้งเรื่อง</th>
                    <th className="p-4 text-[10px] font-black uppercase">ประเภทเหตุ</th>
                    <th className="p-4 text-[10px] font-black uppercase">สถานะ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {/* ขยายเป็น 50 รายการเพื่อความสมบูรณ์ */}
                  {filteredRequests.slice(0, 50).map(req => (
                    <tr key={req.id} className="text-[11px]">
                      <td className="p-4 font-bold text-blue-600">{req.trackingId}</td>
                      <td className="p-4 font-black text-slate-700">{req.name}</td>
                      <td className="p-4 font-bold text-slate-500">{EVENT_TYPE_TH[req.eventType || 'OTHER']}</td>
                      <td className="p-4 font-black text-slate-600">{STATUS_TH[req.status] || req.status}</td>
                    </tr>
                  ))}
                  {filteredRequests.length > 50 && (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-slate-400 font-bold italic bg-slate-50">
                        ... และรายการอื่นๆ อีก {filteredRequests.length - 50} เคส (แสดงผลเฉพาะ 50 รายการล่าสุดใน PDF)
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              <div className="text-center pt-8 border-t border-slate-50">
                 <p className="text-[10px] text-slate-300 font-black uppercase tracking-widest italic">Rawai Digital Master Plan • CCTV Analytics System</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};