'use client';

import React from 'react';
import { CheckCircle } from 'lucide-react';

interface SuccessViewProps {
  submissionResult: any;
  handleTrackRequest: (e: React.FormEvent) => Promise<void>;
  setTrackingIdInput: (id: string) => void;
  setView: (view: string) => void;
}

const SuccessView: React.FC<SuccessViewProps> = ({ submissionResult, handleTrackRequest, setTrackingIdInput, setView }) => (
  <div className="max-w-md mx-auto mt-16 text-center animate-in zoom-in duration-300 px-4">
    <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
      <CheckCircle className="w-12 h-12 text-green-600" />
    </div>
    <h2 className="text-3xl font-bold text-gray-900 mb-2">ยื่นคำร้องสำเร็จ!</h2>
    <p className="text-gray-600 mb-8">
      เจ้าหน้าที่ได้รับคำร้องของคุณแล้ว กรุณาบันทึกเลขที่คำร้องด้านล่างเพื่อใช้ในการติดตามสถานะ
    </p>

    <div className="bg-white border-2 border-dashed border-blue-200 bg-blue-50 rounded-2xl p-8 mb-8 relative group">
      <p className="text-sm text-blue-600 mb-2 font-medium">เลขที่คำร้อง (Tracking ID)</p>
      <p className="text-4xl font-mono font-bold text-blue-800 tracking-wider">
        {submissionResult?.trackingId || 'ERROR'}
      </p>
      <div className="mt-4 text-xs text-blue-400 bg-white inline-block px-3 py-1 rounded-full">
        (โปรดถ่ายรูปหรือจดบันทึกรหัสนี้ไว้)
      </div>
    </div>

    <div className="space-y-4">
      <button 
        onClick={() => {
          setTrackingIdInput(submissionResult?.trackingId);
          // workaround for event type compatibility
          handleTrackRequest({ preventDefault: () => {} } as React.FormEvent);
          setView('track');
        }}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3.5 rounded-xl shadow-lg shadow-blue-200 transition-all"
      >
        ติดตามสถานะคำร้องทันที
      </button>
      <button 
        onClick={() => setView('home')}
        className="w-full bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium py-3.5 rounded-xl transition-all"
      >
        กลับหน้าหลัก
      </button>
    </div>
  </div>
);

export default SuccessView;