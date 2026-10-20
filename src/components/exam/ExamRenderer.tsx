import React, { useState, useEffect } from 'react';
import { ExamData } from '../../types/exam';
import { 
  FileText, Download, Eye, EyeOff, Printer, 
  Save, CheckCircle2, BookmarkCheck, Share2, Shuffle,
  CheckCheck, RefreshCw
} from 'lucide-react';
import { downloadExamDoc } from '../../services/docxService';
import { mixExamDataPreservingAnswers } from '../../services/mixerService';

interface ExamRendererProps {
  data: ExamData;
  onSaveExam?: () => void;
  onTransferToMixer?: (data: ExamData) => void;
  initialShowAnswers?: boolean;
  isMixedPreview?: boolean;
  onRemix?: () => void;
}

export const ExamRenderer: React.FC<ExamRendererProps> = ({ 
  data, 
  onSaveExam,
  onTransferToMixer,
  initialShowAnswers,
  isMixedPreview,
  onRemix
}) => {
  const [currentExamData, setCurrentExamData] = useState<ExamData>(data);
  const [showAnswers, setShowAnswers] = useState(initialShowAnswers ?? false);
  const [isMixed, setIsMixed] = useState<boolean>(isMixedPreview ?? false);
  const [isExportingDoc, setIsExportingDoc] = useState(false);

  useEffect(() => {
    setCurrentExamData(data);
    if (initialShowAnswers !== undefined) {
      setShowAnswers(initialShowAnswers);
    }
    if (isMixedPreview !== undefined) {
      setIsMixed(isMixedPreview);
    }
  }, [data, initialShowAnswers, isMixedPreview]);

  const handleQuickMixWithAnswers = () => {
    const mixed = mixExamDataPreservingAnswers(currentExamData);
    setCurrentExamData(mixed);
    setShowAnswers(true);
    setIsMixed(true);
    if (onRemix) onRemix();
  };

  const formatFormula = (text: string) => {
    if (!text) return null;
    const regex = /([a-zA-Z\d\)])(\d*[\+\-])|([spdf])(\d+)|([a-zA-Z\)])(\d+)/g;
    const parts: (string | React.ReactNode)[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }

      const charBefore = match[1] || match[3] || match[5];
      parts.push(charBefore);

      const value = match[2] || match[4] || match[6];
      const key = `chem-${match.index}-${value}`;

      if (match[2]) { // Charge
        parts.push(<sup key={key} className="text-[0.8em] leading-none inline-block font-medium align-super text-indigo-900">{value}</sup>);
      } else if (match[4]) { // Electron configuration
        parts.push(<sup key={key} className="text-[0.8em] leading-none inline-block font-medium align-super text-indigo-900">{value}</sup>);
      } else if (match[6]) { // Atom subscript
        parts.push(<sub key={key} className="text-[0.8em] leading-none inline-block font-medium align-sub text-indigo-900">{value}</sub>);
      }

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    if (parts.length === 0) return <span>{text}</span>;
    return parts.map((p, i) => <React.Fragment key={i}>{p}</React.Fragment>);
  };

  const handleDownloadDoc = async (isAnswerKey: boolean) => {
    try {
      setIsExportingDoc(true);
      await downloadExamDoc(currentExamData, isAnswerKey);
    } catch (e: any) {
      alert(e.message || 'Lỗi khi tải file Word');
    } finally {
      setIsExportingDoc(false);
    }
  };

  const labelsPart1 = ['A', 'B', 'C', 'D'];
  const labelsPart2 = ['a', 'b', 'c', 'd'];

  return (
    <div className="space-y-6">
      
      {/* Top Controls Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3 no-print">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-xs font-bold text-slate-800">
            {isMixed ? 'Đề trộn kiểm tra đáp án:' : 'Đề thi đã hoàn tất:'} <span className="text-indigo-600">{currentExamData.title}</span>
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Mix with Answers Button */}
          <button
            onClick={handleQuickMixWithAnswers}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm cursor-pointer"
            title="Đảo thứ tự câu hỏi và phương án, tự động hiện đáp án chuẩn xác để giáo viên đối soát"
          >
            {isMixed ? <RefreshCw className="w-3.5 h-3.5" /> : <CheckCheck className="w-3.5 h-3.5" />}
            <span>{isMixed ? 'Trộn lại mã khác (giữ đáp án)' : 'Trộn đề giữ nguyên đáp án'}</span>
          </button>

          {/* Toggle Answer Key */}
          <button
            onClick={() => setShowAnswers(!showAnswers)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              showAnswers
                ? 'bg-blue-600 text-white border-blue-600 shadow'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
            }`}
          >
            {showAnswers ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{showAnswers ? 'Ẩn đáp án & giải thích' : 'Hiện đáp án & giải thích'}</span>
          </button>

          {/* Download Exam Doc */}
          <button
            onClick={() => handleDownloadDoc(false)}
            disabled={isExportingDoc}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 rounded-xl text-xs font-bold transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-indigo-600" />
            <span>Tải Word Đề thi (.docx)</span>
          </button>

          {/* Download Answer Key Doc */}
          <button
            onClick={() => handleDownloadDoc(true)}
            disabled={isExportingDoc}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-xl text-xs font-bold transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>Tải Word Đề + Đáp án (.docx)</span>
          </button>

          {/* Print */}
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>In đề</span>
          </button>

          {/* Save Exam */}
          {onSaveExam && (
            <button
              onClick={onSaveExam}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold transition-colors"
            >
              <Save className="w-3.5 h-3.5 text-amber-700" />
              <span>Lưu vào kho</span>
            </button>
          )}

          {/* Transfer to Mixer */}
          {onTransferToMixer && (
            <button
              onClick={() => onTransferToMixer(currentExamData)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-indigo-500/20 transition-all cursor-pointer"
              title="Chuyển đề này sang module 4. Trộn đề"
            >
              <Shuffle className="w-3.5 h-3.5" />
              <span>Trộn đề này</span>
            </button>
          )}
        </div>
      </div>

      {/* Mixed Exam Notice Banner for Teachers */}
      {isMixed && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 flex items-start gap-3 text-emerald-900 shadow-sm no-print">
          <CheckCheck className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
          <div className="text-xs leading-relaxed space-y-1">
            <p className="font-bold text-emerald-950 text-sm">
              Chế độ trộn đề giữ nguyên đáp án (Dành cho Giáo viên kiểm tra & đối soát trước khi phát hành):
            </p>
            <p className="text-emerald-800">
              Đề thi đã được hoán vị ngẫu nhiên cả câu hỏi và các phương án. Tất cả đáp án chuẩn ở <strong>Phần I</strong>, <strong>Phần II</strong>, <strong>Phần III</strong> (và <strong>Phần IV tự luận</strong> nếu có) được thể hiện trực quan để thầy/cô đối soát trước khi in ấn hoặc phát hành đề cho học sinh.
            </p>
          </div>
        </div>
      )}

      {/* Main Exam Content Paper */}
      <div className={`exam-print-area bg-white p-6 md:p-12 shadow-xl rounded-2xl border border-slate-200 max-w-4xl mx-auto text-slate-800 leading-normal transition-colors ${
        showAnswers ? 'ring-2 ring-blue-500/30' : ''
      }`}>
        
        {/* Header */}
        <div className="text-center mb-8 pb-4 border-b border-slate-200">
          <div className="flex justify-between items-start text-xs text-slate-900 mb-4 leading-relaxed">
            <div className="text-left">
              <p className="font-semibold text-slate-800 uppercase tracking-wide">
                SỞ GIÁO DỤC VÀ ĐÀO TẠO VĨNH LONG
              </p>
              <p className="font-extrabold text-slate-950 uppercase tracking-wide mt-0.5">
                TRƯỜNG <span className="underline decoration-slate-900 underline-offset-2">THCS-THPT PHAN VĂN TRỊ</span>
              </p>
            </div>
            <div className="text-center sm:text-right">
              <p className="font-black text-slate-950 uppercase tracking-wide">
                ĐỀ KIỂM TRA ..........
              </p>
              <p className="font-bold text-slate-900 mt-0.5">
                Môn : Hóa Học
              </p>
              <p className="font-semibold text-slate-800">
                NĂM HỌC 2026 – 2027
              </p>
              <p className="font-bold text-slate-950">
                Thời gian làm bài: 45 phút
              </p>
            </div>
          </div>

          <h1 className="text-lg md:text-xl font-extrabold uppercase tracking-tight text-slate-900 mt-2">
            {currentExamData.title}
          </h1>
          {showAnswers && (
            <span className="inline-block mt-1 px-3 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-bold uppercase tracking-wider">
              HƯỚNG DẪN CHẤM & ĐÁP ÁN CHI TIẾT
            </span>
          )}
        </div>

        {/* PART 1 */}
        <section className="mb-10">
          <div className="p-2.5 bg-slate-100 rounded-lg mb-4 flex items-center justify-between">
            <h2 className="font-bold text-xs uppercase tracking-wider text-slate-900">
              PHẦN I. Câu trắc nghiệm nhiều phương án lựa chọn ({currentExamData.part1.length} câu - {(currentExamData.part1.length * 0.25).toFixed(1).replace('.', ',')} điểm)
            </h2>
            <span className="text-[11px] italic text-slate-500">Mỗi câu chọn 01 phương án đúng</span>
          </div>

          <div className="space-y-5">
            {currentExamData.part1.map((q, idx) => (
              <div key={idx} className="text-sm">
                <p className="font-medium text-slate-900 mb-2 leading-relaxed">
                  <span className="font-bold text-indigo-950">Câu {idx + 1}.</span> {formatFormula(q.question)}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-4">
                  {q.options.map((opt, oIdx) => {
                    const isCorrect = showAnswers && oIdx === q.correctIndex;
                    const cleanOpt = opt.replace(/^[A-D][\.\)]\s*/i, '').replace(/^\.\s*/, '');

                    return (
                      <div
                        key={oIdx}
                        className={`p-2 rounded-lg text-xs transition-colors flex items-start gap-1.5 ${
                          isCorrect 
                            ? 'bg-emerald-100 text-emerald-950 font-bold border border-emerald-300' 
                            : 'hover:bg-slate-50'
                        }`}
                      >
                        <span className="font-bold text-slate-700">{labelsPart1[oIdx]}.</span>
                        <span className="flex-1">{formatFormula(cleanOpt)}</span>
                        {isCorrect && (
                          <span className="flex items-center gap-1 text-[10px] bg-emerald-600 text-white px-1.5 py-0.5 rounded font-extrabold shrink-0">
                            <CheckCircle2 className="w-3 h-3" />
                            ĐÚNG
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* PART 2 */}
        <section className="mb-10">
          <div className="p-2.5 bg-emerald-50 border border-emerald-100 rounded-lg mb-4 flex items-center justify-between">
            <h2 className="font-bold text-xs uppercase tracking-wider text-emerald-950">
              PHẦN II. Câu trắc nghiệm đúng sai ({currentExamData.part2.length} câu - {(currentExamData.part2.length * 1.0).toFixed(1).replace('.', ',')} điểm)
            </h2>
            <span className="text-[11px] italic text-emerald-700">Mỗi câu gồm 4 ý nhận định</span>
          </div>

          <div className="space-y-6">
            {currentExamData.part2.map((sc, idx) => (
              <div key={idx} className="text-sm p-4 rounded-xl bg-slate-50/70 border border-slate-200">
                <div className="font-medium text-slate-900 mb-3 leading-relaxed">
                  <span className="font-bold text-emerald-900">Câu {idx + 1}.</span> {formatFormula(sc.context)}
                </div>
                <div className="space-y-2 pl-2">
                  {sc.statements.map((st, sIdx) => {
                    const cleanText = st.text.replace(/^[a-d][\.\)]\s*/i, '').replace(/^\.\s*/, '');
                    const isTrue = !!st.isTrue;
                    return (
                      <div 
                        key={sIdx} 
                        className={`p-2 rounded-lg text-xs flex items-center justify-between gap-2 transition-colors ${
                          showAnswers 
                            ? isTrue 
                              ? 'bg-emerald-50/80 text-emerald-950 border border-emerald-200' 
                              : 'bg-rose-50/60 text-rose-950 border border-rose-200'
                            : 'text-slate-800 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-start gap-2 flex-1">
                          <span className="font-bold text-slate-800 whitespace-nowrap">{labelsPart2[sIdx]})</span>
                          <span className="flex-1">{formatFormula(cleanText)}</span>
                        </div>
                        {showAnswers && (
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase shrink-0 border ${
                            isTrue 
                              ? 'bg-emerald-600 text-white border-emerald-600' 
                              : 'bg-rose-600 text-white border-rose-600'
                          }`}>
                            {isTrue ? 'Đúng' : 'Sai'}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* PART 3 */}
        <section className="mb-8">
          <div className="p-2.5 bg-indigo-50 border border-indigo-100 rounded-lg mb-4 flex items-center justify-between">
            <h2 className="font-bold text-xs uppercase tracking-wider text-indigo-950">
              PHẦN III. Câu trắc nghiệm trả lời ngắn ({currentExamData.part3.length} câu - {(currentExamData.part3.length === 4 || (currentExamData.part4 && currentExamData.part4.length > 0)) ? '2,0' : '1,5'} điểm)
            </h2>
            <span className="text-[11px] italic text-indigo-700">
              {(currentExamData.part3.length === 4 || (currentExamData.part4 && currentExamData.part4.length > 0)) ? 'Mỗi câu đúng 0,5 điểm' : 'Điền con số đáp án cụ thể'}
            </span>
          </div>

          <div className="space-y-6">
            {currentExamData.part3.map((q, idx) => (
              <div key={idx} className="text-sm p-4 rounded-xl bg-slate-50/70 border border-slate-200">
                <p className="font-medium text-slate-900 mb-2 leading-relaxed">
                  <span className="font-bold text-indigo-900">Câu {idx + 1}.</span> {formatFormula(q.question)}
                </p>

                {showAnswers ? (
                  <div className="mt-2 p-3 bg-blue-50/60 rounded-xl border border-blue-200 space-y-2 text-xs">
                    <div className="font-bold text-blue-700 italic border-l-4 border-blue-500 pl-3 py-1 flex items-center gap-2">
                      <span className="text-[11px] uppercase tracking-wider font-extrabold text-blue-900 bg-blue-100 px-2 py-0.5 rounded">Đáp số:</span>
                      <span className="underline text-sm font-extrabold">{q.answer}</span>
                    </div>
                    {q.explanation && (
                      <div className="text-[12px] text-slate-600 italic border-l-4 border-slate-300 pl-3 py-1">
                        <span className="font-bold not-italic text-slate-800">Hướng dẫn giải: </span>
                        {formatFormula(q.explanation)}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mt-2 flex items-center gap-2 py-1 text-xs">
                    <span className="font-bold italic text-slate-700">A.</span>
                    <div className="w-full max-w-[150px] border-b-2 border-dotted border-slate-400 h-4"></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* PART 4 (TỰ LUẬN) */}
        {currentExamData.part4 && currentExamData.part4.length > 0 && (
          <section className="mb-8">
            <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg mb-4 flex items-center justify-between">
              <h2 className="font-bold text-xs uppercase tracking-wider text-amber-950">
                PHẦN IV. TỰ LUẬN ({currentExamData.part4.length} câu - 3,0 điểm)
              </h2>
              <span className="text-[11px] italic text-amber-800">Thí sinh trình bày lời giải chi tiết</span>
            </div>

            <div className="space-y-6">
              {currentExamData.part4.map((q, idx) => (
                <div key={idx} className="text-sm p-4 rounded-xl bg-amber-50/30 border border-amber-200">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <p className="font-medium text-slate-900 leading-relaxed flex-1">
                      <span className="font-bold text-amber-950">Câu {idx + 1} ({q.points || 1.0} điểm).</span> {formatFormula(q.question)}
                    </p>
                    <span className="shrink-0 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-xs font-bold border border-amber-300">
                      {q.points || 1.0} điểm
                    </span>
                  </div>

                  {showAnswers ? (
                    <div className="mt-3 p-3.5 bg-emerald-50/80 rounded-xl border border-emerald-300 space-y-2 text-xs">
                      <div className="font-bold text-emerald-900 flex items-center gap-1.5 border-b border-emerald-200 pb-1.5">
                        <BookmarkCheck className="w-4 h-4 text-emerald-600" />
                        <span>HƯỚNG DẪN GIẢI & BIỂU ĐIỂM CHI TIẾT:</span>
                      </div>
                      <div className="text-slate-800 leading-relaxed whitespace-pre-line pl-1 pt-1 font-sans text-xs">
                        {q.solution ? formatFormula(q.solution) : 'Chưa có biểu điểm chi tiết.'}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 pt-3 border-t border-dashed border-amber-200 space-y-2">
                      <div className="text-[11px] italic text-slate-400">Bài làm:</div>
                      <div className="border-b border-dotted border-slate-300 h-6"></div>
                      <div className="border-b border-dotted border-slate-300 h-6"></div>
                      <div className="border-b border-dotted border-slate-300 h-6"></div>
                      <div className="border-b border-dotted border-slate-300 h-6"></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Footer */}
        <div className="text-center pt-8 border-t border-slate-200 text-xs font-bold text-slate-400 uppercase tracking-widest">
          --- HẾT ---
        </div>

      </div>

    </div>
  );
};
