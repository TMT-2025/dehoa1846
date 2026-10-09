export type OptionLabel = "A" | "B" | "C" | "D";
export type SubItemLabel = "a" | "b" | "c" | "d";

export interface OptionPermutationEntry {
  originalLabel: OptionLabel;
  newLabel: OptionLabel;
  optionId: string;
  isCorrect: boolean;
}

export interface MCQAnswerMapping {
  questionId: string;
  originalCorrectLabel: OptionLabel;
  newCorrectLabel: OptionLabel;
  permutations: OptionPermutationEntry[];
}

export interface SubItemPermutationEntry {
  originalLabel: SubItemLabel;
  newLabel: SubItemLabel;
  subItemId: string;
  isCorrect: boolean; // True/False state
}

export interface TFAnswerMapping {
  questionId: string;
  permutations: SubItemPermutationEntry[];
  answers: Record<SubItemLabel, boolean>;
}

export interface SAAnswerMapping {
  questionId: string;
  expectedValue: string;
  acceptableAnswers?: string[];
}

export interface QuestionOrderEntry {
  originalIndex: number;
  newIndex: number;
  questionId: string;
  sectionIndex: number;
}

export interface VariantAuditMap {
  examCode: string;
  seed: number;
  questionOrder: QuestionOrderEntry[];
  mcqMappings: Record<string, MCQAnswerMapping>;
  tfMappings: Record<string, TFAnswerMapping>;
  saMappings: Record<string, SAAnswerMapping>;
}

export interface VariantAnswerKey {
  examCode: string;
  mcqAnswers: Record<string, OptionLabel>; // questionId -> newCorrectLabel
  tfAnswers: Record<string, Record<SubItemLabel, boolean>>; // questionId -> { a: true, b: false... }
  saAnswers: Record<string, string>; // questionId -> expectedValue
}

/**
 * Creates an empty audit map for a variant
 */
export function createEmptyAuditMap(examCode: string, seed: number): VariantAuditMap {
  return {
    examCode,
    seed,
    questionOrder: [],
    mcqMappings: {},
    tfMappings: {},
    saMappings: {}
  };
}

/**
 * Derives a clean student scoring answer key from the audit map
 */
export function deriveAnswerKey(auditMap: VariantAuditMap): VariantAnswerKey {
  const mcqAnswers: Record<string, OptionLabel> = {};
  for (const [qId, map] of Object.entries(auditMap.mcqMappings)) {
    mcqAnswers[qId] = map.newCorrectLabel;
  }

  const tfAnswers: Record<string, Record<SubItemLabel, boolean>> = {};
  for (const [qId, map] of Object.entries(auditMap.tfMappings)) {
    tfAnswers[qId] = { ...map.answers };
  }

  const saAnswers: Record<string, string> = {};
  for (const [qId, map] of Object.entries(auditMap.saMappings)) {
    saAnswers[qId] = map.expectedValue;
  }

  return {
    examCode: auditMap.examCode,
    mcqAnswers,
    tfAnswers,
    saAnswers
  };
}
