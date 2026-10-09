import React, { useState, useEffect, useRef } from 'react';
import { 
  Shuffle, FileText, Upload, Sparkles, CheckCircle2, 
  AlertCircle, Download, FileSpreadsheet, RefreshCw, 
  Settings2, ChevronDown, ChevronUp, Beaker, ShieldCheck, ArrowRight
} from 'lucide-react';
import saveAs from 'file-saver';
import { ExamData } from '../../types/exam.js';
import { 
  analyzeExamSource, executeMixerPipeline, 
  ExamAnalysisResult, MixerExecutionResult, MixerConfig 
} from '../../services/mixerService.js';

interface ExamMixerProps {
  initialExamData?: ExamData | null;
  onClearInitialExam?: () => void;
  onSwitchToCreateTab?: () => void;
}

export const ExamMixer: React.FC<ExamMixerProps> = ({
  initialExamData,
  onClearInitialExam,
  onSwitchToCreateTab
}) => {
  const [sourceMode, setSourceMode] = useState<'ai' | 'file' | 'sample'>('ai');
  const [currentExamData, setCurrentExamData] = useState<ExamData | null>(initialExamData || null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<ExamAnalysisResult | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Configuration
  const [variantCount, setVariantCount] = useState<number>(4);
  const [examCodeDigits, setExamCodeDigits] = useState<3 | 4>(4);
  const [examCodeStart, setExamCodeStart] = useState<string>('1001');
  const [shuffleQuestions, setShuffleQuestions] = useState<boolean>(true);
  const [shuffleOptions, setShuffleOptions] = useState<boolean>(true);
  const [shuffleTF, setShuffleTF] = useState<boolean>(false);
  const [seed, setSeed] = useState<number>(20260925);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  // Execution
  const [isMixing, setIsMixing] = useState(false);
  const [progressStage, setProgressStage] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);
  const [mixerResult, setMixerResult] = useState<MixerExecutionResult | null>(null);
  const [mixerError, setMixerError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // If initialExamData is received, analyze it automatically
  useEffect(() => {
    if (initialExamData) {
      setCurrentExamData(initialExamData);
      setSourceMode('ai');
      triggerAnalysis(initialExamData);
    }
  }, [initialExamData]);

  // Handle Exam Code Digits Toggle
  const handleDigitsToggle = (digits: 3 | 4) => {
    setExamCodeDigits(digits);
    const num = parseInt(examCodeStart, 10);
    if (digits === 3) {
      if (isNaN(num) || num >= 1000) setExamCodeStart('101');
      else setExamCodeStart(String(num).padStart(3, '0').slice(-3));
    } else {
      if (isNaN(num) || num < 1000) setExamCodeStart('1001');
      else setExamCodeStart(String(num).padStart(4, '0'));
    }
  };

  const handleCustomCodeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.trim();
    setExamCodeStart(val);
    if (val.length === 3) setExamCodeDigits(3);
    else if (val.length >= 4) setExamCodeDigits(4);
  };

  // Run analysis on source
  const triggerAnalysis = async (source: ExamData | File | Uint8Array, title?: string) => {
    setIsAnalyzing(true);
    setAnalysisError(null);
    setMixerResult(null);
    setMixerError(null);

    try {
      const res = await analyzeExamSource(source, title);
      setAnalysis(res);
    } catch (err: any) {
      console.error(err);
      setAnalysisError(err.message || 'Lỗi khi bóc tách cấu trúc đề thi');
      setAnalysis(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.docx')) {
      alert('Vui lòng chọn tệp định dạng .docx của Microsoft Word');
      return;
    }
    setUploadedFile(file);
    setCurrentExamData(null);
    setSourceMode('file');
    triggerAnalysis(file, file.name);
  };

  const handleLoadSample = async () => {
    try {
      setIsAnalyzing(true);
      setSourceMode('sample');
      setCurrentExamData(null);
      setUploadedFile(null);

      const res = await fetch('/samples/DeGocTron.docx');
      if (!res.ok) throw new Error('Không thể tải tệp đề mẫu');
      const ab = await res.arrayBuffer();
      const uint8 = new Uint8Array(ab);
      await triggerAnalysis(uint8, 'DeGoc_HoaHoc_ChuongEsterLipid.docx');
    } catch (err: any) {
      alert('Lỗi nạp đề mẫu: ' + err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Run mixing job
  const handleStartMixing = async () => {
    if (!analysis?.examIR) return;

    setIsMixing(true);
    setMixerError(null);
    setProgressPercent(5);
    setProgressStage('Bắt đầu tiến trình trộn đề...');

    const config: MixerConfig = {
      variantCount: Number(variantCount) || 4,
      examCodeStart: examCodeStart.trim() || '1001',
      seed: Number(seed) || 20260925,
      shuffleQuestions,
      shuffleOptions,
      shuffleTrueFalseSubItems: shuffleTF
    };

    try {
      const result = await executeMixerPipeline(
        analysis.examIR,
        config,
        (stage, pct) => {
          setProgressStage(stage);
          setProgressPercent(pct);
        }
      );
      setMixerResult(result);
    } catch (err: any) {
      console.error(err);
      setMixerError(err.message || 'Lỗi trong quá trình trộn đề');
    } finally {
      setIsMixing(false);
    }
  };

  // Downloads
  const downloadZip = () => {
    if (!mixerResult) return;
    saveAs(mixerResult.zipBlob, `GOI_DE_TRON_${examCodeStart}_${variantCount}_MA.zip`);
  };

  const downloadExcel = () => {
    if (!mixerResult) return;
    saveAs(mixerResult.excelBlob, `DAP_AN_MA_TRAN_${examCodeStart}.xlsx`);
  };

  const downloadJson = () => {
    if (!mixerResult) return;
    saveAs(mixerResult.jsonBlob, `DAP_AN_${examCodeStart}.json`);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      
      {/* Hero Showcase Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-950 text-white p-6 sm:p-8 shadow-2xl border border-indigo-900/60">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold tracking-wide uppercase">
              <Shuffle className="w-3.5 h-3.5 text-cyan-400" />
              <span>Core Mixing Engine v1.0 • Thuật toán Tất định</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase">
              4. Trộn Đề Thi Trắc Nghiệm Chuẩn THPT
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
              Hoán vị câu hỏi và phương án tất định cực nhanh (~0.05s/đề), bảo toàn 100% công thức Hóa học, chỉ số dưới (subscript), số mũ và hình vẽ. Xuất trọn gói file Word A4 và ma trận đáp án Excel trực quan.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-semibold shrink-0">
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2">
              <span className="text-emerald-400">🛡️</span>
              <span className="text-slate-200">Không lộ đáp án</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2">
              <span className="text-cyan-400">🧪</span>
              <span className="text-slate-200">Bảo toàn hóa học</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2">
              <span className="text-amber-400">📊</span>
              <span className="text-slate-200">Xuất đáp án excel</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2">
              <span className="text-purple-400">⚡</span>
              <span className="text-slate-200">Tất định 0.05s</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT COLUMN: SOURCE & CONFIGURATION */}
        <div className="lg:col-span-5 space-y-6">

          {/* 1. Nguồn Đề Thi (Source Selection) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">1</span>
                <span>Nguồn Đề Thi Gốc</span>
              </h2>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleLoadSample}
                  className="px-2.5 py-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3 text-indigo-600" />
                  <span>Dùng Đề Mẫu</span>
                </button>
              </div>
            </div>

            {/* If currentExamData from ChemSuite is present */}
            {currentExamData && sourceMode === 'ai' && (
              <div className="p-3.5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <span className="px-2 py-0.5 rounded-md bg-blue-600 text-white text-[10px] font-bold uppercase">
                      Đề tạo từ ChemSuite AI
                    </span>
                    <h3 className="font-extrabold text-xs text-blue-950 mt-1">
                      {currentExamData.title}
                    </h3>
                    <p className="text-[11px] text-blue-700 font-medium">
                      Lớp {currentExamData.grade} • 28 câu hỏi GDPT 2018
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setCurrentExamData(null);
                      setAnalysis(null);
                    }}
                    className="text-[10px] text-slate-400 hover:text-rose-600 underline cursor-pointer"
                  >
                    Bỏ chọn
                  </button>
                </div>
              </div>
            )}

            {/* Or File Upload / Dropzone */}
            {(!currentExamData || sourceMode !== 'ai') && (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-slate-50/60 hover:bg-indigo-50/30 p-5 rounded-xl text-center cursor-pointer transition-all space-y-2"
              >
                <Upload className="w-6 h-6 text-indigo-600 mx-auto" />
                <div>
                  <p className="text-xs font-bold text-slate-800">
                    {uploadedFile ? uploadedFile.name : 'Bấm để nạp tệp Word (.docx) từ máy'}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Hỗ trợ file Word chuẩn GDPT 2018 (Phần I, II, III)
                  </p>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  accept=".docx" 
                  className="hidden" 
                />
              </div>
            )}
          </div>

          {/* 2. Cấu hình Trộn Đề (Configuration) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">2</span>
              <span>Cấu Hình Sinh Mã Đề</span>
            </h2>

            <div className="space-y-4 text-xs font-medium text-slate-700">
              
              {/* Variant count */}
              <div>
                <label className="block mb-1 font-bold text-slate-800">Số lượng mã đề cần sinh</label>
                <input 
                  type="number" 
                  min={1} 
                  max={100} 
                  value={variantCount} 
                  onChange={(e) => setVariantCount(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none" 
                />
                <p className="text-[11px] text-slate-400 mt-1">Phổ biến: 4 đề, 8 đề, 12 đề, 24 đề...</p>
              </div>

              {/* Exam Code Start with 3 / 4 Digits Toggle */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-bold text-slate-800">Mã đề bắt đầu</label>
                  
                  {/* Digits Toggle Pills */}
                  <div className="inline-flex p-0.5 rounded-lg bg-slate-100 border border-slate-200 text-[11px] font-semibold">
                    <button
                      type="button"
                      onClick={() => handleDigitsToggle(3)}
                      className={`px-2.5 py-0.5 rounded-md transition-all cursor-pointer ${
                        examCodeDigits === 3 
                          ? 'bg-white text-indigo-700 font-bold shadow-xs' 
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      3 chữ số
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDigitsToggle(4)}
                      className={`px-2.5 py-0.5 rounded-md transition-all cursor-pointer ${
                        examCodeDigits === 4 
                          ? 'bg-white text-indigo-700 font-bold shadow-xs' 
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      4 chữ số
                    </button>
                  </div>
                </div>

                <input 
                  type="text" 
                  value={examCodeStart} 
                  onChange={handleCustomCodeInput}
                  maxLength={6}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-indigo-700 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" 
                />
                <div className="flex items-center justify-between mt-1 text-[11px] text-slate-400">
                  <span>{examCodeDigits === 3 ? 'Chuẩn 3 chữ số (101, 102...)' : 'Chuẩn 4 chữ số (1001, 1002...)'}</span>
                  <span className="text-[10px]">Tự gõ số tùy ý</span>
                </div>
              </div>

              {/* Shuffling Options */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={shuffleQuestions} 
                    onChange={(e) => setShuffleQuestions(e.target.checked)} 
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500" 
                  />
                  <span className="font-semibold text-slate-800">Xáo thứ tự câu hỏi trong từng phần</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={shuffleOptions} 
                    onChange={(e) => setShuffleOptions(e.target.checked)} 
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500" 
                  />
                  <span className="font-semibold text-slate-800">Xáo thứ tự phương án A, B, C, D (Phần I)</span>
                </label>
              </div>

              {/* Advanced Options Collapsible */}
              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center justify-between w-full py-1 cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <Settings2 className="w-3.5 h-3.5" />
                    <span>Tùy chọn nâng cao</span>
                  </span>
                  {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {showAdvanced && (
                  <div className="mt-2.5 p-3 bg-slate-50 rounded-xl space-y-3 text-xs border border-slate-200">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={shuffleTF} 
                        onChange={(e) => setShuffleTF(e.target.checked)} 
                        className="w-4 h-4 text-indigo-600 rounded border-slate-300" 
                      />
                      <span>Xáo thứ tự các ý Đúng/Sai (a, b, c, d) - Phần II</span>
                    </label>

                    <div>
                      <label className="block mb-1 font-semibold text-slate-700">Mã hạt giống tất định (Seed)</label>
                      <input 
                        type="number" 
                        value={seed} 
                        onChange={(e) => setSeed(parseInt(e.target.value, 10) || 20260925)} 
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs" 
                      />
                      <p className="text-[10px] text-slate-400 mt-0.5">Cùng một seed sẽ tạo ra kết quả trộn đồng nhất 100%.</p>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: PREVIEW & RESULTS */}
        <div className="lg:col-span-7 space-y-6">

          {/* 3. Bóc tách & Kiểm thử Cấu trúc (Analysis Preview) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">3</span>
              <span>Bóc Tách & Thẩm Định Đề Gốc</span>
            </h2>

            {isAnalyzing && (
              <div className="p-6 text-center space-y-2 bg-slate-50 rounded-xl">
                <RefreshCw className="w-6 h-6 text-indigo-600 animate-spin mx-auto" />
                <p className="text-xs font-bold text-slate-700">Đang phân tích cấu trúc OpenXML & ma trận...</p>
              </div>
            )}

            {analysisError && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Lỗi đọc đề thi:</p>
                  <p>{analysisError}</p>
                </div>
              </div>
            )}

            {!isAnalyzing && !analysis && !analysisError && (
              <div className="p-8 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl space-y-2">
                <FileText className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-medium">Chưa có đề thi nào được nạp.</p>
                <p className="text-[11px] text-slate-400">
                  Hãy chọn tệp Word từ máy hoặc bấm <strong>"Dùng Đề Mẫu"</strong> để trải nghiệm thử.
                </p>
              </div>
            )}

            {analysis && (
              <div className="space-y-3">
                <div className="grid grid-cols-4 gap-2.5">
                  <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl text-center">
                    <p className="text-[10px] text-blue-700 uppercase font-bold">Phần I (4 Lựa chọn)</p>
                    <p className="text-lg font-black text-blue-900 mt-0.5">{analysis.sectionCounts.part1} <span className="text-xs font-normal">câu</span></p>
                  </div>
                  <div className="p-3 bg-indigo-50/60 border border-indigo-200 rounded-xl text-center">
                    <p className="text-[10px] text-indigo-700 uppercase font-bold">Phần II (Đúng/Sai)</p>
                    <p className="text-lg font-black text-indigo-900 mt-0.5">{analysis.sectionCounts.part2} <span className="text-xs font-normal">câu</span></p>
                  </div>
                  <div className="p-3 bg-teal-50/60 border border-teal-200 rounded-xl text-center">
                    <p className="text-[10px] text-teal-700 uppercase font-bold">Phần III (Trả lời ngắn)</p>
                    <p className="text-lg font-black text-teal-900 mt-0.5">{analysis.sectionCounts.part3} <span className="text-xs font-normal">câu</span></p>
                  </div>
                  <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl text-center">
                    <p className="text-[10px] text-emerald-700 uppercase font-bold">Tổng số câu</p>
                    <p className="text-lg font-black text-emerald-900 mt-0.5">{analysis.sectionCounts.total} <span className="text-xs font-normal">câu</span></p>
                  </div>
                </div>

                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-emerald-900 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Thẩm định Gate 1 (Cấu trúc đề): ĐẠT CHUẨN</span>
                  </div>
                  <span className="text-[11px] text-emerald-700 font-semibold">Sẵn sàng trộn</span>
                </div>
              </div>
            )}
          </div>

          {/* 4. Thực thi Trộn & Kết Quả (Progress & Deliverables) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">4</span>
              <span>Sinh Mã Đề & Xuất Thành Phẩm</span>
            </h2>

            {/* Action Button */}
            {!isMixing && !mixerResult && (
              <button
                onClick={handleStartMixing}
                disabled={!analysis || isAnalyzing}
                className="w-full py-4 px-6 rounded-2xl font-black text-sm text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-600 shadow-lg shadow-indigo-500/25 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2.5 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
              >
                <Shuffle className="w-5 h-5 text-cyan-200" />
                <span>BẮT ĐẦU TRỘN {variantCount} MÃ ĐỀ THI</span>
              </button>
            )}

            {/* Progress Bar */}
            {isMixing && (
              <div className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-indigo-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold text-indigo-950 flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 text-indigo-600 animate-spin" />
                    <span>{progressStage}</span>
                  </span>
                  <span className="font-bold text-indigo-600">{progressPercent}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 h-2.5 rounded-full transition-all duration-300" 
                    style={{ width: `${progressPercent}%` }}
                  ></div>
                </div>
                <p className="text-[11px] text-slate-500 text-center">
                  Đang tiến hành hoán vị câu hỏi, mã hóa đáp án và thẩm định OpenXML...
                </p>
              </div>
            )}

            {/* Error Message */}
            {mixerError && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Lỗi trong tiến trình trộn đề:</p>
                  <p>{mixerError}</p>
                </div>
              </div>
            )}

            {/* Completed Deliverables */}
            {mixerResult && (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <p className="font-extrabold text-emerald-950 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Đã sinh thành công {mixerResult.variants.length} mã đề thi</span>
                    </p>
                    <p className="text-[11px] text-emerald-700">
                      Thời gian hoàn tất: {(mixerResult.durationMs / 1000).toFixed(2)}s • Kiểm định Gate 2 & Gate 3: PASS
                    </p>
                  </div>
                  <button
                    onClick={() => setMixerResult(null)}
                    className="text-xs font-bold text-slate-500 hover:text-slate-800 underline cursor-pointer"
                  >
                    Trộn lại
                  </button>
                </div>

                {/* Generated Codes List */}
                <div className="flex flex-wrap gap-2">
                  {mixerResult.variants.map(v => (
                    <span 
                      key={v.code} 
                      className="px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 font-mono font-bold text-xs text-slate-800 flex items-center gap-1.5 shadow-2xs"
                    >
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      Mã {v.code}
                    </span>
                  ))}
                </div>

                {/* Download Action Buttons */}
                <div className="space-y-2.5 pt-2 border-t border-slate-100">
                  <button
                    onClick={downloadZip}
                    className="w-full py-3.5 px-5 rounded-xl font-black text-xs text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-600 shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <Download className="w-4 h-4 text-cyan-200" />
                    <span>TẢI TRỌN GÓI KẾT QUẢ (.ZIP)</span>
                  </button>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <button
                      onClick={downloadExcel}
                      className="py-2.5 px-4 rounded-xl border border-emerald-500/30 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-xs"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
                      <span>Xuất đáp án Excel (.xlsx)</span>
                    </button>

                    <button
                      onClick={downloadJson}
                      className="py-2.5 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 font-bold text-xs text-slate-700 flex items-center justify-center gap-2 cursor-pointer transition-colors"
                    >
                      <FileText className="w-4 h-4 text-slate-500" />
                      <span>Tải Bảng Đáp Án (JSON)</span>
                    </button>
                  </div>
                </div>

              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
};
