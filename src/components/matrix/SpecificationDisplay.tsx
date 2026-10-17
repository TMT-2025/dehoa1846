import React, { useState } from 'react';
import { 
  FileSpreadsheet, Download, Printer, 
  ChevronDown, ChevronUp, Layers, CheckSquare, Sparkles, BookOpen
} from 'lucide-react';
import { SpecificationData, SpecificationRow } from '../../types/specification';
import { exportSpecificationToExcel, downloadMatrixAndSpecDoc } from '../../services/exportService';
import { MatrixData } from '../../types/matrix';

interface SpecificationDisplayProps {
  specData: SpecificationData;
  matrixData?: MatrixData;
}

export const SpecificationDisplay: React.FC<SpecificationDisplayProps> = ({
  specData,
  matrixData
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [showCompetencyCodes, setShowCompetencyCodes] = useState(true);

  const handleExportExcel = () => {
    try {
      setIsExporting(true);
      if (matrixData) {
        exportSpecificationToExcel(matrixData, specData);
      }
    } catch (e: any) {
      alert(e.message || 'Lỗi khi xuất file Excel');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportWord = async () => {
    try {
      setIsExporting(true);
      if (matrixData) {
        await downloadMatrixAndSpecDoc(matrixData, specData);
      }
    } catch (e: any) {
      alert(e.message || 'Lỗi khi xuất file Word');
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const hasEssay = specData.hasEssay;

  return (
    <div className="space-y-4">
      
      {/* Top Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3 no-print">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-600" />
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase">
              BẢN ĐẶC TẢ ĐỀ KIỂM TRA ĐỊNH KỲ (PHỤ LỤC 2 - CÔNG VĂN 7991/BGDĐT-GDTrH)
            </h3>
            <p className="text-[11px] text-slate-500 font-medium">
              Tích hợp chuẩn Yêu cầu cần đạt CT GDPT 2018 môn Hóa học {specData.grade}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowCompetencyCodes(!showCompetencyCodes)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg text-xs font-bold transition-colors cursor-pointer"
            title="Bật/Tắt hiển thị mã năng lực (NLTN, TH-VN, VDKN)"
          >
            <CheckSquare className="w-4 h-4 text-slate-600" />
            <span>{showCompetencyCodes ? 'Ẩn mã năng lực' : 'Hiện mã năng lực (NL)'}</span>
          </button>

          <button
            onClick={handleExportWord}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-300 rounded-lg text-xs font-bold transition-colors shadow-xs cursor-pointer"
            title="Tải file Word gồm cả Ma trận và Bản đặc tả theo chuẩn CV 7991"
          >
            <Download className="w-4 h-4 text-blue-600" />
            <span>Tải Word Ma trận + Bản đặc tả (.docx)</span>
          </button>

          <button
            onClick={handleExportExcel}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-lg text-xs font-bold transition-colors shadow-xs cursor-pointer"
            title="Xuất file Excel gồm 2 Sheet: Ma trận & Bản đặc tả"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Xuất Excel (.xlsx)</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-lg text-xs font-bold transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>In bản đặc tả</span>
          </button>
        </div>
      </div>

      {/* Main Table Paper */}
      <div 
        id="specification-table-container"
        className="overflow-x-auto bg-white p-6 md:p-10 border border-gray-300 shadow-xl rounded-2xl relative"
      >
        <div className="text-center mb-6">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">
            BỘ GIÁO DỤC VÀ ĐÀO TẠO - CÔNG VĂN SỐ 7991/BGDĐT-GDTrH
          </p>
          <h2 className="text-xl md:text-2xl font-black uppercase text-indigo-950 tracking-tight leading-snug">
            2. BẢN ĐẶC TẢ ĐỀ KIỂM TRA ĐỊNH KÌ MÔN HÓA HỌC
          </h2>
          <p className="text-sm md:text-base font-bold mt-1 text-slate-800 uppercase">
            LỚP {specData.grade} - {specData.examType}
            {hasEssay ? ' (CÓ PHẦN TỰ LUẬN)' : ' (100% TRẮC NGHIỆM KHÁCH QUAN)'}
          </p>
          <div className="flex flex-wrap justify-center gap-2 mt-2 text-[11px] font-bold text-slate-600">
            <span className="bg-slate-100 px-3 py-0.5 rounded-full border border-slate-300">
              Tổng số lệnh hỏi: <strong className="text-indigo-900">{specData.totals.totalCommands}</strong> ({hasEssay ? 'TN 7.0đ + TL 3.0đ = 10 điểm' : '10 điểm'})
            </span>
            <span className="bg-indigo-50 px-3 py-0.5 rounded-full border border-indigo-200 text-indigo-900">
              Tỉ lệ nhận thức: Biết {specData.totals.percentages.know}% - Hiểu {specData.totals.percentages.understand}% - Vận dụng {specData.totals.percentages.apply}%
            </span>
          </div>
        </div>

        {/* Specification Table */}
        <table className="w-full border-collapse border-[1.5px] border-black text-[11px] leading-snug bg-white">
          <thead>
            <tr className="bg-[#e2e8f0] font-bold text-slate-900 text-center">
              <th rowSpan={3} className="border border-black p-2 w-8">TT</th>
              <th rowSpan={3} className="border border-black p-2 w-32">Chủ đề/Chương</th>
              <th rowSpan={3} className="border border-black p-2 w-36">Nội dung/đơn vị kiến thức</th>
              <th rowSpan={3} className="border border-black p-2 min-w-[280px]">Yêu cầu cần đạt</th>
              <th colSpan={hasEssay ? 12 : 9} className="border border-black p-2 bg-[#f8fafc]">
                Số câu hỏi ở các mức độ đánh giá
              </th>
            </tr>
            <tr className="bg-[#f8fafc] font-bold text-slate-900 text-center">
              <th colSpan={3} className="border border-black p-1.5 bg-[#fefce8] text-amber-950">
                Nhiều lựa chọn
              </th>
              <th colSpan={3} className="border border-black p-1.5 bg-[#f0fdf4] text-emerald-950">
                “Đúng – Sai”
              </th>
              <th colSpan={3} className="border border-black p-1.5 bg-[#eef2ff] text-indigo-950">
                Trả lời ngắn
              </th>
              {hasEssay && (
                <th colSpan={3} className="border border-black p-1.5 bg-[#faf5ff] text-purple-950">
                  Tự luận
                </th>
              )}
            </tr>
            <tr className="bg-[#f8fafc] text-[9px] uppercase font-black text-slate-700 text-center">
              <th className="border border-black p-1 w-9">Biết</th>
              <th className="border border-black p-1 w-9">Hiểu</th>
              <th className="border border-black p-1 w-9">Vận dụng</th>

              <th className="border border-black p-1 w-9">Biết</th>
              <th className="border border-black p-1 w-9">Hiểu</th>
              <th className="border border-black p-1 w-9">Vận dụng</th>

              <th className="border border-black p-1 w-9">Biết</th>
              <th className="border border-black p-1 w-9">Hiểu</th>
              <th className="border border-black p-1 w-9">Vận dụng</th>

              {hasEssay && (
                <>
                  <th className="border border-black p-1 w-9 bg-[#f3e8ff] text-purple-900">Biết</th>
                  <th className="border border-black p-1 w-9 bg-[#f3e8ff] text-purple-900">Hiểu</th>
                  <th className="border border-black p-1 w-9 bg-[#f3e8ff] text-purple-900">Vận dụng</th>
                </>
              )}
            </tr>
          </thead>

          <tbody>
            {specData.rows.map((row, idx) => {
              const formatCell = (count: number, code: string) => {
                if (count <= 0) return '';
                if (!showCompetencyCodes) return `${count}`;
                return (
                  <div className="flex flex-col items-center">
                    <span className="font-bold text-slate-900">{count}</span>
                    <span className="text-[8px] text-slate-500 font-semibold">{code}</span>
                  </div>
                );
              };

              return (
                <tr key={`spec-row-${idx}`} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#fcfdfd]'}>
                  {/* TT */}
                  <td className="border border-black p-1.5 text-center font-bold text-slate-600 align-top">
                    {row.index}
                  </td>

                  {/* Chủ đề/Chương */}
                  {row.isFirstInChapter ? (
                    <td 
                      rowSpan={row.chapterRowCount} 
                      className="border border-black p-2.5 font-black text-[11px] uppercase text-[#1e3a8a] bg-white align-top leading-tight"
                    >
                      {row.chapterName}
                    </td>
                  ) : null}

                  {/* Nội dung/Đơn vị kiến thức */}
                  <td className="border border-black p-2 font-bold text-slate-900 align-top text-left">
                    {row.lessonName}
                  </td>

                  {/* Yêu cầu cần đạt (Phân tách Nhận biết, Thông hiểu, Vận dụng) */}
                  <td className="border border-black p-2.5 text-left text-[11px] align-top space-y-2">
                    {row.outcomes.recognition && row.outcomes.recognition.length > 0 && (
                      <div>
                        <strong className="text-amber-900 font-bold block mb-0.5">
                          - Nhận biết:
                        </strong>
                        <ul className="list-disc pl-4 space-y-0.5 text-slate-800">
                          {row.outcomes.recognition.map((item, oIdx) => (
                            <li key={oIdx}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {row.outcomes.understanding && row.outcomes.understanding.length > 0 && (
                      <div>
                        <strong className="text-emerald-900 font-bold block mb-0.5">
                          - Thông hiểu:
                        </strong>
                        <ul className="list-disc pl-4 space-y-0.5 text-slate-800">
                          {row.outcomes.understanding.map((item, oIdx) => (
                            <li key={oIdx}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {row.outcomes.application && row.outcomes.application.length > 0 && (
                      <div>
                        <strong className="text-indigo-900 font-bold block mb-0.5">
                          - Vận dụng:
                        </strong>
                        <ul className="list-disc pl-4 space-y-0.5 text-slate-800">
                          {row.outcomes.application.map((item, oIdx) => (
                            <li key={oIdx}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </td>

                  {/* Nhiều lựa chọn (MCQ) */}
                  <td className="border border-black p-1 text-center align-top bg-amber-50/20 font-bold">
                    {formatCell(row.part1.know, '(NLTN)')}
                  </td>
                  <td className="border border-black p-1 text-center align-top bg-amber-50/20 font-bold">
                    {formatCell(row.part1.understand, '(TH-VN)')}
                  </td>
                  <td className="border border-black p-1 text-center align-top bg-amber-50/20 font-bold">
                    {formatCell(row.part1.apply, '(VDKN)')}
                  </td>

                  {/* Đúng - Sai (TF) */}
                  <td className="border border-black p-1 text-center align-top bg-emerald-50/20 font-bold text-emerald-950">
                    {formatCell(row.part2.know, '(NLTN)')}
                  </td>
                  <td className="border border-black p-1 text-center align-top bg-emerald-50/20 font-bold text-emerald-950">
                    {formatCell(row.part2.understand, '(TH-VN)')}
                  </td>
                  <td className="border border-black p-1 text-center align-top bg-emerald-50/20 font-bold text-emerald-950">
                    {formatCell(row.part2.apply, '(VDKN)')}
                  </td>

                  {/* Trả lời ngắn (SA) */}
                  <td className="border border-black p-1 text-center align-top bg-indigo-50/20 font-bold">
                    {formatCell(row.part3.know, '(NLTN)')}
                  </td>
                  <td className="border border-black p-1 text-center align-top bg-indigo-50/20 font-bold">
                    {formatCell(row.part3.understand, '(TH-VN)')}
                  </td>
                  <td className="border border-black p-1 text-center align-top bg-indigo-50/20 font-black text-indigo-900">
                    {formatCell(row.part3.apply, '(VDKN)')}
                  </td>

                  {/* Tự luận (TL) */}
                  {hasEssay && (
                    <>
                      <td className="border border-black p-1 text-center align-top bg-purple-50/20 font-bold text-purple-950">
                        {formatCell(row.part4?.know || 0, '(NLTN)')}
                      </td>
                      <td className="border border-black p-1 text-center align-top bg-purple-50/20 font-bold text-purple-950">
                        {formatCell(row.part4?.understand || 0, '(TH-VN)')}
                      </td>
                      <td className="border border-black p-1 text-center align-top bg-purple-50/20 font-black text-purple-900">
                        {formatCell(row.part4?.apply || 0, '(VDKN)')}
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>

          <tfoot>
            {/* Tổng số câu / Tổng số lệnh */}
            <tr className="bg-[#cbd5e1] font-black text-slate-900 border-t-2 border-black text-center">
              <td colSpan={4} className="border border-black p-2 text-center uppercase tracking-wider">
                Tổng số câu hỏi / lệnh hỏi
              </td>
              <td className="border border-black p-1.5">{specData.totals.part1.know}</td>
              <td className="border border-black p-1.5">{specData.totals.part1.understand}</td>
              <td className="border border-black p-1.5">{specData.totals.part1.apply}</td>

              <td className="border border-black p-1.5">{specData.totals.part2.know}</td>
              <td className="border border-black p-1.5">{specData.totals.part2.understand}</td>
              <td className="border border-black p-1.5">{specData.totals.part2.apply}</td>

              <td className="border border-black p-1.5">{specData.totals.part3.know}</td>
              <td className="border border-black p-1.5">{specData.totals.part3.understand}</td>
              <td className="border border-black p-1.5 text-indigo-900 font-bold">{specData.totals.part3.apply}</td>

              {hasEssay && (
                <>
                  <td className="border border-black p-1.5 text-purple-950">{specData.totals.part4?.know || 0}</td>
                  <td className="border border-black p-1.5 text-purple-950">{specData.totals.part4?.understand || 0}</td>
                  <td className="border border-black p-1.5 text-purple-900 font-bold">{specData.totals.part4?.apply || 0}</td>
                </>
              )}
            </tr>

            {/* Tổng số điểm */}
            <tr className="bg-[#e2e8f0] font-black text-slate-900 text-center">
              <td colSpan={4} className="border border-black p-2 text-center uppercase tracking-wider text-[10px]">
                Tổng số điểm
              </td>
              <td colSpan={3} className="border border-black p-1.5 bg-[#fefce8] text-amber-950 font-bold">
                {specData.totals.totalPoints.part1.toFixed(1).replace('.', ',')} điểm
              </td>
              <td colSpan={3} className="border border-black p-1.5 bg-[#f0fdf4] text-emerald-950 font-bold">
                {specData.totals.totalPoints.part2.toFixed(1).replace('.', ',')} điểm
              </td>
              <td colSpan={3} className="border border-black p-1.5 bg-[#eef2ff] text-indigo-950 font-bold">
                {specData.totals.totalPoints.part3.toFixed(1).replace('.', ',')} điểm
              </td>
              {hasEssay && (
                <td colSpan={3} className="border border-black p-1.5 bg-[#faf5ff] text-purple-950 font-bold">
                  {(specData.totals.totalPoints.part4 || 3.0).toFixed(1).replace('.', ',')} điểm
                </td>
              )}
            </tr>

            {/* Tỉ lệ % */}
            <tr className="bg-[#f1f5f9] font-black text-slate-900 text-center">
              <td colSpan={4} className="border border-black p-2 text-center uppercase tracking-wider text-[10px]">
                Tỉ lệ %
              </td>
              <td colSpan={3} className="border border-black p-1 bg-[#fefce8] text-amber-950 font-bold">
                {specData.totals.percentages.part1}%
              </td>
              <td colSpan={3} className="border border-black p-1 bg-[#f0fdf4] text-emerald-950 font-bold">
                {specData.totals.percentages.part2}%
              </td>
              <td colSpan={3} className="border border-black p-1 bg-[#eef2ff] text-indigo-950 font-bold">
                {specData.totals.percentages.part3}%
              </td>
              {hasEssay && (
                <td colSpan={3} className="border border-black p-1 bg-[#faf5ff] text-purple-950 font-bold">
                  {specData.totals.percentages.part4 || 30}%
                </td>
              )}
            </tr>

            {/* Tổng hợp mức độ nhận thức */}
            <tr className="bg-indigo-100 font-bold text-slate-900">
              <td colSpan={4} className="border border-black p-2 text-center uppercase text-[10px] text-indigo-950">
                Tổng hợp tỉ lệ nhận thức toàn đề:
              </td>
              <td colSpan={hasEssay ? 4 : 3} className="border border-black p-1.5 bg-[#fefce8] text-center">
                Nhận biết: <strong>{specData.totals.percentages.know}%</strong> ({specData.totals.totalPoints.know.toFixed(1).replace('.', ',')}đ)
              </td>
              <td colSpan={hasEssay ? 4 : 3} className="border border-black p-1.5 bg-[#f0fdf4] text-center">
                Thông hiểu: <strong>{specData.totals.percentages.understand}%</strong> ({specData.totals.totalPoints.understand.toFixed(1).replace('.', ',')}đ)
              </td>
              <td colSpan={hasEssay ? 4 : 3} className="border border-black p-1.5 bg-[#eef2ff] text-center">
                Vận dụng: <strong>{specData.totals.percentages.apply}%</strong> ({specData.totals.totalPoints.apply.toFixed(1).replace('.', ',')}đ)
              </td>
            </tr>
          </tfoot>
        </table>

        {/* Chú thích theo Công văn 7991 */}
        <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-600 space-y-1">
          <p className="font-bold text-slate-700">Ghi chú theo Công văn số 7991/BGDĐT-GDTrH:</p>
          <p>- (NLTN): Năng lực nhận thức kiến thức hoá học.</p>
          <p>- (TH-VN): Năng lực tìm hiểu thế giới tự nhiên dưới góc độ hoá học / giải thích hiện tượng.</p>
          <p>- (VDKN): Năng lực vận dụng kiến thức, kĩ năng đã học vào giải quyết vấn đề thực tiễn.</p>
          {hasEssay ? (
            <p className="text-amber-800 font-bold">
              - Đề kiểm tra định kì Lớp 10, 11 gồm 2 phần: Trắc nghiệm (7,0 điểm) và Tự luận (3,0 điểm) theo quy định.
            </p>
          ) : (
            <p className="text-indigo-800 font-bold">
              - Đề kiểm tra Lớp 12 gồm 40 lệnh trắc nghiệm khách quan 100% (10,0 điểm) theo định dạng đề Tốt nghiệp THPT của Bộ GD&ĐT.
            </p>
          )}
        </div>
      </div>

    </div>
  );
};
