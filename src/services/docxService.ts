import { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel, Table, TableRow, TableCell, WidthType, BorderStyle } from "docx";
import saveAs from "file-saver";
import { ExamData } from "../types/exam";
import { formatExamTitleFromMatrixName } from "./bridgeService";

const parseChemicalText = (text: string, baseOptions: any = {}): TextRun[] => {
  if (!text) return [];
  const parts: TextRun[] = [];
  // Regex matches:
  // 1. Charges (e.g., 2+, +, -)
  // 2. Electron configurations (numbers after s, p, d, f)
  // 3. Chemical formulas (numbers after other letters or ")")
  const regex = /([a-zA-Z\d\)])(\d*[\+\-])|([spdf])(\d+)|([a-zA-Z\)])(\d+)/g;
  
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(new TextRun({ ...baseOptions, text: text.substring(lastIndex, match.index) }));
    }

    const charBefore = match[1] || match[3] || match[5];
    parts.push(new TextRun({ ...baseOptions, text: charBefore }));

    const value = match[2] || match[4] || match[6];
    if (match[2] || match[4]) { // Charge or Electron count
      parts.push(new TextRun({ ...baseOptions, text: value, superScript: true }));
    } else { // Atom count
      parts.push(new TextRun({ ...baseOptions, text: value, subScript: true }));
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(new TextRun({ ...baseOptions, text: text.substring(lastIndex) }));
  }

  return parts.length > 0 ? parts : [new TextRun({ ...baseOptions, text: text })];
};

