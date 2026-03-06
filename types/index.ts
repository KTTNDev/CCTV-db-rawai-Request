export interface FileState {
  idCard: File | null;
  report: File | null;
  scene: File[];
}

export interface FormDataState {
  name: string;
isForeigner: string; // ✅ เพิ่ม: 'THAI' หรือ 'FOREIGNER'
  nationalId: string;
  passportNumber: string; // ✅ เพิ่ม
  phone: string;
  email: string;
  eventDate: string;
  eventTimeStart: string;
  eventTimeEnd: string;
  eventType: string;
  // ✅ ต้องมีบรรทัดนี้ เพื่อให้ TypeScript รู้จักฟิลด์นี้ตอน Build
  accidentSubtype?: string; 
  isForeignerInvolved: string; // ✅ เพิ่มบรรทัดนี้ (บรรทัดที่ 16 โดยประมาณ)
  location: string;
  latitude: number | null;
  longitude: number | null;
  description: string;
  deliveryMethod: string;
}

export interface TrackingStatus {
  // ✅ แก้ไข: เปลี่ยนเป็น string เพื่อแก้ปัญหา Type mismatch ตอน Build
  status: string; 
  timestamp: any;
  note: string;
}

// ✅ เพิ่ม interface นี้เข้าไปเพื่อให้ AdminView.tsx ใช้งานได้ และแก้ Error: Module has no exported member 'CCTVRequest'
export interface CCTVRequest {
  id: string;
  trackingId: string;
  status: string;
  createdAt: any; // Firebase Timestamp
  
  // ข้อมูลจาก FormData
  name: string;
  isForeigner: string; // ✅ เพิ่ม
  nationalId: string;
  passportNumber?: string; // ✅ เพิ่ม
  phone: string;
  email?: string;
  eventDate: string;
  eventTimeStart: string;
  eventTimeEnd: string;
  eventType: string;
  accidentSubtype?: string;
  isForeignerInvolved?: string; // ✅ เพิ่มบรรทัดนี้ (บรรทัดที่ 49 โดยประมาณ)
  location: string;
  latitude: number;
  longitude: number;
  description?: string;
  deliveryMethod?: string;

  // ไฟล์แนบ (ใน Firestore จะเก็บเป็น URL string ไม่ใช่ File object)
  attachments?: {
    idCard: string;
    report: string;
    scene: string[];
  };

  // ประวัติและการจัดการ
  statusHistory?: TrackingStatus[];
  adminNote?: string;
}