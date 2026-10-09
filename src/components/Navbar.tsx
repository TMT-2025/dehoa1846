import React, { useState, useEffect } from 'react';
import { 
  Beaker, LayoutGrid, FileText, FolderClock, Shuffle,
  Key, Sparkles, CheckCircle2, AlertCircle, RefreshCw 
} from 'lucide-react';
import { getStoredApiKey } from '../services/geminiService';

interface NavbarProps {
  activeTab: 'matrix' | 'exam' | 'history' | 'mixer';
  setActiveTab: (tab: 'matrix' | 'exam' | 'history' | 'mixer') => void;
  onOpenApiKeyModal: () => void;
  hasActiveMatrix: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenApiKeyModal,
  hasActiveMatrix
}) => {
  const [hasApiKey, setHasApiKey] = useState(false);
  const [serverOk, setServerOk] = useState<boolean | null>(null);

  const checkStatus = async () => {
    const key = getStoredApiKey();
    setHasApiKey(Boolean(key));

    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        const data = await res.json();
        setServerOk(true);
        if (data.hasGeminiKey) {
          setHasApiKey(true);
        }
      } else {
        setServerOk(false);
      }
    } catch {
      setServerOk(false);
    }
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white shadow-xl sticky top-0 z-50 border-b border-indigo-900/50 backdrop-blur-md no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl shadow-lg ring-2 ring-indigo-400/30 flex items-center justify-center">
            <Beaker className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-lg sm:text-xl tracking-tight text-white uppercase flex items-center gap-1.5">
                ChemSuite <span className="text-amber-400 text-xs px-2 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/30">GDPT 2018</span>
              </h1>
            </div>
            <p className="text-[11px] text-indigo-300 font-medium">Hệ thống Tạo Ma Trận & Ra Đề Thi Hóa Học Chuẩn Hóa 2025</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center p-1 bg-slate-950/60 rounded-xl border border-slate-800 shadow-inner">
          <button
            onClick={() => setActiveTab('matrix')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all duration-200 ${
              activeTab === 'matrix'
                ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span>1. Tạo Ma Trận</span>
          </button>

          <button
            onClick={() => setActiveTab('exam')}
            className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all duration-200 ${
              activeTab === 'exam'
                ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>2. Ra Đề Thi (AI)</span>
            {hasActiveMatrix && activeTab !== 'exam' && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping absolute top-1.5 right-1.5"></span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all duration-200 ${
              activeTab === 'history'
                ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <FolderClock className="w-4 h-4" />
            <span>3. Kho Lưu Trữ</span>
          </button>

          <button
            onClick={() => setActiveTab('mixer')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all duration-200 ${
              activeTab === 'mixer'
                ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Shuffle className="w-4 h-4" />
            <span>4. Trộn Đề</span>
          </button>
        </nav>

        {/* System Status & API Key */}
        <div className="flex items-center gap-2 sm:gap-3 text-xs">
          <div 
            title={serverOk ? "Máy chủ Node.js đang hoạt động" : "Chế độ chạy Client-side độc lập"}
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold ${
              serverOk 
                ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60' 
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${serverOk ? 'bg-emerald-400' : 'bg-slate-400'}`}></span>
            {serverOk ? 'Server Sẵn Sàng' : 'Local'}
          </div>

          <button
            onClick={onOpenApiKeyModal}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all border ${
              hasApiKey
                ? 'bg-emerald-900/40 hover:bg-emerald-900/60 text-emerald-300 border-emerald-700/60'
                : 'bg-amber-900/40 hover:bg-amber-900/60 text-amber-300 border-amber-700/60 animate-pulse'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>{hasApiKey ? 'Gemini Key: Đã kết nối' : 'Cấu hình Gemini Key'}</span>
          </button>
        </div>

      </div>
    </header>
  );
};
