import JSZip from "jszip";
import { DOMParser } from "@xmldom/xmldom";
import { VariantExamResult } from "../mixer/variant-generator.js";
import { ExamIR } from "../ir/types.js";
import {
  getChildrenByLocalName,
  getFirstChildByLocalName,
  getDescendantsByLocalName,
  getElementTextContent
} from "../parser/xml-utils.js";

export interface RenderValidationIssue {
  code: string;
  severity: "INFO" | "WARNING" | "ERROR" | "CRITICAL";
  message: string;
}

export interface RenderValidationReport {
  isValid: boolean;
  totalErrors: number;
  totalWarnings: number;
  issues: RenderValidationIssue[];
  metrics: {
    hasDocumentXml: boolean;
    hasFooterXml: boolean;
    hasStylesXml: boolean;
    hasContentTypesXml: boolean;
    headerExamCodeMatch: boolean;
    footerExamCodeMatch: boolean;
    hasPageField: boolean;
    hasNumPagesField: boolean;
    totalParagraphs: number;
    subscriptCount: number;
    superscriptCount: number;
    hasAnswerLeakage: boolean;
  };
}

/**
 * Counts the expected vertAlign='subscript' runs across all sections, questions, and options in ExamIR
 */
export function countExpectedSubscripts(exam?: ExamIR): number {
  if (!exam || !exam.sections) return 0;
  let count = 0;
  for (const section of exam.sections) {
    if (!section.questions) continue;
    for (const q of section.questions) {
      if (q.stem?.paragraphs) {
        for (const p of q.stem.paragraphs) {
          if (p.runs) {
            for (const r of p.runs) {
              if (r.vertAlign === "subscript") count++;
            }
          }
        }
      }
      if (q.options) {
        for (const opt of q.options) {
          if (opt.content?.paragraphs) {
            for (const p of opt.content.paragraphs) {
              if (p.runs) {
                for (const r of p.runs) {
                  if (r.vertAlign === "subscript") count++;
                }
              }
            }
          }
        }
      }
      if (q.subItems) {
        for (const item of q.subItems) {
          if (item.content?.paragraphs) {
            for (const p of item.content.paragraphs) {
              if (p.runs) {
                for (const r of p.runs) {
                  if (r.vertAlign === "subscript") count++;
                }
              }
            }
          }
        }
      }
    }
  }
  return count;
}

