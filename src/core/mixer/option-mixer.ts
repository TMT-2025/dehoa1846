import { QuestionOption } from "../ir/types.js";
import { cloneRichContent } from "../ir/helpers.js";
import { SeededPRNG } from "./seeded-prng.js";
import { shuffleArray } from "./permutation.js";
import { MCQAnswerMapping, OptionLabel, OptionPermutationEntry } from "./answer-mapper.js";

const LABELS: OptionLabel[] = ["A", "B", "C", "D"];

export interface OptionMixResult {
  shuffledOptions: QuestionOption[];
  mapping: MCQAnswerMapping;
}

export function mixOptions(
  questionId: string,
  options: readonly QuestionOption[],
  shuffle: boolean,
  prng: SeededPRNG
): OptionMixResult {
  if (options.length !== 4) {
    throw new Error(`Question '${questionId}' expected 4 options, got ${options.length}`);
  }

  // Deep clone options
  const clonedOptions: QuestionOption[] = options.map(opt => ({
    id: opt.id,
    originalLabel: opt.originalLabel,
    currentLabel: opt.originalLabel,
    content: cloneRichContent(opt.content),
    isCorrect: opt.isCorrect,
    answerSource: opt.answerSource,
    isPinned: opt.isPinned
  }));

  // Identify original correct option
  const originalCorrectOpt = clonedOptions.find(o => o.isCorrect);
  if (!originalCorrectOpt) {
    throw new Error(`Question '${questionId}' has no correct option marked`);
  }
  const originalCorrectLabel = originalCorrectOpt.originalLabel;

  let permutedOptions: QuestionOption[];
  if (!shuffle) {
    permutedOptions = clonedOptions;
  } else {
    permutedOptions = shuffleArray(clonedOptions, prng);
  }

  // Re-assign new labels A, B, C, D
  const permutations: OptionPermutationEntry[] = [];
  let newCorrectLabel: OptionLabel | null = null;

  for (let idx = 0; idx < permutedOptions.length; idx++) {
    const newLabel = LABELS[idx];
    const opt = permutedOptions[idx];
    opt.currentLabel = newLabel;

    permutations.push({
      originalLabel: opt.originalLabel,
      newLabel,
      optionId: opt.id,
      isCorrect: opt.isCorrect
    });

    if (opt.isCorrect) {
      newCorrectLabel = newLabel;
    }
  }

  if (!newCorrectLabel) {
    throw new Error(`Failed to map new correct option in Question '${questionId}'`);
  }

  return {
    shuffledOptions: permutedOptions,
    mapping: {
      questionId,
      originalCorrectLabel,
      newCorrectLabel,
      permutations
    }
  };
}
