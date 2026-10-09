import { ExamData } from "../../types/exam.js";
import { 
  ExamIR, ExamSection, ExamQuestion, QuestionOption, 
  TrueFalseSubItem, FormattedRun, RichParagraph 
} from "../ir/types.js";

/**
 * Splits text with chemical numbers into FormattedRuns with subscripts and superscripts
 */
export function parseChemicalTextToRuns(text: string, base: Partial<FormattedRun> = {}): FormattedRun[] {
  if (!text) return [];
  const runs: FormattedRun[] = [];
  const regex = /([a-zA-Z\d\)])(\d*[\+\-])|([spdf])(\d+)|([a-zA-Z\)])(\d+)/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      runs.push({ ...base, text: text.substring(lastIndex, match.index) });
    }

    const charBefore = match[1] || match[3] || match[5];
    runs.push({ ...base, text: charBefore });

    const value = match[2] || match[4] || match[6];
    if (match[2] || match[4]) {
      // Superscript for charges or electron configurations
      runs.push({ ...base, text: value, vertAlign: "superscript" });
    } else {
      // Subscript for atom counts
      runs.push({ ...base, text: value, vertAlign: "subscript" });
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    runs.push({ ...base, text: text.substring(lastIndex) });
  }

  return runs.length > 0 ? runs : [{ ...base, text }];
}

function createParagraph(text: string, boldPrefix?: string): RichParagraph {
  const runs: FormattedRun[] = [];
  if (boldPrefix) {
    runs.push({ text: boldPrefix, bold: true });
  }
  runs.push(...parseChemicalTextToRuns(text));
  return { runs };
}

/**
 * Converts a ChemSuite ExamData structure directly into standard ExamIR intermediate representation
 */
