'use client';

import React from 'react';
import { Upload, FileText, Trash2 } from 'lucide-react';

interface FileUploaderProps {
  label: string;
  description: string;
  icon?: any;
  multiple?: boolean;
  files: File[] | File | null;
  onFileChange: (files: File[]) => void;
  accept?: string;
}

const FileUploader = ({ label, description, icon: Icon = Upload, multiple = false, files, onFileChange, accept = "image/*,.pdf" }: FileUploaderProps) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      const validFiles = newFiles.filter(file => {
        if (file.size > 5 * 1024 * 1024) {
          alert(`ไฟล์ ${file.name} มีขนาดใหญ่เกิน 5MB`);
          return false;
        }
        return true;
      });

      if (validFiles.length > 0) {
        if (multiple) {
          const currentFiles = Array.isArray(files) ? files : [];
          onFileChange([...currentFiles, ...validFiles]);
        } else {
          onFileChange([validFiles[0]]);
        }
      }
    }
  };

  const removeFile = (index: number) => {
    if (Array.isArray(files)) {
      const newFiles = files.filter((_, i) => i !== index);
      onFileChange(newFiles);
    } else {
      onFileChange([]);
    }
  };

  const fileList = Array.isArray(files) ? files : (files ? [files] : []);

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors relative cursor-pointer group">
        <div className="space-y-1 text-center">
          <Icon className="mx-auto h-12 w-12 text-gray-400 group-hover:text-blue-500 transition-colors" />
          <div className="flex text-sm text-gray-600 justify-center">
            <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
              <span>เลือกไฟล์</span>
              <input 
                type="file" 
                className="sr-only" 
                multiple={multiple} 
                onChange={handleFileChange} 
                accept={accept}
              />
            </label>
            <p className="pl-1">หรือลากมาวาง</p>
          </div>
          <p className="text-xs text-gray-500">{description} (ไม่เกิน 5MB)</p>
        </div>
      </div>
      
      {fileList.length > 0 && (
        <div className="mt-3 space-y-2">
          {fileList.map((file, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg shadow-sm animate-in fade-in slide-in-from-bottom-1">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <FileText className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-medium text-gray-700 truncate">{file.name}</span>
                  <span className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => removeFile(index)}
                className="p-1 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full transition-colors"
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