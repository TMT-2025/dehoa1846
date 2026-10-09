import JSZip from "jszip";
import { DOMParser } from "@xmldom/xmldom";
import {
  ExamIR,
  ExamSection,
  ExamQuestion,
  QuestionOption,
  TrueFalseSubItem,
  ShortAnswerData,
  QuestionType,
  RichParagraph,
  FormattedRun
} from "../ir/types.js";
import {
  getChildrenByLocalName,
  getFirstChildByLocalName,
  getAttributeValue,
  getElementTextContent
} from "./xml-utils.js";
import {
  parseParagraphElement,
  elementHasUnderline,
  elementHasColor
} from "./run-parser.js";

export interface ParseDocxOptions {
  fileName?: string;
}

export async function parseDocx(bufferOrUint8Array: Buffer | Uint8Array, options: ParseDocxOptions = {}): Promise<ExamIR> {
  const zip = await JSZip.loadAsync(bufferOrUint8Array);

  const documentXmlFile = zip.file("word/document.xml");
  if (!documentXmlFile) {
    throw new Error("Invalid DOCX: word/document.xml not found in archive.");
  }

  const documentXmlStr = await documentXmlFile.async("string");
  const domParser = new DOMParser();
  const doc = domParser.parseFromString(documentXmlStr, "application/xml");
  if (!doc.documentElement) {
    throw new Error("Invalid DOCX: root element not found in document.xml.");
  }

  const bodyEl = getFirstChildByLocalName(doc.documentElement, "body");
  if (!bodyEl) {
    throw new Error("Invalid DOCX: w:body not found in document.xml.");
  }

  // Parse page properties from sectPr if available
  let pageWidthDxa = 11906;
  let pageHeightDxa = 16838;
  let marginTopDxa = 720;
  let marginBottomDxa = 720;
  let marginLeftDxa = 720;
  let marginRightDxa = 720;

  const sectPrEl = getFirstChildByLocalName(bodyEl, "sectPr");
  if (sectPrEl) {
    const pgSzEl = getFirstChildByLocalName(sectPrEl, "pgSz");
    if (pgSzEl) {
      const w = getAttributeValue(pgSzEl, "w");
      const h = getAttributeValue(pgSzEl, "h");
      if (w) pageWidthDxa = parseInt(w, 10);
      if (h) pageHeightDxa = parseInt(h, 10);
    }
    const pgMarEl = getFirstChildByLocalName(sectPrEl, "pgMar");
    if (pgMarEl) {
      const top = getAttributeValue(pgMarEl, "top");
      const bottom = getAttributeValue(pgMarEl, "bottom");
      const left = getAttributeValue(pgMarEl, "left");
      const right = getAttributeValue(pgMarEl, "right");
      if (top) marginTopDxa = parseInt(top, 10);
      if (bottom) marginBottomDxa = parseInt(bottom, 10);
      if (left) marginLeftDxa = parseInt(left, 10);
      if (right) marginRightDxa = parseInt(right, 10);
    }
  }

  // Collect paragraphs
  const pElements = getChildrenByLocalName(bodyEl, "p");

  const sections: ExamSection[] = [];
  let currentSection: ExamSection | null = null;
  let currentGroupTag: string | undefined = undefined;

  let currentSectionIndex = 0;
  let currentQuestionIndex = 0;

  let i = 0;
  while (i < pElements.length) {
    const pEl = pElements[i];
    const rawText = getElementTextContent(pEl).trim();

    // 1. Check for group tag like <g0#1>, <g0#2>, <g0#3>
    const groupMatch = rawText.match(/^<g(\d+)#(\d+)>/);
    if (groupMatch) {
      currentGroupTag = groupMatch[0];
      i++;
      continue;
    }

    // 2. Check for Section Header like "PHẦN I", "PHẦN II", "PHẦN III"
    const sectionMatch = rawText.match(/^PHẦN\s+(I{1,3}|[1-3])[\.:\s]*(.*)/i);
    if (sectionMatch) {
      const romanOrNum = sectionMatch[1].toUpperCase();
      let sType: QuestionType = "MULTIPLE_CHOICE";
      let sIndex = 1;

      if (romanOrNum === "I" || romanOrNum === "1") {
        sType = "MULTIPLE_CHOICE";
        sIndex = 1;
      } else if (romanOrNum === "II" || romanOrNum === "2") {
        sType = "TRUE_FALSE";
        sIndex = 2;
      } else if (romanOrNum === "III" || romanOrNum === "3") {
        sType = "SHORT_ANSWER";
        sIndex = 3;
      }

      currentSectionIndex = sIndex;
      currentQuestionIndex = 0;

      currentSection = {
        id: `sec-${sIndex}`,
        sectionIndex: sIndex,
        groupTag: currentGroupTag,
        title: rawText,
        type: sType,
        shufflePolicy: {
          shuffleQuestions: true,
          shuffleOptions: sType === "MULTIPLE_CHOICE",
          shuffleTrueFalseSubItems: false
        },
        questions: []
      };
      sections.push(currentSection);
      i++;
      continue;
    }

    // 3. Check for Question Header like "Câu 1.", "Câu 2:"
    const qMatch = rawText.match(/^Câu\s+(\d+)[\.:\s]*(.*)/i);
    if (qMatch && currentSection) {
      currentQuestionIndex++;
      const qNum = parseInt(qMatch[1], 10);
      const startPIndex = i;

      if (currentSection.type === "MULTIPLE_CHOICE") {
        // MULTIPLE CHOICE:
        // Current paragraph is stem (or starts the stem)
        const stemParagraphs: RichParagraph[] = [];
        stemParagraphs.push(parseParagraphElement(pEl));
        i++;

        // Read any additional stem paragraphs before option A
        while (i < pElements.length) {
          const nextText = getElementTextContent(pElements[i]).trim();
          if (nextText.match(/^[A-D][\.:\)]\s*/)) {
            break;
          }
          if (nextText.match(/^Câu\s+\d+[\.:]/i) || nextText.match(/^PHẦN/i) || nextText.match(/^<g/i)) {
            break;
          }
          if (nextText.length > 0) {
            stemParagraphs.push(parseParagraphElement(pElements[i]));
          }
          i++;
        }

        // Now read options A, B, C, D
        const optionsList: QuestionOption[] = [];
        const expectedLabels = ["A", "B", "C", "D"] as const;

        while (i < pElements.length && optionsList.length < 4) {
          const optEl = pElements[i];
          const optRaw = getElementTextContent(optEl).trim();
          const optMatch = optRaw.match(/^([A-D])[\.:\)]\s*(.*)/s);

          if (optMatch) {
            const label = optMatch[1].toUpperCase() as "A" | "B" | "C" | "D";
            const isCorrect = elementHasUnderline(optEl);

            // Parse paragraph with sanitizeUnderline = true to strip answer underline
            const parsedP = parseParagraphElement(optEl, { sanitizeUnderline: true });

            // Strip the leading "A. " from the first run
            stripLeadingLabel(parsedP, /^[A-D][\.:\)]\s*/);

            optionsList.push({
              id: `opt-${qNum}-${label}`,
              originalLabel: label,
              content: {
                paragraphs: [parsedP]
              },
              isCorrect,
              answerSource: "document-format"
            });
            i++;
          } else {
            // Not an option line; break
            break;
          }
        }

        const hasChem = checkForChemicalFormulas(stemParagraphs, optionsList.map(o => o.content.paragraphs).flat());

        const question: ExamQuestion = {
          id: `q-mc-${qNum}`,
          sourcePosition: {
            sectionIndex: currentSection.sectionIndex,
            questionIndex: currentQuestionIndex,
            originalNumberStr: `Câu ${qNum}.`,
            startParagraphIndex: startPIndex,
            endParagraphIndex: i - 1
          },
          type: "MULTIPLE_CHOICE",
          stem: { paragraphs: stemParagraphs },
          options: optionsList,
          allowShuffle: true,
          allowOptionShuffle: true,
          formattingMetadata: {
            optionLayoutHint: "auto",
            hasChemicalFormulas: hasChem,
            hasMathExpressions: false,
            imageCount: 0
          }
        };

        currentSection.questions.push(question);
        continue;
      } else if (currentSection.type === "TRUE_FALSE") {
        // TRUE / FALSE:
        const stemParagraphs: RichParagraph[] = [];
        stemParagraphs.push(parseParagraphElement(pEl));
        i++;

        // Read any additional stem paragraphs before sub-item a)
        while (i < pElements.length) {
          const nextText = getElementTextContent(pElements[i]).trim();
          if (nextText.match(/^[a-d][\)\.:]\s*/)) {
            break;
          }
          if (nextText.match(/^Câu\s+\d+[\.:]/i) || nextText.match(/^PHẦN/i) || nextText.match(/^<g/i)) {
            break;
          }
          if (nextText.length > 0) {
            stemParagraphs.push(parseParagraphElement(pElements[i]));
          }
          i++;
        }

        // Read sub-items a, b, c, d
        const subItemsList: TrueFalseSubItem[] = [];
        while (i < pElements.length && subItemsList.length < 4) {
          const subEl = pElements[i];
          const subRaw = getElementTextContent(subEl).trim();
          const subMatch = subRaw.match(/^([a-d])[\)\.:]\s*(.*)/s);

          if (subMatch) {
            const label = subMatch[1].toLowerCase() as "a" | "b" | "c" | "d";
            const isCorrect = elementHasUnderline(subEl);

            const parsedP = parseParagraphElement(subEl, { sanitizeUnderline: true });
            stripLeadingLabel(parsedP, /^[a-d][\)\.:]\s*/);

            subItemsList.push({
              id: `sub-${qNum}-${label}`,
              originalLabel: label,
              content: {
                paragraphs: [parsedP]
              },
              isCorrect,
              answerSource: "document-format"
            });
            i++;
          } else {
            break;
          }
        }

        const hasChem = checkForChemicalFormulas(stemParagraphs, subItemsList.map(s => s.content.paragraphs).flat());

        const question: ExamQuestion = {
          id: `q-tf-${qNum}`,
          sourcePosition: {
            sectionIndex: currentSection.sectionIndex,
            questionIndex: currentQuestionIndex,
            originalNumberStr: `Câu ${qNum}.`,
            startParagraphIndex: startPIndex,
            endParagraphIndex: i - 1
          },
          type: "TRUE_FALSE",
          stem: { paragraphs: stemParagraphs },
          subItems: subItemsList,
          allowShuffle: true,
          allowOptionShuffle: false,
          formattingMetadata: {
            hasChemicalFormulas: hasChem,
            hasMathExpressions: false,
            imageCount: 0
          }
        };

        currentSection.questions.push(question);
        continue;
      } else if (currentSection.type === "SHORT_ANSWER") {
        // SHORT ANSWER:
        const stemParagraphs: RichParagraph[] = [];
        stemParagraphs.push(parseParagraphElement(pEl));
        i++;

        // Next line may be the answer line A. <value>
        let shortAnswerData: ShortAnswerData | undefined = undefined;

        if (i < pElements.length) {
          const ansEl = pElements[i];
          const ansRaw = getElementTextContent(ansEl).trim();
          const ansMatch = ansRaw.match(/^A[\.:\)]\s*(.*)/s);

          if (ansMatch || elementHasColor(ansEl, "0000FF") || elementHasUnderline(ansEl)) {
            const expectedVal = ansMatch ? ansMatch[1].trim() : ansRaw.trim();
            const rawAnswerP = parseParagraphElement(ansEl);

            // Build acceptable variations (e.g. "0.92" <-> "0,92")
            const acceptable = [expectedVal];
            if (expectedVal.includes(".")) {
              acceptable.push(expectedVal.replace(".", ","));
            } else if (expectedVal.includes(",")) {
              acceptable.push(expectedVal.replace(",", "."));
            }

            shortAnswerData = {
              expectedValue: expectedVal,
              acceptableAnswers: acceptable,
              sourceAnswerRaw: {
                paragraphs: [rawAnswerP]
              },
              answerSource: "document-format"
            };
            i++; // Advance past answer line
          }
        }

        const hasChem = checkForChemicalFormulas(stemParagraphs, []);

        const question: ExamQuestion = {
          id: `q-sa-${qNum}`,
          sourcePosition: {
            sectionIndex: currentSection.sectionIndex,
            questionIndex: currentQuestionIndex,
            originalNumberStr: `Câu ${qNum}.`,
            startParagraphIndex: startPIndex,
            endParagraphIndex: i - 1
          },
          type: "SHORT_ANSWER",
          stem: { paragraphs: stemParagraphs },
          shortAnswer: shortAnswerData,
          allowShuffle: true,
          allowOptionShuffle: false,
          formattingMetadata: {
            hasChemicalFormulas: hasChem,
            hasMathExpressions: false,
            imageCount: 0
          }
        };

        currentSection.questions.push(question);
        continue;
      }
    }

    // Default: skip unhandled paragraphs (like empty lines)
    i++;
  }

  return {
    schemaVersion: "1.0.0",
    metadata: {
      originalFileName: options.fileName || "DeGocTron.docx",
      createdAt: new Date().toISOString(),
      sourceDocxProperties: {
        pageWidthDxa,
        pageHeightDxa,
        marginTopDxa,
        marginBottomDxa,
        marginLeftDxa,
        marginRightDxa,
        defaultFont: "Times New Roman",
        defaultFontSizePt: 12
      }
    },
    header: {
      examTitle: "KIỂM TRA CHƯƠNG ESTER - LIPID",
      studentInfoFields: {
        showStudentName: true,
        showStudentId: true,
        showExamCode: true
      },
      tableBorderBottomSize: 12
    },
    footer: {
      showExamCode: true,
      showPageNumbers: true,
      pageNumberFormat: "PageXofY",
      topBorder: true
    },
    sections
  };
}

function stripLeadingLabel(p: RichParagraph, regex: RegExp): void {
  if (p.runs.length === 0) return;
  const firstRun = p.runs[0];
  const match = firstRun.text.match(regex);
  if (match) {
    firstRun.text = firstRun.text.substring(match[0].length);
    if (firstRun.text.length === 0 && p.runs.length > 1) {
      p.runs.shift();
    }
  }
}

function checkForChemicalFormulas(stems: RichParagraph[], other: RichParagraph[]): boolean {
  const allPs = [...stems, ...other];
  for (const p of allPs) {
    for (const r of p.runs) {
      if (r.vertAlign === "subscript" || r.vertAlign === "superscript") {
        return true;
      }
    }
  }
  return false;
}
