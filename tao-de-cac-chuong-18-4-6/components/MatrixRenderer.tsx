
import React, { useRef } from 'react';
import { ExamData, MatrixRow } from '../types';
import { Download } from 'lucide-react';

interface MatrixRendererProps {
  data: ExamData;
}

const MatrixRenderer: React.FC<MatrixRendererProps> = ({ data }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const downloadAsImage = () => {
    const el = containerRef.current;
    if (!el) return;

    // Use a Canvas to draw the table
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 1200;
    const padding = 40;
    const rowHeight = 40;
    const titleHeight = 80;
    const tableTop = titleHeight + padding;
    
    const rows = data.matrix;
    const totalRows = rows.length + 2; // Header + Body + Total
    const height = tableTop + (totalRows * rowHeight) + padding;

    canvas.width = width;
    canvas.height = height;

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Title
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`MA TRẬN ĐỀ KIỂM TRA - ${data.title.toUpperCase()}`, width / 2, 50);

    // Table settings
    const colWidths = [300, 150, 150, 150, 150, 150];
    const colNames = ['Nội dung kiến thức', 'Nhận biết', 'Thông hiểu', 'Vận dụng', 'Vận dụng cao', 'Tổng'];
    let currentY = tableTop;

    // Helper for drawing rows
    const drawRow = (cells: string[], isHeader = false) => {
      let currentX = padding;
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1;
      
      cells.forEach((cell, i) => {
        const w = colWidths[i];
        // Rect
        ctx.strokeRect(currentX, currentY, w, rowHeight);
        if (isHeader) {
          ctx.fillStyle = '#f1f5f9';
          ctx.fillRect(currentX + 1, currentY + 1, w - 2, rowHeight - 2);
          ctx.fillStyle = '#0f172a';
          ctx.font = 'bold 14px Arial';
        } else {
          ctx.fillStyle = '#334155';
          ctx.font = '14px Arial';
        }
        
        ctx.textAlign = 'center';
        ctx.fillText(cell, currentX + w / 2, currentY + rowHeight / 2 + 5);
        currentX += w;
      });
      currentY += rowHeight;
    };

    // Header
    drawRow(colNames, true);

    // Body
    let grandTotal = 0;
    rows.forEach(r => {
      const rowSum = r.recognition + r.understanding + r.application + r.highApplication;
      grandTotal += rowSum;
      drawRow([
        r.topic,
        r.recognition.toString(),
        r.understanding.toString(),
        r.application.toString(),
        r.highApplication.toString(),
        rowSum.toString()
      ]);
    });

    // Final Footer Total
    const totals = rows.reduce((acc, curr) => {
        acc[0] += curr.recognition;
        acc[1] += curr.understanding;
        acc[2] += curr.application;
        acc[3] += curr.highApplication;
        return acc;
    }, [0, 0, 0, 0]);
    
    drawRow(['TỔNG CỘNG', ...totals.map(t => t.toString()), grandTotal.toString()], true);

    // Download
    const link = document.createElement('a');
    link.download = `MaTran_${data.title.replace(/\s+/g, '_')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const formatFormula = (text: string) => {
    if (!text) return null;
    const regex = /([a-zA-Z\d\)])(\d*[\+\-])|([spdf])(\d+)|([a-zA-Z\)])(\d+)/g;
    const parts: (string | React.ReactNode)[] = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      const charBefore = match[1] || match[3] || match[5];
      parts.push(charBefore);
      const value = match[2] || match[4] || match[6];
      const key = `match-${match.index}`;
      if (match[2] || match[4]) {
        parts.push(<sup key={key} className="text-[0.75em] leading-[0] inline-block align-baseline translate-y-[-0.3em] font-medium">{value}</sup>);
      } else {
        parts.push(<sub key={key} className="text-[0.75em] leading-[0] inline-block align-baseline translate-y-[0.1em] font-medium">{value}</sub>);
      }
      lastIndex = regex.lastIndex;
    }
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }
    if (parts.length === 0) return <span>{text}</span>;
    return parts.map((p, i) => <React.Fragment key={i}>{p}</React.Fragment>);
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-slate-800 text-lg">Ma trận phân bổ câu hỏi</h3>
        <button 
          onClick={downloadAsImage}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-sm transition-all"
        >
          <Download className="w-4 h-4" />
          Tải ảnh Ma Trận
        </button>
      </div>
      
      <div className="overflow-x-auto" ref={containerRef}>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-slate-100 text-slate-700">
              <th className="border border-slate-300 p-2 text-left">Nội dung kiến thức</th>
              <th className="border border-slate-300 p-2 text-center">Nhận biết</th>
              <th className="border border-slate-300 p-2 text-center">Thông hiểu</th>
              <th className="border border-slate-300 p-2 text-center">Vận dụng</th>
              <th className="border border-slate-300 p-2 text-center">Vận dụng cao</th>
              <th className="border border-slate-300 p-2 text-center font-bold">Tổng</th>
            </tr>
          </thead>
          <tbody>
            {data.matrix.map((row, idx) => {
              const rowSum = row.recognition + row.understanding + row.application + row.highApplication;
              return (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  <td className="border border-slate-200 p-2 font-medium">{formatFormula(row.topic)}</td>
                  <td className="border border-slate-200 p-2 text-center">{row.recognition}</td>
                  <td className="border border-slate-200 p-2 text-center">{row.understanding}</td>
                  <td className="border border-slate-200 p-2 text-center">{row.application}</td>
                  <td className="border border-slate-200 p-2 text-center">{row.highApplication}</td>
                  <td className="border border-slate-200 p-2 text-center font-bold">{rowSum}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-slate-100 font-bold">
              <td className="border border-slate-300 p-2">TỔNG CỘNG</td>
              <td className="border border-slate-300 p-2 text-center">{data.matrix.reduce((a, b) => a + b.recognition, 0)}</td>
              <td className="border border-slate-300 p-2 text-center">{data.matrix.reduce((a, b) => a + b.understanding, 0)}</td>
              <td className="border border-slate-300 p-2 text-center">{data.matrix.reduce((a, b) => a + b.application, 0)}</td>
              <td className="border border-slate-300 p-2 text-center">{data.matrix.reduce((a, b) => a + b.highApplication, 0)}</td>
              <td className="border border-slate-300 p-2 text-center">{data.matrix.reduce((a, b) => a + b.recognition + b.understanding + b.application + b.highApplication, 0)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default MatrixRenderer;
