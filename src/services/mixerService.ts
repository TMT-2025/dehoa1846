import { ExamData } from "../types/exam.js";
import { ExamIR } from "../core/ir/types.js";
import { parseDocx } from "../core/parser/docx-parser.js";
import { validateExamIR } from "../core/validation/parser-validator.js";
import { convertExamDataToExamIR } from "../core/converter/examDataConverter.js";
import { generateVariant, VariantExamResult } from "../core/mixer/variant-generator.js";
import { renderExamToDocx } from "../core/renderer/renderer.js";
import { loadTemplateBuffer } from "../core/renderer/template-loader.js";
import { executeGate2Validation, executeGate3Validation } from "../core/pipeline/pipeline-validator.js";
import { generateExamCodes, BatchItemResult } from "../core/pipeline/batch-generator.js";
import { generateBatchAnswerKey, BatchAnswerKeyExport } from "../core/pipeline/answer-key-generator.js";
import { generateAnswerKeyExcel } from "../core/pipeline/excel-generator.js";
import { executeExport, ExportResult } from "../core/pipeline/export-manager.js";
import { buildExamManifest, calculateStageBenchmark, ExamManifest } from "../core/pipeline/manifest-generator.js";

export interface MixerConfig {
  variantCount: number;
  examCodeStart: string | number;
  seed: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  shuffleTrueFalseSubItems: boolean;
}

export interface ExamAnalysisResult {
  title: string;
  sourceType: 'ai-created' | 'uploaded-docx' | 'sample';
  examIR: ExamIR;
  sectionCounts: {
    part1: number;
    part2: number;
    part3: number;
    total: number;
  };
  validation: {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  };
}

export interface MixerExecutionResult {
  manifest: ExamManifest;
  answerKey: BatchAnswerKeyExport;
  variants: {
    code: string;
    itemResult: BatchItemResult;
  }[];
  zipBlob: Blob;
  excelBlob: Blob;
  jsonBlob: Blob;
  durationMs: number;
}

/**
 * Analyzes an ExamData structure or an uploaded DOCX file
 */
export async function analyzeExamSource(
  source: ExamData | File | Uint8Array | ArrayBuffer,
  sourceTitle?: string
): Promise<ExamAnalysisResult> {
  let examIR: ExamIR;
  let sourceType: 'ai-created' | 'uploaded-docx' | 'sample' = 'uploaded-docx';

  // 1. Direct ExamData from ChemSuite
  if ('part1' in (source as any)) {
    sourceType = 'ai-created';
    examIR = convertExamDataToExamIR(source as ExamData);
  } else {
    // 2. File or Buffer
    let uint8: Uint8Array;
    let fileName = sourceTitle || "DeGoc.docx";

    if (source instanceof File) {
      fileName = source.name;
      const ab = await source.arrayBuffer();
      uint8 = new Uint8Array(ab);
    } else if (source instanceof ArrayBuffer) {
      uint8 = new Uint8Array(source);
    } else {
      uint8 = source as Uint8Array;
    }

    examIR = await parseDocx(uint8, { fileName });
  }

  // Quality check
  const valReport = validateExamIR(examIR);

  // Calculate question counts per section
  let part1 = 0;
  let part2 = 0;
  let part3 = 0;

  for (const s of examIR.sections) {
    if (s.type === 'MULTIPLE_CHOICE') part1 += s.questions.length;
    else if (s.type === 'TRUE_FALSE') part2 += s.questions.length;
    else if (s.type === 'SHORT_ANSWER') part3 += s.questions.length;
  }

  return {
    title: examIR.header.examTitle || sourceTitle || "Đề thi kiểm tra",
    sourceType,
    examIR,
    sectionCounts: {
      part1,
      part2,
      part3,
      total: part1 + part2 + part3
    },
    validation: {
      isValid: valReport.isValid,
      errors: valReport.issues.filter(i => i.severity === 'CRITICAL' || i.severity === 'ERROR').map(i => i.message),
      warnings: valReport.issues.filter(i => i.severity === 'WARNING').map(i => i.message)
    }
  };
}

/**
 * Executes full deterministic batch mixing pipeline and produces deliverables
 */
