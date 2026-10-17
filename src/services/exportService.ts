import * as XLSX from 'xlsx';
import { domToPng, domToCanvas } from 'modern-screenshot';
import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel, Table, TableRow, TableCell, WidthType, BorderStyle } from "docx";
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

  const footerRow2 = [
    'Tổng số điểm', '', '', '',
    `${totalPoints.part1.toFixed(1)}đ`, '', '',
    `${totalPoints.part2.toFixed(1)}đ`, '', '',
    `${totalPoints.part3.toFixed(1)}đ`, '', ''
  ];
  if (hasEssay) {
    footerRow2.push(`${(totalPoints.part4 || 3.0).toFixed(1)}đ`, '', '');
  }
  footerRow2.push(
    `${totalPoints.know.toFixed(1)}đ`,
    `${totalPoints.understand.toFixed(1)}đ`,
    `${totalPoints.apply.toFixed(1)}đ`,
    '10.0 điểm',
    ''
  );

  const footerRow3 = [
    'Tỉ lệ %', '', '', '',
    `${percentages.part1}%`, '', '',
    `${percentages.part2}%`, '', '',
    `${percentages.part3}%`, '', ''
  ];
  if (hasEssay) {
    footerRow3.push(`${percentages.part4 || 30}%`, '', '');
  }
  footerRow3.push(
    `${percentages.know}%`,
    `${percentages.understand}%`,
    `${percentages.apply}%`,
    '100%',
    ''
  );

  const ws1Data = [
    ['BỘ GIÁO DỤC VÀ ĐÀO TẠO - CÔNG VĂN SỐ 7991/BGDĐT-GDTrH'],
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
    `${totalPoints.part1.toFixed(1)}đ`, '', '',
    `${totalPoints.part2.toFixed(1)}đ`, '', '',
    `${totalPoints.part3.toFixed(1)}đ`, '', ''
  ];
  if (hasEssay) {
    specFooter2.push(`${(totalPoints.part4 || 3.0).toFixed(1)}đ`, '', '');
  }
  specFooter2.push('10.0 điểm');

  const specFooter3 = [
    'Tỉ lệ %', '', '', '',
    `${percentages.part1}%`, '', '',
    `${percentages.part2}%`, '', '',
    `${percentages.part3}%`, '', ''
  ];
  if (hasEssay) {
    specFooter3.push(`${percentages.part4 || 30}%`, '', '');
  }
  specFooter3.push('100%');

  const ws2Data = [
    ['BỘ GIÁO DỤC VÀ ĐÀO TẠO - CÔNG VĂN SỐ 7991/BGDĐT-GDTrH'],
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
  const children: any[] = [];

  const noBorder = {
    top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  };

  const tableBorder = {
    top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
    bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
    left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
    right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
  };

  // Header Table
  children.push(new Table({
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
                children: [new TextRun({ text: "SỞ GIÁO DỤC VÀ ĐÀO TẠO VĨNH LONG", bold: true, size: 21 })]
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: "TRƯỜNG THCS-THPT PHAN VĂN TRỊ", bold: true, underline: {}, size: 22 })]
              })
            ]
          }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            borders: noBorder,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM", bold: true, size: 21 })]
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: "Độc lập - Tự do - Hạnh phúc", bold: true, underline: {}, size: 21 })]
              })
            ]
          })
        ]
      })
    ]
  }));

  children.push(new Paragraph({
    text: `KÈM THEO CÔNG VĂN SỐ 7991/BGDĐT-GDTrH CỦA BỘ GD&ĐT`,
    alignment: AlignmentType.CENTER,
    spacing: { before: 150, after: 150 },
    children: [new TextRun({ text: "KÈM THEO CÔNG VĂN SỐ 7991/BGDĐT-GDTrH CỦA BỘ GD&ĐT", italics: true, size: 20 })]
  }));

  // SECTION 1: MA TRẬN
  children.push(new Paragraph({
    text: "1. MA TRẬN ĐỀ KIỂM TRA ĐỊNH KÌ",
    heading: HeadingLevel.HEADING_1,
    alignment: AlignmentType.CENTER,
    spacing: { before: 200, after: 100 },
  }));

  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [
      new TextRun({ 
        text: `Môn: Hóa Học - Lớp ${matrixData.grade} (${matrixData.examType.toUpperCase()})` + (hasEssay ? " - CÓ PHẦN TỰ LUẬN" : ""),
        bold: true,
        size: 22 
      })
    ],
    spacing: { before: 50, after: 200 }
  }));

  // Build Matrix Table in Docx
  const matrixHeaderRow1 = new TableRow({
    children: [
      new TableCell({ children: [new Paragraph({ text: "TT", alignment: AlignmentType.CENTER })], borders: tableBorder }),
      new TableCell({ children: [new Paragraph({ text: "Chủ đề / Chương", alignment: AlignmentType.CENTER })], borders: tableBorder }),
      new TableCell({ children: [new Paragraph({ text: "Nội dung / đơn vị kiến thức", alignment: AlignmentType.CENTER })], borders: tableBorder }),
      new TableCell({ children: [new Paragraph({ text: "Nhiều lựa chọn (P.I)", alignment: AlignmentType.CENTER })], borders: tableBorder }),
      new TableCell({ children: [new Paragraph({ text: "Đúng - Sai (P.II)", alignment: AlignmentType.CENTER })], borders: tableBorder }),
      new TableCell({ children: [new Paragraph({ text: "Trả lời ngắn (P.III)", alignment: AlignmentType.CENTER })], borders: tableBorder }),
      ...(hasEssay ? [new TableCell({ children: [new Paragraph({ text: "Tự luận (P.IV)", alignment: AlignmentType.CENTER })], borders: tableBorder })] : []),
      new TableCell({ children: [new Paragraph({ text: "Tổng lệnh", alignment: AlignmentType.CENTER })], borders: tableBorder }),
      new TableCell({ children: [new Paragraph({ text: "Tỉ lệ %", alignment: AlignmentType.CENTER })], borders: tableBorder })
    ]
  });

  const matrixBodyRows: TableRow[] = specData.rows.map(r => {
    const p1Text = `B:${r.part1.know} H:${r.part1.understand} V:${r.part1.apply}`;
    const p2Text = `B:${r.part2.know} H:${r.part2.understand} V:${r.part2.apply}`;
    const p3Text = `B:${r.part3.know} H:${r.part3.understand} V:${r.part3.apply}`;
    const p4Text = r.part4 ? `B:${r.part4.know} H:${r.part4.understand} V:${r.part4.apply}` : '';

    return new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ text: String(r.index), alignment: AlignmentType.CENTER })], borders: tableBorder }),
        new TableCell({ children: [new Paragraph({ text: r.chapterName })], borders: tableBorder }),
        new TableCell({ children: [new Paragraph({ text: r.lessonName })], borders: tableBorder }),
        new TableCell({ children: [new Paragraph({ text: p1Text, alignment: AlignmentType.CENTER })], borders: tableBorder }),
        new TableCell({ children: [new Paragraph({ text: p2Text, alignment: AlignmentType.CENTER })], borders: tableBorder }),
        new TableCell({ children: [new Paragraph({ text: p3Text, alignment: AlignmentType.CENTER })], borders: tableBorder }),
        ...(hasEssay ? [new TableCell({ children: [new Paragraph({ text: p4Text, alignment: AlignmentType.CENTER })], borders: tableBorder })] : []),
        new TableCell({ children: [new Paragraph({ text: String(r.totalCommands), alignment: AlignmentType.CENTER })], borders: tableBorder }),
        new TableCell({ children: [new Paragraph({ text: `${((r.totalCommands / specData.totals.totalCommands) * 100).toFixed(1)}%`, alignment: AlignmentType.CENTER })], borders: tableBorder })
      ]
    });
  });

  children.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: tableBorder,
    rows: [matrixHeaderRow1, ...matrixBodyRows]
  }));

  // Summary note
  children.push(new Paragraph({
    text: `Tổng số lệnh: ${specData.totals.totalCommands} lệnh (10.0 điểm). Tỉ lệ: Biết ${specData.totals.percentages.know}% - Hiểu ${specData.totals.percentages.understand}% - Vận dụng ${specData.totals.percentages.apply}%.`,
    spacing: { before: 120, after: 300 },
    children: [new TextRun({ 
      text: `Tổng số: ${specData.totals.totalCommands} lệnh (10.0 điểm). Tỉ lệ: Biết ${specData.totals.percentages.know}% - Hiểu ${specData.totals.percentages.understand}% - Vận dụng ${specData.totals.percentages.apply}%.`,
      bold: true,
      italics: true,
      size: 20
    })]
  }));

  // SECTION 2: BẢN ĐẶC TẢ
  children.push(new Paragraph({
    text: "2. BẢN ĐẶC TẢ ĐỀ KIỂM TRA ĐỊNH KÌ",
    heading: HeadingLevel.HEADING_1,
    alignment: AlignmentType.CENTER,
    spacing: { before: 300, after: 150 },
  }));

  const specHeaderDocx = new TableRow({
    children: [
      new TableCell({ children: [new Paragraph({ text: "TT", alignment: AlignmentType.CENTER })], borders: tableBorder }),
      new TableCell({ children: [new Paragraph({ text: "Chủ đề / Chương", alignment: AlignmentType.CENTER })], borders: tableBorder }),
      new TableCell({ children: [new Paragraph({ text: "Nội dung kiến thức", alignment: AlignmentType.CENTER })], borders: tableBorder }),
      new TableCell({ children: [new Paragraph({ text: "Yêu cầu cần đạt", alignment: AlignmentType.CENTER })], borders: tableBorder }),
      new TableCell({ children: [new Paragraph({ text: "P.I (MCQ)", alignment: AlignmentType.CENTER })], borders: tableBorder }),
      new TableCell({ children: [new Paragraph({ text: "P.II (Đ/S)", alignment: AlignmentType.CENTER })], borders: tableBorder }),
      new TableCell({ children: [new Paragraph({ text: "P.III (SA)", alignment: AlignmentType.CENTER })], borders: tableBorder }),
      ...(hasEssay ? [new TableCell({ children: [new Paragraph({ text: "P.IV (TL)", alignment: AlignmentType.CENTER })], borders: tableBorder })] : [])
    ]
  });

  const specRowsDocx: TableRow[] = specData.rows.map(r => {
    const outcomeParagraphs: Paragraph[] = [];
    if (r.outcomes.recognition?.length) {
      outcomeParagraphs.push(new Paragraph({ children: [new TextRun({ text: "- Nhận biết:", bold: true })] }));
      r.outcomes.recognition.forEach(o => outcomeParagraphs.push(new Paragraph({ children: [new TextRun({ text: `+ ${o}` })] })));
    }
    if (r.outcomes.understanding?.length) {
      outcomeParagraphs.push(new Paragraph({ children: [new TextRun({ text: "- Thông hiểu:", bold: true })] }));
      r.outcomes.understanding.forEach(o => outcomeParagraphs.push(new Paragraph({ children: [new TextRun({ text: `+ ${o}` })] })));
    }
    if (r.outcomes.application?.length) {
      outcomeParagraphs.push(new Paragraph({ children: [new TextRun({ text: "- Vận dụng:", bold: true })] }));
      r.outcomes.application.forEach(o => outcomeParagraphs.push(new Paragraph({ children: [new TextRun({ text: `+ ${o}` })] })));
    }

    const p1Summary = `B:${r.part1.know} H:${r.part1.understand} V:${r.part1.apply}`;
    const p2Summary = `B:${r.part2.know} H:${r.part2.understand} V:${r.part2.apply}`;
    const p3Summary = `B:${r.part3.know} H:${r.part3.understand} V:${r.part3.apply}`;
    const p4Summary = r.part4 ? `B:${r.part4.know} H:${r.part4.understand} V:${r.part4.apply}` : '';

    return new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ text: String(r.index), alignment: AlignmentType.CENTER })], borders: tableBorder }),
        new TableCell({ children: [new Paragraph({ text: r.chapterName, bold: true })], borders: tableBorder }),
        new TableCell({ children: [new Paragraph({ text: r.lessonName, bold: true })], borders: tableBorder }),
        new TableCell({ children: outcomeParagraphs.length ? outcomeParagraphs : [new Paragraph({ text: "Kiến thức bài học." })], borders: tableBorder }),
        new TableCell({ children: [new Paragraph({ text: p1Summary, alignment: AlignmentType.CENTER })], borders: tableBorder }),
        new TableCell({ children: [new Paragraph({ text: p2Summary, alignment: AlignmentType.CENTER })], borders: tableBorder }),
        new TableCell({ children: [new Paragraph({ text: p3Summary, alignment: AlignmentType.CENTER })], borders: tableBorder }),
        ...(hasEssay ? [new TableCell({ children: [new Paragraph({ text: p4Summary, alignment: AlignmentType.CENTER })], borders: tableBorder })] : [])
      ]
    });
  });

  children.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: tableBorder,
    rows: [specHeaderDocx, ...specRowsDocx]
  }));

  const doc = new Document({
    sections: [{
      properties: {
        page: {
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
