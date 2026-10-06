
export interface MCQQuestion {
  question: string;
  options: string[]; 
  correctIndex: number;
}

export interface Statement {
  text: string;
  isTrue: boolean;
}

export interface TFScenario {
  context: string;
  statements: Statement[];
}

export interface ShortAnswerQuestion {
  question: string;
  answer: string | number;
  explanation?: string;
}

export interface MatrixRow {
  topic: string;
  recognition: number;   // Nhận biết
  understanding: number; // Thông hiểu
  application: number;   // Vận dụng
  highApplication: number; // Vận dụng cao
}

export interface ExamData {
  title: string;
  grade: string;
  part1: MCQQuestion[];
  part2: TFScenario[];
  part3: ShortAnswerQuestion[];
  matrix: MatrixRow[];
}

export enum AppStatus {
  IDLE = 'IDLE',
  GENERATING = 'GENERATING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

export type GradeLevel = '10' | '11' | '12';
