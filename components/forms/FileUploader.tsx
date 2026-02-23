'use client';

import React from 'react';
import { Upload, FileText, Trash2, LucideIcon, Loader2 } from 'lucide-react';
// 1. Import ไลบรารีบีบอัดภาพ
import imageCompression from 'browser-image-compression';



interface FileUploaderProps {
  label: string;
  description: string;
  icon?: LucideIcon;
  multiple?: boolean;
  files: any; // รับได้ทั้ง File หรือ File[]
  onFileChange: (files: any) => void;
}
const FileUploader = ({ label, description, icon: Icon = Upload, multiple = false, files, onFileChange }: FileUploaderProps) => {
  const [compressing, setCompressing] = React.useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setCompressing(true); // เริ่มสถานะบีบอัด
      const selectedFiles = Array.from(e.target.files);
      const processedFiles: File[] = [];

      // 2. ตั้งค่าการบีบอัด (เช่น บีบให้ไม่เกิน 1MB หรือกว้างไม่เกิน 1280px)
      const options = {
        maxSizeMB: 2,
        useWebWorker: true,
      };

      try {
        for (const file of selectedFiles) {
          // ถ้าเป็นภาพให้บีบอัด ถ้าเป็น PDF ให้ส่งไปตรงๆ (เพราะบีบ PDF ฝั่ง Client ยากกว่าครับ)
          if (file.type.startsWith('image/')) {
            const compressedFile = await imageCompression(file, options);
            processedFiles.push(compressedFile as File);
          } else {
            processedFiles.push(file);
          }
        }

        if (multiple) {
          onFileChange([...(Array.isArray(files) ? files : []), ...processedFiles]);
        } else {
          onFileChange(processedFiles[0]);
        }
      } catch (error) {
        console.error("Compression error:", error);
      } finally {
        setCompressing(false); // จบบีบอัด
      }
    }
  };

  const removeFile = (index: number) => {
    if (multiple && Array.isArray(files)) {
      onFileChange(files.filter((_, i) => i !== index));
    } else {
      onFileChange(null);
    }
  };

  // ปรับข้อมูลให้เป็น Array เสมอเพื่อใช้ในการ Map แสดงผล
  const fileList = multiple ? (Array.isArray(files) ? files : []) : (files ? [files] : []);

  return (
    <div className="w-full group">
      <label className="block text-[13px] font-semibold text-slate-600 mb-2 uppercase tracking-wider ml-1">
        {label}
      </label>
      
      <label className="mt-1 flex justify-center px-6 pt-8 pb-8 border-2 border-slate-200 border-dashed rounded-3xl bg-slate-50/50 hover:bg-blue-50/40 hover:border-blue-300 transition-all cursor-pointer relative group-hover:shadow-sm">
        <input 
          type="file" 
          className="sr-only" 
          multiple={multiple} 
          onChange={handleFileChange} 
          accept="image/*,.pdf" 
        />
        <div className="space-y-3 text-center">
          <div className="mx-auto w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 group-hover:scale-110 transition-transform duration-300">
             <Icon className="h-7 w-7 text-slate-400 group-hover:text-blue-600 transition-colors" />
          </div>
          <div className="flex flex-col items-center text-sm text-slate-600 justify-center gap-1">
            <span className="font-bold text-blue-700 hover:text-blue-600 text-base">
              คลิกเพื่ออัปโหลด
            </span>
            <span className="text-xs text-slate-400 font-medium">{description}</span>
          </div>
        </div>
      </label>
      
      {/* รายการไฟล์ที่เลือกแล้ว */}
      {fileList.length > 0 && (
        <div className="mt-4 space-y-2">
          {fileList.map((file: any, index: number) => (
            <div key={index} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-2xl shadow-sm animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="p-2 bg-blue-50 rounded-xl flex-shrink-0 text-blue-600">
                    <FileText className="w-4 h-4" />
                </div>
                <span className="text-sm font-semibold text-slate-700 truncate max-w-[200px]">
                  {file?.name}
                </span>
              </div>
              <button 
                type="button" 
                onClick={() => removeFile(index)} 
                className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-xl transition-colors flex-shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUploader;