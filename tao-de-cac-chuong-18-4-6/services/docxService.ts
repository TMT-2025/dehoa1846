
import { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel } from "docx";
import saveAs from "file-saver";
import { ExamData } from "../types";

const parseChemicalText = (text: string, baseOptions: any = {}): TextRun[] => {
  if (!text) return [];
  const parts: TextRun[] = [];
  // Regex matches:
  // 1. Charges (e.g., 2+, +, -)
  // 2. Electron configurations (numbers after s, p, d, f)
  // 3. Chemical formulas (numbers after other letters or ")")
  const regex = /([a-zA-Z\d\)])(\d*[\+\-])|([spdf])(\d+)|([a-zA-Z\)])(\d+)/g;
  
  let lastIndex = 0;
  let match;

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

export const downloadExamDoc = async (data: ExamData, isAnswerKey: boolean) => {
  const children: any[] = [];
  const spacing = isAnswerKey ? { before: 100, after: 0 } : { before: 300, after: 80 };

  children.push(new Paragraph({
    text: data.title.toUpperCase() + (isAnswerKey ? " - ĐÁP ÁN" : ""),
    heading: HeadingLevel.HEADING_1,
    alignment: AlignmentType.CENTER,
    spacing: { after: 300 },
  }));

  // PART 1
  children.push(new Paragraph({ children: [new TextRun({ text: "PHẦN I. Câu trắc nghiệm nhiều phương án lựa chọn.", bold: true })], spacing }));
  const labels1 = ["A", "B", "C", "D"];
  data.part1.forEach((q, idx) => {
    children.push(new Paragraph({ children: [new TextRun({ text: `Câu ${idx + 1}. `, bold: true }), ...parseChemicalText(q.question)], spacing: { before: 60 } }));
    q.options.forEach((opt, oIdx) => {
      const isCorrect = isAnswerKey && oIdx === q.correctIndex;
      const cleanOpt = opt.replace(/^[A-D][\.\)]\s*/i, '').replace(/^\.\s*/, '');
      children.push(new Paragraph({
        children: [
          new TextRun({ text: `${labels1[oIdx]}. `, bold: isCorrect, italics: isCorrect, underline: isCorrect ? {} : undefined }),
          ...parseChemicalText(cleanOpt, { italics: isCorrect, underline: isCorrect ? {} : undefined, bold: false })
        ],
        indent: { left: 450 },
        spacing: { before: 0, after: 0 }
      }));
    });
  });

  // PART 2
  children.push(new Paragraph({ children: [new TextRun({ text: "PHẦN II. Câu trắc nghiệm đúng sai.", bold: true })], spacing }));
  const labels2 = ["a", "b", "c", "d"];
  data.part2.forEach((sc, idx) => {
    children.push(new Paragraph({ children: [new TextRun({ text: `Câu ${idx + 1}. `, bold: true }), ...parseChemicalText(sc.context)], spacing: { before: 100 } }));
    sc.statements.forEach((st, sIdx) => {
      const isTrueMark = isAnswerKey && st.isTrue;
      const cleanText = st.text.replace(/^[a-d][\.\)]\s*/i, '').replace(/^\.\s*/, '');
      children.push(new Paragraph({
        children: [
          new TextRun({ text: `${labels2[sIdx]}) `, bold: true, italics: isTrueMark, underline: isTrueMark ? {} : undefined }),
          ...parseChemicalText(cleanText, { italics: isTrueMark, underline: isTrueMark ? {} : undefined, bold: false }),
        ],
        indent: { left: 450 },
        spacing: { before: 0, after: 0 }
      }));
    });
  });

  // PART 3
  children.push(new Paragraph({ children: [new TextRun({ text: "PHẦN III. Câu trắc nghiệm trả lời ngắn.", bold: true })], spacing }));
  data.part3.forEach((q, idx) => {
    children.push(new Paragraph({ children: [new TextRun({ text: `Câu ${idx + 1}. `, bold: true }), ...parseChemicalText(q.question)], spacing: { before: 100 } }));
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

  const doc = new Document({
    sections: [{ properties: { page: { margin: { top: 720, bottom: 720, left: 720, right: 720 } } }, children }],
  });
  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${isAnswerKey ? 'DapAn' : 'DeThi'}_${data.title.replace(/\s+/g, '_')}.docx`);
};
