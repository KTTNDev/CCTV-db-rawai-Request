'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  collection, query, onSnapshot, doc, updateDoc, 
  arrayUnion 
} from 'firebase/firestore';
// ✅ แก้ไขปัญหา Path Error โดยเปลี่ยนจาก alias @/ เป็น relative path
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
// ✅ แก้ไขปัญหา Path Error สำหรับ types
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

  // 1. ดึงข้อมูลแบบ Real-time จาก Firestore
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

  // 2. ฟังก์ชันอัปเดตสถานะและบันทึกประวัติ
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
          note: adminNote || `อัปเดตสถานะเป็น: ${newStatus}`
        })
      });
      setAdminNote('');
      // อัปเดต state ท้องถิ่นเพื่อให้ Modal แสดงสถานะล่าสุด
      if (selectedRequest && selectedRequest.id === requestId) {
        setSelectedRequest({ ...selectedRequest, status: newStatus as any });
      }
    } catch (error) {
      console.error("Error updating status:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  // 3. กรองข้อมูลตามสถานะและคำค้นหา
  const filteredRequests = requests.filter(req => {
    const matchesStatus = filterStatus === 'all' || req.status === filterStatus;
    const nameStr = req.name || '';
    const trackingIdStr = req.trackingId || '';
    const matchesSearch = 
      nameStr.toLowerCase().includes(searchQuery.toLowerCase()) || 
      trackingIdStr.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // กำหนดสีและไอคอนตามสถานะ
  const getStatusConfig = (status: string) => {
    const configs: any = {
      pending: { color: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock, label: 'รอตรวจสอบ' },
      verifying: { color: 'bg-blue-50 text-blue-700 border-blue-200', icon: ShieldCheck, label: 'ตรวจสอบเอกสาร' },
      searching: { color: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: Search, label: 'กำลังค้นหาภาพ' },
      completed: { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle, label: 'เสร็จสิ้น' },
      rejected: { color: 'bg-red-50 text-red-700 border-red-200', icon: XCircle, label: 'ปฏิเสธ' },
    };
    return configs[status] || configs.pending;
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
          <p className="font-bold text-slate-500 animate-pulse">กำลังโหลดระบบจัดการสำหรับเจ้าหน้าที่...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 font-sans text-slate-900">
      <div className="max-w-[1600px] mx-auto p-4 md:p-8">
        
        {/* Header & Stats Dashboard */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 flex items-center gap-3">
              <LayoutDashboard className="w-8 h-8 text-blue-900" />
              ระบบจัดการคำร้อง <span className="text-blue-600">CCTV</span>
            </h1>
            <p className="text-slate-500 font-medium mt-1">แผงควบคุมสำหรับเจ้าหน้าที่ เทศบาลตำบลราไวย์</p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            {[
              { label: 'งานใหม่', count: requests.filter(r => r.status === 'pending').length, color: 'text-amber-600', bg: 'bg-amber-100' },
              { label: 'กำลังดำเนินการ', count: requests.filter(r => ['verifying', 'searching'].includes(r.status)).length, color: 'text-blue-600', bg: 'bg-blue-100' },
              { label: 'สำเร็จแล้ว', count: requests.filter(r => r.status === 'completed').length, color: 'text-emerald-600', bg: 'bg-emerald-100' }
            ].map((stat, i) => (
              <div key={i} className="bg-white px-5 py-3 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className={`w-2.5 h-2.5 rounded-full ${stat.bg.replace('100', '500')}`}></div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1">{stat.label}</p>
                  <p className={`text-xl font-black ${stat.color} leading-none`}>{stat.count}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Toolbar: Filter & Search */}
        <div className="bg-white p-4 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="ค้นหาชื่อผู้แจ้ง หรือ Tracking ID..." 
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-50 outline-none font-medium"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <select 
              className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none cursor-pointer"
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
            >
              <option value="all">แสดงทุกสถานะ</option>
              <option value="pending">รอตรวจสอบ</option>
              <option value="verifying">ตรวจสอบเอกสาร</option>
              <option value="searching">กำลังค้นหาภาพ</option>
              <option value="completed">เสร็จสิ้น</option>
              <option value="rejected">ปฏิเสธ</option>
            </select>
          </div>
        </div>

        {/* Desktop View: Table Layout */}
        <div className="hidden lg:block bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400">Tracking ID</th>
                <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400">ผู้แจ้ง / ประเภท</th>
                <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400">วันเวลาที่เกิดเหตุ</th>
                <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 text-center">เอกสาร</th>
                <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400">สถานะ</th>
                <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 text-right">ดำเนินการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredRequests.map((req) => {
                const status = getStatusConfig(req.status);
                const StatusIcon = status.icon;
                return (
                  <tr key={req.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-8 py-6 font-mono font-bold text-blue-900">{req.trackingId}</td>
                    <td className="px-8 py-6">
                      <p className="font-bold text-slate-900">{req.name}</p>
                      <p className="text-xs text-slate-400 mt-1 font-medium">{req.eventType}</p>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-sm font-bold text-slate-700">{req.eventDate}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{req.eventTimeStart} - {req.eventTimeEnd}</p>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <div className="inline-flex gap-1.5">
                        <div title="บัตรประชาชน" className={`w-2.5 h-2.5 rounded-full ${req.attachments?.idCard ? 'bg-blue-500' : 'bg-slate-200'}`}></div>
                        <div title="ใบแจ้งความ" className={`w-2.5 h-2.5 rounded-full ${req.attachments?.report ? 'bg-blue-500' : 'bg-slate-200'}`}></div>
                        <div title="ภาพเหตุการณ์" className={`w-2.5 h-2.5 rounded-full ${req.attachments?.scene?.length ? 'bg-emerald-500' : 'bg-slate-200'}`}></div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                       <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase border ${status.color}`}>
                         <StatusIcon className="w-3 h-3" />
                         {status.label}
                       </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button 
                        onClick={() => setSelectedRequest(req)}
                        className="p-2.5 bg-slate-100 hover:bg-blue-900 hover:text-white rounded-xl transition-all shadow-sm"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredRequests.length === 0 && (
            <div className="p-20 text-center">
               <p className="text-slate-400 font-bold">ไม่พบข้อมูลคำร้องตามเงื่อนไขที่ระบุ</p>
            </div>
          )}
        </div>

        {/* Mobile View: Card Layout */}
        <div className="lg:hidden space-y-4">
          {filteredRequests.map((req) => {
            const status = getStatusConfig(req.status);
            return (
              <div 
                key={req.id} 
                onClick={() => setSelectedRequest(req)}
                className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm active:scale-95 transition-transform"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ID: {req.trackingId}</span>
                    <h3 className="text-lg font-black text-slate-900">{req.name}</h3>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${status.color}`}>
                    {status.label}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                    <Calendar className="w-4 h-4" /> {req.eventDate}
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                    <Activity className="w-4 h-4" /> {req.eventType}
                  </div>
                </div>
                <button className="w-full py-3 bg-slate-50 text-blue-900 font-black text-xs uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 border border-slate-100">
                  <Eye className="w-4 h-4" /> ดูรายละเอียดและจัดการ
                </button>
              </div>
            );
          })}
        </div>

        {/* Detail Modal: Full Information & Management */}
        {selectedRequest && (
          <div className="