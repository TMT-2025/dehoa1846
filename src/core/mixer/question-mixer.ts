import { ExamQuestion, ExamSection } from "../ir/types.js";
import { cloneRichContent } from "../ir/helpers.js";
import { SeededPRNG } from "./seeded-prng.js";
import { shuffleArray } from "./permutation.js";
import { mixOptions } from "./option-mixer.js";
import { mixTrueFalseSubItems } from "./true-false-mixer.js";
import {
  MCQAnswerMapping,
  TFAnswerMapping,
  SAAnswerMapping,
  QuestionOrderEntry
} from "./answer-mapper.js";

export interface QuestionMixingOptions {
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  shuffleTrueFalseSubItems: boolean;
}

export interface SectionMixResult {
  shuffledSection: ExamSection;
  questionOrders: QuestionOrderEntry[];
  mcqMappings: Record<string, MCQAnswerMapping>;
  tfMappings: Record<string, TFAnswerMapping>;
  saMappings: Record<string, SAAnswerMapping>;
}

export function mixSectionQuestions(
  section: Readonly<ExamSection>,
  options: QuestionMixingOptions,
  prng: SeededPRNG
): SectionMixResult {
  const mcqMappings: Record<string, MCQAnswerMapping> = {};
  const tfMappings: Record<string, TFAnswerMapping> = {};
  const saMappings: Record<string, SAAnswerMapping> = {};
  const questionOrders: QuestionOrderEntry[] = [];

  // 1. Clone questions list
  const clonedQuestions: ExamQuestion[] = section.questions.map(q => ({
    id: q.id,
    sourcePosition: { ...q.sourcePosition },
    type: q.type,
    stem: cloneRichContent(q.stem),
    options: q.options ? q.options.map(o => ({ ...o, content: cloneRichContent(o.content) })) : undefined,
    subItems: q.subItems ? q.subItems.map(s => ({ ...s, content: cloneRichContent(s.content) })) : undefined,
    shortAnswer: q.shortAnswer ? {
      ...q.shortAnswer,
      acceptableAnswers: q.shortAnswer.acceptableAnswers ? [...q.shortAnswer.acceptableAnswers] : undefined,
      sourceAnswerRaw: q.shortAnswer.sourceAnswerRaw ? cloneRichContent(q.shortAnswer.sourceAnswerRaw) : undefined
    } : undefined,
    allowShuffle: q.allowShuffle,
    allowOptionShuffle: q.allowOptionShuffle,
    formattingMetadata: { ...q.formattingMetadata }
  }));

  // 2. Permute question order if enabled
  let permutedQuestions: ExamQuestion[];
  if (!options.shuffleQuestions) {
    permutedQuestions = clonedQuestions;
  } else {
    permutedQuestions = shuffleArray(clonedQuestions, prng);
  }

  // 3. Process each question
  for (let newIdx = 0; newIdx < permutedQuestions.length; newIdx++) {
    const q = permutedQuestions[newIdx];

    questionOrders.push({
      originalIndex: q.sourcePosition.questionIndex,
      newIndex: newIdx + 1,
      questionId: q.id,
      sectionIndex: section.sectionIndex
    });

    if (q.type === "MULTIPLE_CHOICE" && q.options) {
      const shouldShuffleOpt = options.shuffleOptions && q.allowOptionShuffle;
      const optResult = mixOptions(q.id, q.options, shouldShuffleOpt, prng);
      q.options = optResult.shuffledOptions;
      mcqMappings[q.id] = optResult.mapping;
    } else if (q.type === "TRUE_FALSE" && q.subItems) {
      const shouldShuffleSub = options.shuffleTrueFalseSubItems;
      const tfResult = mixTrueFalseSubItems(q.id, q.subItems, shouldShuffleSub, prng);
      q.subItems = tfResult.shuffledSubItems;
      tfMappings[q.id] = tfResult.mapping;
    } else if (q.type === "SHORT_ANSWER" && q.shortAnswer) {
      saMappings[q.id] = {
        questionId: q.id,
        expectedValue: q.shortAnswer.expectedValue,
        acceptableAnswers: q.shortAnswer.acceptableAnswers
      };
    }
  }

  const shuffledSection: ExamSection = {
    id: section.id,
    sectionIndex: section.sectionIndex,
    groupTag: section.groupTag,
    title: section.title,
    type: section.type,
    shufflePolicy: {
      shuffleQuestions: options.shuffleQuestions,
      shuffleOptions: options.shuffleOptions,
      shuffleTrueFalseSubItems: options.shuffleTrueFalseSubItems
    },
    questions: permutedQuestions
  };

  return {
    shuffledSection,
    questionOrders,
    mcqMappings,
    tfMappings,
    saMappings
  };
}
