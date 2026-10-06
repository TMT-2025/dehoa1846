import React, { useState, useEffect } from 'react';
import { Key, CheckCircle, AlertCircle, ExternalLink, X, ShieldCheck } from 'lucide-react';
import { getStoredApiKey, setStoredApiKey } from '../services/geminiService';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeySaved: () => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, onKeySaved }) => {
  const [apiKey, setApiKey] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setApiKey(getStoredApiKey());
      setSavedSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    setStoredApiKey(apiKey.trim());
    setSavedSuccess(true);
    onKeySaved();
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  const handleClear = () => {
    setStoredApiKey('');
    setApiKey('');
    onKeySaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-xl">
              <Key className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base">Cấu hình Google Gemini API Key</h3>
              <p className="text-xs text-indigo-300">Dùng để sinh đề trắc nghiệm tự động theo ma trận</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Gemini API Key của bạn
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none text-sm font-mono text-slate-800 transition-all"
            />
            <p className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 inline" />
              Khóa API được lưu an toàn trực tiếp trên trình duyệt của bạn hoặc đọc từ file <code className="text-indigo-600 font-semibold">.env</code>.
            </p>
          </div>

          <div className="p-3.5 bg-indigo-50 border border-indigo-100 rounded-xl text-xs text-indigo-900 space-y-1.5">
            <p className="font-bold flex items-center gap-1">
              <span>💡 Bạn chưa có API Key?</span>
            </p>
            <p className="text-slate-600">
              Bạn có thể tạo API Key hoàn toàn miễn phí tại Google AI Studio trong vòng 30 giây:
            </p>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 font-bold text-indigo-600 hover:text-indigo-800 hover:underline pt-1"
            >
              <span>Mở Google AI Studio để lấy Key</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {savedSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>Đã lưu API Key thành công! Sẵn sàng sinh đề.</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-100">
            {apiKey && (
              <button
                type="button"
                onClick={handleClear}
                className="px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              >
                Xóa Key
              </button>
            )}
            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={!apiKey.trim()}
                className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:pointer-events-none rounded-xl shadow-md hover:shadow-lg transition-all"
              >
                Lưu API Key
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
