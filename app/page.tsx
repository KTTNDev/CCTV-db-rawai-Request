'use client';

import React, { useState, useEffect } from 'react';
import { 
  collection, addDoc, query, where, getDocs, 
  serverTimestamp, doc, getDoc 
} from 'firebase/firestore';
import { 
  signInAnonymously, onAuthStateChanged, User as FirebaseUser 
} from 'firebase/auth';

/**
 * 🛠️ การแก้ไขข้อผิดพลาด "Could not resolve":
 * เปลี่ยนจากการใช้ @/ มาเป็นการใช้ Relative Path (../)
 * เพื่อให้ระบบรันโค้ดสามารถค้นหาตำแหน่งไฟล์ในโฟลเดอร์ src ได้ถูกต้อง
 */
import { db, auth } from '../lib/firebase';
import { uploadFileToGoogleDrive, generateTrackingId } from '../utils/helpers';
import { FormDataState, FileState } from '../types';

// ส่วนประกอบ UI ปกติ
import ConsentModal from '../components/ui/ConsentModal';
import HomeView from '../components/views/HomeView';
import RequestView from '../components/views/RequestView';
import SuccessView from '../components/views/SuccessView';
import TrackView from '../components/views/TrackView';
import Footer from '../components/layout/Footer';
import Navbar from '../components/layout/Navbar';

// ส่วนประกอบสำหรับเจ้าหน้าที่ (Admin/Staff)
import AdminLoginView from '../components/views/AdminLoginView';
import AdminView from '../components/views/AdminView';

