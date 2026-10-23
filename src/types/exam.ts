export interface MCQQuestion {
  question: string;
  options: string[]; 
  correctIndex: number;
  chapter?: string;
  lesson?: string;
  level?: string;
}

export interface Statement {
  text: string;
  isTrue: boolean;
  level?: string;
}

export interface TFScenario {
  context: string;
  statements: Statement[];
  chapter?: string;
  lesson?: string;
}

export interface ShortAnswerQuestion {
  question: string;
  answer: string | number;
  explanation?: string;
  chapter?: string;
  lesson?: string;
}

export interface EssayQuestion {
  question: string;
  points: number; // Điểm số, ví dụ 1.0 điểm
  solution?: string; // Hướng dẫn chấm chi tiết và thang điểm
  chapter?: string;
  lesson?: string;
  level?: string;
}

export interface ExamMatrixRow {
  topic: string;
  recognition: number;   // Nhận biết
  understanding: number; // Thông hiểu
  application: number;   // Vận dụng
  highApplication: number; // Vận dụng cao
}

export interface ExamData {
  id?: string;
  title: string;
  grade: string;
  examType?: string;
  createdAt?: number;
  part1: MCQQuestion[];
  part2: TFScenario[];
  part3: ShortAnswerQuestion[];
  part4?: EssayQuestion[];
  matrix: ExamMatrixRow[];
  sourceMatrixId?: string;
  sourceMatrixName?: string;
  sourceMatrixData?: any;
  matrixVerified?: boolean;
  questionBlueprint?: string;
  examCode?: string;
}

export enum AppStatus {
  IDLE = 'IDLE',
  GENERATING = 'GENERATING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

export type GradeLevel = '10' | '11' | '12';
