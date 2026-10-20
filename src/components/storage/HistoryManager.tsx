import React, { useState, useEffect } from 'react';
import { SavedConfig, MatrixData } from '../../types/matrix';
import { ExamData } from '../../types/exam';
import { 
  getSavedMatrices, deleteSavedMatrix, 
  getSavedExams, deleteSavedExam 
} from '../../services/storageService';
import { 
  FolderClock, LayoutGrid, FileText, Trash2, 
  Download, ArrowRight, Eye, Calendar, Sparkles, Edit3, Shuffle,
  CheckCheck, X
} from 'lucide-react';
import { ExamRenderer } from '../exam/ExamRenderer';
import { MatrixDisplay } from '../matrix/MatrixDisplay';
import { mixExamDataPreservingAnswers } from '../../services/mixerService';

interface HistoryManagerProps {
  onLoadMatrixToEditor: (config: SavedConfig) => void;
  onTransferMatrixToExam: (matrixData: MatrixData) => void;
  onTransferExamToMixer?: (exam: ExamData) => void;
}

export const HistoryManager: React.FC<HistoryManagerProps> = ({
  onLoadMatrixToEditor,
  onTransferMatrixToExam,
  onTransferExamToMixer
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'matrices' | 'exams'>('matrices');
  const [matrices, setMatrices] = useState<SavedConfig[]>([]);
  const [exams, setExams] = useState<ExamData[]>([]);
  const [previewExam, setPreviewExam] = useState<ExamData | null>(null);
  const [previewMatrix, setPreviewMatrix] = useState<MatrixData | null>(null);
  const [isMixedView, setIsMixedView] = useState<boolean>(false);

  // Mixing options modal state
  const [mixModalExam, setMixModalExam] = useState<ExamData | null>(null);
  const [variantCountChoice, setVariantCountChoice] = useState<1 | 2>(1);
  const [optShuffleQuestions, setOptShuffleQuestions] = useState<boolean>(true);
  const [optShuffleOptions, setOptShuffleOptions] = useState<boolean>(true);
  const [optShuffleTF, setOptShuffleTF] = useState<boolean>(true);
  const [mixedVariants, setMixedVariants] = useState<ExamData[]>([]);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState<number>(0);

  const loadData = () => {
    setMatrices(getSavedMatrices());
    setExams(getSavedExams());
  };

  const handleOpenMixModal = (item: ExamData) => {
    setMixModalExam(item);
  };

  const handleExecuteMixWithAnswers = () => {
    if (!mixModalExam) return;
    const baseCode = mixModalExam.grade === 12 ? 1201 : mixModalExam.grade === 11 ? 1101 : 1001;

    if (variantCountChoice === 1) {
      const v1 = mixExamDataPreservingAnswers(mixModalExam, {
        shuffleQuestions: optShuffleQuestions,
        shuffleOptions: optShuffleOptions,
        shuffleTF: optShuffleTF,
        seed: Math.floor(Math.random() * 1000000),
        examCode: String(baseCode)
      });
      setMixedVariants([v1]);
      setSelectedVariantIndex(0);
      setPreviewExam(v1);
    } else {
      // 2 variants
      const v1 = mixExamDataPreservingAnswers(mixModalExam, {
        shuffleQuestions: optShuffleQuestions,
        shuffleOptions: optShuffleOptions,
        shuffleTF: optShuffleTF,
        seed: 112233,
        examCode: String(baseCode)
      });
      const v2 = mixExamDataPreservingAnswers(mixModalExam, {
        shuffleQuestions: optShuffleQuestions,
        shuffleOptions: optShuffleOptions,
        shuffleTF: optShuffleTF,
        seed: 998877,
        examCode: String(baseCode + 1)
      });
      setMixedVariants([v1, v2]);
      setSelectedVariantIndex(0);
      setPreviewExam(v1);
    }

    setIsMixedView(true);
    setMixModalExam(null);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDeleteMatrix = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Bạn có chắc chắn muốn xóa mẫu ma trận này?')) {
      deleteSavedMatrix(id);
      loadData();
      if (previewMatrix) setPreviewMatrix(null);
    }
  };

  const handleDeleteExam = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Bạn có chắc chắn muốn xóa đề thi này khỏi kho lưu trữ?')) {
      deleteSavedExam(id);
      loadData();
      if (previewExam && previewExam.id === id) setPreviewExam(null);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Sub Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm no-print">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
            <FolderClock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800">Kho Lưu Trữ Dữ Liệu</h2>
            <p className="text-xs text-slate-500">Quản lý mẫu ma trận khung và các bộ đề thi đã khởi tạo</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/70">
          {/* Nút 1: Mẫu Ma Trận - Tông màu Indigo / Tím nổi bật */}
          <button
            onClick={() => {
              setActiveSubTab('matrices');
              setPreviewExam(null);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all duration-200 cursor-pointer active:scale-95 ${
              activeSubTab === 'matrices'
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/25 ring-2 ring-indigo-400/30'
                : 'bg-indigo-50/70 text-indigo-700 hover:bg-indigo-100 border border-indigo-200/70 hover:border-indigo-300'
            }`}
          >
            <LayoutGrid className={`w-4 h-4 ${activeSubTab === 'matrices' ? 'text-white' : 'text-indigo-600'}`} />
            <span>Mẫu Ma Trận</span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-black transition-colors ${
                activeSubTab === 'matrices'
                  ? 'bg-white/20 text-white border border-white/25 backdrop-blur-xs'
                  : 'bg-indigo-200/70 text-indigo-900 border border-indigo-300/50'
              }`}
            >
              {matrices.length}
            </span>
          </button>

          {/* Nút 2: Đề Thi Đã Tạo - Tông màu Emerald / Xanh ngọc nổi bật */}
          <button
            onClick={() => {
              setActiveSubTab('exams');
              setPreviewMatrix(null);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all duration-200 cursor-pointer active:scale-95 ${
              activeSubTab === 'exams'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/25 ring-2 ring-emerald-400/30'
                : 'bg-emerald-50/70 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/70 hover:border-emerald-300'
            }`}
          >
            <FileText className={`w-4 h-4 ${activeSubTab === 'exams' ? 'text-white' : 'text-emerald-600'}`} />
            <span>Đề Thi Đã Tạo</span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-black transition-colors ${
                activeSubTab === 'exams'
                  ? 'bg-white/20 text-white border border-white/25 backdrop-blur-xs'
                  : 'bg-emerald-200/70 text-emerald-900 border border-emerald-300/50'
              }`}
            >
              {exams.length}
            </span>
          </button>
        </div>
      </div>

      {/* MATRICES LIST */}
      {activeSubTab === 'matrices' && !previewMatrix && (
        <div className="space-y-4">
          {matrices.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 space-y-2">
              <LayoutGrid className="w-12 h-12 text-slate-300 mx-auto" />
              <p className="font-bold text-sm text-slate-700">Chưa có mẫu ma trận nào được lưu.</p>
              <p className="text-xs">
                Khi tạo xong ma trận ở Tab 1, bạn có thể bấm "Lưu mẫu ma trận" để tái sử dụng nhanh chóng!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {matrices.map((config) => (
                <div
                  key={config.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {config.grade === 'Tự do' ? 'Tự do' : `Lớp ${config.grade}`} • {config.examType}
                      </span>
                      <button
                        onClick={(e) => handleDeleteMatrix(config.id, e)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <h3 className="font-bold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {config.name}
                    </h3>

                    <p className="text-xs text-slate-500 line-clamp-2">
                      {config.selectedChapters.map(c => c.name).join(', ')}
                    </p>

                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 pt-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{new Date(config.timestamp).toLocaleDateString('vi-VN')}</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 mt-4">
                    <button
                      onClick={() => onLoadMatrixToEditor(config)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-amber-700" />
                      <span>Mở chỉnh sửa</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      {config.generatedMatrix && (
                        <button
                          onClick={() => setPreviewMatrix(config.generatedMatrix!)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                          title="Xem trước bảng ma trận"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-600" />
                          <span>Xem bảng</span>
                        </button>
                      )}

                      {config.generatedMatrix && (
                        <button
                          onClick={() => onTransferMatrixToExam(config.generatedMatrix!)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors shadow-xs cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Sinh đề AI</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MATRIX PREVIEW */}
      {previewMatrix && (
        <div className="space-y-4">
          <button
            onClick={() => setPreviewMatrix(null)}
            className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 no-print"
          >
            ← Quay lại danh sách
          </button>
          <MatrixDisplay
            data={previewMatrix}
            onUpdateMatrixData={setPreviewMatrix}
            onTransferToExam={onTransferMatrixToExam}
            onSaveConfig={() => {}}
          />
        </div>
      )}

      {/* EXAMS LIST */}
      {activeSubTab === 'exams' && !previewExam && (
        <div className="space-y-4">
          {exams.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 space-y-2">
              <FileText className="w-12 h-12 text-slate-300 mx-auto" />
              <p className="font-bold text-sm text-slate-700">Chưa có đề thi nào trong kho lưu trữ.</p>
              <p className="text-xs">
                Khi sinh đề bằng AI ở Tab 2, các đề thi sẽ tự động được lưu trữ tại đây!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {exams.map((item) => (
                <div
                  key={item.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-50 text-emerald-800 border border-emerald-200">
                        Khối {item.grade} • 40 Lệnh hỏi
                      </span>
                      <button
                        onClick={(e) => handleDeleteExam(item.id!, e)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <h3 className="font-bold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {item.title}
                    </h3>

                    <p className="text-xs text-slate-500">
                      18 câu MCQ, 4 câu Đúng/Sai, 6 câu trả lời ngắn kèm lời giải chi tiết.
                    </p>

                    {item.createdAt && (
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 pt-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{new Date(item.createdAt).toLocaleDateString('vi-VN')}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 mt-4">
                    <button
                      onClick={() => {
                        setIsMixedView(false);
                        setPreviewExam(item);
                      }}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-900 text-xs font-bold transition-colors cursor-pointer"
                      title="Xem trước đề gốc và in ấn"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Xem & In đề</span>
                    </button>

                    <button
                      onClick={() => handleOpenMixModal(item)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 text-xs font-bold transition-colors cursor-pointer"
                      title="Mở bảng tùy chọn: Trộn 1 hoặc 2 đề, đảo phương án/câu hỏi và giữ nguyên đáp án in nghiêng gạch chân để kiểm tra"
                    >
                      <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Trộn đề giữ nguyên đáp án</span>
                    </button>

                    {onTransferExamToMixer && (
                      <button
                        onClick={() => onTransferExamToMixer(item)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 text-xs font-bold transition-colors cursor-pointer"
                        title="Chuyển sang module 4. Trộn đề"
                      >
                        <Shuffle className="w-3.5 h-3.5 text-purple-600" />
                        <span>Trộn đề</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* EXAM PREVIEW */}
      {previewExam && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm no-print">
            <button
              onClick={() => {
                setPreviewExam(null);
                setIsMixedView(false);
                setMixedVariants([]);
              }}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-colors cursor-pointer"
            >
              ← Quay lại danh sách đề
            </button>

            {/* If 2 variants were generated, allow quick switching */}
            {mixedVariants.length > 1 && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700">Mã đề:</span>
                {mixedVariants.map((v, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedVariantIndex(idx);
                      setPreviewExam(v);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      selectedVariantIndex === idx
                        ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-600/30'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                    }`}
                  >
                    Mã đề {v.title.match(/Mã đề\s*(\w+)/i)?.[1] || `0${idx + 1}`}
                  </button>
                ))}
              </div>
            )}
          </div>

          <ExamRenderer 
            data={previewExam} 
            onTransferToMixer={onTransferExamToMixer}
            initialShowAnswers={isMixedView}
            isMixedPreview={isMixedView}
          />
        </div>
      )}

      {/* MIXING OPTIONS MODAL */}
      {mixModalExam && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <CheckCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">
                    Trộn Đề Giữ Nguyên Đáp Án
                  </h3>
                  <p className="text-[11px] text-slate-500 line-clamp-1">
                    {mixModalExam.title}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setMixModalExam(null)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 1. Chọn số lượng mã đề */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-800">
                1. Chọn số lượng đề cần trộn:
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setVariantCountChoice(1)}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    variantCountChoice === 1
                      ? 'border-emerald-500 bg-emerald-50/60 text-emerald-950 font-bold ring-2 ring-emerald-500/20 shadow-xs'
                      : 'border-slate-200 bg-slate-50/50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <p className="text-xs font-extrabold">Trộn 1 đề</p>
                  <p className="text-[10px] text-slate-500 font-normal mt-0.5">Sinh 1 mã đề kiểm tra nhanh</p>
                </button>

                <button
                  type="button"
                  onClick={() => setVariantCountChoice(2)}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    variantCountChoice === 2
                      ? 'border-emerald-500 bg-emerald-50/60 text-emerald-950 font-bold ring-2 ring-emerald-500/20 shadow-xs'
                      : 'border-slate-200 bg-slate-50/50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <p className="text-xs font-extrabold">Trộn 2 đề</p>
                  <p className="text-[10px] text-slate-500 font-normal mt-0.5">Sinh 2 mã đề đối soát chéo</p>
                </button>
              </div>
            </div>

            {/* 2. Tùy chọn đảo trộn */}
            <div className="space-y-2.5 pt-2 border-t border-slate-100">
              <label className="text-xs font-bold text-slate-800">
                2. Tùy chọn đảo trộn đáp án & câu hỏi:
              </label>

              <div className="space-y-2.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={optShuffleQuestions}
                    onChange={(e) => setOptShuffleQuestions(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                  />
                  <span className="font-medium text-slate-800">
                    Xáo thứ tự các câu hỏi trong từng phần (Phần I, II, III)
                  </span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={optShuffleOptions}
                    onChange={(e) => setOptShuffleOptions(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                  />
                  <span className="font-medium text-slate-800">
                    Xáo thứ tự các phương án A, B, C, D (Phần I)
                  </span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={optShuffleTF}
                    onChange={(e) => setOptShuffleTF(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                  />
                  <span className="font-medium text-slate-800">
                    Xáo thứ tự các ý Đúng / Sai a, b, c, d (Phần II)
                  </span>
                </label>
              </div>
            </div>

            {/* Quy chuẩn hiển thị */}
            <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200 text-[11px] text-blue-950 leading-relaxed">
              <span className="font-bold">Quy cách thể hiện đáp án:</span>
              <ul className="list-disc list-inside mt-0.5 space-y-0.5 text-blue-900">
                <li>Phần I & II: Phương án đúng được <em><u>in nghiêng và gạch chân</u></em>.</li>
                <li>Phần III: Hiển thị <em><u>A. [Đáp số]</u></em> (màu xanh, không có lời giải).</li>
                <li>Phần IV (Tự luận nếu có): Giữ nguyên thứ tự và thang điểm.</li>
              </ul>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setMixModalExam(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleExecuteMixWithAnswers}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCheck className="w-4 h-4" />
                <span>Bắt đầu trộn & Xem đề</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
