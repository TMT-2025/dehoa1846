import * as XLSX from 'xlsx';
import { domToPng, domToCanvas } from 'modern-screenshot';
import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel, Table, TableRow, TableCell, WidthType, BorderStyle, PageOrientation } from "docx";
import saveAs from "file-saver";
import { MatrixData } from '../types/matrix';
import { SpecificationData } from '../types/specification';
import { buildSpecificationFromMatrix } from './specificationService';

export const exportMatrixToExcel = (matrixData: MatrixData, customSpecData?: SpecificationData) => {
  const specData = customSpecData || buildSpecificationFromMatrix(matrixData);
  const hasEssay = specData.hasEssay;
  const baseTotal = specData.standardCommands;

  // ==========================================
  // SHEET 1: MA TRẬN ĐỀ KIỂM TRA ĐỊNH KÌ (CV 7991)
  // ==========================================
  const matrixRows: any[] = [];

  matrixData.rows.forEach((row, idx) => {
    const rowKnow = row.part1.know + row.part2.know + row.part3.know + (row.part4?.know || 0);
    const rowUnderstand = row.part1.understand + row.part2.understand + row.part3.understand + (row.part4?.understand || 0);
    const rowApply = row.part1.apply + row.part2.apply + row.part3.apply + (row.part4?.apply || 0);

    const rowCells: any[] = [
      idx + 1,
      row.content,
      row.lessonName,
      row.detailName,
      // Phần I (Nhiều lựa chọn)
      row.part1.know || '', row.part1.understand || '', row.part1.apply || '',
      // Phần II (Đúng - Sai)
      row.part2.know || '', row.part2.understand || '', row.part2.apply || '',
      // Phần III (Trả lời ngắn)
      row.part3.know || '', row.part3.understand || '', row.part3.apply || ''
    ];

    if (hasEssay) {
      // Phần IV (Tự luận)
      rowCells.push(
        row.part4?.know || '', row.part4?.understand || '', row.part4?.apply || ''
      );
    }

    // Cột Tổng (Biết - Hiểu - Vận dụng) chuẩn CV 7991
    rowCells.push(
      rowKnow || '',
      rowUnderstand || '',
      rowApply || '',
      row.total || '',
      row.total ? `${((row.total / (matrixData.totals.grandTotal || baseTotal)) * 100).toFixed(1)}%` : ''
    );

    matrixRows.push(rowCells);

    // Dòng tổng cộng chương
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
      const p4k = chapRows.reduce((s, r) => s + (r.part4?.know || 0), 0);
      const p4u = chapRows.reduce((s, r) => s + (r.part4?.understand || 0), 0);
      const p4v = chapRows.reduce((s, r) => s + (r.part4?.apply || 0), 0);
      const chapTotal = chapRows.reduce((s, r) => s + r.total, 0);

      const chapK = p1k + p2k + p3k + p4k;
      const chapU = p1u + p2u + p3u + p4u;
      const chapV = p1v + p2v + p3v + p4v;

      const sumCells: any[] = [
        '', `[TỔNG ${row.content.toUpperCase()}]`, '', '',
        p1k || '', p1u || '', p1v || '',
        p2k || '', p2u || '', p2v || '',
        p3k || '', p3u || '', p3v || ''
      ];
      if (hasEssay) {
        sumCells.push(p4k || '', p4u || '', p4v || '');
      }
      sumCells.push(
        chapK || '',
        chapU || '',
        chapV || '',
        `${chapTotal} lệnh`,
        `${((chapTotal / (matrixData.totals.grandTotal || baseTotal)) * 100).toFixed(1)}%`
      );

      matrixRows.push(sumCells);
    }
  });

  const headerColumns = hasEssay
    ? ['TT', 'Chủ đề/Chương', 'Nội dung/đơn vị kiến thức', 'Mục chi tiết', 'P1-Biết', 'P1-Hiểu', 'P1-Vận dụng', 'P2-Biết', 'P2-Hiểu', 'P2-Vận dụng', 'P3-Biết', 'P3-Hiểu', 'P3-Vận dụng', 'P4-Biết (TL)', 'P4-Hiểu (TL)', 'P4-Vận dụng (TL)', 'Tổng-Biết', 'Tổng-Hiểu', 'Tổng-Vận dụng', 'Tổng lệnh', 'Tỉ lệ (%)']
    : ['TT', 'Chủ đề/Chương', 'Nội dung/đơn vị kiến thức', 'Mục chi tiết', 'P1-Biết', 'P1-Hiểu', 'P1-Vận dụng', 'P2-Biết', 'P2-Hiểu', 'P2-Vận dụng', 'P3-Biết', 'P3-Hiểu', 'P3-Vận dụng', 'Tổng-Biết', 'Tổng-Hiểu', 'Tổng-Vận dụng', 'Tổng lệnh', 'Tỉ lệ (%)'];

  const totalPoints = specData.totals.totalPoints;
  const percentages = specData.totals.percentages;

  const footerRow1 = [
    'Tổng số câu hỏi / lệnh hỏi', '', '', '',
    matrixData.totals.part1.know, matrixData.totals.part1.understand, matrixData.totals.part1.apply,
    matrixData.totals.part2.know, matrixData.totals.part2.understand, matrixData.totals.part2.apply,
    matrixData.totals.part3.know, matrixData.totals.part3.understand, matrixData.totals.part3.apply
  ];
  if (hasEssay) {
    footerRow1.push(
      matrixData.totals.part4?.know || 0,
      matrixData.totals.part4?.understand || 0,
      matrixData.totals.part4?.apply || 0
    );
  }
  footerRow1.push(
    matrixData.totals.ratio.know,
    matrixData.totals.ratio.understand,
    matrixData.totals.ratio.apply,
    matrixData.totals.grandTotal,
    '100%'
  );

  const formatPt = (val: number, suffix = 'đ') => {
    if (val === undefined || isNaN(val)) return `0${suffix}`;
    const fixed = val.toFixed(2);
    const formatted = (fixed.endsWith('.00') ? val.toFixed(1) : fixed.endsWith('0') ? val.toFixed(1) : fixed).replace('.', ',');
    return `${formatted}${suffix}`;
  };
  const totalPercent = Math.round((percentages.know + percentages.understand + percentages.apply) * 10) / 10;

  const footerRow2 = [
    'Tổng số điểm', '', '', '',
    formatPt(totalPoints.part1), '', '',
    formatPt(totalPoints.part2), '', '',
    formatPt(totalPoints.part3), '', ''
  ];
  if (hasEssay) {
    footerRow2.push(formatPt(totalPoints.part4 || 0), '', '');
  }
  footerRow2.push(
    formatPt(totalPoints.know),
    formatPt(totalPoints.understand),
    formatPt(totalPoints.apply),
    formatPt(totalPoints.grandTotal ?? 10.0, ' điểm'),
    ''
  );

  const footerRow3 = [
    'Tỉ lệ %', '', '', '',
    `${percentages.part1}%`, '', '',
    `${percentages.part2}%`, '', '',
    `${percentages.part3}%`, '', ''
  ];
  if (hasEssay) {
    footerRow3.push(`${percentages.part4 || 0}%`, '', '');
  }
  footerRow3.push(
    `${percentages.know}%`,
    `${percentages.understand}%`,
    `${percentages.apply}%`,
    `${totalPercent}%`,
    ''
  );

  const ws1Data = [
    ['TRƯỜNG THCS-THPT PHAN VĂN TRỊ - VĨNH LONG'],
    ['1. MA TRẬN ĐỀ KIỂM TRA ĐỊNH KÌ MÔN HÓA HỌC'],
    [`LỚP ${matrixData.grade} - ${matrixData.examType}${hasEssay ? ' (ĐỊNH DẠNG ĐỊNH KÌ CÓ TỰ LUẬN)' : ' (100% TRẮC NGHIỆM)'}`],
    [`Phạm vi: ${matrixData.chapters.map(c => c.name).join(', ')}`],
    [],
    headerColumns,
    ...matrixRows,
    [],
    footerRow1,
    footerRow2,
    footerRow3,
    [],
    ['Yêu cầu bổ sung:', matrixData.extraRequirements || 'Không có']
  ];

  // ==========================================
  // SHEET 2: BẢN ĐẶC TẢ ĐỀ KIỂM TRA ĐỊNH KÌ (CV 7991)
  // ==========================================
  const specHeader = hasEssay
    ? ['TT', 'Chủ đề/Chương', 'Nội dung/đơn vị kiến thức', 'Yêu cầu cần đạt', 'Nhiều lựa chọn (Biết)', 'Nhiều lựa chọn (Hiểu)', 'Nhiều lựa chọn (Vận dụng)', 'Đúng - Sai (Biết)', 'Đúng - Sai (Hiểu)', 'Đúng - Sai (Vận dụng)', 'Trả lời ngắn (Biết)', 'Trả lời ngắn (Hiểu)', 'Trả lời ngắn (Vận dụng)', 'Tự luận (Biết)', 'Tự luận (Hiểu)', 'Tự luận (Vận dụng)', 'Tổng lệnh']
    : ['TT', 'Chủ đề/Chương', 'Nội dung/đơn vị kiến thức', 'Yêu cầu cần đạt', 'Nhiều lựa chọn (Biết)', 'Nhiều lựa chọn (Hiểu)', 'Nhiều lựa chọn (Vận dụng)', 'Đúng - Sai (Biết)', 'Đúng - Sai (Hiểu)', 'Đúng - Sai (Vận dụng)', 'Trả lời ngắn (Biết)', 'Trả lời ngắn (Hiểu)', 'Trả lời ngắn (Vận dụng)', 'Tổng lệnh'];

  const specRows: any[] = [];
  specData.rows.forEach(r => {
    const outcomeText = [
      '- Nhận biết:\n' + (r.outcomes.recognition?.map(x => `+ ${x}`).join('\n') || '+ Nắm vững kiến thức cơ bản.'),
      '- Thông hiểu:\n' + (r.outcomes.understanding?.map(x => `+ ${x}`).join('\n') || '+ Hiểu bản chất và giải thích được hiện tượng.'),
      '- Vận dụng:\n' + (r.outcomes.application?.map(x => `+ ${x}`).join('\n') || '+ Vận dụng giải bài tập và tình huống thực tế.')
    ].join('\n\n');

    const rowItems: any[] = [
      r.index,
      r.chapterName,
      r.lessonName,
      outcomeText,
      r.part1.know || '', r.part1.understand || '', r.part1.apply || '',
      r.part2.know || '', r.part2.understand || '', r.part2.apply || '',
      r.part3.know || '', r.part3.understand || '', r.part3.apply || ''
    ];

    if (hasEssay) {
      rowItems.push(
        r.part4?.know || '', r.part4?.understand || '', r.part4?.apply || ''
      );
    }

    rowItems.push(r.totalCommands || '');
    specRows.push(rowItems);
  });

  const specFooter1 = [
    'Tổng số câu hỏi / lệnh hỏi', '', '', '',
    specData.totals.part1.know, specData.totals.part1.understand, specData.totals.part1.apply,
    specData.totals.part2.know, specData.totals.part2.understand, specData.totals.part2.apply,
    specData.totals.part3.know, specData.totals.part3.understand, specData.totals.part3.apply
  ];
  if (hasEssay) {
    specFooter1.push(
      specData.totals.part4?.know || 0,
      specData.totals.part4?.understand || 0,
      specData.totals.part4?.apply || 0
    );
  }
  specFooter1.push(specData.totals.totalCommands);

  const specFooter2 = [
    'Tổng số điểm', '', '', '',
    formatPt(totalPoints.part1), '', '',
    formatPt(totalPoints.part2), '', '',
    formatPt(totalPoints.part3), '', ''
  ];
  if (hasEssay) {
    specFooter2.push(formatPt(totalPoints.part4 || 0), '', '');
  }
  specFooter2.push(formatPt(totalPoints.grandTotal ?? 10.0, ' điểm'));

  const specFooter3 = [
    'Tỉ lệ %', '', '', '',
    `${percentages.part1}%`, '', '',
    `${percentages.part2}%`, '', '',
    `${percentages.part3}%`, '', ''
  ];
  if (hasEssay) {
    specFooter3.push(`${percentages.part4 || 0}%`, '', '');
  }
  specFooter3.push(`${totalPercent}%`);

  const ws2Data = [
    ['TRƯỜNG THCS-THPT PHAN VĂN TRỊ - VĨNH LONG'],
    ['2. BẢN ĐẶC TẢ ĐỀ KIỂM TRA ĐỊNH KÌ MÔN HÓA HỌC'],
    [`LỚP ${specData.grade} - ${specData.examType}${hasEssay ? ' (CÓ PHẦN TỰ LUẬN)' : ' (100% TRẮC NGHIỆM)'}`],
    [],
    specHeader,
    ...specRows,
    [],
    specFooter1,
    specFooter2,
    specFooter3
  ];

  const wb = XLSX.utils.book_new();
  const ws1 = XLSX.utils.aoa_to_sheet(ws1Data);
  const ws2 = XLSX.utils.aoa_to_sheet(ws2Data);

  XLSX.utils.book_append_sheet(wb, ws1, '1. MaTrận');
  XLSX.utils.book_append_sheet(wb, ws2, '2. BảnĐặcTả');

  const cleanGrade = String(matrixData.grade).replace(/\s+/g, '_');
  const cleanExamType = matrixData.examType.replace(/\s+/g, '_');
  XLSX.writeFile(wb, `MaTran_Va_BanDacTa_HoaHoc_Lop${cleanGrade}_${cleanExamType}.xlsx`);
};

