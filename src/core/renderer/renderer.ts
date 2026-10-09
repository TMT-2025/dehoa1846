import { ExamIR } from "../ir/types.js";
import { VariantExamResult } from "../mixer/variant-generator.js";
import {
  TemplateProfile,
  DEFAULT_TEMPLATE_PROFILE,
  loadTemplateBuffer
} from "./template-loader.js";
import { renderExamTitle, renderStudentHeaderTable } from "./header-renderer.js";
import { renderFooterXml } from "./footer-renderer.js";
import { renderQuestion } from "./question-renderer.js";
import { cloneAndAssembleDocx } from "./document-cloner.js";
import { escapeXml } from "./content-renderer.js";

export interface RenderOptions {
  templateBuffer?: Buffer | Uint8Array;
  profile?: TemplateProfile;
}

export function buildDocumentXml(
  exam: ExamIR,
  examCode: string,
  profile: TemplateProfile
): string {
  const bodyParts: string[] = [];

  // 1. Exam Title
  const title = exam.header?.examTitle || "KIỂM TRA CHƯƠNG ESTER - LIPID";
  bodyParts.push(renderExamTitle(title));

  // 2. Student Info Header Table
  bodyParts.push(renderStudentHeaderTable(examCode, profile));

  // 3. Sections and Questions
  for (const section of exam.sections) {
    // Section Header Paragraph
    bodyParts.push(
      [
        '<w:p>',
        '  <w:pPr>',
        '    <w:rPr><w:b/></w:rPr>',
        '  </w:pPr>',
        `  <w:r><w:rPr><w:b/></w:rPr><w:t>${escapeXml(section.title)}</w:t></w:r>`,
        '</w:p>'
      ].join("\n")
    );

    // Questions in this section (displayIndex from 1 to N within section)
    for (let qIdx = 0; qIdx < section.questions.length; qIdx++) {
      const q = section.questions[qIdx];
      const displayIndex = qIdx + 1;
      const qXml = renderQuestion(q, displayIndex, profile);
      bodyParts.push(qXml);
    }
  }

  // 4. End of exam marker
  bodyParts.push(
    [
      '<w:p>',
      '  <w:pPr>',
      '    <w:jc w:val="center"/>',
      '    <w:rPr><w:b/></w:rPr>',
      '  </w:pPr>',
      `  <w:r><w:rPr><w:b/></w:rPr><w:t>${escapeXml(profile.typography.endMarkerText)}</w:t></w:r>`,
      '</w:p>'
    ].join("\n")
  );

  // 5. Section Properties (w:sectPr)
  const geo = profile.geometry;
  const sectPrXml = [
    '<w:sectPr>',
    '  <w:footerReference w:type="default" r:id="rId7"/>',
    `  <w:pgSz w:w="${geo.pageWidthDxa}" w:h="${geo.pageHeightDxa}"/>`,
    `  <w:pgMar w:top="${geo.marginTopDxa}" w:right="${geo.marginRightDxa}" w:bottom="${geo.marginBottomDxa}" w:left="${geo.marginLeftDxa}" w:header="${geo.headerMarginDxa}" w:footer="${geo.footerMarginDxa}" w:gutter="0"/>`,
    '  <w:pgNumType w:start="1"/>',
    '  <w:cols w:space="720"/>',
    '  <w:docGrid w:linePitch="360"/>',
    '</w:sectPr>'
  ].join("\n");

  bodyParts.push(sectPrXml);

  return [
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<w:document xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas" xmlns:cx="http://schemas.microsoft.com/office/drawing/2014/chartex" xmlns:cx1="http://schemas.microsoft.com/office/drawing/2015/9/8/chartex" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:wp14="http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:w10="urn:schemas-microsoft-com:office:word" xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml" xmlns:w15="http://schemas.microsoft.com/office/word/2012/wordml" xmlns:w16se="http://schemas.microsoft.com/office/word/2015/wordml/symex" xmlns:wpg="http://schemas.microsoft.com/office/word/2010/wordprocessingGroup" xmlns:wpi="http://schemas.microsoft.com/office/word/2010/wordprocessingInk" xmlns:wne="http://schemas.microsoft.com/office/word/2006/wordml" xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape" mc:Ignorable="w14 w15 w16se wp14">',
    '  <w:body>',
    bodyParts.join("\n"),
    '  </w:body>',
    '</w:document>'
  ].join("\n");
}

export async function renderExamToDocx(
  variantOrExam: VariantExamResult | ExamIR,
  examCodeParam?: string,
  options: RenderOptions = {}
): Promise<Uint8Array> {
  let exam: ExamIR;
  let examCode: string;

  if ("variantExam" in variantOrExam) {
    exam = variantOrExam.variantExam;
    examCode = variantOrExam.metadata.examCode;
  } else {
    exam = variantOrExam;
    examCode = examCodeParam || "101";
  }

  const profile = options.profile || DEFAULT_TEMPLATE_PROFILE;
  const templateBuffer = options.templateBuffer || loadTemplateBuffer();

  const documentXml = buildDocumentXml(exam, examCode, profile);
  const footerXml = renderFooterXml(examCode, profile);

  return cloneAndAssembleDocx(templateBuffer, documentXml, footerXml);
}
