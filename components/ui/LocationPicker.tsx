'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Navigation, MapPin as MapPinIcon } from 'lucide-react';

interface LocationPickerProps {
  onLocationSelect: (lat: number, lng: number) => void;
  initialLat?: number;
  initialLng?: number;
}

const LocationPicker = React.memo(({ onLocationSelect, initialLat, initialLng }: LocationPickerProps) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [address, setAddress] = useState('');

  // 🛠️ 1. โหลด Leaflet Assets อัตโนมัติ (Script & CSS)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // โหลด CSS ของ Leaflet
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement("link");
      link.id = 'leaflet-css';
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    // โหลด JavaScript ของ Leaflet
    if (!(window as any).L) {
      const script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.async = true;
      script.onload = () => setMapLoaded(true);
      document.body.appendChild(script);
    } else {
      setMapLoaded(true);
    }
  }, []);

  // 🛠️ 2. เริ่มต้นสร้างแผนที่เมื่อ Library พร้อม
  useEffect(() => {
    if (mapLoaded && mapContainerRef.current && !mapInstanceRef.current && typeof window !== 'undefined') {
      const L = (window as any).L;

      // แก้ไขปัญหาไอคอน Marker ไม่แสดงผลใน Next.js
      if (L.Icon.Default.prototype._getIconUrl) {
        delete L.Icon.Default.prototype._getIconUrl;
      }
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      });

      // พิกัดเริ่มต้น (ถ้าไม่มีให้ไปที่ราไวย์)
      const defaultLat = initialLat || 7.7818; 
      const defaultLng = initialLng || 98.3125;
      
      const map = L.map(mapContainerRef.current).setView([defaultLat, defaultLng], 13);
      mapInstanceRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);

      // สร้าง Marker เริ่มต้นกรณีระบุมา
      let marker: any = (initialLat && initialLng) 
        ? L.marker([initialLat, initialLng]).addTo(map) 
        : null;

      // จัดการเหตุการณ์เมื่อคลิกเลือกจุดบนแผนที่
      map.on('click', function(e: any) {
        const { lat, lng } = e.latlng;
        if (marker) {
          marker.setLatLng([lat, lng]);
        } else {
          marker = L.marker([lat, lng]).addTo(map);
        }
        setAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
        onLocationSelect(lat, lng);
      });
    }
  }, [mapLoaded, initialLat, initialLng, onLocationSelect]);

  return (
    <div className="space-y-3">
       <div className="relative w-full h-[320px] rounded-[2rem] border-2 border-slate-200 overflow-hidden z-0 bg-slate-50 shadow-sm group hover:border-blue-300 transition-colors">
          <div ref={mapContainerRef} className="w-full h-full" style={{ zIndex: 1 }} />
          
          {/* สถานะระหว่างโหลดแผนที่ */}
          {!mapLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-50 text-slate-500">
               <span className="flex items-center gap-2 text-sm font-medium animate-pulse">
                 <Navigation className="animate-spin w-5 h-5 text-blue-500"/> กำลังโหลดแผนที่...
               </span>
            </div>
          )}
       </div>

       {/* ส่วนแสดงพิกัดด้านล่าง */}
       <div className="flex justify-between items-center text-xs text-slate-500 font-medium px-2">
          <span className="flex items-center gap-1.5">
            <MapPinIcon className="w-3.5 h-3.5" /> แตะที่แผนที่เพื่อปักหมุดตำแหน่งที่เกิดเหตุ
          </span>
          <span className="bg-slate-100 px-3 py-1 rounded-full text-blue-700 tracking-wide font-mono font-bold border border-slate-200">
            {/* ✅ แก้ไขปัญหา 'initialLng' is possibly 'undefined' */}
            {address || (initialLat && initialLng ? `${initialLat.toFixed(6)}, ${initialLng.toFixed(6)}` : 'รอระบุพิกัด')}
          </span>
       </div>
    </div>
  );
});

// กำหนดชื่อสำหรับ Debug
LocationPicker.displayName = 'LocationPicker';

export default LocationPicker;