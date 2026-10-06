import React, { useRef } from 'react';
import { ExamData } from '../../types/exam';
import { Download, Table } from 'lucide-react';

interface MatrixRendererProps {
  data: ExamData;
}

export const MatrixRenderer: React.FC<MatrixRendererProps> = ({ data }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const downloadAsImage = () => {
    const el = containerRef.current;
    if (!el) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 1200;
    const padding = 40;
    const rowHeight = 40;
    const titleHeight = 80;
    const tableTop = titleHeight + padding;
    
    const rows = data.matrix || [];
    const totalRows = rows.length + 2;
    const height = tableTop + (totalRows * rowHeight) + padding;

    canvas.width = width;
    canvas.height = height;

    // White background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Title
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 22px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`MA TRẬN PHÂN BỔ CÂU HỎI - ${data.title.toUpperCase()}`, width / 2, 50);

    const colWidths = [350, 140, 140, 140, 140, 150];
    const colNames = ['Nội dung kiến thức', 'Nhận biết', 'Thông hiểu', 'Vận dụng', 'Vận dụng cao', 'Tổng lệnh'];
    let currentY = tableTop;

    const drawRow = (cells: string[], isHeader = false) => {
      let currentX = padding;
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1;
      
      cells.forEach((cell, i) => {
        const w = colWidths[i];
        ctx.strokeRect(currentX, currentY, w, rowHeight);
        if (isHeader) {
          ctx.fillStyle = '#f1f5f9';
          ctx.fillRect(currentX + 1, currentY + 1, w - 2, rowHeight - 2);
          ctx.fillStyle = '#0f172a';
          ctx.font = 'bold 13px Arial';
        } else {
          ctx.fillStyle = '#334155';
          ctx.font = '13px Arial';
        }
        
        ctx.textAlign = 'center';
        ctx.fillText(cell, currentX + w / 2, currentY + rowHeight / 2 + 5);
        currentX += w;
      });
      currentY += rowHeight;
    };

    drawRow(colNames, true);

    let grandTotal = 0;
    rows.forEach(r => {
      const rowSum = (r.recognition || 0) + (r.understanding || 0) + (r.application || 0) + (r.highApplication || 0);
      grandTotal += rowSum;
      drawRow([
        r.topic,
        (r.recognition || 0).toString(),
        (r.understanding || 0).toString(),
        (r.application || 0).toString(),
        (r.highApplication || 0).toString(),
        rowSum.toString()
      ]);
    });

    const totals = rows.reduce((acc, curr) => {
      acc[0] += curr.recognition || 0;
      acc[1] += curr.understanding || 0;
      acc[2] += curr.application || 0;
      acc[3] += curr.highApplication || 0;
      return acc;
    }, [0, 0, 0, 0]);
    
    drawRow(['TỔNG CỘNG', ...totals.map(t => t.toString()), grandTotal.toString()], true);

    const link = document.createElement('a');
    link.download = `MaTran_${data.title.replace(/\s+/g, '_')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  if (!data.matrix || data.matrix.length === 0) {
    return null;
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-200 space-y-4 no-print">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Table className="w-5 h-5 text-indigo-600" />
          <h3 className="font-bold text-slate-800 text-base">
            Bảng ma trận phân bổ mức độ nhận thức của đề thi
          </h3>
        </div>
        <button 
          onClick={downloadAsImage}
          className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm"
        >
          <Download className="w-4 h-4" />
          Tải ảnh Ma Trận (.png)
        </button>
      </div>
      
      <div className="overflow-x-auto" ref={containerRef}>
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100 text-slate-800 font-bold">
              <th className="border border-slate-300 p-2 text-left">Nội dung kiến thức</th>
              <th className="border border-slate-300 p-2 text-center w-24">Nhận biết</th>
              <th className="border border-slate-300 p-2 text-center w-24">Thông hiểu</th>
              <th className="border border-slate-300 p-2 text-center w-24">Vận dụng</th>
              <th className="border border-slate-300 p-2 text-center w-28">Vận dụng cao</th>
              <th className="border border-slate-300 p-2 text-center w-24 font-bold bg-slate-200">Tổng</th>
            </tr>
          </thead>
          <tbody>
            {data.matrix.map((row, idx) => {
              const rowSum = (row.recognition || 0) + (row.understanding || 0) + (row.application || 0) + (row.highApplication || 0);
              return (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  <td className="border border-slate-200 p-2.5 font-medium text-slate-800">{row.topic}</td>
                  <td className="border border-slate-200 p-2 text-center">{row.recognition || 0}</td>
                  <td className="border border-slate-200 p-2 text-center">{row.understanding || 0}</td>
                  <td className="border border-slate-200 p-2 text-center">{row.application || 0}</td>
                  <td className="border border-slate-200 p-2 text-center text-indigo-700 font-bold">{row.highApplication || 0}</td>
                  <td className="border border-slate-200 p-2 text-center font-bold bg-slate-50">{rowSum}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-slate-100 font-extrabold text-slate-900 border-t-2 border-slate-300">
              <td className="border border-slate-300 p-2">TỔNG CỘNG</td>
              <td className="border border-slate-300 p-2 text-center">{data.matrix.reduce((a, b) => a + (b.recognition || 0), 0)}</td>
              <td className="border border-slate-300 p-2 text-center">{data.matrix.reduce((a, b) => a + (b.understanding || 0), 0)}</td>
              <td className="border border-slate-300 p-2 text-center">{data.matrix.reduce((a, b) => a + (b.application || 0), 0)}</td>
              <td className="border border-slate-300 p-2 text-center text-indigo-700">{data.matrix.reduce((a, b) => a + (b.highApplication || 0), 0)}</td>
              <td className="border border-slate-300 p-2 text-center bg-slate-200">
                {data.matrix.reduce((a, b) => a + (b.recognition || 0) + (b.understanding || 0) + (b.application || 0) + (b.highApplication || 0), 0)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