export async function validateRenderedDocx(
  docxBuffer: Buffer | Uint8Array,
  expectedVariant: VariantExamResult
): Promise<RenderValidationReport> {
  const issues: RenderValidationIssue[] = [];
  const expectedExamCode = expectedVariant.metadata.examCode;

  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(docxBuffer);
  } catch (err: any) {
    return {
      isValid: false,
      totalErrors: 1,
      totalWarnings: 0,
      issues: [{
        code: "VAL-DOCX-CORRUPTED",
        severity: "CRITICAL",
        message: `DOCX package is not a valid zip archive: ${err.message}`
      }],
      metrics: {
        hasDocumentXml: false,
        hasFooterXml: false,
        hasStylesXml: false,
        hasContentTypesXml: false,
        headerExamCodeMatch: false,
        footerExamCodeMatch: false,
        hasPageField: false,
        hasNumPagesField: false,
        totalParagraphs: 0,
        subscriptCount: 0,
        superscriptCount: 0,
        hasAnswerLeakage: false
      }
    };
  }

  // 15. DOCX Package Structural Integrity
  const hasContentTypesXml = zip.file("[Content_Types].xml") !== null;
  const hasDocumentXml = zip.file("word/document.xml") !== null;
  const hasStylesXml = zip.file("word/styles.xml") !== null;
  const hasFooterXml = zip.file("word/footer1.xml") !== null;

  if (!hasContentTypesXml) {
    issues.push({ code: "VAL-PKG-NO-CONTENT-TYPES", severity: "CRITICAL", message: "[Content_Types].xml is missing" });
  }
  if (!hasDocumentXml) {
    issues.push({ code: "VAL-PKG-NO-DOCUMENT-XML", severity: "CRITICAL", message: "word/document.xml is missing" });
  }
  if (!hasStylesXml) {
    issues.push({ code: "VAL-PKG-NO-STYLES-XML", severity: "CRITICAL", message: "word/styles.xml is missing" });
  }
  if (!hasFooterXml) {
    issues.push({ code: "VAL-PKG-NO-FOOTER-XML", severity: "CRITICAL", message: "word/footer1.xml is missing" });
  }

  if (!hasDocumentXml || !hasFooterXml) {
    const errCount = issues.length;
    return {
      isValid: false,
      totalErrors: errCount,
      totalWarnings: 0,
      issues,
      metrics: {
        hasDocumentXml,
        hasFooterXml,
        hasStylesXml,
        hasContentTypesXml,
        headerExamCodeMatch: false,
        footerExamCodeMatch: false,
        hasPageField: false,
        hasNumPagesField: false,
        totalParagraphs: 0,
        subscriptCount: 0,
        superscriptCount: 0,
        hasAnswerLeakage: false
      }
    };
  }

  const domParser = new DOMParser();
  const documentXmlStr = await zip.file("word/document.xml")!.async("string");
  const doc = domParser.parseFromString(documentXmlStr, "application/xml");

  const footerXmlStr = await zip.file("word/footer1.xml")!.async("string");
  const footerDoc = domParser.parseFromString(footerXmlStr, "application/xml");

  if (!doc.documentElement || !footerDoc.documentElement) {
    return {
      isValid: false,
      totalErrors: 1,
      totalWarnings: 0,
      issues: [{ code: "VAL-DOCX-XML-NULL-ROOT", severity: "CRITICAL", message: "XML root element missing" }],
      metrics: {
        hasDocumentXml,
        hasFooterXml,
        hasStylesXml,
        hasContentTypesXml,
        headerExamCodeMatch: false,
        footerExamCodeMatch: false,
        hasPageField: false,
        hasNumPagesField: false,
        totalParagraphs: 0,
        subscriptCount: 0,
        superscriptCount: 0,
        hasAnswerLeakage: false
      }
    };
  }

  const docRoot = doc.documentElement;
  const footerRoot = footerDoc.documentElement;

  const bodyEl = getFirstChildByLocalName(docRoot, "body");
  if (!bodyEl) {
    issues.push({ code: "VAL-DOC-NO-BODY", severity: "CRITICAL", message: "w:body missing in document.xml" });
  }

  const paragraphs = bodyEl ? getChildrenByLocalName(bodyEl, "p") : [];
  const tables = bodyEl ? getChildrenByLocalName(bodyEl, "tbl") : [];

  // 8 & 9. Header Table Exam Code check
  let headerExamCodeMatch = false;
  if (tables.length > 0) {
    const headerTbl = tables[0];
    const tblText = getElementTextContent(headerTbl);
    if (tblText.includes(`Mã đề ${expectedExamCode}`)) {
      headerExamCodeMatch = true;
    } else {
      issues.push({
        code: "VAL-HEADER-EXAM-CODE-MISMATCH",
        severity: "CRITICAL",
        message: `Header table does not contain 'Mã đề ${expectedExamCode}'`
      });
    }
  } else {
    issues.push({ code: "VAL-NO-HEADER-TABLE", severity: "CRITICAL", message: "Student header table missing" });
  }

  // 10. Footer Exam Code check
  const footerText = getElementTextContent(footerRoot);
  let footerExamCodeMatch = false;
  if (footerText.includes(`Mã đề ${expectedExamCode}`)) {
    footerExamCodeMatch = true;
  } else {
    issues.push({
      code: "VAL-FOOTER-EXAM-CODE-MISMATCH",
      severity: "CRITICAL",
      message: `Footer does not contain 'Mã đề ${expectedExamCode}'`
    });
  }

  // 11 & 12. Dynamic Word Fields (Page, NUMPAGES)
  const instrTexts = getDescendantsByLocalName(footerRoot, "instrText");
  const instrValues = instrTexts.map(i => (i.textContent || "").trim());
  const hasPageField = instrValues.some(v => v === "Page" || v.includes("PAGE"));
  const hasNumPagesField = instrValues.some(v => v === "NUMPAGES");

  if (!hasPageField) {
    issues.push({ code: "VAL-NO-PAGE-FIELD", severity: "CRITICAL", message: "Footer missing Word dynamic field 'Page'" });
  }
  if (!hasNumPagesField) {
    issues.push({ code: "VAL-NO-NUMPAGES-FIELD", severity: "CRITICAL", message: "Footer missing Word dynamic field 'NUMPAGES'" });
  }

  // 13. Answer Leakage Scan
  // Scan all runs inside paragraphs (excluding the header table) for underline
  let hasAnswerLeakage = false;
  let inShortAnswerSection = false;
  for (const p of paragraphs) {
    const runs = getChildrenByLocalName(p, "r");
    for (const r of runs) {
      const rPr = getFirstChildByLocalName(r, "rPr");
      if (rPr) {
        const u = getFirstChildByLocalName(rPr, "u");
        if (u) {
          // If underline is single and found in an option/sub-item, flag leakage!
          const text = getElementTextContent(r);
          // Allow underline only if it's explicitly in header table dots or non-answer text
          if (text.trim().length > 0 && !text.includes("...") && !text.includes("___")) {
            hasAnswerLeakage = true;
            issues.push({
              code: "VAL-LEAKAGE-UNDERLINE",
              severity: "CRITICAL",
              message: `Answer leakage detected: Underline found in text '${text}'`
            });
          }
        }
      }
    }

    const pText = getElementTextContent(p).trim();
    if (pText.includes("PHẦN III") || pText.includes("PHẦN 3")) {
      inShortAnswerSection = true;
    }

    // Direct answer label leak: "Trả lời: ..." or "Đáp án: ..."
    if (pText.match(/^(?:Trả lời|Đáp án)[\.:\)]/i)) {
      hasAnswerLeakage = true;
      issues.push({
        code: "VAL-LEAKAGE-SHORT-ANSWER",
        severity: "CRITICAL",
        message: `Answer leakage detected: Direct answer line found '${pText}'`
      });
    }

    // In short answer section, any answer key line like "A. 200" or "A. <value>" is answer leakage
    if (inShortAnswerSection && pText.match(/^A[\.:\)]\s*(200|0\.92|3|5\.28|88\.4|1170|\d+(?:[.,]\d+)?)$/)) {
      hasAnswerLeakage = true;
      issues.push({
        code: "VAL-LEAKAGE-SHORT-ANSWER",
        severity: "CRITICAL",
        message: `Answer leakage detected: Short answer key line found in student exam '${pText}'`
      });
    }
  }

  // 14. Formatting integrity: count subscripts and superscripts
  const vertAligns = getDescendantsByLocalName(docRoot, "vertAlign");
  let subscriptCount = 0;
  let superscriptCount = 0;
  for (const va of vertAligns) {
    const val = va.getAttribute("w:val") || va.getAttribute("val");
    if (val === "subscript") subscriptCount++;
    if (val === "superscript") superscriptCount++;
  }

  const expectedSubscripts = countExpectedSubscripts(expectedVariant.variantExam);

  // Only report missing subscripts if the source exam actually had subscripts!
  if (expectedSubscripts > 0 && subscriptCount === 0) {
    issues.push({
      code: "VAL-FMT-NO-SUBSCRIPTS",
      severity: "ERROR",
      message: `Chemical formulas appear to have lost their subscript formatting (expected: ${expectedSubscripts}, rendered: 0)`
    });
  }

  const errors = issues.filter(i => i.severity === "CRITICAL" || i.severity === "ERROR").length;
  const warnings = issues.filter(i => i.severity === "WARNING").length;

  return {
    isValid: errors === 0,
    totalErrors: errors,
    totalWarnings: warnings,
    issues,
    metrics: {
      hasDocumentXml,
      hasFooterXml,
      hasStylesXml,
      hasContentTypesXml,
      headerExamCodeMatch,
      footerExamCodeMatch,
      hasPageField,
      hasNumPagesField,
      totalParagraphs: paragraphs.length,
      subscriptCount,
      superscriptCount,
      hasAnswerLeakage
    }
  };
}
