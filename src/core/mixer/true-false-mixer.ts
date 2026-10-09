import { TrueFalseSubItem } from "../ir/types.js";
import { cloneRichContent } from "../ir/helpers.js";
import { SeededPRNG } from "./seeded-prng.js";
import { shuffleArray } from "./permutation.js";
import { TFAnswerMapping, SubItemLabel, SubItemPermutationEntry } from "./answer-mapper.js";

const SUB_LABELS: SubItemLabel[] = ["a", "b", "c", "d"];

export interface TrueFalseMixResult {
  shuffledSubItems: TrueFalseSubItem[];
  mapping: TFAnswerMapping;
}

export function mixTrueFalseSubItems(
  questionId: string,
  subItems: readonly TrueFalseSubItem[],
  shuffle: boolean,
  prng: SeededPRNG
): TrueFalseMixResult {
  if (subItems.length !== 4) {
    throw new Error(`TRUE_FALSE Question '${questionId}' expected 4 sub-items, got ${subItems.length}`);
  }

  // Deep clone sub-items
  const clonedSubItems: TrueFalseSubItem[] = subItems.map(item => ({
    id: item.id,
    originalLabel: item.originalLabel,
    currentLabel: item.originalLabel,
    content: cloneRichContent(item.content),
    isCorrect: item.isCorrect,
    answerSource: item.answerSource,
    isPinned: item.isPinned
  }));

  let permutedSubItems: TrueFalseSubItem[];
  if (!shuffle) {
    permutedSubItems = clonedSubItems;
  } else {
    permutedSubItems = shuffleArray(clonedSubItems, prng);
  }

  const permutations: SubItemPermutationEntry[] = [];
  const answers: Record<SubItemLabel, boolean> = {
    a: false,
    b: false,
    c: false,
    d: false
  };

  for (let idx = 0; idx < permutedSubItems.length; idx++) {
    const newLabel = SUB_LABELS[idx];
    const item = permutedSubItems[idx];
    item.currentLabel = newLabel;

    permutations.push({
      originalLabel: item.originalLabel,
      newLabel,
      subItemId: item.id,
      isCorrect: item.isCorrect
    });

    answers[newLabel] = item.isCorrect;
  }

  return {
    shuffledSubItems: permutedSubItems,
    mapping: {
      questionId,
      permutations,
      answers
    }
  };
}
