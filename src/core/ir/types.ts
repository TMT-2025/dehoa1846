/**
 * EXAM INTERMEDIATE REPRESENTATION (IR) DEFINITIONS
 * Conforms to 02_EXAM_IR_SPEC.md
 */

export type VertAlign = "baseline" | "subscript" | "superscript";

export interface DrawingReference {
  imageId: string;
  fileName: string;
  contentType: string;
  widthDxa: number;
  heightDxa: number;
}

export interface FormattedRun {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: "single" | "double" | "none" | string;
  strike?: boolean;
  vertAlign?: VertAlign;
  fontName?: string;
  fontSizeHalfPoints?: number;
  colorHex?: string;
  highlightColor?: string;
  drawingRef?: DrawingReference;
  mathXml?: string;
  isTab?: boolean;
  isLineBreak?: boolean;
}

export interface TabStopDefinition {
  positionDxa: number;
  alignment: "left" | "center" | "right";
}

export interface RichParagraph {
  runs: FormattedRun[];
  alignment?: "left" | "center" | "right" | "justify";
  spacingBeforeDxa?: number;
  spacingAfterDxa?: number;
  lineSpacingDxa?: number;
  tabStops?: TabStopDefinition[];
}

export interface RichContent {
  paragraphs: RichParagraph[];
}

export type QuestionType = "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER";

export interface QuestionOption {
  id: string;
  originalLabel: "A" | "B" | "C" | "D";
  currentLabel?: "A" | "B" | "C" | "D";
  content: RichContent;
  isCorrect: boolean;
  answerSource: "document-format" | "unspecified";
  isPinned?: boolean;
}

export interface TrueFalseSubItem {
  id: string;
  originalLabel: "a" | "b" | "c" | "d";
  currentLabel?: "a" | "b" | "c" | "d";
  content: RichContent;
  isCorrect: boolean;
  answerSource: "document-format" | "unspecified";
  isPinned?: boolean;
}

export interface ShortAnswerData {
  expectedValue: string;
  acceptableAnswers?: string[];
  sourceAnswerRaw?: RichContent;
  answerSource: "document-format" | "unspecified";
  unit?: string;
}

export interface SourcePosition {
  sectionIndex: number;
  questionIndex: number;
  originalNumberStr: string;
  startParagraphIndex: number;
  endParagraphIndex: number;
}

export interface QuestionFormattingMetadata {
  optionLayoutHint?: "auto" | "4_columns" | "2_columns" | "1_column";
  hasChemicalFormulas: boolean;
  hasMathExpressions: boolean;
  imageCount: number;
}

export interface ExamQuestion {
  id: string;
  sourcePosition: SourcePosition;
  type: QuestionType;
  stem: RichContent;
  options?: QuestionOption[];
  subItems?: TrueFalseSubItem[];
  shortAnswer?: ShortAnswerData;
  allowShuffle: boolean;
  allowOptionShuffle: boolean;
  formattingMetadata: QuestionFormattingMetadata;
}

export interface ShufflePolicy {
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  shuffleTrueFalseSubItems: boolean;
}

export interface ExamSection {
  id: string;
  sectionIndex: number;
  groupTag?: string;
  title: string;
  type: QuestionType;
  shufflePolicy: ShufflePolicy;
  questions: ExamQuestion[];
}

export interface HeaderConfig {
  schoolName?: string;
  examTitle: string;
  subject?: string;
  durationMinutes?: number;
  studentInfoFields: {
    showStudentName: boolean;
    showStudentId: boolean;
    showExamCode: boolean;
  };
  tableBorderBottomSize: number;
}

export interface FooterConfig {
  showExamCode: boolean;
  showPageNumbers: boolean;
  pageNumberFormat: "PageXofY" | "PageX";
  topBorder: boolean;
}

export interface ExamMetadata {
  originalFileName: string;
  createdAt: string;
  author?: string;
  sourceDocxProperties: {
    pageWidthDxa: number;
    pageHeightDxa: number;
    marginTopDxa: number;
    marginBottomDxa: number;
    marginLeftDxa: number;
    marginRightDxa: number;
    defaultFont: string;
    defaultFontSizePt: number;
  };
}

export interface ExamIR {
  schemaVersion: "1.0.0";
  metadata: ExamMetadata;
  header: HeaderConfig;
  footer: FooterConfig;
  sections: ExamSection[];
}
