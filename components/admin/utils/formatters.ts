// components/admin/utils/formatters.ts

import { Car, ShieldAlert, Hammer, Users, FileQuestion } from 'lucide-react';

// ✅ 1. ค่าคงที่สำหรับสีและข้อความภาษาไทย
export const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#64748b'];

export const EVENT_TYPE_TH: Record<string, string> = {
  'ACCIDENT': '🚗 อุบัติเหตุจราจร',
  'THEFT': '🔓 โจรกรรม / ลักทรัพย์',
  'VANDALISM': '🔨 ทำลายทรัพย์สิน',
  'DISPUTE': '⚖️ ข้อพิพาท / ทะเลาะวิวาท',
  'OTHER': '📋 อื่นๆ'
};

export const STATUS_TH: Record<string, string> = {
  'pending': '⏳ รอตรวจสอบ',
  'verifying': '📄 ตรวจเอกสาร',
  'searching': '🔍 กำลังหาภาพ',
  'completed': '✅ เสร็จสิ้น',
  'rejected': '❌ ปฏิเสธ'
};

// ✅ 2. ฟังก์ชันจัดการ Google Drive Link
export const extractDriveFileId = (url: string): string | null => {
  if (!url) return null;
  const match = url.match(/(?:file\/d\/|open\?id=|uc\?.*id=)([\w-]+)/);
  return match ? match[1] : null;
};

export const getDirectDriveLink = (url: string | undefined | null): string => {
  const fileId = extractDriveFileId(url || '');
  if (fileId) return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
  return url || '';
};

export const getMiniThumbnailLink = (url: string | undefined | null): string => {
  const fileId = extractDriveFileId(url || '');
  if (fileId) return `https://drive.google.com/thumbnail?id=${fileId}&sz=w150`;
  return url || '';
};

// ✅ 3. ฟังก์ชันจัดรูปแบบตัวเลขและวันที่
export const formatEventDate = (dateString?: string) => {
  if (!dateString) return '-';
  try {
    let year = 0, month = 0, day = 0;
    if (/^\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}$/.test(dateString)) {
      const parts = dateString.split(/[\/\-]/);
      year = parseInt(parts[0], 10); month = parseInt(parts[1], 10) - 1; day = parseInt(parts[2], 10);
    } else if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(dateString)) {
      const parts = dateString.split(/[\/\-]/);
      day = parseInt(parts[0], 10); month = parseInt(parts[1], 10) - 1; year = parseInt(parts[2], 10);
    } else {
      const d = new Date(dateString);
      if (!isNaN(d.getTime())) return d.toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' });
      return dateString;
    }
    if (year > 2400) year -= 543; 
    const dateObj = new Date(year, month, day);
    return dateObj.toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch (e) { return dateString; }
};

export const formatPhoneNumber = (phone?: string) => {
  if (!phone) return '-';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  return phone;
};

export const formatNationalId = (id?: string) => {
  if (!id) return '-';
  const cleaned = id.replace(/\D/g, '');
  if (cleaned.length === 13) return `${cleaned.slice(0, 1)}-${cleaned.slice(1, 5)}-${cleaned.slice(5, 10)}-${cleaned.slice(10, 12)}-${cleaned.slice(12)}`;
  return id;
};

// ✅ 4. ฟังก์ชันจัดการไอคอนลายน้ำ
export const getEventIcon = (type: string) => {
  switch (type) {
    case 'ACCIDENT': return Car;
    case 'THEFT': return ShieldAlert;
    case 'VANDALISM': return Hammer;
    case 'DISPUTE': return Users;
    default: return FileQuestion;
  }
};
export const formatSubmitDate = (timestamp: any) => {
  if (!timestamp?.seconds) return 'N/A';
  return new Date(timestamp.seconds * 1000).toLocaleDateString('th-TH', { 
    day: '2-digit', 
    month: 'short', 
    year: '2-digit' 
  });
};

export const ACCIDENT_SUBTYPE_TH: Record<string, string> = {
  'MC_VS_MC': '🏍️ จยย. ชน จยย.',
  'MC_VS_CAR': '🚗 จยย. ชน รถยนต์',
  'CAR_VS_CAR': '🚘 รถยนต์ ชน รถยนต์',
  'PEDESTRIAN': '🚶 ชนคนเดินเท้า',
  'HIT_AND_RUN': '🏃 ชนแล้วหนี',
  'OTHER': '📋 อื่นๆ'
};