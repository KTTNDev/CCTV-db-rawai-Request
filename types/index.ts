export interface FileState {
  idCard: File | null;
  report: File | null;
  scene: File[];
}

// ✅ ส่วนนี้แหละครับที่หายไป เพิ่มเข้าไปได้เลย
export interface FormDataState {
  name: string;
  nationalId: string;
  phone: string;
  email: string;
  eventDate: string;
  eventTimeStart: string;
  eventTimeEnd: string;
  eventType: string;
  accidentSubtype?: string; 
  location: string;
  latitude: number | null;
  longitude: number | null;
  description: string;
  deliveryMethod: string;
  // ✅ เพิ่มฟิลด์ต่างชาติแบบไม่มีค่า Default
  involvedForeigner: 'yes' | 'no' | 'unknown' | ''; 
}

export interface TrackingStatus {
  status: string; 
  timestamp: any;
  note: string;
}

export interface CCTVRequest {
  id: string;
  trackingId: string;
  status: string;
  createdAt: any; 
  
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
  // ✅ เพิ่มตรงนี้ด้วยเพื่อให้บันทึกลง Database ได้
  involvedForeigner: 'yes' | 'no' | 'unknown' | ''; 

  attachments?: {
    idCard: string;
    report: string;
    scene: string[];
  };

  statusHistory?: TrackingStatus[];
  adminNote?: string;
}

export interface CCTVCamera {
  id: string | number;
  name: string;
  location: string;
  embedUrl: string;
  type: string;
  isActive: boolean;
}