export function convertExamDataToExamIR(data: ExamData): ExamIR {
  const sections: ExamSection[] = [];

  // 1. Part I: Multiple Choice Questions (18 questions)
  if (data.part1 && data.part1.length > 0) {
    const questions: ExamQuestion[] = data.part1.map((q, idx) => {
      const qNum = idx + 1;
      const cleanStem = q.question.replace(/^Câu\s+\d+[\.:\)]\s*/i, '');
      const optionsLabels: ("A" | "B" | "C" | "D")[] = ["A", "B", "C", "D"];

      const options: QuestionOption[] = q.options.map((opt, oIdx) => {
        const cleanOpt = opt.replace(/^[A-D][\.\)]\s*/i, '').replace(/^\.\s*/, '');
        const label = optionsLabels[oIdx] || "A";
        return {
          id: `opt-${qNum}-${label}`,
          originalLabel: label,
          currentLabel: label,
          content: {
            paragraphs: [createParagraph(cleanOpt)]
          },
          isCorrect: oIdx === q.correctIndex,
          answerSource: "document-format"
        };
      });

      return {
        id: `q-mc-${qNum}`,
        sourcePosition: {
          sectionIndex: 1,
          questionIndex: idx,
          originalNumberStr: `Câu ${qNum}.`,
          startParagraphIndex: idx * 5,
          endParagraphIndex: idx * 5 + 4
        },
        type: "MULTIPLE_CHOICE",
        stem: {
          paragraphs: [createParagraph(cleanStem, `Câu ${qNum}. `)]
        },
        options,
        allowShuffle: true,
        allowOptionShuffle: true,
        formattingMetadata: {
          hasChemicalFormulas: true,
          hasMathExpressions: false,
          imageCount: 0
        }
      };
    });

    sections.push({
      id: "sec-part-1",
      sectionIndex: 1,
      title: "PHẦN I. Câu trắc nghiệm nhiều phương án lựa chọn (18 câu - 4.5 điểm).",
      type: "MULTIPLE_CHOICE",
      shufflePolicy: {
        shuffleQuestions: true,
        shuffleOptions: true,
        shuffleTrueFalseSubItems: false
      },
      questions
    });
  }

  // 2. Part II: True / False Questions (4 scenarios)
  if (data.part2 && data.part2.length > 0) {
    const tfLabels: ("a" | "b" | "c" | "d")[] = ["a", "b", "c", "d"];
    const questions: ExamQuestion[] = data.part2.map((sc, idx) => {
      const qNum = idx + 1;
      const cleanStem = sc.context.replace(/^Câu\s+\d+[\.:\)]\s*/i, '');

      const subItems: TrueFalseSubItem[] = sc.statements.map((st, sIdx) => {
        const cleanText = st.text.replace(/^[a-d][\.\)]\s*/i, '').replace(/^\.\s*/, '');
        const label = tfLabels[sIdx] || "a";
        return {
          id: `tf-${qNum}-${label}`,
          originalLabel: label,
          currentLabel: label,
          content: {
            paragraphs: [createParagraph(cleanText)]
          },
          isCorrect: Boolean(st.isTrue),
          answerSource: "document-format"
        };
      });

      return {
        id: `q-tf-${qNum}`,
        sourcePosition: {
          sectionIndex: 2,
          questionIndex: idx,
          originalNumberStr: `Câu ${qNum}.`,
          startParagraphIndex: idx * 5,
          endParagraphIndex: idx * 5 + 4
        },
        type: "TRUE_FALSE",
        stem: {
          paragraphs: [createParagraph(cleanStem, `Câu ${qNum}. `)]
        },
        subItems,
        allowShuffle: true,
        allowOptionShuffle: false,
        formattingMetadata: {
          hasChemicalFormulas: true,
          hasMathExpressions: false,
          imageCount: 0
        }
      };
    });

    sections.push({
      id: "sec-part-2",
      sectionIndex: 2,
      title: "PHẦN II. Câu trắc nghiệm đúng sai (4 câu - 4.0 điểm).",
      type: "TRUE_FALSE",
      shufflePolicy: {
        shuffleQuestions: true,
        shuffleOptions: false,
        shuffleTrueFalseSubItems: true
      },
      questions
    });
  }

  // 3. Part III: Short Answer Questions (6 questions)
  if (data.part3 && data.part3.length > 0) {
    const questions: ExamQuestion[] = data.part3.map((sa, idx) => {
      const qNum = idx + 1;
      const cleanStem = sa.question.replace(/^Câu\s+\d+[\.:\)]\s*/i, '');
      const expectedVal = String(sa.answer).trim();

      return {
        id: `q-sa-${qNum}`,
        sourcePosition: {
          sectionIndex: 3,
          questionIndex: idx,
          originalNumberStr: `Câu ${qNum}.`,
          startParagraphIndex: idx * 2,
          endParagraphIndex: idx * 2 + 1
        },
        type: "SHORT_ANSWER",
        stem: {
          paragraphs: [createParagraph(cleanStem, `Câu ${qNum}. `)]
        },
        shortAnswer: {
          expectedValue: expectedVal,
          acceptableAnswers: [expectedVal, expectedVal.replace(".", ","), expectedVal.replace(",", ".")],
          answerSource: "document-format"
        },
        allowShuffle: true,
        allowOptionShuffle: false,
        formattingMetadata: {
          hasChemicalFormulas: true,
          hasMathExpressions: false,
          imageCount: 0
        }
      };
    });

    sections.push({
      id: "sec-part-3",
      sectionIndex: 3,
      title: "PHẦN III. Câu trắc nghiệm trả lời ngắn (6 câu - 1.5 điểm).",
      type: "SHORT_ANSWER",
      shufflePolicy: {
        shuffleQuestions: true,
        shuffleOptions: false,
        shuffleTrueFalseSubItems: false
      },
      questions
    });
  }

  return {
    schemaVersion: "1.0.0",
    metadata: {
      originalFileName: `${(data.title || "De_Thi_Hoa_Hoc").replace(/\s+/g, '_')}.docx`,
      createdAt: new Date().toISOString(),
      author: "ChemSuite AI Mixer",
      sourceDocxProperties: {
        pageWidthDxa: 11906,
        pageHeightDxa: 16838,
        marginTopDxa: 567,
        marginBottomDxa: 567,
        marginLeftDxa: 1134,
        marginRightDxa: 567,
        defaultFont: "Times New Roman",
        defaultFontSizePt: 12
      }
    },
    header: {
      schoolName: "TRƯỜNG THCS-THPT PHAN VĂN TRỊ",
      examTitle: (data.title || "KIỂM TRA HÓA HỌC").toUpperCase(),
      subject: `Hóa Học ${data.grade || "12"}`,
      durationMinutes: 45,
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
      topBorder: false
    },
    sections
  };
}
