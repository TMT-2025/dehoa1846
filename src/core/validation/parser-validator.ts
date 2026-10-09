import { ExamIR, QuestionType } from "../ir/types.js";
import { richContentToPlainText } from "../ir/helpers.js";

export interface ValidationIssue {
  code: string;
  severity: "INFO" | "WARNING" | "ERROR" | "CRITICAL";
  sectionIndex?: number;
  questionId?: string;
  message: string;
}

export interface ValidationReport {
  isValid: boolean;
  totalErrors: number;
  totalWarnings: number;
  issues: ValidationIssue[];
  summary: {
    sectionCount: number;
    mcqCount: number;
    tfCount: number;
    shortAnswerCount: number;
    totalQuestions: number;
  };
}

export function validateExamIR(exam: ExamIR): ValidationReport {
  const issues: ValidationIssue[] = [];

  // 1. Validate sections
  if (exam.sections.length !== 3) {
    issues.push({
      code: "VAL-SEC-COUNT",
      severity: "CRITICAL",
      message: `Expected 3 sections, found ${exam.sections.length}.`
    });
  }

  // Section ID uniqueness
  const sectionIds = new Set<string>();
  for (const sec of exam.sections) {
    if (sectionIds.has(sec.id)) {
      issues.push({
        code: "VAL-SEC-ID-DUPLICATE",
        severity: "CRITICAL",
        sectionIndex: sec.sectionIndex,
        message: `Duplicate section ID: '${sec.id}'.`
      });
    }
    sectionIds.add(sec.id);
  }

  // 2. Validate question counts by section
  let mcqCount = 0;
  let tfCount = 0;
  let saCount = 0;

  const sec1 = exam.sections.find(s => s.sectionIndex === 1);
  if (sec1) {
    mcqCount = sec1.questions.length;
    if (sec1.type !== "MULTIPLE_CHOICE") {
      issues.push({
        code: "VAL-SEC1-TYPE",
        severity: "CRITICAL",
        sectionIndex: 1,
        message: `Section 1 type should be MULTIPLE_CHOICE, got ${sec1.type}.`
      });
    }
    if (sec1.questions.length !== 18) {
      issues.push({
        code: "VAL-SEC1-QCOUNT",
        severity: "CRITICAL",
        sectionIndex: 1,
        message: `Section 1 expected 18 questions, found ${sec1.questions.length}.`
      });
    }
  }

  const sec2 = exam.sections.find(s => s.sectionIndex === 2);
  if (sec2) {
    tfCount = sec2.questions.length;
    if (sec2.type !== "TRUE_FALSE") {
      issues.push({
        code: "VAL-SEC2-TYPE",
        severity: "CRITICAL",
        sectionIndex: 2,
        message: `Section 2 type should be TRUE_FALSE, got ${sec2.type}.`
      });
    }
    if (sec2.questions.length !== 4) {
      issues.push({
        code: "VAL-SEC2-QCOUNT",
        severity: "CRITICAL",
        sectionIndex: 2,
        message: `Section 2 expected 4 questions, found ${sec2.questions.length}.`
      });
    }
  }

  const sec3 = exam.sections.find(s => s.sectionIndex === 3);
  if (sec3) {
    saCount = sec3.questions.length;
    if (sec3.type !== "SHORT_ANSWER") {
      issues.push({
        code: "VAL-SEC3-TYPE",
        severity: "CRITICAL",
        sectionIndex: 3,
        message: `Section 3 type should be SHORT_ANSWER, got ${sec3.type}.`
      });
    }
    if (sec3.questions.length !== 6) {
      issues.push({
        code: "VAL-SEC3-QCOUNT",
        severity: "CRITICAL",
        sectionIndex: 3,
        message: `Section 3 expected 6 questions, found ${sec3.questions.length}.`
      });
    }
  }

  const totalQuestions = exam.sections.reduce((sum, s) => sum + s.questions.length, 0);
  if (totalQuestions !== 28) {
    issues.push({
      code: "VAL-TOTAL-QCOUNT",
      severity: "CRITICAL",
      message: `Expected 28 total questions, found ${totalQuestions}.`
    });
  }

  // 3. Question IDs uniqueness & individual question validation
  const questionIds = new Set<string>();
  const allOptionIds = new Set<string>();

  for (const sec of exam.sections) {
    for (const q of sec.questions) {
      if (questionIds.has(q.id)) {
        issues.push({
          code: "VAL-Q-ID-DUPLICATE",
          severity: "CRITICAL",
          questionId: q.id,
          message: `Duplicate question ID: '${q.id}'.`
        });
      }
      questionIds.add(q.id);

      // Check empty stem
      const stemText = richContentToPlainText(q.stem).trim();
      if (stemText.length === 0) {
        issues.push({
          code: "VAL-Q-STEM-EMPTY",
          severity: "ERROR",
          questionId: q.id,
          message: `Question '${q.id}' has empty stem.`
        });
      }

      // Check MCQ
      if (q.type === "MULTIPLE_CHOICE") {
        if (!q.options || q.options.length !== 4) {
          issues.push({
            code: "VAL-MCQ-OPT-COUNT",
            severity: "CRITICAL",
            questionId: q.id,
            message: `Question '${q.id}' expected 4 options, found ${q.options ? q.options.length : 0}.`
          });
        } else {
          let correctCount = 0;
          for (const opt of q.options) {
            if (allOptionIds.has(opt.id)) {
              issues.push({
                code: "VAL-OPT-ID-DUPLICATE",
                severity: "ERROR",
                questionId: q.id,
                message: `Duplicate option ID: '${opt.id}'.`
              });
            }
            allOptionIds.add(opt.id);

            const optText = richContentToPlainText(opt.content).trim();
            if (optText.length === 0) {
              issues.push({
                code: "VAL-OPT-EMPTY",
                severity: "ERROR",
                questionId: q.id,
                message: `Option '${opt.id}' in question '${q.id}' has empty content.`
              });
            }

            if (opt.isCorrect) correctCount++;
          }

          if (correctCount === 0) {
            issues.push({
              code: "VAL-MCQ-NO-CORRECT",
              severity: "CRITICAL",
              questionId: q.id,
              message: `Question '${q.id}' has no correct option marked with underline.`
            });
          } else if (correctCount > 1) {
            issues.push({
              code: "VAL-MCQ-MULTIPLE-CORRECT",
              severity: "WARNING",
              questionId: q.id,
              message: `Question '${q.id}' has multiple options marked correct (${correctCount}).`
            });
          }
        }
      }

      // Check TRUE_FALSE
      if (q.type === "TRUE_FALSE") {
        if (!q.subItems || q.subItems.length !== 4) {
          issues.push({
            code: "VAL-TF-SUBITEMS-COUNT",
            severity: "CRITICAL",
            questionId: q.id,
            message: `TRUE_FALSE Question '${q.id}' expected 4 sub-items, found ${q.subItems ? q.subItems.length : 0}.`
          });
        } else {
          for (const sub of q.subItems) {
            const subText = richContentToPlainText(sub.content).trim();
            if (subText.length === 0) {
              issues.push({
                code: "VAL-TF-SUBITEM-EMPTY",
                severity: "ERROR",
                questionId: q.id,
                message: `Sub-item '${sub.id}' in question '${q.id}' has empty content.`
              });
            }
          }
        }
      }

      // Check SHORT_ANSWER
      if (q.type === "SHORT_ANSWER") {
        if (!q.shortAnswer || !q.shortAnswer.expectedValue || q.shortAnswer.expectedValue.trim().length === 0) {
          issues.push({
            code: "VAL-SA-NO-ANSWER",
            severity: "CRITICAL",
            questionId: q.id,
            message: `SHORT_ANSWER Question '${q.id}' is missing expected answer.`
          });
        }
      }
    }
  }

  const errors = issues.filter(i => i.severity === "CRITICAL" || i.severity === "ERROR").length;
  const warnings = issues.filter(i => i.severity === "WARNING").length;

  return {
    isValid: errors === 0,
    totalErrors: errors,
    totalWarnings: warnings,
    issues,
    summary: {
      sectionCount: exam.sections.length,
      mcqCount,
      tfCount,
      shortAnswerCount: saCount,
      totalQuestions
    }
  };
}
