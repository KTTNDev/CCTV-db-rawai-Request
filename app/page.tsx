'use client';

import React, { useState, useEffect } from 'react';
import { 
  collection, addDoc, query, where, getDocs, 
  serverTimestamp 
} from 'firebase/firestore';
import { 
  signInAnonymously, onAuthStateChanged, User as FirebaseUser 
} from 'firebase/auth';
import { db, auth } from '@/lib/firebase';
import { uploadFileToGoogleDrive, generateTrackingId } from '@/utils/helpers';
import { FormDataState, FileState } from '@/types';

// Import Components
import ConsentModal from '@/components/ui/ConsentModal';
import HomeView from '@/components/views/HomeView';
import RequestView from '@/components/views/RequestView';
import SuccessView from '@/components/views/SuccessView';
import TrackView from '@/components/views/TrackView';
import Footer from '@/components/layout/Footer';
import Navbar from '@/components/layout/Navbar'; // สมมติว่าแยก Navbar แล้ว

const App = () => {
  const [view, setView] = useState('home');
  const [showConsent, setShowConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState<FirebaseUser | null>(null);

  // Initialize Auth
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
    nationalId: '',
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
    idCard: null,
    report: null,
    scene: []
  });

  const [submissionResult, setSubmissionResult] = useState<any>(null);
  const [trackingIdInput, setTrackingIdInput] = useState('');
  const [trackResult, setTrackResult] = useState<any>(null);

  const handleRequestClick = () => setShowConsent(true);
  const handleConsentAgree = () => {
    setShowConsent(false);
    setView('request');
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

      // Parallel Uploads could be implemented here for speed
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

      await addDoc(collection(db, "cctv_requests"), docData);
      setSubmissionResult(docData);
      setView('success');
      
      // Reset Form
      setFormData({
        name: '', nationalId: '', phone: '', email: '', eventDate: '',
        eventTimeStart: '', eventTimeEnd: '', eventType: '', location: '',
        latitude: null, longitude: null, description: '', deliveryMethod: 'LINE'
      });
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
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
      <Navbar view={view} setView={setView} onRequestClick={handleRequestClick} />

      {showConsent && <ConsentModal onAgree={handleConsentAgree} onCancel={() => setShowConsent(false)} />}

      <main className="min-h-[calc(100vh-64px)]">
        {view === 'home' && <HomeView setView={setView} onRequestClick={handleRequestClick} />}
        {view === 'request' && <RequestView 
                                  formData={formData} 
                                  setFormData={setFormData}
                                  files={files}
                                  setFiles={setFiles}
                                  handleSubmitRequest={handleSubmitRequest} 
                                  setView={setView} 
                                  loading={loading} 
                                  error={error} 
                                />}
        {view === 'success' && <SuccessView 
                                  submissionResult={submissionResult} 
                                  handleTrackRequest={handleTrackRequest} 
                                  setTrackingIdInput={setTrackingIdInput} 
                                  setView={setView} 
                                />}
        {view === 'track' && <TrackView 
                                trackingIdInput={trackingIdInput} 
                                setTrackingIdInput={setTrackingIdInput} 
                                handleTrackRequest={handleTrackRequest} 
                                trackResult={trackResult} 
                                loading={loading} 
                                error={error} 
                                setView={setView} 
                              />}
      </main>

      <Footer />
    </div>
  );
};

export default App;