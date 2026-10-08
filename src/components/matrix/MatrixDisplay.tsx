import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, Image as ImageIcon, Download, 
  Printer, Sparkles, Save, Check, ArrowRight, Edit3,
  ChevronUp, ChevronDown, SlidersHorizontal
} from 'lucide-react';
import { MatrixData } from '../../types/matrix';
import { exportMatrixToExcel, exportMatrixToImage, exportMatrixToPDF } from '../../services/exportService';

interface SpinCellProps {
  value: number;
  onIncrement: () => void;
  onDecrement: () => void;
  textClassName?: string;
  bgHighlight?: string;
}

const SpinCell: React.FC<SpinCellProps> = ({ 
  value, 
  onIncrement, 
  onDecrement, 
  textClassName = '', 
  bgHighlight = '' 
}) => {
  return (
    <td className={`border border-black p-0 text-center relative group/spin hover:bg-amber-50/70 transition-colors ${bgHighlight}`}>
      <div className="flex items-center justify-center min-h-[26px] h-full px-0.5 gap-0.5">
        <span className={`inline-block min-w-[12px] text-center font-bold text-[11px] leading-none select-none ${
          value > 0 ? (textClassName || 'text-slate-900') : 'text-slate-300'
        }`}>
          {value > 0 ? value : <span className="no-print">0</span>}
        </span>
        <div className="flex flex-col no-print -space-y-0.5 opacity-30 group-hover/spin:opacity-100 transition-opacity">
          <button
            type="button"
            title="Tăng 1 câu (+1)"
            onClick={(e) => {
              e.stopPropagation();
              onIncrement();
            }}
            className="w-3.5 h-2.5 flex items-center justify-center text-slate-500 hover:text-indigo-700 hover:bg-indigo-100 rounded-xs cursor-pointer transition-colors"
          >
            <ChevronUp className="w-2.5 h-2.5 stroke-[3]" />
          </button>
          <button
            type="button"
            title="Giảm 1 câu (-1)"
            disabled={value <= 0}
            onClick={(e) => {
              e.stopPropagation();
              onDecrement();
            }}
            className="w-3.5 h-2.5 flex items-center justify-center text-slate-500 hover:text-rose-700 hover:bg-rose-100 disabled:opacity-20 disabled:hover:bg-transparent rounded-xs cursor-pointer transition-colors"
          >
            <ChevronDown className="w-2.5 h-2.5 stroke-[3]" />
          </button>
        </div>
      </div>
    </td>
  );
};

interface MatrixDisplayProps {
  data: MatrixData;
  onTransferToExam: (matrixData: MatrixData) => void;
  onSaveConfig: () => void;
  onEditMatrix?: () => void;
  onUpdateMatrixData?: (updated: MatrixData) => void;
}

