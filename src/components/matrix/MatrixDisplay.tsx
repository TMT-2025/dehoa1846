import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileSpreadsheet, Image as ImageIcon, Download, 
  Printer, Sparkles, Save, Check, ArrowRight, Edit3,
  ChevronUp, ChevronDown, SlidersHorizontal, BookOpen, Layers
} from 'lucide-react';
import { MatrixData } from '../../types/matrix';
import { 
  exportMatrixToExcel, exportMatrixToImage, exportMatrixToPDF, 
  downloadMatrixAndSpecDoc 
} from '../../services/exportService';
import { buildSpecificationFromMatrix } from '../../services/specificationService';
import { SpecificationDisplay } from './SpecificationDisplay';

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

const formatPoint = (val: number, suffix = 'đ') => {
  if (val === 0) return `0${suffix}`;
  const rounded = Math.round(val * 100) / 100;
  const formatted = (rounded % 1 === 0) ? `${rounded.toFixed(1)}` : `${rounded}`;
  return `${formatted.replace('.', ',')}${suffix}`;
};

const formatPercent = (val: number) => {
  if (val === 0) return '0%';
  const rounded = Math.round(val * 10) / 10;
  const formatted = (rounded % 1 === 0) ? `${rounded.toFixed(0)}` : `${rounded.toFixed(1)}`;
  return `${formatted.replace('.', ',')}%`;
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
  const [activeView, setActiveView] = useState<'matrix' | 'specification' | 'both'>('matrix');

  useEffect(() => {
    setCurrentData(data);
  }, [data]);

  const hasEssay = Boolean(
    currentData.totals.hasEssay || 
    currentData.totals.part4 || 
    currentData.rows.some(r => r.part4 && (r.part4.know + r.part4.understand + r.part4.apply > 0)) ||
    currentData.totals.grandTotal === 27
  );
  const standardCommands = hasEssay ? 27 : 40;
  const isStandardTotal = currentData.totals.grandTotal === standardCommands;

  // Xây dựng Bản đặc tả tự động tương ứng theo Ma trận
  const specData = useMemo(() => {
    return buildSpecificationFromMatrix(currentData);
  }, [currentData]);

  const handleCellChange = (
    rowIndex: number, 
    part: 'part1' | 'part2' | 'part3' | 'part4', 
    level: 'know' | 'understand' | 'apply', 
    delta: number
  ) => {
    const currentRow = currentData.rows[rowIndex];
    if (!currentRow) return;

    const baseCurrentPart = currentRow[part] || { know: 0, understand: 0, apply: 0 };
    const currentVal = baseCurrentPart[level] || 0;
    const newVal = Math.max(0, currentVal + delta);
    if (newVal === currentVal) return;

    const updatedRows = currentData.rows.map((row, idx) => {
      if (idx !== rowIndex) return row;
      const basePart = row[part] || { know: 0, understand: 0, apply: 0 };
      const updatedPart = { ...basePart, [level]: newVal };
      const updatedRow = { ...row, [part]: updatedPart };
      const rowTotal = 
        updatedRow.part1.know + updatedRow.part1.understand + updatedRow.part1.apply +
        updatedRow.part2.know + updatedRow.part2.understand + updatedRow.part2.apply +
        updatedRow.part3.know + updatedRow.part3.understand + updatedRow.part3.apply +
        ((updatedRow.part4?.know || 0) + (updatedRow.part4?.understand || 0) + (updatedRow.part4?.apply || 0));
      return { ...updatedRow, total: rowTotal };
    });

    // Tính lại totals
    const newTotals = {
      part1: { know: 0, understand: 0, apply: 0 },
      part2: { know: 0, understand: 0, apply: 0 },
      part3: { know: 0, understand: 0, apply: 0 },
      part4: hasEssay ? { know: 0, understand: 0, apply: 0 } : undefined,
      grandTotal: 0,
      ratio: { know: 0, understand: 0, apply: 0 },
      hasEssay
    };

    updatedRows.forEach(row => {
      newTotals.part1.know += row.part1.know;
      newTotals.part1.understand += row.part1.understand;
      newTotals.part1.apply += row.part1.apply;

      newTotals.part2.know += row.part2.know;
      newTotals.part2.understand += row.part2.understand;
      newTotals.part2.apply += row.part2.apply;

      newTotals.part3.know += row.part3.know;
      newTotals.part3.understand += row.part3.understand;
      newTotals.part3.apply += row.part3.apply;

      if (row.part4 && newTotals.part4) {
        newTotals.part4.know += row.part4.know;
        newTotals.part4.understand += row.part4.understand;
        newTotals.part4.apply += row.part4.apply;
      }
    });

    const p4K = newTotals.part4?.know || 0;
    const p4U = newTotals.part4?.understand || 0;
    const p4A = newTotals.part4?.apply || 0;

    newTotals.ratio.know = newTotals.part1.know + newTotals.part2.know + newTotals.part3.know + p4K;
    newTotals.ratio.understand = newTotals.part1.understand + newTotals.part2.understand + newTotals.part3.understand + p4U;
    newTotals.ratio.apply = newTotals.part1.apply + newTotals.part2.apply + newTotals.part3.apply + p4A;
    newTotals.grandTotal = newTotals.ratio.know + newTotals.ratio.understand + newTotals.ratio.apply;

    const updatedData: MatrixData = {
      ...currentData,
      rows: updatedRows,
      totals: newTotals
    };

    setCurrentData(updatedData);
    if (onUpdateMatrixData) {
      onUpdateMatrixData(updatedData);
    }
  };

  const handleExportExcel = () => {
    try {
      setIsExporting(true);
      exportMatrixToExcel(currentData, specData);
    } catch (e: any) {
      alert(e.message || 'Lỗi khi xuất file Excel');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportWord = async () => {
    try {
      setIsExporting(true);
      await downloadMatrixAndSpecDoc(currentData, specData);
    } catch (e: any) {
      alert(e.message || 'Lỗi khi xuất file Word');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportImage = async () => {
    try {
      setIsExporting(true);
      const cleanGrade = String(currentData.grade).replace(/\s+/g, '_');
      const cleanExamType = currentData.examType.replace(/\s+/g, '_');
      await exportMatrixToImage('matrix-table-container', `MaTran_HoaHoc_Lop${cleanGrade}_${cleanExamType}`);
    } catch (e: any) {
      alert(e.message || 'Lỗi khi xuất file ảnh');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      setIsExporting(true);
      const cleanGrade = String(currentData.grade).replace(/\s+/g, '_');
      const cleanExamType = currentData.examType.replace(/\s+/g, '_');
      await exportMatrixToPDF('matrix-table-container', `MaTran_HoaHoc_Lop${cleanGrade}_${cleanExamType}`);
    } catch (e: any) {
      alert(e.message || 'Lỗi khi xuất file PDF');
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getChapterRowSpan = (chapterContent: string) => {
    return currentData.rows.filter(r => r.content === chapterContent).length;
  };

  // Tính tổng số lệnh cho từng chương
  const chapterSummaries = useMemo(() => {
    const map = new Map<string, {
      p1: { know: number; understand: number; apply: number };
      p2: { know: number; understand: number; apply: number };
      p3: { know: number; understand: number; apply: number };
      p4: { know: number; understand: number; apply: number };
      total: number;
    }>();

    currentData.rows.forEach(r => {
      if (!map.has(r.content)) {
        map.set(r.content, {
          p1: { know: 0, understand: 0, apply: 0 },
          p2: { know: 0, understand: 0, apply: 0 },
          p3: { know: 0, understand: 0, apply: 0 },
          p4: { know: 0, understand: 0, apply: 0 },
          total: 0
        });
      }
      const sum = map.get(r.content)!;
      sum.p1.know += r.part1.know;
      sum.p1.understand += r.part1.understand;
      sum.p1.apply += r.part1.apply;

      sum.p2.know += r.part2.know;
      sum.p2.understand += r.part2.understand;
      sum.p2.apply += r.part2.apply;

      sum.p3.know += r.part3.know;
      sum.p3.understand += r.part3.understand;
      sum.p3.apply += r.part3.apply;

      if (r.part4) {
        sum.p4.know += r.part4.know;
        sum.p4.understand += r.part4.understand;
        sum.p4.apply += r.part4.apply;
      }

      sum.total += r.total;
    });

    return map;
  }, [currentData.rows]);

  return (
    <div className="space-y-6">
      
      {/* View Switcher Tabs: Ma trận vs Bản đặc tả (CV 7991) */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3 no-print">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => setActiveView('matrix')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeView === 'matrix'
                ? 'bg-white text-indigo-950 shadow-sm border border-slate-200/80 font-black'
                : 'text-slate-600 hover:text-indigo-900'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
            <span>1. Ma trận đề kiểm tra (CV 7991)</span>
          </button>

          <button
            onClick={() => setActiveView('specification')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeView === 'specification'
                ? 'bg-white text-indigo-950 shadow-sm border border-slate-200/80 font-black'
                : 'text-slate-600 hover:text-indigo-900'
            }`}
          >
            <BookOpen className="w-4 h-4 text-emerald-600" />
            <span>2. Bản đặc tả đề kiểm tra (CV 7991)</span>
          </button>

          <button
            onClick={() => setActiveView('both')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeView === 'both'
                ? 'bg-white text-indigo-950 shadow-sm border border-slate-200/80 font-black'
                : 'text-slate-600 hover:text-indigo-900'
            }`}
          >
            <Layers className="w-4 h-4 text-purple-600" />
            <span>Xem cả hai bản</span>
          </button>
        </div>

        {/* Nút hành động chính: Soạn đề thi */}
        <button
          onClick={() => onTransferToExam(currentData)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-extrabold shadow-md hover:shadow-indigo-500/25 transition-all cursor-pointer"
        >
          <Sparkles className="w-4 h-4" />
          <span>Chuyển sang soạn đề thi</span>
          <ArrowRight className="w-4 h-4 ml-0.5" />
        </button>
      </div>

      {/* Top Controls Toolbar for Matrix */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3 no-print">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse"></span>
          <span className="text-xs font-bold text-slate-800">
            {hasEssay ? 'Định dạng KTK định kì Lớp 10/11: ' : 'Định dạng đề Lớp 12 & thường xuyên: '}
            <span className="text-indigo-600 font-extrabold">{standardCommands} lệnh hỏi ({hasEssay ? 'TN 7.0đ + TL 3.0đ' : '10 điểm'})</span>
          </span>
          <span className="text-[11px] text-slate-500 italic ml-2 hidden sm:inline">
            (Bấm nút mũi tên ▲ ▼ tại mỗi ô để điều chỉnh số câu)
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportWord}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-300 rounded-lg text-xs font-bold transition-colors shadow-xs cursor-pointer"
            title="Tải trọn bộ file Word gồm Ma trận và Bản đặc tả chuẩn CV 7991"
          >
            <Download className="w-4 h-4 text-blue-600" />
            <span>Tải Word Ma trận + Bản đặc tả (.docx)</span>
          </button>

          <button
            onClick={handleExportExcel}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-bold transition-colors cursor-pointer"
            title="Xuất file Excel gồm 2 Sheet: Ma trận và Bản đặc tả"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Xuất Excel (.xlsx)</span>
          </button>

          <button
            onClick={handleExportImage}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-lg text-xs font-bold transition-colors cursor-pointer"
          >
            <ImageIcon className="w-4 h-4 text-slate-600" />
            <span>Xuất Ảnh (.png)</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-lg text-xs font-bold transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>In bảng</span>
          </button>

          {onEditMatrix && (
            <button
              onClick={onEditMatrix}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-300 rounded-lg text-xs font-bold transition-colors shadow-xs cursor-pointer"
            >
              <Edit3 className="w-4 h-4 text-indigo-600" />
              <span>Chỉnh sửa bối cảnh Phần II</span>
            </button>
          )}

          <button
            onClick={onSaveConfig}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs font-bold transition-colors cursor-pointer"
          >
            <Save className="w-4 h-4 text-amber-700" />
            <span>Lưu mẫu</span>
          </button>
        </div>
      </div>

      {/* Render Ma trận (Nếu activeView === 'matrix' hoặc 'both') */}
      {(activeView === 'matrix' || activeView === 'both') && (
        <div 
          id="matrix-table-container" 
          className="overflow-x-auto bg-white p-6 md:p-10 border border-gray-300 shadow-xl rounded-2xl relative"
        >
          <div className="text-center mb-6">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">
              BỘ GIÁO DỤC VÀ ĐÀO TẠO - CÔNG VĂN SỐ 7991/BGDĐT-GDTrH
            </p>
            <h2 className="text-xl md:text-2xl font-black uppercase text-blue-950 tracking-tight leading-snug">
              1. MA TRẬN ĐỀ KIỂM TRA ĐỊNH KỲ MÔN HÓA HỌC
            </h2>
            <p className="text-sm md:text-base font-bold mt-1 text-slate-800 uppercase">
              {currentData.grade === 'Tự do' ? 'CHỦ ĐỀ TỰ DO' : `KHỐI LỚP ${currentData.grade}`} - {currentData.examType}
              {hasEssay ? ' (CÓ PHẦN TỰ LUẬN)' : ' (100% TRẮC NGHIỆM KHÁCH QUAN)'}
            </p>
            <p className="text-xs font-bold text-slate-500 mt-0.5 uppercase">
              Phạm vi: {currentData.chapters.map(c => c.name).join(', ')}
            </p>
            <div className="flex flex-wrap justify-center gap-3 mt-3 text-[11px] font-black uppercase tracking-widest text-slate-500">
              <span className={`px-3.5 py-1 rounded-full border shadow-sm font-bold ${
                currentData.totals.grandTotal === standardCommands && Math.abs(specData.totals.totalPoints.grandTotal - 10.0) < 0.01
                  ? 'bg-slate-100 border-slate-300 text-slate-700' 
                  : 'bg-amber-100 border-amber-400 text-amber-900 font-black'
              }`}>
                Tổng số lệnh: {currentData.totals.grandTotal} / {standardCommands} lệnh ({formatPoint(specData.totals.totalPoints.grandTotal, ' điểm')}: TN {formatPoint(specData.totals.totalPoints.part1 + specData.totals.totalPoints.part2 + specData.totals.totalPoints.part3)} {hasEssay ? `+ TL ${formatPoint(specData.totals.totalPoints.part4 || 0)}` : ''})
              </span>
              <span className="bg-indigo-700 px-3.5 py-1 rounded-full text-white shadow-sm font-bold">
                Tỉ lệ điểm: Biết {formatPercent(specData.totals.percentages.know)} ({formatPoint(specData.totals.totalPoints.know)}) - Hiểu {formatPercent(specData.totals.percentages.understand)} ({formatPoint(specData.totals.totalPoints.understand)}) - Vận dụng {formatPercent(specData.totals.percentages.apply)} ({formatPoint(specData.totals.totalPoints.apply)})
              </span>
            </div>
          </div>

          <table className="w-full border-collapse border-[1.5px] border-black text-[11px] text-center leading-tight bg-white">
            <thead>
              <tr className="bg-[#e2e8f0] font-bold text-slate-900">
                <th rowSpan={3} className="border border-black p-2 w-8">TT</th>
                <th rowSpan={3} className="border border-black p-2 w-32">Chủ đề/Chương</th>
                <th rowSpan={3} className="border border-black p-2 w-36">Nội dung/đơn vị kiến thức</th>
                <th rowSpan={3} className="border border-black p-2">Mục chi tiết nội dung</th>
                <th colSpan={hasEssay ? 12 : 9} className="border border-black p-2">
                  Mức độ đánh giá (Số lệnh hỏi)
                </th>
                <th colSpan={3} className="border border-black p-2 bg-[#f1f5f9]">Tổng</th>
                <th rowSpan={3} className="border border-black p-2 w-14 bg-[#f8fafc]">Tổng lệnh</th>
                <th rowSpan={3} className="border border-black p-2 w-14 bg-[#f8fafc]">Tỉ lệ %</th>
              </tr>
              <tr className="bg-[#f8fafc] font-bold text-slate-900">
                <th colSpan={3} className="border border-black p-1.5 bg-[#fefce8] text-amber-950">
                  Nhiều lựa chọn ({hasEssay ? '12 lệnh' : '18 lệnh'})
                </th>
                <th colSpan={3} className="border border-black p-1.5 bg-[#f0fdf4] text-emerald-950">
                  “Đúng – Sai” ({hasEssay ? '8 lệnh' : '16 lệnh'})
                </th>
                <th colSpan={3} className="border border-black p-1.5 bg-[#eef2ff] text-indigo-950">
                  Trả lời ngắn ({hasEssay ? '4 lệnh' : '6 lệnh'})
                </th>
                {hasEssay && (
                  <th colSpan={3} className="border border-black p-1.5 bg-[#faf5ff] text-purple-950">
                    Tự luận (3 lệnh)
                  </th>
                )}
                <th className="border border-black p-1 bg-[#f1f5f9] text-slate-800 text-[9px] uppercase font-black">Biết</th>
                <th className="border border-black p-1 bg-[#f1f5f9] text-slate-800 text-[9px] uppercase font-black">Hiểu</th>
                <th className="border border-black p-1 bg-[#f1f5f9] text-slate-800 text-[9px] uppercase font-black">Vận dụng</th>
              </tr>
              <tr className="bg-[#f8fafc] text-[9px] uppercase font-black text-slate-700">
                <th className="border border-black p-1 w-9 text-center">B</th><th className="border border-black p-1 w-9 text-center">H</th><th className="border border-black p-1 w-9 text-center">V</th>
                <th className="border border-black p-1 w-9 text-center">B</th><th className="border border-black p-1 w-9 text-center">H</th><th className="border border-black p-1 w-9 text-center">V</th>
                <th className="border border-black p-1 w-9 text-center">B</th><th className="border border-black p-1 w-9 text-center">H</th><th className="border border-black p-1 w-9 text-center">V</th>
                {hasEssay && (
                  <>
                    <th className="border border-black p-1 w-9 text-center bg-[#f3e8ff] text-purple-900 font-bold">B</th>
                    <th className="border border-black p-1 w-9 text-center bg-[#f3e8ff] text-purple-900 font-bold">H</th>
                    <th className="border border-black p-1 w-9 text-center bg-[#f3e8ff] text-purple-900 font-bold">V</th>
                  </>
                )}
                {/* 3 cột con của Tổng ở row 2 đã được định nghĩa */}
                <th className="hidden"></th>
                <th className="hidden"></th>
                <th className="hidden"></th>
              </tr>
            </thead>
            <tbody>
              {currentData.rows.map((row, idx) => {
                const isP2Host = (row.part2.know + row.part2.understand + row.part2.apply) > 0;
                const isFirstInChapter = idx === 0 || currentData.rows[idx - 1].content !== row.content;
                const isLastInChapter = idx === currentData.rows.length - 1 || currentData.rows[idx + 1].content !== row.content;
                const chapSum = chapterSummaries.get(row.content);

                const rowKnow = row.part1.know + row.part2.know + row.part3.know + (row.part4?.know || 0);
                const rowUnderstand = row.part1.understand + row.part2.understand + row.part3.understand + (row.part4?.understand || 0);
                const rowApply = row.part1.apply + row.part2.apply + row.part3.apply + (row.part4?.apply || 0);

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

                      {/* Part 4 (Tự luận) Spin Cells */}
                      {hasEssay && (
                        <>
                          <SpinCell 
                            value={row.part4?.know || 0} 
                            textClassName="font-semibold text-purple-950"
                            bgHighlight="bg-purple-50/20"
                            onIncrement={() => handleCellChange(idx, 'part4', 'know', 1)}
                            onDecrement={() => handleCellChange(idx, 'part4', 'know', -1)}
                          />
                          <SpinCell 
                            value={row.part4?.understand || 0} 
                            textClassName="font-semibold text-purple-950"
                            bgHighlight="bg-purple-50/20"
                            onIncrement={() => handleCellChange(idx, 'part4', 'understand', 1)}
                            onDecrement={() => handleCellChange(idx, 'part4', 'understand', -1)}
                          />
                          <SpinCell 
                            value={row.part4?.apply || 0} 
                            textClassName="font-bold text-purple-900"
                            bgHighlight="bg-purple-50/30"
                            onIncrement={() => handleCellChange(idx, 'part4', 'apply', 1)}
                            onDecrement={() => handleCellChange(idx, 'part4', 'apply', -1)}
                          />
                        </>
                      )}

                      {/* Cột Tổng (Biết - Hiểu - Vận dụng) chuẩn CV 7991 */}
                      <td className="border border-black p-1 font-bold bg-[#f8fafc] text-slate-700">
                        {rowKnow || ''}
                      </td>
                      <td className="border border-black p-1 font-bold bg-[#f8fafc] text-slate-700">
                        {rowUnderstand || ''}
                      </td>
                      <td className="border border-black p-1 font-bold bg-[#f8fafc] text-slate-700">
                        {rowApply || ''}
                      </td>

                      {/* Row Total */}
                      <td className="border border-black p-1 font-bold bg-[#f8fafc] text-slate-800">
                        {row.total || ''}
                      </td>
                      <td className="border border-black p-1 font-bold bg-[#f8fafc] text-slate-600">
                        {row.total ? `${((row.total / (currentData.totals.grandTotal || standardCommands)) * 100).toFixed(1)}%` : ''}
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
                        {/* P4 */}
                        {hasEssay && (
                          <>
                            <td className="border border-black p-1 bg-purple-100/40 text-slate-900 font-bold">{chapSum.p4.know || ''}</td>
                            <td className="border border-black p-1 bg-purple-100/40 text-slate-900 font-bold">{chapSum.p4.understand || ''}</td>
                            <td className="border border-black p-1 bg-purple-100/40 text-purple-900 font-black">{chapSum.p4.apply || ''}</td>
                          </>
                        )}
                        {/* Tổng Biết - Hiểu - Vận dụng của Chương */}
                        <td className="border border-black p-1 bg-indigo-100 text-indigo-950 font-bold">
                          {(chapSum.p1.know + chapSum.p2.know + chapSum.p3.know + chapSum.p4.know) || ''}
                        </td>
                        <td className="border border-black p-1 bg-indigo-100 text-indigo-950 font-bold">
                          {(chapSum.p1.understand + chapSum.p2.understand + chapSum.p3.understand + chapSum.p4.understand) || ''}
                        </td>
                        <td className="border border-black p-1 bg-indigo-100 text-indigo-950 font-bold">
                          {(chapSum.p1.apply + chapSum.p2.apply + chapSum.p3.apply + chapSum.p4.apply) || ''}
                        </td>
                        {/* Chapter Totals */}
                        <td className="border border-black p-1 text-xs font-black bg-indigo-200 text-indigo-950">
                          {chapSum.total} lệnh
                        </td>
                        <td className="border border-black p-1 text-xs font-black bg-indigo-200 text-indigo-950">
                          {((chapSum.total / (currentData.totals.grandTotal || standardCommands)) * 100).toFixed(1)}%
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>

            <tfoot>
              {/* Grand Total Row 1: Tổng số câu hỏi / lệnh hỏi */}
              <tr className="bg-[#cbd5e1] font-black text-slate-900 border-t-2 border-black">
                <td colSpan={4} className="border border-black p-2 text-center uppercase tracking-wider">
                  Tổng số câu hỏi / lệnh hỏi
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

                {hasEssay && (
                  <>
                    <td className="border border-black p-1 text-purple-950">{currentData.totals.part4?.know || 0}</td>
                    <td className="border border-black p-1 text-purple-950">{currentData.totals.part4?.understand || 0}</td>
                    <td className="border border-black p-1 text-purple-950 font-bold">{currentData.totals.part4?.apply || 0}</td>
                  </>
                )}

                <td className="border border-black p-1 text-slate-900 font-bold">{currentData.totals.ratio.know}</td>
                <td className="border border-black p-1 text-slate-900 font-bold">{currentData.totals.ratio.understand}</td>
                <td className="border border-black p-1 text-slate-900 font-bold">{currentData.totals.ratio.apply}</td>

                <td className="border border-black p-1 text-sm text-indigo-900">{currentData.totals.grandTotal}</td>
                <td className="border border-black p-1 text-sm text-indigo-900">100%</td>
              </tr>

              {/* Grand Total Row 2: Tổng số điểm chuẩn CV 7991 */}
              <tr className="bg-[#e2e8f0] font-black text-slate-900">
                <td colSpan={4} className="border border-black p-1.5 text-center uppercase tracking-wider text-[10px]">
                  Tổng số điểm
                </td>
                <td colSpan={3} className="border border-black p-1 bg-[#fefce8] text-amber-950 font-bold">
                  {formatPoint(specData.totals.totalPoints.part1, ' điểm')}
                </td>
                <td colSpan={3} className="border border-black p-1 bg-[#f0fdf4] text-emerald-950 font-bold">
                  {formatPoint(specData.totals.totalPoints.part2, ' điểm')}
                </td>
                <td colSpan={3} className="border border-black p-1 bg-[#eef2ff] text-indigo-950 font-bold">
                  {formatPoint(specData.totals.totalPoints.part3, ' điểm')}
                </td>
                {hasEssay && (
                  <td colSpan={3} className="border border-black p-1 bg-[#faf5ff] text-purple-950 font-bold">
                    {formatPoint(specData.totals.totalPoints.part4 || 0, ' điểm')}
                  </td>
                )}
                <td className="border border-black p-1 bg-[#fefce8] text-amber-950 font-bold">
                  {formatPoint(specData.totals.totalPoints.know)}
                </td>
                <td className="border border-black p-1 bg-[#f0fdf4] text-emerald-950 font-bold">
                  {formatPoint(specData.totals.totalPoints.understand)}
                </td>
                <td className="border border-black p-1 bg-[#eef2ff] text-indigo-950 font-bold">
                  {formatPoint(specData.totals.totalPoints.apply)}
                </td>
                <td colSpan={2} className={`border border-black p-1 font-black ${
                  Math.abs(specData.totals.totalPoints.grandTotal - 10.0) < 0.01 
                    ? 'bg-indigo-100 text-indigo-950' 
                    : 'bg-amber-200 text-amber-950'
                }`}>
                  {formatPoint(specData.totals.totalPoints.grandTotal, ' điểm')}
                </td>
              </tr>

              {/* Grand Total Row 3: Tỉ lệ % chuẩn CV 7991 */}
              <tr className="bg-[#f1f5f9] font-black text-slate-900">
                <td colSpan={4} className="border border-black p-1.5 text-center uppercase tracking-wider text-[10px]">
                  Tỉ lệ % điểm
                </td>
                <td colSpan={3} className="border border-black p-1 bg-[#fefce8] text-amber-950 font-bold">
                  {formatPercent(specData.totals.percentages.part1)}
                </td>
                <td colSpan={3} className="border border-black p-1 bg-[#f0fdf4] text-emerald-950 font-bold">
                  {formatPercent(specData.totals.percentages.part2)}
                </td>
                <td colSpan={3} className="border border-black p-1 bg-[#eef2ff] text-indigo-950 font-bold">
                  {formatPercent(specData.totals.percentages.part3)}
                </td>
                {hasEssay && (
                  <td colSpan={3} className="border border-black p-1 bg-[#faf5ff] text-purple-950 font-bold">
                    {formatPercent(specData.totals.percentages.part4 || 0)}
                  </td>
                )}
                <td className="border border-black p-1 bg-[#fefce8] text-amber-950 font-bold">
                  {formatPercent(specData.totals.percentages.know)}
                </td>
                <td className="border border-black p-1 bg-[#f0fdf4] text-emerald-950 font-bold">
                  {formatPercent(specData.totals.percentages.understand)}
                </td>
                <td className="border border-black p-1 bg-[#eef2ff] text-indigo-950 font-bold">
                  {formatPercent(specData.totals.percentages.apply)}
                </td>
                <td colSpan={2} className="border border-black p-1 bg-indigo-100 text-indigo-950 font-black">
                  100%
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
      )}

      {/* Render Bản đặc tả (Nếu activeView === 'specification' hoặc 'both') */}
      {(activeView === 'specification' || activeView === 'both') && (
        <div className="animate-fade-in">
          <SpecificationDisplay specData={specData} matrixData={currentData} />
        </div>
      )}

    </div>
  );
};
