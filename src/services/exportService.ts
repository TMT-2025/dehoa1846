import * as XLSX from 'xlsx';
import { domToPng, domToCanvas } from 'modern-screenshot';
import { jsPDF } from 'jspdf';
import { MatrixData } from '../types/matrix';

export const exportMatrixToExcel = (matrixData: MatrixData) => {
  const tableRows: any[] = [];

  matrixData.rows.forEach((row, idx) => {
    tableRows.push([
      idx + 1, row.content, row.lessonName, row.detailName,
      row.part1.know || '', row.part1.understand || '', row.part1.apply || '',
      row.part2.know || '', row.part2.understand || '', row.part2.apply || '',
      row.part3.know || '', row.part3.understand || '', row.part3.apply || '',
      row.total || '', row.total ? `${((row.total / 40) * 100).toFixed(1)}%` : ''
    ]);

    const isLastInChap = idx === matrixData.rows.length - 1 || matrixData.rows[idx + 1].content !== row.content;
    if (isLastInChap) {
      const chapRows = matrixData.rows.filter(r => r.content === row.content);
      const p1k = chapRows.reduce((s, r) => s + r.part1.know, 0);
      const p1u = chapRows.reduce((s, r) => s + r.part1.understand, 0);
      const p1v = chapRows.reduce((s, r) => s + r.part1.apply, 0);
      const p2k = chapRows.reduce((s, r) => s + r.part2.know, 0);
      const p2u = chapRows.reduce((s, r) => s + r.part2.understand, 0);
      const p2v = chapRows.reduce((s, r) => s + r.part2.apply, 0);
      const p3k = chapRows.reduce((s, r) => s + r.part3.know, 0);
      const p3u = chapRows.reduce((s, r) => s + r.part3.understand, 0);
      const p3v = chapRows.reduce((s, r) => s + r.part3.apply, 0);
      const chapTotal = chapRows.reduce((s, r) => s + r.total, 0);

      tableRows.push([
        '', `[TỔNG CỘNG ${row.content.toUpperCase()}]`, '', '',
        p1k || '', p1u || '', p1v || '',
        p2k || '', p2u || '', p2v || '',
        p3k || '', p3u || '', p3v || '',
        `${chapTotal} lệnh`, `${((chapTotal / 40) * 100).toFixed(1)}%`
      ]);
    }
  });

  const wsData = [
    ['MA TRẬN CHI TIẾT ĐỀ KIỂM TRA HÓA HỌC GDPT 2018'],
    [`LỚP ${matrixData.grade} - ${matrixData.examType}`],
    [`PHẠM VI: ${matrixData.chapters.map(c => c.name).join(', ')}`],
    [],
    ['TT', 'Nội dung', 'Đơn vị kiến thức', 'Mục chi tiết', 'P1-B', 'P1-H', 'P1-V', 'P2-B', 'P2-H', 'P2-V', 'P3-B', 'P3-H', 'P3-V', 'Tổng lệnh', 'Tỉ lệ (%)'],
    ...tableRows,
    [],
    ['Tổng cộng lệnh hỏi toàn đề:', 40],
    ['Tỉ lệ Nhận biết - Thông hiểu - Vận dụng:', '16 (40%) - 12 (30%) - 12 (30%)'],
    ['Yêu cầu bổ sung:', matrixData.extraRequirements || 'Không có']
  ];
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'MaTran');
  XLSX.writeFile(wb, `MaTran_HoaHoc_Lop${matrixData.grade}_${matrixData.examType.replace(/\s+/g, '_')}.xlsx`);
};

export const exportMatrixToImage = async (elementId: string, filename: string): Promise<void> => {
  const element = document.getElementById(elementId);
  if (!element) throw new Error("Không tìm thấy bảng ma trận");
  
  const originalStyle = element.getAttribute('style') || '';
  try {
    element.style.borderRadius = '0';
    element.style.boxShadow = 'none';
    element.style.overflow = 'visible';
    element.style.width = 'fit-content';
    element.style.maxWidth = 'none';
    
    await new Promise(resolve => setTimeout(resolve, 150));
    
    const dataUrl = await domToPng(element, {
      scale: 2,
      backgroundColor: '#ffffff',
      filter: (node) => {
        if (node instanceof HTMLElement && node.classList.contains('no-print')) {
          return false;
        }
        return true;
      }
    });
    
    const link = document.createElement('a');
    link.download = `${filename}.png`;
    link.href = dataUrl;
    link.click();
  } finally {
    if (element) {
      element.setAttribute('style', originalStyle);
    }
  }
};

export const exportMatrixToPDF = async (elementId: string, filename: string): Promise<void> => {
  const element = document.getElementById(elementId);
  if (!element) throw new Error("Không tìm thấy bảng ma trận");
  
  const originalStyle = element.getAttribute('style') || '';
  try {
    element.style.borderRadius = '0';
    element.style.boxShadow = 'none';
    element.style.overflow = 'visible';
    element.style.width = 'fit-content';
    element.style.maxWidth = 'none';
    
    await new Promise(resolve => setTimeout(resolve, 150));
    
    const canvas = await domToCanvas(element, {
      scale: 2,
      backgroundColor: '#ffffff',
      filter: (node) => {
        if (node instanceof HTMLElement && node.classList.contains('no-print')) {
          return false;
        }
        return true;
      }
    });
    
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'px',
      format: [canvas.width, canvas.height]
    });
    
    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
    pdf.save(`${filename}.pdf`);
  } finally {
    if (element) {
      element.setAttribute('style', originalStyle);
    }
  }
};
