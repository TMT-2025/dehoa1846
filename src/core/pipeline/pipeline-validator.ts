import JSZip from "jszip";
import { ExamIR } from "../ir/types.js";
import { VariantExamResult } from "../mixer/variant-generator.js";
import { validateExamIR, ValidationReport } from "../validation/parser-validator.js";
import { validateMixedVariant, MixingValidationReport } from "../validation/mixing-validator.js";
import { validateRenderedDocx, RenderValidationReport } from "../validation/render-validator.js";

export type QualityGateName = "GATE_1_PRE_PARSE" | "GATE_2_POST_MIXING" | "GATE_3_POST_RENDER";

export class PipelineQualityGateError extends Error {
  public readonly gate: QualityGateName;
  public readonly issues: any[];

  constructor(gate: QualityGateName, message: string, issues: any[] = []) {
    super(`[PipelineQualityGateError - ${gate}] ${message}`);
    this.name = "PipelineQualityGateError";
    this.gate = gate;
    this.issues = issues;
  }
}

/**
 * Gate 1: Pre-parse & Post-parse validation
 * Verifies DOCX binary structure and parsed ExamIR academic schema
 */
export async function executeGate1Validation(
  sourceDocxBuffer: Buffer | Uint8Array,
  parsedExam: ExamIR
): Promise<ValidationReport> {
  // Pre-parse check: Is it a valid ZIP containing word/document.xml?
  try {
    const zip = await JSZip.loadAsync(sourceDocxBuffer);
    if (!zip.file("word/document.xml")) {
      throw new PipelineQualityGateError(
        "GATE_1_PRE_PARSE",
        "Source DOCX package is missing required 'word/document.xml' part."
      );
    }
  } catch (err: any) {
    if (err instanceof PipelineQualityGateError) throw err;
    throw new PipelineQualityGateError(
      "GATE_1_PRE_PARSE",
      `Source DOCX is corrupt or not a valid ZIP/OpenXML package: ${err.message}`
    );
  }

  // Post-parse check: Validate ExamIR
  const report = validateExamIR(parsedExam);
  if (!report.isValid) {
    throw new PipelineQualityGateError(
      "GATE_1_PRE_PARSE",
      `Parsed ExamIR failed validation with ${report.totalErrors} error(s).`,
      report.issues
    );
  }

  return report;
}

/**
 * Gate 2: Post-mixing validation for a single variant
 * Verifies question count, section integrity, option integrity, answer correctness preservation
 */
export function executeGate2Validation(
  sourceExam: Readonly<ExamIR>,
  variantResult: Readonly<VariantExamResult>
): MixingValidationReport {
  const report = validateMixedVariant(
    sourceExam,
    variantResult.variantExam,
    variantResult.auditMap
  );

  if (!report.isValid) {
    throw new PipelineQualityGateError(
      "GATE_2_POST_MIXING",
      `Variant ${variantResult.metadata.examCode} failed mixing validation with ${report.totalErrors} error(s).`,
      report.issues
    );
  }

  return report;
}

/**
 * Gate 3: Post-render validation for a single rendered DOCX
 * Verifies OpenXML package validity, zero answer leakage, dynamic fields, and styling
 */
export async function executeGate3Validation(
  renderedDocxBuffer: Buffer | Uint8Array,
  variantResult: Readonly<VariantExamResult>
): Promise<RenderValidationReport> {
  const report = await validateRenderedDocx(renderedDocxBuffer, variantResult);

  if (!report.isValid) {
    throw new PipelineQualityGateError(
      "GATE_3_POST_RENDER",
      `Rendered DOCX for variant ${variantResult.metadata.examCode} failed validation with ${report.totalErrors} error(s).`,
      report.issues
    );
  }

  return report;
}
