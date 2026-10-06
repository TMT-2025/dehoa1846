
import React from 'react';
import { MatrixData, MatrixRow } from '../types';

interface MatrixDisplayProps {
  data: MatrixData;
}

const MatrixDisplay: React.FC<MatrixDisplayProps> = ({ data }) => {
  const getLessonSummary = (lessonName: string) => {
    const lessonRows = data.rows.filter(r => r.lessonName === lessonName);
    const lessonTotal = lessonRows.reduce((sum, r) => sum + r.total, 0);
    const lessonPercent = ((lessonTotal / data.totals.grandTotal) * 100).toFixed(1);
    
    const partTotals = {
      p1k: lessonRows.reduce((sum, r) => sum + r.part1.know, 0),
      p1u: lessonRows.reduce((sum, r) => sum + r.part1.understand, 0),
      p1v: lessonRows.reduce((sum, r) => sum + r.part1.apply, 0),
      p2k: lessonRows.reduce((sum, r) => sum + r.part2.know, 0),
      p2u: lessonRows.reduce((sum, r) => sum + r.part2.understand, 0),
      p2v: lessonRows.reduce((sum, r) => sum + r.part2.apply, 0),
      p3k: lessonRows.reduce((sum, r) => sum + r.part3.know, 0),
      p3u: lessonRows.reduce((sum, r) => sum + r.part3.understand, 0),
      p3v: lessonRows.reduce((sum, r) => sum + r.part3.apply, 0),
    };

    return { total: lessonTotal, percent: lessonPercent, ...partTotals };
  };

  // Helper to calculate rowSpan for chapter name
  const getChapterRowSpan = (chapterName: string) => {
    const chapterRows = data.rows.filter(r => r.content === chapterName);
    const lessonCount = new Set(chapterRows.map(r => r.lessonName)).size;
    return chapterRows.length + lessonCount;
  };

  return (
    <div id="matrix-table-container" className="overflow-x-auto bg-white p-10 border border-gray-200 shadow-2xl rounded-2xl relative">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-black uppercase text-blue-900 tracking-tight leading-none">MA TRẬN ĐỀ KIỂM TRA CHI TIẾT</h2>
        <p className="text-xl font-bold mt-3 text-slate-700 uppercase">
          {data.grade === 'Tự do' ? 'CHỦ ĐỀ TỰ DO' : `KHỐI LỚP ${data.grade}`} - {data.examType}
        </p>
        <p className="text-sm font-bold text-slate-500 mt-1 uppercase">Phạm vi: {data.chapters.map(c => c.name).join(', ')}</p>
        <div className="flex justify-center gap-4 mt-4 text-[11px] font-black uppercase tracking-widest text-slate-400">
          <span className="bg-slate-100 px-4 py-1.5 rounded-full border border-slate-200 shadow-sm">Tổng: 40 Lệnh hỏi (10đ)</span>
          <span className="bg-indigo-600 px-4 py-1.5 rounded-full text-white shadow-lg">Tỉ lệ chuẩn 4:3:3 (B:H:V)</span>
        </div>
      </div>

      <table className="w-full border-collapse border-[1.5px] border-black text-[11px] text-center leading-tight bg-white">
        <thead>
          <tr className="bg-[#e2e8f0] font-bold">
            <th rowSpan={3} className="border border-black p-2 w-8">TT</th>
            <th rowSpan={3} className="border border-black p-2 w-32">Nội dung</th>
            <th rowSpan={3} className="border border-black p-2 w-32">Đơn vị kiến thức</th>
            <th rowSpan={3} className="border border-black p-2">Mục chi tiết nội dung</th>
            <th colSpan={9} className="border border-black p-2">Mức độ nhận thức (Số lệnh hỏi)</th>
            <th rowSpan={3} className="border border-black p-2 w-12 bg-[#f8fafc]">Tổng lệnh</th>
            <th rowSpan={3} className="border border-black p-2 w-12 bg-[#f8fafc]">Tỉ lệ (%)</th>
          </tr>
          <tr className="bg-[#f8fafc] font-bold">
            <th colSpan={3} className="border border-black p-1.5 bg-[#fefce8]">Phần I (MCQ)</th>
            <th colSpan={3} className="border border-black p-1.5 bg-[#f0fdf4]">Phần II (Đ/S)</th>
            <th colSpan={3} className="border border-black p-1.5 bg-[#eef2ff]">Phần III (SA)</th>
          </tr>
          <tr className="bg-[#f8fafc] text-[9px] uppercase font-black">
            <th className="border border-black p-1 w-8">B</th><th className="border border-black p-1 w-8">H</th><th className="border border-black p-1 w-8">V</th>
            <th className="border border-black p-1 w-8">B</th><th className="border border-black p-1 w-8">H</th><th className="border border-black p-1 w-8">V</th>
            <th className="border border-black p-1 w-8">B</th><th className="border border-black p-1 w-8">H</th><th className="border border-black p-1 w-8">V</th>
          </tr>
        </thead>
        <tbody>
          {data.rows.map((row, idx) => {
            const elements = [];
            const isP2Host = (row.part2.know + row.part2.understand + row.part2.apply) > 0;
            
            // Check if this is the first row of a chapter
            const isFirstInChapter = idx === 0 || data.rows[idx - 1].content !== row.content;
 
            elements.push(
              <tr key={`row-${idx}`} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#f8fafc]'}>
                <td className="border border-black p-1 text-[10px] text-[#94a3b8] font-bold">{idx + 1}</td>
                {isFirstInChapter ? (
                  <td rowSpan={getChapterRowSpan(row.content)} className="border border-black p-3 font-black text-[10px] uppercase text-[#1e3a8a] bg-white leading-tight">
                    {row.content}
                  </td>
                ) : null}
                {row.isFirstInLesson ? (
                  <td rowSpan={row.lessonRowCount + 1} className="border border-black p-3 font-bold text-left align-top bg-white leading-snug text-[11px] text-[#1e293b]">
                    {row.lessonName}
                  </td>
                ) : null}
                <td className={`border border-black p-2 text-left italic font-medium ${isP2Host ? 'text-[#15803d] bg-[#f0fdf4] font-black' : 'text-[#64748b]'}`}>
                  {row.detailName} {isP2Host && <span className="not-italic text-[7px] bg-[#16a34a] text-white px-1 py-0.5 rounded ml-1 uppercase">Bối cảnh P.II (1-2-1)</span>}
                </td>
                
                <td className="border border-black p-1">{row.part1.know || ''}</td>
                <td className="border border-black p-1">{row.part1.understand || ''}</td>
                <td className="border border-black p-1">{row.part1.apply || ''}</td>
                
                <td className={`border border-black p-1 font-black ${isP2Host ? 'bg-[#dcfce7] text-[#15803d]' : ''}`}>{row.part2.know || ''}</td>
                <td className={`border border-black p-1 font-black ${isP2Host ? 'bg-[#dcfce7] text-[#15803d]' : ''}`}>{row.part2.understand || ''}</td>
                <td className={`border border-black p-1 font-black ${isP2Host ? 'bg-[#dcfce7] text-[#15803d]' : ''}`}>{row.part2.apply || ''}</td>
                
                <td className="border border-black p-1">{row.part3.know || ''}</td>
                <td className="border border-black p-1">{row.part3.understand || ''}</td>
                <td className="border border-black p-1">{row.part3.apply || ''}</td>
                
                <td className="border border-black p-1 font-black text-[#0f172a] bg-[#f8fafc]">{row.total}</td>
                <td className="border border-black p-1 text-[9px] text-[#94a3b8] bg-[#f8fafc]">{((row.total / 40) * 100).toFixed(1)}%</td>
              </tr>
            );
 
            if (row.isLastInLesson) {
              const summary = getLessonSummary(row.lessonName);
              elements.push(
                <tr key={`sum-${row.lessonName}`} className="bg-[#1e293b] text-white font-black uppercase">
                  <td colSpan={1} className="border border-black p-1.5 text-[8px]">—</td>
                  <td className="border border-black p-1.5 text-right text-[9px] tracking-tight">TỔNG ĐƠN VỊ:</td>
                  <td className="border border-black p-1.5">{summary.p1k || ''}</td>
                  <td className="border border-black p-1.5">{summary.p1u || ''}</td>
                  <td className="border border-black p-1.5">{summary.p1v || ''}</td>
                  <td className="border border-black p-1.5 text-[#4ade80]">{summary.p2k || ''}</td>
                  <td className="border border-black p-1.5 text-[#4ade80]">{summary.p2u || ''}</td>
                  <td className="border border-black p-1.5 text-[#4ade80]">{summary.p2v || ''}</td>
                  <td className="border border-black p-1.5">{summary.p3k || ''}</td>
                  <td className="border border-black p-1.5">{summary.p3u || ''}</td>
                  <td className="border border-black p-1.5">{summary.p3v || ''}</td>
                  <td className="border border-black p-1.5 bg-[#2563eb] text-white text-xs">{summary.total}</td>
                  <td className="border border-black p-1.5 bg-[#2563eb] text-white text-[10px]">{summary.percent}%</td>
                </tr>
              );
            }
            return elements;
          })}
        </tbody>
        <tfoot className="bg-[#0f172a] text-white font-black text-xs uppercase border-t-2 border-black">
          <tr className="h-12">
            <td colSpan={4} className="border border-black p-3 text-left tracking-widest text-[12px] bg-[#1e293b]">TỔNG CỘNG TOÀN BỘ (40 LỆNH HỎI)</td>
            <td className="border border-black p-1">{data.totals.part1.know}</td>
            <td className="border border-black p-1">{data.totals.part1.understand}</td>
            <td className="border border-black p-1">{data.totals.part1.apply}</td>
            <td className="border border-black p-1">{data.totals.part2.know}</td>
            <td className="border border-black p-1">{data.totals.part2.understand}</td>
            <td className="border border-black p-1">{data.totals.part2.apply}</td>
            <td className="border border-black p-1">{data.totals.part3.know}</td>
            <td className="border border-black p-1">{data.totals.part3.understand}</td>
            <td className="border border-black p-1">{data.totals.part3.apply}</td>
            <td className="border border-black p-1 text-[#60a5fa] bg-[#1e293b] text-base shadow-inner">{data.totals.grandTotal}</td>
            <td className="border border-black p-1 text-[#60a5fa] bg-[#1e293b]">100%</td>
          </tr>
          <tr className="bg-[#f1f5f9] text-[#0f172a] h-12">
            <td colSpan={4} className="border border-black p-3 text-left font-black text-[#1e3a8a] bg-[#eff6ff] uppercase">Phân tích tỉ lệ nhận thức (Chuẩn 4-3-3)</td>
            <td colSpan={3} className="border border-black p-1 bg-[#facc1533] text-[#854d0e]">
              BIẾT: {data.totals.ratio.know} LỆNH ({(data.totals.ratio.know / 40 * 100)}%)
            </td>
            <td colSpan={3} className="border border-black p-1 bg-[#4ade8033] text-[#166534]">
              HIỂU: {data.totals.ratio.understand} LỆNH ({(data.totals.ratio.understand / 40 * 100)}%)
            </td>
            <td colSpan={3} className="border border-black p-1 bg-[#818cf833] text-[#3730a3]">
              VD: {data.totals.ratio.apply} LỆNH ({(data.totals.ratio.apply / 40 * 100)}%)
            </td>
            <td colSpan={2} className="border border-black p-1 bg-[#e2e8f0] font-black">100%</td>
          </tr>
        </tfoot>
      </table>

      {data.extraRequirements && (
        <div className="mt-8 p-6 bg-slate-50 border-l-4 border-slate-900 rounded-r-2xl shadow-sm">
          <h4 className="text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Yêu cầu bổ sung</h4>
          <p className="text-sm text-slate-800 font-bold italic leading-relaxed">"{data.extraRequirements}"</p>
        </div>
      )}

      <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-8 no-print">
        <div className="bg-slate-50 border border-slate-200 rounded-3xl p-8">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">Chi tiết Logic Phần II (Đúng/Sai)</h4>
          <div className="space-y-4">
            <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
              <div className="w-10 h-10 bg-green-600 text-white rounded-xl flex items-center justify-center font-black">1</div>
              <div className="text-[11px] font-bold text-slate-600">Mỗi bối cảnh chứa chính xác 4 lệnh hỏi.</div>
            </div>
            <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
              <div className="w-10 h-10 bg-green-600 text-white rounded-xl flex items-center justify-center font-black">2</div>
              <div className="text-[11px] font-bold text-slate-600 uppercase">Cơ cấu nội bối cảnh: 1 Biết - 2 Hiểu - 1 VD.</div>
            </div>
            <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
              <div className="w-10 h-10 bg-red-600 text-white rounded-xl flex items-center justify-center font-black">!</div>
              <div className="text-[11px] font-bold text-red-600 uppercase">Cấm chồng lấn Phần I và Phần III vào bối cảnh P.II.</div>
            </div>
          </div>
        </div>
        <div className="bg-slate-900 text-white rounded-3xl p-8 flex flex-col justify-center text-center shadow-xl">
            <div className="text-4xl font-black text-blue-400 italic tracking-tighter">40 LỆNH HỎI</div>
            <div className="text-[10px] uppercase font-bold text-slate-400 mt-2 tracking-[0.2em] underline decoration-blue-500 underline-offset-8">Phân bổ 100/N chuẩn GDPT 2018</div>
        </div>
      </div>
    </div>
  );
};

export default MatrixDisplay;
