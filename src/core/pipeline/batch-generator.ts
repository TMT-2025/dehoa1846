import { ExamIR } from "../ir/types.js";
import { QuestionMixingOptions } from "../mixer/question-mixer.js";
import { generateVariant, VariantExamResult } from "../mixer/variant-generator.js";
import { renderExamToDocx } from "../renderer/renderer.js";
import { TemplateProfile } from "../renderer/template-loader.js";
import { executeGate2Validation, executeGate3Validation } from "./pipeline-validator.js";

export interface BatchItemResult {
  examCode: string;
  variantResult: VariantExamResult;
  docxBytes: Uint8Array;
  timings: {
    mixMs: number;
    renderMs: number;
    validateMs: number;
  };
}

export interface BatchGenerationResult {
  items: BatchItemResult[];
  timings: {
    mixDurationsMs: number[];
    renderDurationsMs: number[];
    validateDurationsMs: number[];
  };
}

export interface BatchOptions {
  examCodeStart: number | string;
  variantCount: number;
  seed: number;
  mixingConfig?: Partial<QuestionMixingOptions>;
  templateBuffer: Buffer | Uint8Array;
  profile?: TemplateProfile;
}

/**
 * Computes an array of sequential exam code strings from a starting value
 */
export function generateExamCodes(start: number | string, count: number): string[] {
  const numericStart = parseInt(String(start), 10);
  const isNumeric = !isNaN(numericStart);

  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    if (isNumeric) {
      const codeNum = numericStart + i;
      // Preserve leading zeros if original had them
      const padLen = String(start).length;
      codes.push(String(codeNum).padStart(padLen, "0"));
    } else {
      codes.push(`${start}_${i + 1}`);
    }
  }

  return codes;
}

/**
 * Executes batch generation, mixing, rendering, and Gate 2 & 3 quality checks
 */
export async function executeBatchGeneration(
  sourceExam: Readonly<ExamIR>,
  options: BatchOptions
): Promise<BatchGenerationResult> {
  const examCodes = generateExamCodes(options.examCodeStart, options.variantCount);
  const items: BatchItemResult[] = [];

  const mixDurationsMs: number[] = [];
  const renderDurationsMs: number[] = [];
  const validateDurationsMs: number[] = [];

  for (const examCode of examCodes) {
    // 1. Mixing stage
    const tMixStart = performance.now();
    const variantResult = generateVariant(sourceExam, {
      examCode,
      seed: options.seed,
      shuffleQuestions: options.mixingConfig?.shuffleQuestions ?? true,
      shuffleOptions: options.mixingConfig?.shuffleOptions ?? true,
      shuffleTrueFalseSubItems: options.mixingConfig?.shuffleTrueFalseSubItems ?? false
    });
    const mixMs = performance.now() - tMixStart;
    mixDurationsMs.push(mixMs);

    // 2. Gate 2 Validation (Post-mixing)
    const tValStart = performance.now();
    executeGate2Validation(sourceExam, variantResult);

    // 3. Rendering stage
    const tRenderStart = performance.now();
    const docxBytes = await renderExamToDocx(variantResult, examCode, {
      templateBuffer: options.templateBuffer,
      profile: options.profile
    });
    const renderMs = performance.now() - tRenderStart;
    renderDurationsMs.push(renderMs);

    // 4. Gate 3 Validation (Post-rendering)
    const tValGate3Start = performance.now();
    await executeGate3Validation(docxBytes, variantResult);
    const validateMs = (performance.now() - tValStart) - renderMs; // combined validation time
    validateDurationsMs.push(validateMs);

    items.push({
      examCode,
      variantResult,
      docxBytes,
      timings: {
        mixMs,
        renderMs,
        validateMs
      }
    });
  }

  return {
    items,
    timings: {
      mixDurationsMs,
      renderDurationsMs,
      validateDurationsMs
    }
  };
}