export async function executeMixerPipeline(
  examIR: ExamIR,
  config: MixerConfig,
  onProgress?: (stage: string, percent: number) => void
): Promise<MixerExecutionResult> {
  const tStart = performance.now();
  onProgress?.("KHỞI TẠO", 10);

  const examCodes = generateExamCodes(config.examCodeStart, config.variantCount);
  const items: BatchItemResult[] = [];
  const mixDurationsMs: number[] = [];
  const renderDurationsMs: number[] = [];
  const validateDurationsMs: number[] = [];

  const templateBuffer = loadTemplateBuffer();

  // Process variants sequentially
  for (let i = 0; i < examCodes.length; i++) {
    const examCode = examCodes[i];
    const baseProgress = 15 + Math.floor((i / examCodes.length) * 70);

    // 1. Mixing
    onProgress?.(`TRỘN MÃ ĐỀ ${examCode}`, baseProgress);
    const tMix = performance.now();
    const variantResult: VariantExamResult = generateVariant(examIR, {
      examCode,
      seed: config.seed,
      shuffleQuestions: config.shuffleQuestions,
      shuffleOptions: config.shuffleOptions,
      shuffleTrueFalseSubItems: config.shuffleTrueFalseSubItems
    });
    const mixMs = performance.now() - tMix;
    mixDurationsMs.push(mixMs);

    // Gate 2 check
    executeGate2Validation(examIR, variantResult);

    // 2. Rendering
    onProgress?.(`RENDER FILE WORD ${examCode}`, baseProgress + 10);
    const tRender = performance.now();
    const docxBytes = await renderExamToDocx(variantResult, examCode, {
      templateBuffer
    });
    const renderMs = performance.now() - tRender;
    renderDurationsMs.push(renderMs);

    // Gate 3 check
    const tVal = performance.now();
    await executeGate3Validation(docxBytes, variantResult);
    const validateMs = performance.now() - tVal;
    validateDurationsMs.push(validateMs);

    items.push({
      examCode,
      variantResult,
      docxBytes,
      timings: { mixMs, renderMs, validateMs }
    });
  }

  // 3. Answer Key generation & Excel
  onProgress?.("TẠO MA TRẬN ĐÁP ÁN EXCEL", 88);
  const tKeyStart = performance.now();
  const answerKey = generateBatchAnswerKey(items);
  const keyMs = performance.now() - tKeyStart;

  const excelBuffer = await generateAnswerKeyExcel(answerKey);

  // 4. Manifest & Export
  onProgress?.("ĐÓNG GÓI TỆP TIN ZIP", 95);
  const stageBench = calculateStageBenchmark(
    { items, timings: { mixDurationsMs, renderDurationsMs, validateDurationsMs } },
    0.05,
    keyMs
  );

  const manifestDraft: ExamManifest = {
    manifestVersion: "1.0.0",
    generatedAt: new Date().toISOString(),
    configuration: {
      seed: config.seed,
      variantCount: config.variantCount,
      examCodeStart: String(config.examCodeStart),
      shuffleQuestions: config.shuffleQuestions,
      shuffleOptions: config.shuffleOptions,
      shuffleTrueFalseSubItems: config.shuffleTrueFalseSubItems,
      sourceFileName: examIR.metadata.originalFileName,
      templateFileName: "DeSauTron.docx"
    },
    sourceExamStats: {
      totalSections: examIR.sections.length,
      totalQuestions: examIR.sections.reduce((acc, s) => acc + s.questions.length, 0),
      hasMath: false,
      hasChemistry: true
    },
    stageBenchmarks: stageBench,
    variants: [],
    deliverableFiles: []
  };

  const exportResult: ExportResult = await executeExport(
    items,
    answerKey,
    manifestDraft,
    { outputDir: "output", createZip: true, skipDiskWrite: true }
  );

  const manifest = buildExamManifest(
    manifestDraft.configuration,
    examIR,
    items,
    stageBench,
    exportResult
  );

  onProgress?.("HOÀN TẤT", 100);

  const durationMs = performance.now() - tStart;

  const zipBlob = new Blob([exportResult.zipBuffer!], { type: "application/zip" });
  const excelBlob = new Blob([excelBuffer], { 
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" 
  });
  const jsonBlob = new Blob([JSON.stringify(answerKey, null, 2)], { 
    type: "application/json" 
  });

  return {
    manifest,
    answerKey,
    variants: items.map(it => ({ code: it.examCode, itemResult: it })),
    zipBlob,
    excelBlob,
    jsonBlob,
    durationMs
  };
}
