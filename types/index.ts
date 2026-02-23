// ... existing code ...
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

  attachments?: {
    idCard: string;
    report: string;
    scene: string[];
  };

  statusHistory?: TrackingStatus[];
  adminNote?: string;
}

// ✅ เพิ่ม Interface สำหรับกล้อง CCTV
export interface CCTVCamera {
  id: string | number;
  name: string;
  location: string;
  embedUrl: string;
  type: string;
  isActive: boolean;
  involvedForeigner: 'yes' | 'no' | 'unknown'| ''; // ✅ เพิ่มฟิลด์นี้เข้าไปด้วย
}