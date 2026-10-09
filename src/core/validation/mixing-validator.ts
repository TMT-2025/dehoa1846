import { ExamIR, ExamQuestion, QuestionOption, TrueFalseSubItem } from "../ir/types.js";
import { richContentToPlainText } from "../ir/helpers.js";
import { VariantAuditMap } from "../mixer/answer-mapper.js";

export interface MixingValidationIssue {
  code: string;
  severity: "INFO" | "WARNING" | "ERROR" | "CRITICAL";
  questionId?: string;
  message: string;
}

export interface MixingValidationReport {
  isValid: boolean;
  totalErrors: number;
  totalWarnings: number;
  issues: MixingValidationIssue[];
  metrics: {
    totalQuestions: number;
    sectionCounts: { p1: number; p2: number; p3: number };
    mcqPreservedCount: number;
    tfPreservedCount: number;
    saPreservedCount: number;
  };
}

/**
 * Validates that a generated variant is mathematically and academically sound
 * relative to the source ExamIR.
 */
export function validateMixedVariant(
  sourceExam: Readonly<ExamIR>,
  variantExam: Readonly<ExamIR>,
  auditMap?: VariantAuditMap
): MixingValidationReport {
  const issues: MixingValidationIssue[] = [];

  // 1. Total questions count
  const sourceQuestions = sourceExam.sections.flatMap(s => s.questions);
  const variantQuestions = variantExam.sections.flatMap(s => s.questions);

  if (variantQuestions.length !== 28) {
    issues.push({
      code: "VAL-MIX-TOTAL-COUNT",
      severity: "CRITICAL",
      message: `Variant total questions must be 28, found ${variantQuestions.length}`
    });
  }

  // 2. Section counts
  const vSec1 = variantExam.sections.find(s => s.sectionIndex === 1);
  const vSec2 = variantExam.sections.find(s => s.sectionIndex === 2);
  const vSec3 = variantExam.sections.find(s => s.sectionIndex === 3);

  const p1Count = vSec1 ? vSec1.questions.length : 0;
  const p2Count = vSec2 ? vSec2.questions.length : 0;
  const p3Count = vSec3 ? vSec3.questions.length : 0;

  if (p1Count !== 18) {
    issues.push({
      code: "VAL-MIX-SEC1-COUNT",
      severity: "CRITICAL",
      message: `Variant Section 1 expected 18 questions, found ${p1Count}`
    });
  }
  if (p2Count !== 4) {
    issues.push({
      code: "VAL-MIX-SEC2-COUNT",
      severity: "CRITICAL",
      message: `Variant Section 2 expected 4 questions, found ${p2Count}`
    });
  }
  if (p3Count !== 6) {
    issues.push({
      code: "VAL-MIX-SEC3-COUNT",
      severity: "CRITICAL",
      message: `Variant Section 3 expected 6 questions, found ${p3Count}`
    });
  }

  // 3 & 4. No missing question, no duplicate question ID
  const sourceQMap = new Map<string, ExamQuestion>();
  for (const q of sourceQuestions) {
    sourceQMap.set(q.id, q);
  }

  const seenQIds = new Set<string>();
  let mcqPreserved = 0;
  let tfPreserved = 0;
  let saPreserved = 0;

  for (const vQ of variantQuestions) {
    if (seenQIds.has(vQ.id)) {
      issues.push({
        code: "VAL-MIX-DUP-ID",
        severity: "CRITICAL",
        questionId: vQ.id,
        message: `Duplicate question ID '${vQ.id}' found in variant`
      });
    }
    seenQIds.add(vQ.id);

    const srcQ = sourceQMap.get(vQ.id);
    if (!srcQ) {
      issues.push({
        code: "VAL-MIX-UNKNOWN-ID",
        severity: "CRITICAL",
        questionId: vQ.id,
        message: `Question '${vQ.id}' in variant does not exist in source exam`
      });
      continue;
    }

    // 10. Stem canonical content unchanged
    const srcStemText = richContentToPlainText(srcQ.stem).trim();
    const varStemText = richContentToPlainText(vQ.stem).trim();
    if (srcStemText !== varStemText) {
      issues.push({
        code: "VAL-MIX-STEM-MUTATED",
        severity: "CRITICAL",
        questionId: vQ.id,
        message: `Stem text of question '${vQ.id}' was altered during mixing`
      });
    }

    // 12. Rich formatting metadata preserved
    if (srcQ.formattingMetadata.hasChemicalFormulas !== vQ.formattingMetadata.hasChemicalFormulas) {
      issues.push({
        code: "VAL-MIX-FMT-MUTATED",
        severity: "ERROR",
        questionId: vQ.id,
        message: `Chemical formula metadata flag mismatch for question '${vQ.id}'`
      });
    }

    // Type specific checks
    if (vQ.type === "MULTIPLE_CHOICE") {
      mcqPreserved++;

      // 5. Each MCQ has 4 options
      if (!vQ.options || vQ.options.length !== 4) {
        issues.push({
          code: "VAL-MIX-MCQ-OPTS-COUNT",
          severity: "CRITICAL",
          questionId: vQ.id,
          message: `MCQ Question '${vQ.id}' must have 4 options, found ${vQ.options ? vQ.options.length : 0}`
        });
        continue;
      }

      // 6. Exactly 1 correct answer
      const correctOpts = vQ.options.filter(o => o.isCorrect);
      if (correctOpts.length !== 1) {
        issues.push({
          code: "VAL-MIX-MCQ-CORRECT-COUNT",
          severity: "CRITICAL",
          questionId: vQ.id,
          message: `MCQ Question '${vQ.id}' has ${correctOpts.length} correct answers (expected 1)`
        });
      }

      // 11. Option content canonical match: every variant option must match an original option
      const srcOptTextMap = new Map<string, QuestionOption>();
      for (const opt of srcQ.options || []) {
        const text = richContentToPlainText(opt.content).trim();
        srcOptTextMap.set(opt.id, opt);
      }

      for (const vOpt of vQ.options) {
        const srcOpt = srcOptTextMap.get(vOpt.id);
        if (!srcOpt) {
          issues.push({
            code: "VAL-MIX-OPT-UNKNOWN",
            severity: "CRITICAL",
            questionId: vQ.id,
            message: `Option '${vOpt.id}' does not exist in source question`
          });
        } else {
          // Check that content text didn't change
          const srcText = richContentToPlainText(srcOpt.content).trim();
          const varText = richContentToPlainText(vOpt.content).trim();
          if (srcText !== varText) {
            issues.push({
              code: "VAL-MIX-OPT-CONTENT-MUTATED",
              severity: "CRITICAL",
              questionId: vQ.id,
              message: `Content of option '${vOpt.id}' in question '${vQ.id}' was altered`
            });
          }
          // Check that isCorrect status matches the original option ID
          if (srcOpt.isCorrect !== vOpt.isCorrect) {
            issues.push({
              code: "VAL-MIX-OPT-STATE-CORRUPTED",
              severity: "CRITICAL",
              questionId: vQ.id,
              message: `Option '${vOpt.id}' correctness state flipped during mixing`
            });
          }
        }
      }

      // Check audit map if provided
      if (auditMap && auditMap.mcqMappings[vQ.id]) {
        const mapping = auditMap.mcqMappings[vQ.id];
        const correctOptInVariant = vQ.options.find(o => o.isCorrect);
        if (correctOptInVariant && correctOptInVariant.currentLabel !== mapping.newCorrectLabel) {
          issues.push({
            code: "VAL-MIX-AUDIT-MISMATCH",
            severity: "CRITICAL",
            questionId: vQ.id,
            message: `Audit map newCorrectLabel (${mapping.newCorrectLabel}) does not match option label (${correctOptInVariant.currentLabel})`
          });
        }
      }
    } else if (vQ.type === "TRUE_FALSE") {
      tfPreserved++;

      // 7. TRUE_FALSE has 4 sub-items
      if (!vQ.subItems || vQ.subItems.length !== 4) {
        issues.push({
          code: "VAL-MIX-TF-SUBITEMS-COUNT",
          severity: "CRITICAL",
          questionId: vQ.id,
          message: `TRUE_FALSE Question '${vQ.id}' must have 4 sub-items, found ${vQ.subItems ? vQ.subItems.length : 0}`
        });
        continue;
      }

      // 8. Truth state matches original sub-item
      const srcSubMap = new Map<string, TrueFalseSubItem>();
      for (const s of srcQ.subItems || []) {
        srcSubMap.set(s.id, s);
      }

      for (const vSub of vQ.subItems) {
        const srcSub = srcSubMap.get(vSub.id);
        if (!srcSub) {
          issues.push({
            code: "VAL-MIX-SUB-UNKNOWN",
            severity: "CRITICAL",
            questionId: vQ.id,
            message: `Sub-item '${vSub.id}' does not exist in source question`
          });
        } else {
          if (srcSub.isCorrect !== vSub.isCorrect) {
            issues.push({
              code: "VAL-MIX-TF-STATE-CORRUPTED",
              severity: "CRITICAL",
              questionId: vQ.id,
              message: `Sub-item '${vSub.id}' truth state was corrupted`
            });
          }
          const srcText = richContentToPlainText(srcSub.content).trim();
          const varText = richContentToPlainText(vSub.content).trim();
          if (srcText !== varText) {
            issues.push({
              code: "VAL-MIX-TF-CONTENT-MUTATED",
              severity: "CRITICAL",
              questionId: vQ.id,
              message: `Sub-item '${vSub.id}' content was altered`
            });
          }
        }
      }
    } else if (vQ.type === "SHORT_ANSWER") {
      saPreserved++;

      // 9. Expected value preserved
      if (!vQ.shortAnswer || !srcQ.shortAnswer) {
        issues.push({
          code: "VAL-MIX-SA-MISSING",
          severity: "CRITICAL",
          questionId: vQ.id,
          message: `SHORT_ANSWER Question '${vQ.id}' missing answer payload`
        });
      } else if (vQ.shortAnswer.expectedValue !== srcQ.shortAnswer.expectedValue) {
        issues.push({
          code: "VAL-MIX-SA-VALUE-CORRUPTED",
          severity: "CRITICAL",
          questionId: vQ.id,
          message: `SHORT_ANSWER '${vQ.id}' expectedValue changed from '${srcQ.shortAnswer.expectedValue}' to '${vQ.shortAnswer.expectedValue}'`
        });
      }
    }
  }

  // Check for any missing questions from source
  for (const srcQ of sourceQuestions) {
    if (!seenQIds.has(srcQ.id)) {
      issues.push({
        code: "VAL-MIX-QUESTION-LOST",
        severity: "CRITICAL",
        questionId: srcQ.id,
        message: `Source question '${srcQ.id}' is missing from variant`
      });
    }
  }

  const errors = issues.filter(i => i.severity === "CRITICAL" || i.severity === "ERROR").length;
  const warnings = issues.filter(i => i.severity === "WARNING").length;

  return {
    isValid: errors === 0,
    totalErrors: errors,
    totalWarnings: warnings,
    issues,
    metrics: {
      totalQuestions: variantQuestions.length,
      sectionCounts: { p1: p1Count, p2: p2Count, p3: p3Count },
      mcqPreservedCount: mcqPreserved,
      tfPreservedCount: tfPreserved,
      saPreservedCount: saPreserved
    }
  };
}
