
export type Grade = 10 | 11 | 12 | 'Tự do';

export enum ExamType {
  REGULAR = 'Thường xuyên',
  MID_TERM_1 = 'Giữa học kỳ 1',
  END_TERM_1 = 'Cuối học kỳ 1',
  MID_TERM_2 = 'Giữa học kỳ 2',
  END_TERM_2 = 'Cuối học kỳ 2',
  CUSTOM = 'Tùy chỉnh'
}

export interface Lesson {
  id: string;
  name: string;
  subItems?: string[]; 
  part2Hosts?: string[]; // IDs or names of sub-items selected for Part II
}

export interface Chapter {
  id: string;
  name: string;
  lessons: Lesson[];
}

export interface CognitiveLevel {
  know: number;
  understand: number;
  apply: number;
}

export interface MatrixRow {
  content: string;
  lessonName: string;
  detailName: string; 
  isFirstInLesson: boolean; 
  isLastInLesson: boolean; 
  lessonRowCount: number; 
  part1: CognitiveLevel;
  part2: CognitiveLevel;
  part3: CognitiveLevel;
  total: number;
}

export interface MatrixData {
  grade: Grade;
  examType: ExamType;
  chapters: Chapter[];
  extraRequirements?: string;
  rows: MatrixRow[];
  totals: {
    part1: CognitiveLevel;
    part2: CognitiveLevel;
    part3: CognitiveLevel;
    grandTotal: number;
    ratio: CognitiveLevel;
  };
}

export interface SavedConfig {
  id: string;
  name: string;
  timestamp: number;
  grade: Grade;
  selectedChapters: Chapter[];
  examType: ExamType;
  editableLessons: Lesson[];
  extraRequirements: string;
  isCustomMode: boolean;
  customChapterName: string;
}
