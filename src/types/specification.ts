import { Grade, ExamType, CognitiveLevel } from './matrix';
import { LearningOutcomeDetail } from '../constants/learningOutcomes';

export interface SpecificationQuestionCell {
  count: number;
  questionLabels?: string[]; // e.g. ["C1", "C2"] or ["C1a (NLTN)"]
  competencyCode?: string; // Mã năng lực: NLTN, TH-VN, VDKN
}

export interface SpecificationRow {
  index: number;
  chapterName: string;
  lessonName: string;
  outcomes: LearningOutcomeDetail;
  part1: CognitiveLevel;
  part2: CognitiveLevel;
  part3: CognitiveLevel;
  part4?: CognitiveLevel;
  totalCommands: number;
  isFirstInChapter: boolean;
  chapterRowCount: number;
}

export interface SpecificationData {
  grade: Grade;
  examType: ExamType;
  title: string;
  hasEssay: boolean;
  standardCommands: number; // 27 or 40
  rows: SpecificationRow[];
  totals: {
    part1: CognitiveLevel;
    part2: CognitiveLevel;
    part3: CognitiveLevel;
    part4?: CognitiveLevel;
    totalCommands: number;
    ratio: CognitiveLevel;
    totalPoints: {
      part1: number;
      part2: number;
      part3: number;
      part4?: number;
      grandTotal: number;
      know: number;
      understand: number;
      apply: number;
    };
    percentages: {
      part1: number;
      part2: number;
      part3: number;
      part4?: number;
      know: number;
      understand: number;
      apply: number;
    };
  };
}
