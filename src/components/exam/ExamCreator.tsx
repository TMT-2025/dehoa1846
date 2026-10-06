import React, { useState, useEffect, useRef } from 'react';
import { CURRICULUM, GRADE_TOPICS } from '../../constants/curriculum';
import { ExamData, AppStatus, GradeLevel, ExamMatrixRow } from '../../types/exam';
import { generateExam } from '../../services/geminiService';
import { saveExamData } from '../../services/storageService';
import { ExamRenderer } from './ExamRenderer';
import { MatrixRenderer } from './MatrixRenderer';
import { 
  Sparkles, RefreshCw, AlertCircle, Image as ImageIcon, 
  X, CheckCircle, Info, ChevronRight, Layers, Cpu, ArrowLeft
} from 'lucide-react';
import { BridgeResult } from '../../services/bridgeService';

interface ExamCreatorProps {
  bridgeData: BridgeResult | null;
  onClearBridge: () => void;
  onSwitchToMatrixTab: () => void;
}

export const ExamCreator: React.FC<ExamCreatorProps> = ({ 
  bridgeData, 
  onClearBridge,
  onSwitchToMatrixTab
}) => {
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [exam, setExam] = useState<ExamData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(1);
  const [statusText, setStatusText] = useState('');

  const [grade, setGrade] = useState<GradeLevel>('12');
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [details, setDetails] = useState('');
  const [modelName, setModelName] = useState('gemini-2.5-flash');

  // Matrix image upload
  const [matrixImage, setMatrixImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // If bridgeData arrives from Tab 1, initialize form with it
  useEffect(() => {
    if (bridgeData) {
      setGrade(bridgeData.grade);
      setSelectedTopics(bridgeData.topics);
      setDetails(bridgeData.extraDetailsPrompt);
      setExam(null);
      setStatus(AppStatus.IDLE);
    }
  }, [bridgeData]);

  // When grade changes manually (and no active bridge), reset topics
  const handleGradeChange = (newGrade: GradeLevel) => {
    if (bridgeData) {
      onClearBridge();
    }
    setGrade(newGrade);
    setSelectedTopics([]);
    setMatrixImage(null);
  };

  const toggleTopic = (topic: string) => {
    setSelectedTopics(prev =>
      prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic]
    );
  };

  const handleSelectAllTopics = () => {
    setSelectedTopics(GRADE_TOPICS[grade] || []);
  };

  const handleDeselectAllTopics = () => {
    setSelectedTopics([]);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        setMatrixImage(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (selectedTopics.length === 0 && !matrixImage) {
      alert("Vui lòng chọn ít nhất một chương học hoặc tải lên ảnh ma trận!");
      return;
    }

    setStatus(AppStatus.GENERATING);
    setError(null);
    setAttempt(1);
    setStatusText('Đang kết nối Gemini và phân tích ma trận...');

    const matrixToUse = bridgeData?.examMatrix;
    const maxRetries = 2;
    let currentAttempt = 1;

    const progressMessages = [
      'Đang phân tích cấu trúc 40 lệnh hỏi...',
      'Đang soạn 18 câu trắc nghiệm khách quan (Phần I)...',
      'Đang xây dựng 4 bối cảnh thực tiễn Đúng/Sai (Phần II)...',
      'Đang tạo 6 bài toán tính toán có ý nghĩa thực tế (Phần III)...',
      'Đang thẩm định đáp án và tổng hợp dữ liệu...'
    ];

    let msgIndex = 0;
    const msgInterval = setInterval(() => {
      msgIndex = (msgIndex + 1) % progressMessages.length;
      setStatusText(progressMessages[msgIndex]);
    }, 4000);

    while (currentAttempt <= maxRetries) {
      try {
        setAttempt(currentAttempt);
        const data = await generateExam(
          grade, 
          selectedTopics.length > 0 ? selectedTopics : ['Chương trình Hóa học THPT'], 
          details, 
          matrixToUse, 
          matrixImage || undefined,
          modelName
        );

        clearInterval(msgInterval);
        setExam(data);
        setStatus(AppStatus.COMPLETED);
        // Automatically save to local history
        saveExamData(data);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      } catch (err: any) {
        console.error(`Attempt ${currentAttempt} failed:`, err);
        if (currentAttempt === maxRetries) {
          clearInterval(msgInterval);
          setError(err.message || 'Lỗi khi tạo đề thi. Vui lòng kiểm tra API Key hoặc thử lại.');
          setStatus(AppStatus.ERROR);
          return;
        }
        await new Promise(resolve => setTimeout(resolve, 2000));
        currentAttempt++;
      }
    }
  };

  const handleSaveCurrentExam = () => {
    if (!exam) return;
    saveExamData(exam);
    alert('Đã lưu đề thi thành công vào kho lưu trữ!');
  };

  return (
    <div className="space-y-8">
      
      {/* Active Bridge Notification Banner */}
      {bridgeData && (
        <div className="bg-gradient-to-r from-emerald-900 to-teal-950 p-4 rounded-2xl shadow-lg border border-emerald-500/40 text-white flex flex-col md:flex-row items-center justify-between gap-3 no-print">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500 text-white rounded-xl shadow">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/40">
                  Cầu Nối Liên Kết Ma Trận Hoạt Động
                </span>
              </div>
              <p className="text-sm font-bold text-white mt-0.5">
                {bridgeData.summaryText}
              </p>
              <p className="text-xs text-emerald-200">
                AI sẽ bám sát 100% tỉ lệ 4:3:3 và 4 bối cảnh thực tiễn bạn đã ấn định ở Bước 1!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClearBridge}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-emerald-100 transition-colors"
            >
              Hủy liên kết này
            </button>
            <button
              onClick={handleGenerate}
              disabled={status === AppStatus.GENERATING}
              className="px-5 py-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-extrabold text-xs shadow-md transition-all flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4 text-slate-950" />
              <span>Bắt Đầu Sinh Đề Ngay</span>
            </button>
          </div>
        </div>
      )}

      {/* Generation Config Box */}
      {status !== AppStatus.COMPLETED && (
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 space-y-6 no-print">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <span>Thiết Lập Sinh Đề Thi Hóa Học (AI)</span>
              </h2>
              <p className="text-xs text-slate-500">
                Tự động ra 18 câu MCQ, 4 câu Đúng/Sai bối cảnh thực tiễn và 6 câu trả lời ngắn kèm lời giải.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="font-semibold text-slate-600">Model AI:</span>
              <select
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold text-indigo-900 bg-slate-50 focus:border-indigo-500 outline-none"
              >
                <option value="gemini-2.5-flash">Gemini 2.5 Flash (Khuyên dùng - Nhanh, chuẩn)</option>
                <option value="gemini-3-flash-preview">Gemini 3 Flash Preview (Thế hệ mới)</option>
                <option value="gemini-1.5-pro">Gemini 1.5 Pro (Lý luận cao cấp)</option>
              </select>
            </div>
          </div>

          {/* Grade Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              1. Khối Lớp Học
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(['10', '11', '12'] as GradeLevel[]).map((g) => (
                <button
                  key={g}
                  onClick={() => handleGradeChange(g)}
                  className={`p-3.5 rounded-xl border font-bold text-center transition-all ${
                    grade === g
                      ? 'bg-indigo-50 border-indigo-600 text-indigo-950 shadow-sm ring-2 ring-indigo-500/20'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-indigo-300'
                  }`}
                >
                  <div className="text-lg font-extrabold text-indigo-600">Hóa Học {g}</div>
                  <div className="text-[11px] font-normal text-slate-500 mt-0.5">
                    {CURRICULUM[parseInt(g)].length} chương
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Topics Selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                2. Chọn các chương ra đề (Đã chọn: {selectedTopics.length})
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSelectAllTopics}
                  className="text-xs font-bold text-indigo-600 hover:underline"
                >
                  Chọn tất cả
                </button>
                <span className="text-slate-300">•</span>
                <button
                  onClick={handleDeselectAllTopics}
                  className="text-xs font-bold text-slate-500 hover:underline"
                >
                  Bỏ chọn
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {(GRADE_TOPICS[grade] || []).map((topic, idx) => {
                const isSelected = selectedTopics.includes(topic);
                return (
                  <div
                    key={idx}
                    onClick={() => toggleTopic(topic)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${
                      isSelected
                        ? 'bg-indigo-50/70 border-indigo-500 text-indigo-950 font-bold shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 font-medium'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                    />
                    <span className="text-xs leading-snug">{topic}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Image Matrix Upload (Optional OCR) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              3. Hoặc tải lên ảnh chụp Ma Trận (Tùy chọn - Gemini OCR)
            </label>
            <div className="flex items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 rounded-xl border border-dashed border-slate-300 hover:border-indigo-500 bg-slate-50 hover:bg-indigo-50/50 text-xs font-bold text-slate-700 flex items-center gap-2 transition-all"
              >
                <ImageIcon className="w-4 h-4 text-indigo-600" />
                <span>{matrixImage ? 'Thay đổi ảnh ma trận' : 'Tải lên ảnh ma trận (.png, .jpg)'}</span>
              </button>

              {matrixImage && (
                <div className="flex items-center gap-2 text-xs text-emerald-700 font-bold bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>Đã nhận ảnh ma trận</span>
                  <button
                    onClick={() => setMatrixImage(null)}
                    className="text-slate-400 hover:text-rose-600 p-0.5 ml-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Details / Instructions */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              4. Yêu cầu chi tiết & lưu ý soạn đề
            </label>
            <textarea
              rows={3}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="VD: Tập trung vào bài toán enthalpy và tốc độ phản ứng; Phần II chọn bối cảnh thí nghiệm sản xuất axit; Phần III làm tròn 2 chữ số thập phân..."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:border-indigo-500 outline-none transition-colors"
            />
          </div>

          {/* Error Message */}
          {status === AppStatus.ERROR && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Không thể tạo đề thi:</p>
                <p>{error}</p>
                <p className="text-[11px] text-rose-600 mt-1">
                  Gợi ý: Kiểm tra lại Google Gemini API Key hoặc thử chọn một model khác.
                </p>
              </div>
            </div>
          )}

          {/* Generating Indicator */}
          {status === AppStatus.GENERATING && (
            <div className="p-6 bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-2xl text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
              <p className="font-extrabold text-sm text-indigo-950">
                {statusText || 'Đang tạo đề thi bằng AI...'}
              </p>
              <p className="text-xs text-slate-500">
                Đang biên soạn câu hỏi chuẩn GDPT 2018 (Lần thử {attempt}/2). Thao tác này mất khoảng 20 - 45 giây.
              </p>
            </div>
          )}

          {/* Submit Action */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
            <button
              type="button"
              onClick={onSwitchToMatrixTab}
              className="px-4 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-50 rounded-xl transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Chưa có ma trận? Tạo ma trận trước</span>
            </button>

            <button
              onClick={handleGenerate}
              disabled={status === AppStatus.GENERATING || selectedTopics.length === 0}
              className="flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 disabled:opacity-50 disabled:pointer-events-none text-white font-extrabold text-sm shadow-xl hover:shadow-indigo-500/20 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>BẮT ĐẦU TẠO ĐỀ KIỂM TRA</span>
            </button>
          </div>

        </div>
      )}

      {/* Completed Exam View */}
      {status === AppStatus.COMPLETED && exam && (
        <div className="space-y-6">
          <div className="flex items-center justify-between no-print">
            <button
              onClick={() => setStatus(AppStatus.IDLE)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 shadow-sm transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-slate-600" />
              <span>Soạn đề khác hoặc chỉnh sửa</span>
            </button>

            <button
              onClick={handleSaveCurrentExam}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-xs font-bold text-amber-900 transition-colors"
            >
              <CheckCircle className="w-4 h-4 text-amber-700" />
              <span>Đã lưu vào kho đề</span>
            </button>
          </div>

          {/* Attached Distribution Matrix */}
          <MatrixRenderer data={exam} />

          {/* Exam Questions & Answers */}
          <ExamRenderer 
            data={exam} 
            onSaveExam={handleSaveCurrentExam}
          />
        </div>
      )}

    </div>
  );
};