export const downloadExamDoc = async (
  data: ExamData, 
  isAnswerKey: boolean,
  preserveAnswersMode?: boolean
) => {
  const children: any[] = [];
  const showPreservedAnswers = Boolean(
    preserveAnswersMode || 
    data.title?.toUpperCase().includes('GIỮ NGUYÊN ĐÁP ÁN')
  );
  const showAns = isAnswerKey || showPreservedAnswers;
  const spacing = (isAnswerKey || showPreservedAnswers) ? { before: 100, after: 0 } : { before: 300, after: 80 };

  const noBorder = {
    top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  };

  // Header Table (Matching official school template)
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
                children: [
                  new TextRun({ text: "TRƯỜNG THCS-THPT PHAN VĂN TRỊ", bold: true, underline: {}, size: 22 })
                ]
              })
            ]
          }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            borders: noBorder,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: "ĐỀ KIỂM TRA ..........", bold: true, size: 22 })]
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: "Môn : Hóa Học", bold: true, size: 21 })]
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: "NĂM HỌC 2026 – 2027", size: 21 })]
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: "Thời gian làm bài: 45 phút", bold: true, italics: true, size: 20 })]
              })
            ]
          })
        ]
      })
    ]
  }));

  const examTitleText = formatExamTitleFromMatrixName(data.sourceMatrixName || data.title, data.grade, data.examType);
  children.push(new Paragraph({
    text: examTitleText.toUpperCase() + (isAnswerKey ? " - ĐÁP ÁN & HƯỚNG DẪN CHẤM" : ""),
    heading: HeadingLevel.HEADING_1,
    alignment: AlignmentType.CENTER,
    spacing: { before: 240, after: 300 },
  }));

  // PART 1
  const p1Pts = (data.part1.length * 0.25).toFixed(1).replace('.', ',');
  children.push(new Paragraph({ 
    children: [new TextRun({ text: `PHẦN I. Câu trắc nghiệm nhiều phương án lựa chọn (${data.part1.length} câu - ${p1Pts} điểm).`, bold: true })], 
    spacing 
  }));
  const labels1 = ["A", "B", "C", "D"];
  data.part1.forEach((q, idx) => {
    children.push(new Paragraph({ 
      children: [new TextRun({ text: `Câu ${idx + 1}. `, bold: true }), ...parseChemicalText(q.question)], 
      spacing: { before: 60 } 
    }));
    q.options.forEach((opt, oIdx) => {
      const isCorrect = showAns && oIdx === q.correctIndex;
      const cleanOpt = opt.replace(/^[A-D][\.\)]\s*/i, '').replace(/^\.\s*/, '');
      children.push(new Paragraph({
        children: [
          new TextRun({ text: `${labels1[oIdx]}. `, bold: true, italics: isCorrect, underline: isCorrect ? {} : undefined }),
          ...parseChemicalText(cleanOpt, { italics: isCorrect, underline: isCorrect ? {} : undefined, bold: false })
        ],
        indent: { left: 450 },
        spacing: { before: 0, after: 0 }
      }));
    });
  });

  // PART 2
  const p2Pts = (data.part2.length * 1.0).toFixed(1).replace('.', ',');
  children.push(new Paragraph({ 
    children: [new TextRun({ text: `PHẦN II. Câu trắc nghiệm đúng sai (${data.part2.length} câu - ${p2Pts} điểm).`, bold: true })], 
    spacing 
  }));
  const labels2 = ["a", "b", "c", "d"];
  data.part2.forEach((sc, idx) => {
    children.push(new Paragraph({ 
      children: [new TextRun({ text: `Câu ${idx + 1}. `, bold: true }), ...parseChemicalText(sc.context)], 
      spacing: { before: 100 } 
    }));
    sc.statements.forEach((st, sIdx) => {
      const isTrueMark = showAns && st.isTrue;
      const cleanText = st.text.replace(/^[a-d][\.\)]\s*/i, '').replace(/^\.\s*/, '');
      children.push(new Paragraph({
        children: [
          new TextRun({ text: `${labels2[sIdx]}) `, bold: true, italics: isTrueMark, underline: isTrueMark ? {} : undefined }),
          ...parseChemicalText(cleanText, { italics: isTrueMark, underline: isTrueMark ? {} : undefined, bold: false })
        ],
        indent: { left: 450 },
        spacing: { before: 0, after: 0 }
      }));
    });
  });

  // PART 3
  const hasPart4 = Array.isArray(data.part4) && data.part4.length > 0;
  const p3Pts = (data.part3.length === 4 || hasPart4) ? '2,0' : '1,5';
  children.push(new Paragraph({ 
    children: [new TextRun({ text: `PHẦN III. Câu trắc nghiệm trả lời ngắn (${data.part3.length} câu - ${p3Pts} điểm).`, bold: true })], 
    spacing 
  }));
  data.part3.forEach((q, idx) => {
    children.push(new Paragraph({ 
      children: [new TextRun({ text: `Câu ${idx + 1}. `, bold: true }), ...parseChemicalText(q.question)], 
      spacing: { before: 100 } 
    }));
    if (isAnswerKey) {
      children.push(new Paragraph({ 
        children: [
          new TextRun({ text: "A. ", bold: true, italics: true, underline: {} }), 
          new TextRun({ text: `${q.answer}`, bold: true, italics: true, underline: {}, color: "0000FF" })
        ], 
        indent: { left: 450 } 
      }));
      if (q.explanation) {
        children.push(new Paragraph({
          children: [
            new TextRun({ text: "Hướng dẫn giải: ", bold: true, italics: true, color: "666666" }),
            ...parseChemicalText(q.explanation, { italics: true, color: "666666" })
          ],
          indent: { left: 450 },
          spacing: { before: 50, after: 100 }
        }));
      }
    } else if (showAns) {
      // Preserve answers mode (like Image 2): A. [answer] in blue, bold, italic, underline - NO explanation!
      children.push(new Paragraph({ 
        children: [
          new TextRun({ text: "A. ", bold: true, italics: true, underline: {} }), 
          new TextRun({ text: `${q.answer}`, bold: true, italics: true, underline: {}, color: "0000FF" })
        ], 
        indent: { left: 450 } 
      }));
    } else {
      children.push(new Paragraph({ 
        children: [
          new TextRun({ text: "A. ", bold: true, italics: true }),
          new TextRun({ text: "..........................................................." })
        ], 
        indent: { left: 450 } 
      }));
    }
  });

  // PART 4 (TỰ LUẬN)
  if (hasPart4 && data.part4) {
    children.push(new Paragraph({ 
      children: [new TextRun({ text: `PHẦN IV. TỰ LUẬN (${data.part4.length} câu - 3,0 điểm).`, bold: true })], 
      spacing 
    }));

    data.part4.forEach((q, idx) => {
      children.push(new Paragraph({ 
        children: [
          new TextRun({ text: `Câu ${idx + 1} (${q.points || 1.0} điểm). `, bold: true }), 
          ...parseChemicalText(q.question)
        ], 
        spacing: { before: 120 } 
      }));

      if (isAnswerKey) {
        if (q.solution) {
          const lines = q.solution.split('\n');
          children.push(new Paragraph({
            children: [
              new TextRun({ text: "Hướng dẫn giải & Thang điểm:", bold: true, italics: true, color: "006600" })
            ],
            indent: { left: 450 },
            spacing: { before: 50, after: 30 }
          }));
          lines.forEach(line => {
            children.push(new Paragraph({
              children: [
                ...parseChemicalText(line, { italics: true, color: "333333" })
              ],
              indent: { left: 700 },
              spacing: { before: 0, after: 20 }
            }));
          });
        }
      } else {
        children.push(new Paragraph({
          children: [new TextRun({ text: "Bài làm:", italics: true, color: "888888" })],
          indent: { left: 450 },
          spacing: { before: 60, after: 30 }
        }));
        for (let i = 0; i < 5; i++) {
          children.push(new Paragraph({
            children: [new TextRun({ text: "..........................................................................................................................................................................", color: "CCCCCC" })],
            indent: { left: 450 },
            spacing: { before: 0, after: 40 }
          }));
        }
      }
    });
  }

  children.push(new Paragraph({
    text: "--- HẾT ---",
    alignment: AlignmentType.CENTER,
    spacing: { before: 300, after: 100 }
  }));

  const doc = new Document({
    sections: [{ 
      properties: { 
        page: { 
          margin: { top: 720, bottom: 720, left: 720, right: 720 } 
        } 
      }, 
      children 
    }],
  });
  const blob = await Packer.toBlob(doc);
  const cleanTitle = (data.title || "De_Thi_Hoa_Hoc").replace(/[^a-zA-Z0-9_\u00C0-\u024F\u1EA0-\u1EF9]/g, '_');
  saveAs(blob, `${isAnswerKey ? 'DapAn' : 'DeThi'}_${cleanTitle}.docx`);
};
