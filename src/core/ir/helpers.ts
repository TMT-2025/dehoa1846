import { FormattedRun, RichContent, RichParagraph, ExamIR, ExamQuestion } from "./types.js";

export function formattedRunToPlainText(run: FormattedRun): string {
  if (run.isTab) return "\t";
  if (run.isLineBreak) return "\n";
  return run.text;
}

export function richParagraphToPlainText(p: RichParagraph): string {
  return p.runs.map(formattedRunToPlainText).join("");
}

export function richContentToPlainText(content: RichContent): string {
  return content.paragraphs.map(richParagraphToPlainText).join("\n");
}

export function cloneFormattedRun(run: FormattedRun): FormattedRun {
  return { ...run };
}

export function cloneRichParagraph(p: RichParagraph): RichParagraph {
  return {
    runs: p.runs.map(cloneFormattedRun),
    alignment: p.alignment,
    spacingBeforeDxa: p.spacingBeforeDxa,
    spacingAfterDxa: p.spacingAfterDxa,
    lineSpacingDxa: p.lineSpacingDxa,
    tabStops: p.tabStops ? [...p.tabStops] : undefined
  };
}

export function cloneRichContent(content: RichContent): RichContent {
  return {
    paragraphs: content.paragraphs.map(cloneRichParagraph)
  };
}

export function countQuestions(exam: ExamIR): number {
  return exam.sections.reduce((total, sec) => total + sec.questions.length, 0);
}

export function getAllQuestions(exam: ExamIR): ExamQuestion[] {
  return exam.sections.flatMap(sec => sec.questions);
}

export function getQuestionById(exam: ExamIR, questionId: string): ExamQuestion | undefined {
  for (const sec of exam.sections) {
    const q = sec.questions.find(item => item.id === questionId);
    if (q) return q;
  }
  return undefined;
}
