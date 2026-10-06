import React, { useState, useEffect } from 'react';
import { SavedConfig, MatrixData } from '../../types/matrix';
import { ExamData } from '../../types/exam';
import { 
  getSavedMatrices, deleteSavedMatrix, 
  getSavedExams, deleteSavedExam 
} from '../../services/storageService';
import { 
  FolderClock, LayoutGrid, FileText, Trash2, 
  Download, ArrowRight, Eye, Calendar, Sparkles 
} from 'lucide-react';
import { ExamRenderer } from '../exam/ExamRenderer';
import { MatrixDisplay } from '../matrix/MatrixDisplay';

interface HistoryManagerProps {
  onLoadMatrixToEditor: (config: SavedConfig) => void;
  onTransferMatrixToExam: (matrixData: MatrixData) => void;
}

export const HistoryManager: React.FC<HistoryManagerProps> = ({
  onLoadMatrixToEditor,
  onTransferMatrixToExam
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'matrices' | 'exams'>('matrices');
  const [matrices, setMatrices] = useState<SavedConfig[]>([]);
  const [exams, setExams] = useState<ExamData[]>([]);
  const [previewExam, setPreviewExam] = useState<ExamData | null>(null);
  const [previewMatrix, setPreviewMatrix] = useState<MatrixData | null>(null);

  const loadData = () => {
    setMatrices(getSavedMatrices());
    setExams(getSavedExams());
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
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm no-print">
        <div className="flex items-center gap-2">
          <FolderClock className="w-5 h-5 text-indigo-600" />
          <h2 className="text-base font-bold text-slate-800">Kho Lưu Trữ Mẫu Ma Trận & Đề Thi</h2>
        </div>

        <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold">
          <button
            onClick={() => {
              setActiveSubTab('matrices');
              setPreviewExam(null);
            }}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all ${
              activeSubTab === 'matrices'
                ? 'bg-white text-indigo-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span>Mẫu Ma Trận ({matrices.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveSubTab('exams');
              setPreviewMatrix(null);
            }}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all ${
              activeSubTab === 'exams'
                ? 'bg-white text-indigo-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Đề Thi Đã Tạo ({exams.length})</span>
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

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2 mt-4">
                    <button
                      onClick={() => onLoadMatrixToEditor(config)}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                    >
                      Mở chỉnh sửa
                    </button>

                    {config.generatedMatrix && (
                      <button
                        onClick={() => onTransferMatrixToExam(config.generatedMatrix!)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Sinh đề AI</span>
                      </button>
                    )}
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

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2 mt-4">
                    <button
                      onClick={() => setPreviewExam(item)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-900 text-xs font-bold transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Xem & In đề</span>
                    </button>
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
          <button
            onClick={() => setPreviewExam(null)}
            className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 no-print"
          >
            ← Quay lại danh sách đề
          </button>
          <ExamRenderer data={previewExam} />
        </div>
      )}

    </div>
  );
};
