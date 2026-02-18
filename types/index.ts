export interface FileState {
  idCard: File | null;
  report: File | null;
  scene: File[];
}

export interface FormDataState {
  name: string;
  nationalId: string;
  phone: string;
  email: string;
  eventDate: string;
  eventTimeStart: string;
  eventTimeEnd: string;
  eventType: string;
  // ✅ ต้องมีบรรทัดนี้ เพื่อให้ TypeScript รู้จักฟิลด์นี้ตอน Build
  accidentSubtype?: string; 
  location: string;
  latitude: number | null;
  longitude: number | null;
  description: string;
  deliveryMethod: string;
}

export interface TrackingStatus {
  // ✅ แก้ไข: เปลี่ยนจาก Union Type เป็น string เพื่อแก้ปัญหา Type mismatch
  status: string; 
  timestamp: any;
  note: string;
}

// ✅ เพิ่ม interface นี้เข้าไปเพื่อให้ AdminView.tsx ใช้งานได้
export interface CCTVRequest {
  id: string;
  trackingId: string;
  status: string;
  createdAt: any; // Firebase Timestamp
  
  // ข้อมูลจาก FormData
  name: string;
  nationalId: string;
  phone: string;
  email?: string;
  eventDate: string;
  eventTimeStart: string;
  eventTimeEnd: string;
  eventType: string;
  accidentSubtype?: string;
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