const App = () => {
  // สถานะการควบคุมหน้าจอ: home, request, track, success, admin-login, admin-dashboard
  const [view, setView] = useState('home');
  const [showConsent, setShowConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState<FirebaseUser | null>(null);

  // สถานะตรวจสอบการล็อกอินของเจ้าหน้าที่
  const [isAdmin, setIsAdmin] = useState(false);

  // เริ่มต้นระบบตรวจสอบสิทธิ์แบบไม่ระบุตัวตนสำหรับผู้ใช้ทั่วไป
  useEffect(() => {
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (err: any) {
        console.error("Auth init failed:", err);
      }
    };
    initAuth();
    
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
       setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);
const [formData, setFormData] = useState<FormDataState>({
  name: '',
  isForeigner: 'THAI',      // ✅ เพิ่ม: default เป็นคนไทย
  nationalId: '',
  passportNumber: '',       // ✅ เพิ่ม
  isForeignerInvolved: '',  // ✅ เพิ่ม
  phone: '',
  email: '',
  eventDate: '',
  eventTimeStart: '',
  eventTimeEnd: '',
  eventType: '',
  location: '', 
  latitude: null,
  longitude: null,
  description: '',
  deliveryMethod: 'LINE'
});

  const [files, setFiles] = useState<FileState>({
    idCard: null, report: null, scene: []
  });

  const [submissionResult, setSubmissionResult] = useState<any>(null);
  const [trackingIdInput, setTrackingIdInput] = useState('');
  const [trackResult, setTrackResult] = useState<any>(null);

  const handleRequestClick = () => setShowConsent(true);
  
  const handleConsentAgree = () => {
    setShowConsent(false);
    setView('request');
  };

  /**
   * ✅ ฟังก์ชันเมื่อเจ้าหน้าที่เข้าสู่ระบบสำเร็จ
   * จะถูกเรียกใช้หลังจากตรวจสอบรหัสผ่านใน AdminLoginView
   */
  const handleAdminLoginSuccess = () => {
    setIsAdmin(true);
    setView('admin-dashboard');
  };

  /**
   * ✅ ฟังก์ชันออกจากระบบเจ้าหน้าที่
   */
  const handleAdminLogout = () => {
    setIsAdmin(false);
    setView('home');
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.latitude || !formData.longitude) {
      setError('กรุณาปักหมุดสถานที่เกิดเหตุบนแผนที่');
      window.scrollTo(0, 0);
      return;
    }
    setLoading(true);
    setError('');

    try {
      const trackingId = generateTrackingId();
      let idCardUrl = '', reportUrl = '', sceneUrls: string[] = [];

      if (files.idCard) idCardUrl = await uploadFileToGoogleDrive(files.idCard, trackingId);
      if (files.report) reportUrl = await uploadFileToGoogleDrive(files.report, trackingId);
      if (files.scene.length > 0) {
        for (const file of files.scene) {
            const url = await uploadFileToGoogleDrive(file, trackingId);
            sceneUrls.push(url);
        }
      }

      const docData = {
        ...formData,
        fullName: formData.name, 
        trackingId,
        status: 'pending',
        createdAt: serverTimestamp(),
        userId: user?.uid || 'anonymous',
        statusHistory: [
            { status: 'pending', timestamp: new Date(), note: 'ได้รับคำร้องแล้ว' }
        ],
        attachments: { idCard: idCardUrl, report: reportUrl, scene: sceneUrls }
      };

      // 1. บันทึกลง Firebase
      await addDoc(collection(db, "cctv_requests"), docData);

      // 2. ✅ ส่งแจ้งเตือนผ่าน LINE โดยเรียก API Route ของ Vercel
      try {
        await fetch('/api/notify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            trackingId: trackingId,
            name: formData.name,
            location: formData.location, // สถานที่
            eventType: formData.eventType, // ประเภทเหตุการณ์
            date: formData.eventDate, // วันที่เกิดเหตุ
            timeStart: formData.eventTimeStart, // เวลาเริ่ม
            timeEnd: formData.eventTimeEnd, // เวลาสิ้นสุด
          }),
        });
        console.log("✅ Triggered LINE Notification API successfully!");
      } catch (notifyErr) {
        console.error("❌ Failed to call LINE API Route:", notifyErr);
        // ไม่ throw error ปล่อยให้ผู้ใช้ไปหน้า success ต่อไป
      }

      setSubmissionResult(docData);
      setView('success');
    setFormData({
 name: '',
  isForeigner: 'THAI',      // ✅ เพิ่ม: default เป็นคนไทย
  nationalId: '',
  passportNumber: '',       // ✅ เพิ่ม
  isForeignerInvolved: '',  // ✅ เพิ่ม
  phone: '',
  email: '',
  eventDate: '',
  eventTimeStart: '',
  eventTimeEnd: '',
  eventType: '',
  location: '', 
  latitude: null,
  longitude: null,
  description: '',
  deliveryMethod: 'LINE'});
      setFiles({ idCard: null, report: null, scene: [] });

    } catch (err: any) {
      console.error("Error submitting: ", err);
      setError('เกิดข้อผิดพลาด: ' + err.message);
      window.scrollTo(0, 0);
    } finally {
      setLoading(false);
    }
  };

  const handleTrackRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingIdInput.trim()) return;
    setLoading(true);
    setError('');
    setTrackResult(null);

    try {
      const q = query(
        collection(db, "cctv_requests"), 
        where("trackingId", "==", trackingIdInput.trim())
      );
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        setTrackResult(querySnapshot.docs[0].data());
      } else {
        setError('ไม่พบข้อมูลเลขที่คำร้องนี้');
      }
    } catch (err: any) {
      setError('เกิดข้อผิดพลาด: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800 flex flex-col selection:bg-blue-100">
      
      {/* ซ่อน Navbar ปกติเมื่ออยู่ในส่วนของเจ้าหน้าที่ เพื่อความชัดเจนในการทำงาน */}
      {!['admin-login', 'admin-dashboard'].includes(view) && (
        <Navbar 
          view={view} 
          setView={setView} 
          onRequestClick={handleRequestClick} 
        />
      )}

      {showConsent && (
        <ConsentModal 
          onAgree={handleConsentAgree} 
          onCancel={() => setShowConsent(false)} 
        />
      )}

      <main className="flex-grow">
        {/* หน้าหลักประชาชน */}
        {view === 'home' && (
          <HomeView setView={setView} onRequestClick={handleRequestClick} />
        )}
        
        {/* ฟอร์มยื่นคำร้อง */}
        {view === 'request' && (
          <RequestView 
            formData={formData} setFormData={setFormData}
            files={files} setFiles={setFiles}
            handleSubmitRequest={handleSubmitRequest} 
            setView={setView} loading={loading} error={error} 
          />
        )}
        
        {/* หน้าแจ้งผลสำเร็จ */}
        {view === 'success' && (
          <SuccessView 
            submissionResult={submissionResult} 
            handleTrackRequest={handleTrackRequest} 
            setTrackingIdInput={setTrackingIdInput} 
            setView={setView} 
          />
        )}
        
        {/* หน้าติดตามสถานะ */}
        {view === 'track' && (
          <TrackView 
            trackingIdInput={trackingIdInput} 
            setTrackingIdInput={setTrackingIdInput} 
            handleTrackRequest={handleTrackRequest} 
            trackResult={trackResult} 
            loading={loading} error={error} setView={setView} 
          />
        )}

        {/* ----------------------------------------------------
            ✅ ระบบเจ้าหน้าที่ (ADMIN / STAFF SYSTEM)
            ---------------------------------------------------- */}

        {/* หน้า Login เจ้าหน้าที่ */}
        {view === 'admin-login' && (
          <AdminLoginView 
            setView={setView} 
            onLoginSuccess={handleAdminLoginSuccess} 
          />
        )}

        {/* หน้าแดชบอร์ดหลักของเจ้าหน้าที่ (แสดงเมื่อล็อกอินแล้วเท่านั้น) */}
        {view === 'admin-dashboard' && isAdmin && (
          <AdminView onLogout={handleAdminLogout} />
        )}
      </main>

      {/* ซ่อน Footer ปกติเมื่ออยู่ในโหมดเจ้าหน้าที่ */}
      {!['admin-login', 'admin-dashboard'].includes(view) && <Footer />}
    </div>
  );
};

export default App;