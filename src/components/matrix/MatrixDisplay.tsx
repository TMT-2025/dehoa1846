import React, { useState } from 'react';
import { 
  FileSpreadsheet, Image as ImageIcon, Download, 
  Printer, Sparkles, Save, Check, ArrowRight, Edit3
} from 'lucide-react';
import { MatrixData } from '../../types/matrix';
import { exportMatrixToExcel, exportMatrixToImage, exportMatrixToPDF } from '../../services/exportService';

interface MatrixDisplayProps {
  data: MatrixData;
  onTransferToExam: (matrixData: MatrixData) => void;
  onSaveConfig: () => void;
  onEditMatrix?: () => void;
}

export const MatrixDisplay: React.FC<MatrixDisplayProps> = ({ 
  data, 
  onTransferToExam,
  onSaveConfig,
  onEditMatrix 
}) => {
  const [isExporting, setIsExporting] = useState(false);

  const getChapterRowSpan = (chapterName: string) => {
    return data.rows.filter(r => r.content === chapterName).length;
  };

  const handleExportImage = async () => {
    try {
      setIsExporting(true);
      await exportMatrixToImage('matrix-table-container', `MaTran_HoaHoc_Lop${data.grade}_${data.examType}`);
    } catch (err: any) {
      alert(err.message || 'Lỗi khi xuất ảnh');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      setIsExporting(true);
      await exportMatrixToPDF('matrix-table-container', `MaTran_HoaHoc_Lop${data.grade}_${data.examType}`);
    } catch (err: any) {
      alert(err.message || 'Lỗi khi xuất PDF. Bạn có thể chọn In và lưu dưới dạng PDF.');
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Fast Actions */}
      <div className="bg-gradient-to-r from-indigo-900 via-blue-900 to-indigo-950 p-5 rounded-2xl shadow-xl text-white flex flex-col md:flex-row items-center justify-between gap-4 no-print border border-indigo-700/50">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
              Đã tạo thành công ma trận 40 lệnh hỏi
            </span>
          </div>
          <h2 className="text-xl font-extrabold mt-1 tracking-tight">
            Ma trận Đề kiểm tra: {data.grade === 'Tự do' ? 'Chủ đề tự do' : `Khối lớp ${data.grade}`} - {data.examType}
          </h2>
          <p className="text-xs text-indigo-200 mt-0.5">
            Tỉ lệ chuẩn 40% Nhận biết - 30% Thông hiểu - 30% Vận dụng & Vận dụng cao (16 : 12 : 12).
          </p>
        </div>

        {/* The Hero Button: Transfer to Exam Generator */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => onTransferToExam(data)}
            className="group relative inline-flex items-center gap-2.5 px-6 py-3 rounded-xl font-extrabold text-sm text-slate-900 bg-gradient-to-r from-amber-300 via-amber-400 to-amber-300 hover:from-amber-200 hover:to-amber-400 shadow-lg hover:shadow-amber-400/30 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
          >
            <Sparkles className="w-5 h-5 text-indigo-900 group-hover:rotate-12 transition-transform" />
            <span>Sinh Đề Thi Từ Ma Trận Này</span>
            <ArrowRight className="w-4 h-4 text-indigo-900 group-hover:translate-x-1 transition-transform" />
          </button>
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
            onClick={() => exportMatrixToExcel(data)}
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
            {data.grade === 'Tự do' ? 'CHỦ ĐỀ TỰ DO' : `KHỐI LỚP ${data.grade}`} - {data.examType}
          </p>
          <p className="text-xs font-bold text-slate-500 mt-1 uppercase">
            Phạm vi kiến thức: {data.chapters.map(c => c.name).join(', ')}
          </p>
          <div className="flex flex-wrap justify-center gap-3 mt-3 text-[11px] font-black uppercase tracking-widest text-slate-500">
            <span className="bg-slate-100 px-3.5 py-1 rounded-full border border-slate-300 shadow-sm">
              Tổng số: 40 Lệnh hỏi (10 điểm)
            </span>
            <span className="bg-indigo-700 px-3.5 py-1 rounded-full text-white shadow-sm">
              Tỉ lệ chuẩn 4:3:3 (Biết: 16, Hiểu: 12, Vận dụng: 12)
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
              <th className="border border-black p-1 w-8">B</th><th className="border border-black p-1 w-8">H</th><th className="border border-black p-1 w-8">V</th>
              <th className="border border-black p-1 w-8">B</th><th className="border border-black p-1 w-8">H</th><th className="border border-black p-1 w-8">V</th>
              <th className="border border-black p-1 w-8">B</th><th className="border border-black p-1 w-8">H</th><th className="border border-black p-1 w-8">V</th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row, idx) => {
              const isP2Host = (row.part2.know + row.part2.understand + row.part2.apply) > 0;
              const isFirstInChapter = idx === 0 || data.rows[idx - 1].content !== row.content;

              return (
                <tr key={`row-${idx}`} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#f8fafc]'}>
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
                  
                  {/* Part 1 */}
                  <td className="border border-black p-1">{row.part1.know || ''}</td>
                  <td className="border border-black p-1">{row.part1.understand || ''}</td>
                  <td className="border border-black p-1">{row.part1.apply || ''}</td>

                  {/* Part 2 */}
                  <td className="border border-black p-1 font-semibold">{row.part2.know || ''}</td>
                  <td className="border border-black p-1 font-semibold">{row.part2.understand || ''}</td>
                  <td className="border border-black p-1 font-semibold">{row.part2.apply || ''}</td>

                  {/* Part 3 */}
                  <td className="border border-black p-1">{row.part3.know || ''}</td>
                  <td className="border border-black p-1">{row.part3.understand || ''}</td>
                  <td className="border border-black p-1 font-bold text-indigo-700">{row.part3.apply || ''}</td>

                  {/* Row Total */}
                  <td className="border border-black p-1 font-bold bg-[#f8fafc] text-slate-800">{row.total || ''}</td>
                  <td className="border border-black p-1 font-bold bg-[#f8fafc] text-slate-600">
                    {row.total ? `${((row.total / 40) * 100).toFixed(1)}%` : ''}
                  </td>
                </tr>
              );
            })}
          </tbody>

          <tfoot>
            {/* Grand Total */}
            <tr className="bg-[#cbd5e1] font-black text-slate-900 border-t-2 border-black">
              <td colSpan={4} className="border border-black p-2 text-center uppercase tracking-wider">
                Tổng cộng số lệnh hỏi
              </td>
              <td className="border border-black p-1">{data.totals.part1.know}</td>
              <td className="border border-black p-1">{data.totals.part1.understand}</td>
              <td className="border border-black p-1">{data.totals.part1.apply}</td>

              <td className="border border-black p-1">{data.totals.part2.know}</td>
              <td className="border border-black p-1">{data.totals.part2.understand}</td>
              <td className="border border-black p-1">{data.totals.part2.apply}</td>

              <td className="border border-black p-1">{data.totals.part3.know}</td>
              <td className="border border-black p-1">{data.totals.part3.understand}</td>
              <td className="border border-black p-1">{data.totals.part3.apply}</td>

              <td className="border border-black p-1 text-sm text-indigo-900">{data.totals.grandTotal}</td>
              <td className="border border-black p-1 text-sm text-indigo-900">100%</td>
            </tr>

            {/* Cognitive Ratio Summary */}
            <tr className="bg-[#e2e8f0] font-bold text-slate-800">
              <td colSpan={4} className="border border-black p-2 text-center uppercase text-[10px]">
                Tổng hợp theo mức độ nhận thức
              </td>
              <td colSpan={3} className="border border-black p-1 bg-[#fefce8]">
                Nhận biết: <span className="font-black text-slate-900">{data.totals.ratio.know}</span> (40%)
              </td>
              <td colSpan={3} className="border border-black p-1 bg-[#f0fdf4]">
                Thông hiểu: <span className="font-black text-slate-900">{data.totals.ratio.understand}</span> (30%)
              </td>
              <td colSpan={3} className="border border-black p-1 bg-[#eef2ff]">
                Vận dụng: <span className="font-black text-slate-900">{data.totals.ratio.apply}</span> (30%)
              </td>
              <td colSpan={2} className="border border-black p-1 bg-indigo-50 font-black text-indigo-900">
                10 Điểm
              </td>
            </tr>
          </tfoot>
        </table>

        {data.extraRequirements && (
          <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700">
            <span className="font-bold">Ghi chú yêu cầu bổ sung:</span> {data.extraRequirements}
          </div>
        )}
      </div>

    </div>
  );
};
