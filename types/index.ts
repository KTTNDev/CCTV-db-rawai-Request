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
  location: string;
  latitude: number | null;
  longitude: number | null;
  description: string;
  deliveryMethod: string;
}

// Interface สำหรับสถานะการติดตาม (ถ้ามี)
export interface TrackingStatus {
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  timestamp: any;
  note: string;
}