export const exportSpecificationToExcel = (matrixData: MatrixData, specData?: SpecificationData) => {
  exportMatrixToExcel(matrixData, specData);
};

export const downloadMatrixAndSpecDoc = async (matrixData: MatrixData, customSpecData?: SpecificationData) => {
  const specData = customSpecData || buildSpecificationFromMatrix(matrixData);
  const hasEssay = specData.hasEssay;
  const baseTotal = specData.standardCommands;
  const children: any[] = [];

  const noBorder = {
    top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  };

  const borderDef = { style: BorderStyle.SINGLE, size: 1, color: "000000" };
  const tableBorder = {
    top: borderDef,
    bottom: borderDef,
    left: borderDef,
    right: borderDef,
    insideHorizontal: borderDef,
    insideVertical: borderDef
  };

  const formatPt = (val: number, suffix = 'đ') => {
    if (val === undefined || isNaN(val)) return `0${suffix}`;
    const fixed = val.toFixed(2);
    const formatted = (fixed.endsWith('.00') ? val.toFixed(1) : fixed.endsWith('0') ? val.toFixed(1) : fixed).replace('.', ',');
    return `${formatted}${suffix}`;
  };

  const totalPoints = specData.totals.totalPoints;
  const percentages = specData.totals.percentages;
  const totalPercent = Math.round((percentages.know + percentages.understand + percentages.apply) * 10) / 10;

  const cell = (text: string | number, options?: {
    bold?: boolean;
    size?: number;
    alignment?: AlignmentType;
    shading?: string;
    rowSpan?: number;
    columnSpan?: number;
    color?: string;
  }) => {
    const isBold = options?.bold ?? false;
    const size = options?.size ?? 16;
    const alignment = options?.alignment ?? AlignmentType.CENTER;
    const shadingFill = options?.shading ? { fill: options.shading } : undefined;
    
    return new TableCell({
      borders: tableBorder,
      rowSpan: options?.rowSpan,
      columnSpan: options?.columnSpan,
      shading: shadingFill,
      children: [
        new Paragraph({
          alignment,
          spacing: { before: 15, after: 15 },
          children: [
            new TextRun({
              text: String(text !== undefined ? text : ''),
              bold: isBold,
              size,
              color: options?.color
            })
          ]
        })
      ]
    });
  };

  const createNationalHeader = () => new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: noBorder,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            borders: noBorder,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 0, after: 20 },
                children: [new TextRun({ text: "SỞ GIÁO DỤC VÀ ĐÀO TẠO VĨNH LONG", bold: true, size: 20 })]
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 0, after: 40 },
                children: [new TextRun({ text: "TRƯỜNG THCS-THPT PHAN VĂN TRỊ", bold: true, underline: {}, size: 21 })]
              })
            ]
          }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            borders: noBorder,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 0, after: 20 },
                children: [new TextRun({ text: "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM", bold: true, size: 20 })]
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 0, after: 40 },
                children: [new TextRun({ text: "Độc lập - Tự do - Hạnh phúc", bold: true, underline: {}, size: 20 })]
              })
            ]
          })
        ]
      })
    ]
  });

  // ==========================================
  // SECTION 1: MA TRẬN ĐỀ KIỂM TRA ĐỊNH KÌ
  // ==========================================
  children.push(createNationalHeader());

  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 80, after: 40 },
    children: [new TextRun({ text: "TRƯỜNG THCS-THPT PHAN VĂN TRỊ - VĨNH LONG", bold: true, size: 21, color: "334155" })]
  }));

  children.push(new Paragraph({
    text: "1. MA TRẬN ĐỀ KIỂM TRA ĐỊNH KÌ MÔN HÓA HỌC",
    alignment: AlignmentType.CENTER,
    spacing: { before: 30, after: 50 },
    children: [new TextRun({ text: "1. MA TRẬN ĐỀ KIỂM TRA ĐỊNH KÌ MÔN HÓA HỌC", bold: true, size: 25, color: "1E3A8A" })]
  }));

  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 40 },
    children: [
      new TextRun({ 
        text: `LỚP ${matrixData.grade} - ${matrixData.examType.toUpperCase()}${hasEssay ? ' (CÓ PHẦN TỰ LUẬN)' : ' (100% TRẮC NGHIỆM KHÁCH QUAN)'}`,
        bold: true,
        size: 20 
      })
    ]
  }));

  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 30 },
    children: [
      new TextRun({ 
        text: `Phạm vi: ${matrixData.chapters.map(c => c.name).join(', ')}`,
        italics: true,
        size: 18,
        color: "475569"
      })
    ]
  }));

  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 140 },
    children: [
      new TextRun({ 
        text: `Tỉ lệ điểm: Biết ${percentages.know}% (${formatPt(totalPoints.know)}) - Hiểu ${percentages.understand}% (${formatPt(totalPoints.understand)}) - Vận dụng ${percentages.apply}% (${formatPt(totalPoints.apply)}) • Tổng: ${formatPt(totalPoints.grandTotal ?? 10.0, ' điểm')}`,
        bold: true,
        italics: true,
        size: 19,
        color: "3730A3"
      })
    ]
  }));

  // Build Matrix Table in Docx (3-Tier Header matching Web)
  const matrixHeaderRow1 = new TableRow({
    children: [
      cell("TT", { rowSpan: 3, shading: "E2E8F0", bold: true }),
      cell("Chủ đề/Chương", { rowSpan: 3, shading: "E2E8F0", bold: true }),
      cell("Nội dung/đơn vị kiến thức", { rowSpan: 3, shading: "E2E8F0", bold: true }),
      cell("Mục chi tiết nội dung", { rowSpan: 3, shading: "E2E8F0", bold: true }),
      cell("Mức độ đánh giá (Số lệnh hỏi)", { columnSpan: hasEssay ? 12 : 9, shading: "CBD5E1", bold: true }),
      cell("Tổng", { columnSpan: 3, shading: "CBD5E1", bold: true }),
      cell("Tổng lệnh", { rowSpan: 3, shading: "E2E8F0", bold: true }),
      cell("Tỉ lệ %", { rowSpan: 3, shading: "E2E8F0", bold: true })
    ]
  });

  const matrixHeaderRow2 = new TableRow({
    children: [
      cell("Nhiều lựa chọn (P.I)", { columnSpan: 3, shading: "FEF3C7", bold: true }),
      cell("Đúng - Sai (P.II)", { columnSpan: 3, shading: "D1FAE5", bold: true }),
      cell("Trả lời ngắn (P.III)", { columnSpan: 3, shading: "E0E7FF", bold: true }),
      ...(hasEssay ? [cell("Tự luận (P.IV)", { columnSpan: 3, shading: "F3E8FF", bold: true })] : []),
      cell("Biết", { rowSpan: 2, shading: "E2E8F0", bold: true }),
      cell("Hiểu", { rowSpan: 2, shading: "E2E8F0", bold: true }),
      cell("Vận dụng", { rowSpan: 2, shading: "E2E8F0", bold: true })
    ]
  });

  const matrixHeaderRow3 = new TableRow({
    children: [
      cell("B", { shading: "FFFBEB", bold: true }), cell("H", { shading: "FFFBEB", bold: true }), cell("V", { shading: "FFFBEB", bold: true }),
      cell("B", { shading: "ECFDF5", bold: true }), cell("H", { shading: "ECFDF5", bold: true }), cell("V", { shading: "ECFDF5", bold: true }),
      cell("B", { shading: "EEF2FF", bold: true }), cell("H", { shading: "EEF2FF", bold: true }), cell("V", { shading: "EEF2FF", bold: true }),
      ...(hasEssay ? [
        cell("B", { shading: "FAF5FF", bold: true }), cell("H", { shading: "FAF5FF", bold: true }), cell("V", { shading: "FAF5FF", bold: true })
      ] : [])
    ]
  });

  // Group rows by chapter
  const matrixRowsDocx: TableRow[] = [];
  const chaptersMap = new Map<string, typeof matrixData.rows>();
  matrixData.rows.forEach(r => {
    if (!chaptersMap.has(r.content)) {
      chaptersMap.set(r.content, []);
    }
    chaptersMap.get(r.content)!.push(r);
  });

  let globalRowIdx = 1;
  chaptersMap.forEach((cRows, chapterName) => {
    let chapP1K = 0, chapP1U = 0, chapP1A = 0;
    let chapP2K = 0, chapP2U = 0, chapP2A = 0;
    let chapP3K = 0, chapP3U = 0, chapP3A = 0;
    let chapP4K = 0, chapP4U = 0, chapP4A = 0;
    let chapTotalCmds = 0;

    cRows.forEach(r => {
      chapP1K += r.part1.know; chapP1U += r.part1.understand; chapP1A += r.part1.apply;
      chapP2K += r.part2.know; chapP2U += r.part2.understand; chapP2A += r.part2.apply;
      chapP3K += r.part3.know; chapP3U += r.part3.understand; chapP3A += r.part3.apply;
      if (r.part4) {
        chapP4K += r.part4.know; chapP4U += r.part4.understand; chapP4A += r.part4.apply;
      }
      chapTotalCmds += r.total;

      const rKnow = r.part1.know + r.part2.know + r.part3.know + (r.part4?.know || 0);
      const rUnderstand = r.part1.understand + r.part2.understand + r.part3.understand + (r.part4?.understand || 0);
      const rApply = r.part1.apply + r.part2.apply + r.part3.apply + (r.part4?.apply || 0);
      const pctStr = r.total ? `${((r.total / (matrixData.totals.grandTotal || baseTotal)) * 100).toFixed(1)}%` : '';

      const cells = [
        cell(globalRowIdx++),
        cell(r.content, { alignment: AlignmentType.LEFT }),
        cell(r.lessonName, { alignment: AlignmentType.LEFT }),
        cell(r.detailName, { alignment: AlignmentType.LEFT }),
        cell(r.part1.know || ''), cell(r.part1.understand || ''), cell(r.part1.apply || ''),
        cell(r.part2.know || ''), cell(r.part2.understand || ''), cell(r.part2.apply || ''),
        cell(r.part3.know || ''), cell(r.part3.understand || ''), cell(r.part3.apply || '')
      ];
      if (hasEssay) {
        cells.push(
          cell(r.part4?.know || ''),
          cell(r.part4?.understand || ''),
          cell(r.part4?.apply || '')
        );
      }
      cells.push(
        cell(rKnow || ''),
        cell(rUnderstand || ''),
        cell(rApply || ''),
        cell(r.total || '', { bold: true }),
        cell(pctStr)
      );

      matrixRowsDocx.push(new TableRow({ children: cells }));
    });

    // Chapter summary row
    const chapK = chapP1K + chapP2K + chapP3K + chapP4K;
    const chapU = chapP1U + chapP2U + chapP3U + chapP4U;
    const chapA = chapP1A + chapP2A + chapP3A + chapP4A;
    const chapPct = `${((chapTotalCmds / (matrixData.totals.grandTotal || baseTotal)) * 100).toFixed(1)}%`;

    const summaryCells = [
      cell(`Tổng cộng ${chapterName}`, { columnSpan: 4, bold: true, alignment: AlignmentType.RIGHT, shading: 'EEF2FF', color: '1E1B4B' }),
      cell(chapP1K || '', { bold: true, shading: 'EEF2FF' }),
      cell(chapP1U || '', { bold: true, shading: 'EEF2FF' }),
      cell(chapP1A || '', { bold: true, shading: 'EEF2FF' }),
      cell(chapP2K || '', { bold: true, shading: 'EEF2FF' }),
      cell(chapP2U || '', { bold: true, shading: 'EEF2FF' }),
      cell(chapP2A || '', { bold: true, shading: 'EEF2FF' }),
      cell(chapP3K || '', { bold: true, shading: 'EEF2FF' }),
      cell(chapP3U || '', { bold: true, shading: 'EEF2FF' }),
      cell(chapP3A || '', { bold: true, shading: 'EEF2FF' })
    ];
    if (hasEssay) {
      summaryCells.push(
        cell(chapP4K || '', { bold: true, shading: 'EEF2FF' }),
        cell(chapP4U || '', { bold: true, shading: 'EEF2FF' }),
        cell(chapP4A || '', { bold: true, shading: 'EEF2FF' })
      );
    }
    summaryCells.push(
      cell(chapK || '', { bold: true, shading: 'EEF2FF' }),
      cell(chapU || '', { bold: true, shading: 'EEF2FF' }),
      cell(chapA || '', { bold: true, shading: 'EEF2FF' }),
      cell(`${chapTotalCmds} lệnh`, { bold: true, shading: 'E0E7FF' }),
      cell(chapPct, { bold: true, shading: 'E0E7FF' })
    );

    matrixRowsDocx.push(new TableRow({ children: summaryCells }));
  });

  // Footer 1: Tổng số câu hỏi / lệnh hỏi
  const f1Cells = [
    cell('Tổng số câu hỏi / lệnh hỏi', { columnSpan: 4, bold: true, shading: 'CBD5E1', color: '0F172A' }),
    cell(matrixData.totals.part1.know, { bold: true, shading: 'CBD5E1' }),
    cell(matrixData.totals.part1.understand, { bold: true, shading: 'CBD5E1' }),
    cell(matrixData.totals.part1.apply, { bold: true, shading: 'CBD5E1' }),
    cell(matrixData.totals.part2.know, { bold: true, shading: 'CBD5E1' }),
    cell(matrixData.totals.part2.understand, { bold: true, shading: 'CBD5E1' }),
    cell(matrixData.totals.part2.apply, { bold: true, shading: 'CBD5E1' }),
    cell(matrixData.totals.part3.know, { bold: true, shading: 'CBD5E1' }),
    cell(matrixData.totals.part3.understand, { bold: true, shading: 'CBD5E1' }),
    cell(matrixData.totals.part3.apply, { bold: true, shading: 'CBD5E1' })
  ];
  if (hasEssay) {
    f1Cells.push(
      cell(matrixData.totals.part4?.know || 0, { bold: true, shading: 'CBD5E1' }),
      cell(matrixData.totals.part4?.understand || 0, { bold: true, shading: 'CBD5E1' }),
      cell(matrixData.totals.part4?.apply || 0, { bold: true, shading: 'CBD5E1' })
    );
  }
  f1Cells.push(
    cell(matrixData.totals.ratio.know, { bold: true, shading: 'CBD5E1' }),
    cell(matrixData.totals.ratio.understand, { bold: true, shading: 'CBD5E1' }),
    cell(matrixData.totals.ratio.apply, { bold: true, shading: 'CBD5E1' }),
    cell(matrixData.totals.grandTotal, { bold: true, shading: 'CBD5E1' }),
    cell('100%', { bold: true, shading: 'CBD5E1' })
  );

  // Footer 2: Tổng số điểm
  const f2Cells = [
    cell('Tổng số điểm', { columnSpan: 4, bold: true, shading: 'E2E8F0', color: '0F172A' }),
    cell(formatPt(totalPoints.part1), { columnSpan: 3, bold: true, shading: 'E2E8F0' }),
    cell(formatPt(totalPoints.part2), { columnSpan: 3, bold: true, shading: 'E2E8F0' }),
    cell(formatPt(totalPoints.part3), { columnSpan: 3, bold: true, shading: 'E2E8F0' })
  ];
  if (hasEssay) {
    f2Cells.push(cell(formatPt(totalPoints.part4 || 0), { columnSpan: 3, bold: true, shading: 'E2E8F0' }));
  }
  f2Cells.push(
    cell(formatPt(totalPoints.know), { bold: true, shading: 'E2E8F0' }),
    cell(formatPt(totalPoints.understand), { bold: true, shading: 'E2E8F0' }),
    cell(formatPt(totalPoints.apply), { bold: true, shading: 'E2E8F0' }),
    cell(formatPt(totalPoints.grandTotal ?? 10.0, ' điểm'), { bold: true, shading: 'E0E7FF', color: '3730A3' }),
    cell('', { shading: 'E2E8F0' })
  );

  // Footer 3: Tỉ lệ % điểm
  const f3Cells = [
    cell('Tỉ lệ % điểm', { columnSpan: 4, bold: true, shading: 'F1F5F9', color: '0F172A' }),
    cell(`${percentages.part1}%`, { columnSpan: 3, bold: true, shading: 'F1F5F9' }),
    cell(`${percentages.part2}%`, { columnSpan: 3, bold: true, shading: 'F1F5F9' }),
    cell(`${percentages.part3}%`, { columnSpan: 3, bold: true, shading: 'F1F5F9' })
  ];
  if (hasEssay) {
    f3Cells.push(cell(`${percentages.part4 || 0}%`, { columnSpan: 3, bold: true, shading: 'F1F5F9' }));
  }
  f3Cells.push(
    cell(`${percentages.know}%`, { bold: true, shading: 'F1F5F9' }),
    cell(`${percentages.understand}%`, { bold: true, shading: 'F1F5F9' }),
    cell(`${percentages.apply}%`, { bold: true, shading: 'F1F5F9' }),
    cell(`${totalPercent}%`, { bold: true, shading: 'E0E7FF', color: '3730A3' }),
    cell('', { shading: 'F1F5F9' })
  );

  children.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: tableBorder,
    rows: [
      matrixHeaderRow1,
      matrixHeaderRow2,
      matrixHeaderRow3,
      ...matrixRowsDocx,
      new TableRow({ children: f1Cells }),
      new TableRow({ children: f2Cells }),
      new TableRow({ children: f3Cells })
    ]
  }));

  // ==========================================
  // SECTION 2: BẢN ĐẶC TẢ ĐỀ KIỂM TRA ĐỊNH KÌ
  // ==========================================
  children.push(new Paragraph({ pageBreakBefore: true }));
  children.push(createNationalHeader());

  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 80, after: 40 },
    children: [new TextRun({ text: "TRƯỜNG THCS-THPT PHAN VĂN TRỊ - VĨNH LONG", bold: true, size: 21, color: "334155" })]
  }));

  children.push(new Paragraph({
    text: "2. BẢN ĐẶC TẢ ĐỀ KIỂM TRA ĐỊNH KÌ MÔN HÓA HỌC",
    alignment: AlignmentType.CENTER,
    spacing: { before: 30, after: 50 },
    children: [new TextRun({ text: "2. BẢN ĐẶC TẢ ĐỀ KIỂM TRA ĐỊNH KÌ MÔN HÓA HỌC", bold: true, size: 25, color: "1E3A8A" })]
  }));

  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 40 },
    children: [
      new TextRun({ 
        text: `LỚP ${specData.grade} - ${specData.examType.toUpperCase()}${hasEssay ? ' (CÓ PHẦN TỰ LUẬN)' : ' (100% TRẮC NGHIỆM KHÁCH QUAN)'}`,
        bold: true,
        size: 20 
      })
    ]
  }));

  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 140 },
    children: [
      new TextRun({ 
        text: `Tỉ lệ điểm: Biết ${percentages.know}% (${formatPt(totalPoints.know)}) - Hiểu ${percentages.understand}% (${formatPt(totalPoints.understand)}) - Vận dụng ${percentages.apply}% (${formatPt(totalPoints.apply)}) • Tổng: ${formatPt(totalPoints.grandTotal ?? 10.0, ' điểm')}`,
        bold: true,
        italics: true,
        size: 19,
        color: "3730A3"
      })
    ]
  }));

  const specHeaderRow1 = new TableRow({
    children: [
      cell("TT", { rowSpan: 2, shading: "CBD5E1", bold: true }),
      cell("Chủ đề / Chương", { rowSpan: 2, shading: "CBD5E1", bold: true }),
      cell("Nội dung kiến thức", { rowSpan: 2, shading: "CBD5E1", bold: true }),
      cell("Yêu cầu cần đạt", { rowSpan: 2, shading: "CBD5E1", bold: true }),
      cell("Nhiều lựa chọn (P.I)", { columnSpan: 3, shading: "FEF3C7", bold: true }),
      cell("Đúng - Sai (P.II)", { columnSpan: 3, shading: "D1FAE5", bold: true }),
      cell("Trả lời ngắn (P.III)", { columnSpan: 3, shading: "E0E7FF", bold: true }),
      ...(hasEssay ? [cell("Tự luận (P.IV)", { columnSpan: 3, shading: "F3E8FF", bold: true })] : []),
      cell("Tổng lệnh", { rowSpan: 2, shading: "CBD5E1", bold: true })
    ]
  });

  const specHeaderRow2 = new TableRow({
    children: [
      cell("B", { shading: "FFFBEB", bold: true }), cell("H", { shading: "FFFBEB", bold: true }), cell("V", { shading: "FFFBEB", bold: true }),
      cell("B", { shading: "ECFDF5", bold: true }), cell("H", { shading: "ECFDF5", bold: true }), cell("V", { shading: "ECFDF5", bold: true }),
      cell("B", { shading: "EEF2FF", bold: true }), cell("H", { shading: "EEF2FF", bold: true }), cell("V", { shading: "EEF2FF", bold: true }),
      ...(hasEssay ? [
        cell("B", { shading: "FAF5FF", bold: true }), cell("H", { shading: "FAF5FF", bold: true }), cell("V", { shading: "FAF5FF", bold: true })
      ] : [])
    ]
  });

  const specRowsDocx: TableRow[] = specData.rows.map(r => {
    const outcomeParagraphs: Paragraph[] = [];
    if (r.outcomes.recognition?.length) {
      outcomeParagraphs.push(new Paragraph({
        spacing: { before: 15, after: 5 },
        children: [new TextRun({ text: "- Nhận biết:", bold: true, size: 16, color: "1E293B" })]
      }));
      r.outcomes.recognition.forEach(o => outcomeParagraphs.push(new Paragraph({
        spacing: { before: 0, after: 5 },
        children: [new TextRun({ text: `+ ${o}`, size: 16, color: "334155" })]
      })));
    }
    if (r.outcomes.understanding?.length) {
      outcomeParagraphs.push(new Paragraph({
        spacing: { before: 15, after: 5 },
        children: [new TextRun({ text: "- Thông hiểu:", bold: true, size: 16, color: "1E293B" })]
      }));
      r.outcomes.understanding.forEach(o => outcomeParagraphs.push(new Paragraph({
        spacing: { before: 0, after: 5 },
        children: [new TextRun({ text: `+ ${o}`, size: 16, color: "334155" })]
      })));
    }
    if (r.outcomes.application?.length) {
      outcomeParagraphs.push(new Paragraph({
        spacing: { before: 15, after: 5 },
        children: [new TextRun({ text: "- Vận dụng:", bold: true, size: 16, color: "1E293B" })]
      }));
      r.outcomes.application.forEach(o => outcomeParagraphs.push(new Paragraph({
        spacing: { before: 0, after: 5 },
        children: [new TextRun({ text: `+ ${o}`, size: 16, color: "334155" })]
      })));
    }

    const rowCells = [
      cell(r.index),
      cell(r.chapterName, { bold: true, alignment: AlignmentType.LEFT }),
      cell(r.lessonName, { bold: true, alignment: AlignmentType.LEFT }),
      new TableCell({
        borders: tableBorder,
        children: outcomeParagraphs.length ? outcomeParagraphs : [new Paragraph({ children: [new TextRun({ text: "Kiến thức bài học.", size: 16 })] })]
      }),
      cell(r.part1.know || ''), cell(r.part1.understand || ''), cell(r.part1.apply || ''),
      cell(r.part2.know || ''), cell(r.part2.understand || ''), cell(r.part2.apply || ''),
      cell(r.part3.know || ''), cell(r.part3.understand || ''), cell(r.part3.apply || '')
    ];
    if (hasEssay) {
      rowCells.push(
        cell(r.part4?.know || ''),
        cell(r.part4?.understand || ''),
        cell(r.part4?.apply || '')
      );
    }
    rowCells.push(cell(r.totalCommands || '', { bold: true }));

    return new TableRow({ children: rowCells });
  });

  const specF1 = [
    cell('Tổng số câu hỏi / lệnh hỏi', { columnSpan: 4, bold: true, shading: 'CBD5E1', color: '0F172A' }),
    cell(specData.totals.part1.know, { bold: true, shading: 'CBD5E1' }),
    cell(specData.totals.part1.understand, { bold: true, shading: 'CBD5E1' }),
    cell(specData.totals.part1.apply, { bold: true, shading: 'CBD5E1' }),
    cell(specData.totals.part2.know, { bold: true, shading: 'CBD5E1' }),
    cell(specData.totals.part2.understand, { bold: true, shading: 'CBD5E1' }),
    cell(specData.totals.part2.apply, { bold: true, shading: 'CBD5E1' }),
    cell(specData.totals.part3.know, { bold: true, shading: 'CBD5E1' }),
    cell(specData.totals.part3.understand, { bold: true, shading: 'CBD5E1' }),
    cell(specData.totals.part3.apply, { bold: true, shading: 'CBD5E1' })
  ];
  if (hasEssay) {
    specF1.push(
      cell(specData.totals.part4?.know || 0, { bold: true, shading: 'CBD5E1' }),
      cell(specData.totals.part4?.understand || 0, { bold: true, shading: 'CBD5E1' }),
      cell(specData.totals.part4?.apply || 0, { bold: true, shading: 'CBD5E1' })
    );
  }
  specF1.push(cell(specData.totals.totalCommands, { bold: true, shading: 'CBD5E1' }));

  const specF2 = [
    cell('Tổng số điểm', { columnSpan: 4, bold: true, shading: 'E2E8F0', color: '0F172A' }),
    cell(formatPt(totalPoints.part1), { columnSpan: 3, bold: true, shading: 'E2E8F0' }),
    cell(formatPt(totalPoints.part2), { columnSpan: 3, bold: true, shading: 'E2E8F0' }),
    cell(formatPt(totalPoints.part3), { columnSpan: 3, bold: true, shading: 'E2E8F0' })
  ];
  if (hasEssay) {
    specF2.push(cell(formatPt(totalPoints.part4 || 0), { columnSpan: 3, bold: true, shading: 'E2E8F0' }));
  }
  specF2.push(cell(formatPt(totalPoints.grandTotal ?? 10.0, ' điểm'), { bold: true, shading: 'E0E7FF', color: '3730A3' }));

  const specF3 = [
    cell('Tỉ lệ %', { columnSpan: 4, bold: true, shading: 'F1F5F9', color: '0F172A' }),
    cell(`${percentages.part1}%`, { columnSpan: 3, bold: true, shading: 'F1F5F9' }),
    cell(`${percentages.part2}%`, { columnSpan: 3, bold: true, shading: 'F1F5F9' }),
    cell(`${percentages.part3}%`, { columnSpan: 3, bold: true, shading: 'F1F5F9' })
  ];
  if (hasEssay) {
    specF3.push(cell(`${percentages.part4 || 0}%`, { columnSpan: 3, bold: true, shading: 'F1F5F9' }));
  }
  specF3.push(cell(`${totalPercent}%`, { bold: true, shading: 'E0E7FF', color: '3730A3' }));

  children.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: tableBorder,
    rows: [
      specHeaderRow1,
      specHeaderRow2,
      ...specRowsDocx,
      new TableRow({ children: specF1 }),
      new TableRow({ children: specF2 }),
      new TableRow({ children: specF3 })
    ]
  }));

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          size: {
            orientation: PageOrientation.LANDSCAPE,
            width: 16838,
            height: 11906
          },
          margin: { top: 720, bottom: 720, left: 720, right: 720 }
        }
      },
      children
    }]
  });

  const blob = await Packer.toBlob(doc);
  const cleanGrade = String(matrixData.grade).replace(/\s+/g, '_');
  const cleanExamType = matrixData.examType.replace(/\s+/g, '_');
  saveAs(blob, `MaTran_Va_BanDacTa_HoaHoc_Lop${cleanGrade}_${cleanExamType}.docx`);
};

export const exportMatrixToImage = async (elementId: string, filename: string): Promise<void> => {
  const element = document.getElementById(elementId);
  if (!element) throw new Error(`Không tìm thấy bảng để xuất ảnh: ${elementId}`);
  
  const originalStyle = element.getAttribute('style') || '';
  try {
    element.style.borderRadius = '0';
    element.style.boxShadow = 'none';
    element.style.overflow = 'visible';
    element.style.width = 'fit-content';
    element.style.maxWidth = 'none';
    
    await new Promise(resolve => setTimeout(resolve, 200));
    
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
  if (!element) throw new Error(`Không tìm thấy bảng để xuất PDF: ${elementId}`);
  
  const originalStyle = element.getAttribute('style') || '';
  try {
    element.style.borderRadius = '0';
    element.style.boxShadow = 'none';
    element.style.overflow = 'visible';
    element.style.width = 'fit-content';
    element.style.maxWidth = 'none';
    
    await new Promise(resolve => setTimeout(resolve, 200));
    
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