export const MatrixDisplay: React.FC<MatrixDisplayProps> = ({ 
  data, 
  onTransferToExam,
  onSaveConfig,
  onEditMatrix,
  onUpdateMatrixData
}) => {
  const [currentData, setCurrentData] = useState<MatrixData>(data);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    setCurrentData(data);
  }, [data]);

  const handleCellChange = (
    rowIndex: number, 
    part: 'part1' | 'part2' | 'part3', 
    level: 'know' | 'understand' | 'apply', 
    delta: number
  ) => {
    const currentRow = currentData.rows[rowIndex];
    if (!currentRow) return;

    const currentVal = currentRow[part][level];
    const newVal = Math.max(0, currentVal + delta);
    if (newVal === currentVal) return;

    const updatedRows = currentData.rows.map((row, idx) => {
      if (idx !== rowIndex) return row;
      const updatedPart = { ...row[part], [level]: newVal };
      const updatedRow = { ...row, [part]: updatedPart };
      const rowTotal = 
        updatedRow.part1.know + updatedRow.part1.understand + updatedRow.part1.apply +
        updatedRow.part2.know + updatedRow.part2.understand + updatedRow.part2.apply +
        updatedRow.part3.know + updatedRow.part3.understand + updatedRow.part3.apply;
      return { ...updatedRow, total: rowTotal };
    });

    const p1 = {
      know: updatedRows.reduce((s, r) => s + r.part1.know, 0),
      understand: updatedRows.reduce((s, r) => s + r.part1.understand, 0),
      apply: updatedRows.reduce((s, r) => s + r.part1.apply, 0),
    };
    const p2 = {
      know: updatedRows.reduce((s, r) => s + r.part2.know, 0),
      understand: updatedRows.reduce((s, r) => s + r.part2.understand, 0),
      apply: updatedRows.reduce((s, r) => s + r.part2.apply, 0),
    };
    const p3 = {
      know: updatedRows.reduce((s, r) => s + r.part3.know, 0),
      understand: updatedRows.reduce((s, r) => s + r.part3.understand, 0),
      apply: updatedRows.reduce((s, r) => s + r.part3.apply, 0),
    };
    const grandTotal = updatedRows.reduce((s, r) => s + r.total, 0);
    const ratio = {
      know: p1.know + p2.know + p3.know,
      understand: p1.understand + p2.understand + p3.understand,
      apply: p1.apply + p2.apply + p3.apply,
    };

    const updatedData: MatrixData = {
      ...currentData,
      rows: updatedRows,
      totals: {
        part1: p1,
        part2: p2,
        part3: p3,
        grandTotal,
        ratio,
      }
    };

    setCurrentData(updatedData);
    if (onUpdateMatrixData) {
      onUpdateMatrixData(updatedData);
    }
  };

  const getChapterRowSpan = (chapterName: string) => {
    return currentData.rows.filter(r => r.content === chapterName).length;
  };

  const handleExportImage = async () => {
    try {
      setIsExporting(true);
      await exportMatrixToImage('matrix-table-container', `MaTran_HoaHoc_Lop${currentData.grade}_${currentData.examType}`);
    } catch (err: any) {
      alert(err.message || 'Lỗi khi xuất ảnh');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      setIsExporting(true);
      await exportMatrixToPDF('matrix-table-container', `MaTran_HoaHoc_Lop${currentData.grade}_${currentData.examType}`);
    } catch (err: any) {
      alert(err.message || 'Lỗi khi xuất PDF. Bạn có thể chọn In và lưu dưới dạng PDF.');
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const chapterSummaries = React.useMemo(() => {
    const map = new Map<string, {
      p1: { know: number; understand: number; apply: number };
      p2: { know: number; understand: number; apply: number };
      p3: { know: number; understand: number; apply: number };
      total: number;
    }>();

    currentData.rows.forEach(r => {
      const cur = map.get(r.content) || {
        p1: { know: 0, understand: 0, apply: 0 },
        p2: { know: 0, understand: 0, apply: 0 },
        p3: { know: 0, understand: 0, apply: 0 },
        total: 0
      };
      cur.p1.know += r.part1.know;
      cur.p1.understand += r.part1.understand;
      cur.p1.apply += r.part1.apply;
      cur.p2.know += r.part2.know;
      cur.p2.understand += r.part2.understand;
      cur.p2.apply += r.part2.apply;
      cur.p3.know += r.part3.know;
      cur.p3.understand += r.part3.understand;
      cur.p3.apply += r.part3.apply;
      cur.total += r.total;
      map.set(r.content, cur);
    });

    return map;
  }, [currentData.rows]);

  const isStandardTotal = currentData.totals.grandTotal === 40;

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Fast Actions */}
      <div className="bg-gradient-to-r from-indigo-900 via-blue-900 to-indigo-950 p-5 rounded-2xl shadow-xl text-white flex flex-col md:flex-row items-center justify-between gap-4 no-print border border-indigo-700/50">
        <div>
          <div className="flex items-center gap-2">
            {isStandardTotal ? (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                ✓ Đã đạt chuẩn 40 lệnh hỏi (10 điểm)
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/30 text-amber-200 border border-amber-400/40">
                ⚠ Hiện có {currentData.totals.grandTotal} / 40 lệnh hỏi ({currentData.totals.grandTotal > 40 ? `Dư ${currentData.totals.grandTotal - 40} lệnh` : `Thiếu ${40 - currentData.totals.grandTotal} lệnh`})
              </span>
            )}
          </div>
          <h2 className="text-xl font-extrabold mt-1 tracking-tight">
            Ma trận Đề kiểm tra: {currentData.grade === 'Tự do' ? 'Chủ đề tự do' : `Khối lớp ${currentData.grade}`} - {currentData.examType}
          </h2>
          <p className="text-xs text-indigo-200 mt-0.5">
            Tỉ lệ hiện tại: {currentData.totals.ratio.know} Biết - {currentData.totals.ratio.understand} Hiểu - {currentData.totals.ratio.apply} Vận dụng ({Math.round((currentData.totals.ratio.know / (currentData.totals.grandTotal || 1)) * 100)}% : {Math.round((currentData.totals.ratio.understand / (currentData.totals.grandTotal || 1)) * 100)}% : {Math.round((currentData.totals.ratio.apply / (currentData.totals.grandTotal || 1)) * 100)}%).
          </p>
        </div>

        {/* The Hero Button: Transfer to Exam Generator */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => onTransferToExam(currentData)}
            className="group relative inline-flex items-center gap-2.5 px-6 py-3 rounded-xl font-extrabold text-sm text-slate-900 bg-gradient-to-r from-amber-300 via-amber-400 to-amber-300 hover:from-amber-200 hover:to-amber-400 shadow-lg hover:shadow-amber-400/30 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
          >
            <Sparkles className="w-5 h-5 text-indigo-900 group-hover:rotate-12 transition-transform" />
            <span>Sinh Đề Thi Từ Ma Trận Này</span>
            <ArrowRight className="w-4 h-4 text-indigo-900 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* Spin Button Instruction Banner */}
      <div className="bg-indigo-50/80 border border-indigo-200 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs text-indigo-950 no-print">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-indigo-600 shrink-0" />
          <span>
            <strong>Nút xoay điều chỉnh số liệu (Spin Button):</strong> Bạn có thể bấm nút <span className="font-bold text-indigo-700 bg-indigo-100 px-1 py-0.5 rounded">▲ (Tăng)</span> hoặc <span className="font-bold text-rose-700 bg-rose-100 px-1 py-0.5 rounded">▼ (Giảm)</span> trong từng ô để linh hoạt tăng giảm số câu hỏi của bài học theo yêu cầu.
          </span>
        </div>
      </div>

      {/* Export Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm no-print">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
          <span>Công cụ xuất dữ liệu:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => exportMatrixToExcel(currentData)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-bold transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Xuất Excel (.xlsx)</span>
          </button>

          <button
            onClick={handleExportImage}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-300 rounded-lg text-xs font-bold transition-colors"
          >
            <ImageIcon className="w-4 h-4 text-blue-600" />
            <span>Xuất Ảnh (.png)</span>
          </button>

          <button
            onClick={handleExportPDF}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-300 rounded-lg text-xs font-bold transition-colors"
          >
            <Download className="w-4 h-4 text-purple-600" />
            <span>Xuất PDF</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-lg text-xs font-bold transition-colors"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>In bảng</span>
          </button>

          {onEditMatrix && (
            <button
              onClick={onEditMatrix}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-300 rounded-lg text-xs font-bold transition-colors shadow-xs"
            >
              <Edit3 className="w-4 h-4 text-indigo-600" />
              <span>Chỉnh sửa lại câu Phần II</span>
            </button>
          )}

          <button
            onClick={onSaveConfig}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs font-bold transition-colors"
          >
            <Save className="w-4 h-4 text-amber-700" />
            <span>Lưu mẫu ma trận</span>
          </button>
        </div>
      </div>

      {/* Printable Matrix Table Container */}
      <div 
        id="matrix-table-container" 
        className="overflow-x-auto bg-white p-6 md:p-10 border border-gray-300 shadow-xl rounded-2xl relative"
      >
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-black uppercase text-blue-950 tracking-tight leading-none">
            MA TRẬN ĐỀ KIỂM TRA ĐỊNH KỲ HÓA HỌC
          </h2>
          <p className="text-base md:text-lg font-bold mt-2 text-slate-800 uppercase">
            {currentData.grade === 'Tự do' ? 'CHỦ ĐỀ TỰ DO' : `KHỐI LỚP ${currentData.grade}`} - {currentData.examType}
          </p>
          <p className="text-xs font-bold text-slate-500 mt-1 uppercase">
            Phạm vi kiến thức: {currentData.chapters.map(c => c.name).join(', ')}
          </p>
          <div className="flex flex-wrap justify-center gap-3 mt-3 text-[11px] font-black uppercase tracking-widest text-slate-500">
            <span className={`px-3.5 py-1 rounded-full border shadow-sm font-bold ${
              currentData.totals.grandTotal === 40 
                ? 'bg-slate-100 border-slate-300 text-slate-700' 
                : 'bg-amber-100 border-amber-400 text-amber-900 font-black'
            }`}>
              Tổng số: {currentData.totals.grandTotal} Lệnh hỏi ({((currentData.totals.grandTotal / 40) * 10).toFixed(1)} điểm)
            </span>
            <span className="bg-indigo-700 px-3.5 py-1 rounded-full text-white shadow-sm font-bold">
              Tỉ lệ: Biết {currentData.totals.ratio.know} - Hiểu {currentData.totals.ratio.understand} - Vận dụng {currentData.totals.ratio.apply} ({Math.round((currentData.totals.ratio.know / (currentData.totals.grandTotal || 1)) * 100)}% : {Math.round((currentData.totals.ratio.understand / (currentData.totals.grandTotal || 1)) * 100)}% : {Math.round((currentData.totals.ratio.apply / (currentData.totals.grandTotal || 1)) * 100)}%)
            </span>
          </div>
        </div>

        <table className="w-full border-collapse border-[1.5px] border-black text-[11px] text-center leading-tight bg-white">
          <thead>
            <tr className="bg-[#e2e8f0] font-bold text-slate-900">
              <th rowSpan={3} className="border border-black p-2 w-8">TT</th>
              <th rowSpan={3} className="border border-black p-2 w-32">Nội dung</th>
              <th rowSpan={3} className="border border-black p-2 w-36">Đơn vị kiến thức</th>
              <th rowSpan={3} className="border border-black p-2">Mục chi tiết nội dung</th>
              <th colSpan={9} className="border border-black p-2">Mức độ nhận thức (Số lệnh hỏi)</th>
              <th rowSpan={3} className="border border-black p-2 w-14 bg-[#f8fafc]">Tổng lệnh</th>
              <th rowSpan={3} className="border border-black p-2 w-14 bg-[#f8fafc]">Tỉ lệ (%)</th>
            </tr>
            <tr className="bg-[#f8fafc] font-bold text-slate-900">
              <th colSpan={3} className="border border-black p-1.5 bg-[#fefce8] text-amber-950">Phần I (MCQ)</th>
              <th colSpan={3} className="border border-black p-1.5 bg-[#f0fdf4] text-emerald-950">Phần II (Đ/S)</th>
              <th colSpan={3} className="border border-black p-1.5 bg-[#eef2ff] text-indigo-950">Phần III (SA)</th>
            </tr>
            <tr className="bg-[#f8fafc] text-[9px] uppercase font-black text-slate-700">
              <th className="border border-black p-1 w-9 text-center">B</th><th className="border border-black p-1 w-9 text-center">H</th><th className="border border-black p-1 w-9 text-center">V</th>
              <th className="border border-black p-1 w-9 text-center">B</th><th className="border border-black p-1 w-9 text-center">H</th><th className="border border-black p-1 w-9 text-center">V</th>
              <th className="border border-black p-1 w-9 text-center">B</th><th className="border border-black p-1 w-9 text-center">H</th><th className="border border-black p-1 w-9 text-center">V</th>
            </tr>
          </thead>
          <tbody>
            {currentData.rows.map((row, idx) => {
              const isP2Host = (row.part2.know + row.part2.understand + row.part2.apply) > 0;
              const isFirstInChapter = idx === 0 || currentData.rows[idx - 1].content !== row.content;
              const isLastInChapter = idx === currentData.rows.length - 1 || currentData.rows[idx + 1].content !== row.content;
              const chapSum = chapterSummaries.get(row.content);

              return (
                <React.Fragment key={`row-frag-${idx}`}>
                  <tr className={idx % 2 === 0 ? 'bg-white' : 'bg-[#f8fafc]'}>
                    <td className="border border-black p-1 text-[10px] text-slate-500 font-bold">{idx + 1}</td>
                    {isFirstInChapter ? (
                      <td 
                        rowSpan={getChapterRowSpan(row.content)} 
                        className="border border-black p-3 font-black text-[10px] uppercase text-[#1e3a8a] bg-white leading-tight align-top"
                      >
                        {row.content}
                      </td>
                    ) : null}
                    {row.isFirstInLesson ? (
                      <td 
                        rowSpan={row.lessonRowCount} 
                        className="border border-black p-2.5 font-bold text-left align-top bg-white leading-snug text-[11px] text-[#1e293b]"
                      >
                        {row.lessonName}
                      </td>
                    ) : null}
                    <td className={`border border-black p-2 text-left italic font-medium ${isP2Host ? 'text-[#15803d] bg-[#f0fdf4] font-bold' : 'text-[#475569]'}`}>
                      {row.detailName} 
                      {isP2Host && (
                        <span className="not-italic text-[8px] bg-[#16a34a] text-white px-1.5 py-0.5 rounded ml-1.5 uppercase font-black">
                          Bối cảnh P.II (1-2-1)
                        </span>
                      )}
                    </td>
                    
                    {/* Part 1 (MCQ) Spin Cells */}
                    <SpinCell 
                      value={row.part1.know} 
                      onIncrement={() => handleCellChange(idx, 'part1', 'know', 1)}
                      onDecrement={() => handleCellChange(idx, 'part1', 'know', -1)}
                    />
                    <SpinCell 
                      value={row.part1.understand} 
                      onIncrement={() => handleCellChange(idx, 'part1', 'understand', 1)}
                      onDecrement={() => handleCellChange(idx, 'part1', 'understand', -1)}
                    />
                    <SpinCell 
                      value={row.part1.apply} 
                      onIncrement={() => handleCellChange(idx, 'part1', 'apply', 1)}
                      onDecrement={() => handleCellChange(idx, 'part1', 'apply', -1)}
                    />

                    {/* Part 2 (Đ/S) Spin Cells */}
                    <SpinCell 
                      value={row.part2.know} 
                      textClassName="font-semibold text-emerald-950"
                      bgHighlight={isP2Host ? 'bg-emerald-50/30' : ''}
                      onIncrement={() => handleCellChange(idx, 'part2', 'know', 1)}
                      onDecrement={() => handleCellChange(idx, 'part2', 'know', -1)}
                    />
                    <SpinCell 
                      value={row.part2.understand} 
                      textClassName="font-semibold text-emerald-950"
                      bgHighlight={isP2Host ? 'bg-emerald-50/30' : ''}
                      onIncrement={() => handleCellChange(idx, 'part2', 'understand', 1)}
                      onDecrement={() => handleCellChange(idx, 'part2', 'understand', -1)}
                    />
                    <SpinCell 
                      value={row.part2.apply} 
                      textClassName="font-semibold text-emerald-950"
                      bgHighlight={isP2Host ? 'bg-emerald-50/30' : ''}
                      onIncrement={() => handleCellChange(idx, 'part2', 'apply', 1)}
                      onDecrement={() => handleCellChange(idx, 'part2', 'apply', -1)}
                    />

                    {/* Part 3 (SA) Spin Cells */}
                    <SpinCell 
                      value={row.part3.know} 
                      onIncrement={() => handleCellChange(idx, 'part3', 'know', 1)}
                      onDecrement={() => handleCellChange(idx, 'part3', 'know', -1)}
                    />
                    <SpinCell 
                      value={row.part3.understand} 
                      onIncrement={() => handleCellChange(idx, 'part3', 'understand', 1)}
                      onDecrement={() => handleCellChange(idx, 'part3', 'understand', -1)}
                    />
                    <SpinCell 
                      value={row.part3.apply} 
                      textClassName="font-bold text-indigo-700"
                      onIncrement={() => handleCellChange(idx, 'part3', 'apply', 1)}
                      onDecrement={() => handleCellChange(idx, 'part3', 'apply', -1)}
                    />

                    {/* Row Total */}
                    <td className="border border-black p-1 font-bold bg-[#f8fafc] text-slate-800">
                      {row.total || ''}
                    </td>
                    <td className="border border-black p-1 font-bold bg-[#f8fafc] text-slate-600">
                      {row.total ? `${((row.total / (currentData.totals.grandTotal || 40)) * 100).toFixed(1)}%` : ''}
                    </td>
                  </tr>

                  {/* Summary Row After Each Chapter */}
                  {isLastInChapter && chapSum && (
                    <tr className="bg-indigo-50/90 font-bold text-slate-900 border-b-2 border-indigo-400">
                      <td colSpan={4} className="border border-black p-2 text-right font-black uppercase tracking-wider text-[10px] bg-indigo-100/80 text-indigo-950">
                        Tổng cộng {row.content}
                      </td>
                      {/* P1 */}
                      <td className="border border-black p-1 bg-amber-100/40 text-slate-900 font-bold">{chapSum.p1.know || ''}</td>
                      <td className="border border-black p-1 bg-amber-100/40 text-slate-900 font-bold">{chapSum.p1.understand || ''}</td>
                      <td className="border border-black p-1 bg-amber-100/40 text-slate-900 font-bold">{chapSum.p1.apply || ''}</td>
                      {/* P2 */}
                      <td className="border border-black p-1 bg-emerald-100/40 text-slate-900 font-bold">{chapSum.p2.know || ''}</td>
                      <td className="border border-black p-1 bg-emerald-100/40 text-slate-900 font-bold">{chapSum.p2.understand || ''}</td>
                      <td className="border border-black p-1 bg-emerald-100/40 text-slate-900 font-bold">{chapSum.p2.apply || ''}</td>
                      {/* P3 */}
                      <td className="border border-black p-1 bg-indigo-100/40 text-slate-900 font-bold">{chapSum.p3.know || ''}</td>
                      <td className="border border-black p-1 bg-indigo-100/40 text-slate-900 font-bold">{chapSum.p3.understand || ''}</td>
                      <td className="border border-black p-1 bg-indigo-100/40 text-indigo-900 font-black">{chapSum.p3.apply || ''}</td>
                      {/* Chapter Totals */}
                      <td className="border border-black p-1 text-xs font-black bg-indigo-200 text-indigo-950">
                        {chapSum.total} lệnh
                      </td>
                      <td className="border border-black p-1 text-xs font-black bg-indigo-200 text-indigo-950">
                        {((chapSum.total / (currentData.totals.grandTotal || 40)) * 100).toFixed(1)}%
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>

          <tfoot>
            {/* Grand Total */}
            <tr className="bg-[#cbd5e1] font-black text-slate-900 border-t-2 border-black">
              <td colSpan={4} className="border border-black p-2 text-center uppercase tracking-wider">
                Tổng cộng số lệnh hỏi
              </td>
              <td className="border border-black p-1">{currentData.totals.part1.know}</td>
              <td className="border border-black p-1">{currentData.totals.part1.understand}</td>
              <td className="border border-black p-1">{currentData.totals.part1.apply}</td>

              <td className="border border-black p-1">{currentData.totals.part2.know}</td>
              <td className="border border-black p-1">{currentData.totals.part2.understand}</td>
              <td className="border border-black p-1">{currentData.totals.part2.apply}</td>

              <td className="border border-black p-1">{currentData.totals.part3.know}</td>
              <td className="border border-black p-1">{currentData.totals.part3.understand}</td>
              <td className="border border-black p-1">{currentData.totals.part3.apply}</td>

              <td className="border border-black p-1 text-sm text-indigo-900">{currentData.totals.grandTotal}</td>
              <td className="border border-black p-1 text-sm text-indigo-900">100%</td>
            </tr>

            {/* Cognitive Ratio Summary */}
            <tr className="bg-[#e2e8f0] font-bold text-slate-800">
              <td colSpan={4} className="border border-black p-2 text-center uppercase text-[10px]">
                Tổng hợp theo mức độ nhận thức
              </td>
              <td colSpan={3} className="border border-black p-1 bg-[#fefce8]">
                Nhận biết: <span className="font-black text-slate-900">{currentData.totals.ratio.know}</span> ({Math.round((currentData.totals.ratio.know / (currentData.totals.grandTotal || 1)) * 100)}%)
              </td>
              <td colSpan={3} className="border border-black p-1 bg-[#f0fdf4]">
                Thông hiểu: <span className="font-black text-slate-900">{currentData.totals.ratio.understand}</span> ({Math.round((currentData.totals.ratio.understand / (currentData.totals.grandTotal || 1)) * 100)}%)
              </td>
              <td colSpan={3} className="border border-black p-1 bg-[#eef2ff]">
                Vận dụng: <span className="font-black text-slate-900">{currentData.totals.ratio.apply}</span> ({Math.round((currentData.totals.ratio.apply / (currentData.totals.grandTotal || 1)) * 100)}%)
              </td>
              <td colSpan={2} className="border border-black p-1 bg-indigo-50 font-black text-indigo-900">
                10 Điểm
              </td>
            </tr>
          </tfoot>
        </table>

        {currentData.extraRequirements && (
          <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700">
            <span className="font-bold">Ghi chú yêu cầu bổ sung:</span> {currentData.extraRequirements}
          </div>
        )}
      </div>

    </div>
  );
};
