'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Navigation } from 'lucide-react';

interface LocationPickerProps {
  onLocationSelect: (lat: number, lng: number) => void;
  initialLat: number | null;
  initialLng: number | null;
}

const LocationPicker = React.memo(({ onLocationSelect, initialLat, initialLng }: LocationPickerProps) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [address, setAddress] = useState('');

  useEffect(() => {
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement("link");
      link.id = 'leaflet-css';
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

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

  useEffect(() => {
    if (mapLoaded && mapContainerRef.current && !mapInstanceRef.current) {
      const L = (window as any).L;
      
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      });

      const defaultLat = initialLat || 7.7818; 
      const defaultLng = initialLng || 98.3125;

      const map = L.map(mapContainerRef.current).setView([defaultLat, defaultLng], 13);
      mapInstanceRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);

      if (initialLat !== null && initialLng !== null) {
          markerRef.current = L.marker([initialLat, initialLng]).addTo(map);
      }

      map.on('click', function(e: any) {
        const { lat, lng } = e.latlng;
        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        } else {
          markerRef.current = L.marker([lat, lng]).addTo(map);
        }
        setAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
        onLocationSelect(lat, lng);
      });
    }
  }, [mapLoaded, initialLat, initialLng, onLocationSelect]);

  return (
    <div className="space-y-2">
       <div className="relative w-full h-[300px] rounded-lg border-2 border-gray-200 overflow-hidden z-0 bg-gray-100">
          <div ref={mapContainerRef} className="w-full h-full" style={{ zIndex: 1 }} />
          {!mapLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50 text-gray-500">
               <span className="flex items-center gap-2"><Navigation className="animate-spin w-4 h-4"/> กำลังโหลดแผนที่...</span>
            </div>
          )}
       </div>
       <div className="flex justify-between items-center text-xs text-gray-500">
          <span>* แตะที่แผนที่เพื่อปักหมุด</span>
          {/* ✅ ตรวจสอบค่า null ก่อนเรียกใช้ toFixed */}
          <span>พิกัด: {address || (initialLat !== null && initialLng !== null ? `${initialLat.toFixed(6)}, ${initialLng.toFixed(6)}` : '-')}</span>
       </div>
    </div>
  );
});

export default LocationPicker;