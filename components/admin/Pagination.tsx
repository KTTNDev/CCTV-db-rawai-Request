// components/admin/Pagination.tsx
import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  startIndex: number;
  itemsPerPage: number;
  setCurrentPage: (page: number) => void;
  setItemsPerPage: (size: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage, totalPages, totalItems, 
  startIndex, itemsPerPage, setCurrentPage, setItemsPerPage
}) => {
  if (totalItems === 0) return null;

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 md:p-6 rounded-2xl md:rounded-[2rem] border border-slate-200 shadow-sm mb-10">
      {/* ส่วนแสดงจำนวนรายการ */}
      <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          แสดง: <span className="text-slate-800">{startIndex + 1}</span> ถึง <span className="text-slate-800">{Math.min(startIndex + itemsPerPage, totalItems)}</span> จาก <span className="text-blue-600">{totalItems}</span>
        </span>
        
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-400 hidden sm:inline">ต่อหน้า:</span>
          <select 
            className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-lg px-2 py-1 outline-none cursor-pointer hover:bg-slate-100 transition-colors"
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1); 
            }}
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      {/* ปุ่มเลื่อนหน้า */}
      <div className="flex items-center gap-2">
        <button 
          onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
          disabled={currentPage === 1}
          className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-blue-600 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        
        <div className="flex items-center gap-1 px-2">
          <span className="text-sm font-bold text-slate-800">{currentPage}</span>
          <span className="text-sm font-bold text-slate-400">/</span>
          <span className="text-sm font-bold text-slate-400">{totalPages}</span>
        </div>

        <button 
          onClick={() => setCurrentPage(Math.min(currentPage + 1, totalPages))}
          disabled={currentPage === totalPages || totalPages === 0}
          className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-blue-600 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};