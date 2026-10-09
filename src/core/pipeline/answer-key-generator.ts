import { VariantExamResult } from "../mixer/variant-generator.js";
import { QuestionType } from "../ir/types.js";

export interface QuestionAnswerDetail {
  questionKey: string;     // e.g. "P1-Q01"
  sectionIndex: number;    // 1, 2, 3
  questionNumber: number;  // 1 to 18, 1 to 4, 1 to 6
  questionId: string;      // "q-mc-1", etc.
  type: QuestionType;
  answer: string | Record<string, boolean>;
}

export interface VariantAnswerKeyJson {
  examCode: string;
  answers: Record<string, string | Record<string, boolean>>;
  detailedAnswers: QuestionAnswerDetail[];
}

export interface BatchAnswerKeyExport {
  generatedAt: string;
  totalVariants: number;
  examCodes: string[];
  variants: Record<string, VariantAnswerKeyJson>;
}

/**
 * Generates an answer key JSON representation for a single variant
 */
export function generateVariantAnswerKey(variantResult: VariantExamResult): VariantAnswerKeyJson {
  const { variantExam, metadata } = variantResult;
  const examCode = metadata.examCode;
  const answers: Record<string, string | Record<string, boolean>> = {};
  const detailedAnswers: QuestionAnswerDetail[] = [];

  for (const section of variantExam.sections) {
    const secIdx = section.sectionIndex;

    for (let qIdx = 0; qIdx < section.questions.length; qIdx++) {
      const q = section.questions[qIdx];
      const qNum = qIdx + 1;
      const paddedQNum = String(qNum).padStart(2, "0");
      const questionKey = `P${secIdx}-Q${paddedQNum}`;

      if (q.type === "MULTIPLE_CHOICE") {
        const correctOpt = q.options?.find(o => o.isCorrect);
        const correctLetter = correctOpt?.currentLabel || "A";
        answers[questionKey] = correctLetter;

        detailedAnswers.push({
          questionKey,
          sectionIndex: secIdx,
          questionNumber: qNum,
          questionId: q.id,
          type: q.type,
          answer: correctLetter
        });
      } else if (q.type === "TRUE_FALSE") {
        const tfMap: Record<string, boolean> = {};
        for (const sub of q.subItems || []) {
          // Normalize sub-item label to lowercase: "a", "b", "c", "d"
          const label = (sub.currentLabel || "a").toLowerCase().replace(/[^a-d]/g, "") || "a";
          tfMap[label] = Boolean(sub.isCorrect);
        }
        answers[questionKey] = tfMap;

        detailedAnswers.push({
          questionKey,
          sectionIndex: secIdx,
          questionNumber: qNum,
          questionId: q.id,
          type: q.type,
          answer: tfMap
        });
      } else if (q.type === "SHORT_ANSWER") {
        const expectedVal = q.shortAnswer?.expectedValue || "";
        answers[questionKey] = expectedVal;

        detailedAnswers.push({
          questionKey,
          sectionIndex: secIdx,
          questionNumber: qNum,
          questionId: q.id,
          type: q.type,
          answer: expectedVal
        });
      }
    }
  }

  return {
    examCode,
    answers,
    detailedAnswers
  };
}

/**
 * Generates the unified answer-key.json object for a batch of variants
 */
export function generateBatchAnswerKey(variants: VariantExamResult[]): BatchAnswerKeyExport {
  const exportData: BatchAnswerKeyExport = {
    generatedAt: new Date().toISOString(),
    totalVariants: variants.length,
    examCodes: variants.map(v => v.metadata.examCode),
    variants: {}
  };

  for (const v of variants) {
    const keyJson = generateVariantAnswerKey(v);
    exportData.variants[v.metadata.examCode] = keyJson;
  }

  return exportData;
}

/**
 * Reconstructs answer key from Variant IR and compares against generated answer key.
 * Throws an error if any discrepancy is found.
 */
export function verifyAnswerKeyConsistency(
  variantResult: VariantExamResult,
  answerKey: VariantAnswerKeyJson
): boolean {
  if (variantResult.metadata.examCode !== answerKey.examCode) {
    throw new Error(
      `Answer key exam code mismatch: variant=${variantResult.metadata.examCode}, key=${answerKey.examCode}`
    );
  }

  const generated = generateVariantAnswerKey(variantResult);

  // Compare every key in answers
  const expectedKeys = Object.keys(generated.answers);
  const actualKeys = Object.keys(answerKey.answers);

  if (expectedKeys.length !== actualKeys.length) {
    throw new Error(
      `Answer key question count mismatch for exam ${answerKey.examCode}: expected ${expectedKeys.length}, found ${actualKeys.length}`
    );
  }

  for (const k of expectedKeys) {
    const expVal = generated.answers[k];
    const actVal = answerKey.answers[k];

    if (typeof expVal === "object" && expVal !== null) {
      // True/False object
      const expTf = expVal as Record<string, boolean>;
      const actTf = actVal as Record<string, boolean>;
      for (const subKey of ["a", "b", "c", "d"]) {
        if (expTf[subKey] !== actTf[subKey]) {
          throw new Error(
            `Answer key mismatch at ${k}.${subKey} for exam ${answerKey.examCode}: expected ${expTf[subKey]}, got ${actTf[subKey]}`
          );
        }
      }
    } else {
      if (expVal !== actVal) {
        throw new Error(
          `Answer key mismatch at ${k} for exam ${answerKey.examCode}: expected ${expVal}, got ${actVal}`
        );
      }
    }
  }

  return true;
}
