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
  preserveAnswers?: boolean;
}

export interface ExamAnalysisResult {
  title: string;
  sourceType: 'ai-created' | 'uploaded-docx' | 'sample';
  examIR: ExamIR;
  sectionCounts: {
    part1: number;
    part2: number;
    part3: number;
    part4?: number;
    total: number;
  };
  examStructureType: 'lop12_totnghiep' | 'dinhki_lop10_11' | 'custom';
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
  let part4 = 0;

  for (const s of examIR.sections) {
    if (s.type === 'MULTIPLE_CHOICE') part1 += s.questions.length;
    else if (s.type === 'TRUE_FALSE') part2 += s.questions.length;
    else if (s.type === 'SHORT_ANSWER') part3 += s.questions.length;
    else if (s.type === 'ESSAY') part4 += s.questions.length;
  }

  let examStructureType: 'lop12_totnghiep' | 'dinhki_lop10_11' | 'custom' = 'custom';
  if (part1 === 18 && part2 === 4 && part3 === 6) {
    examStructureType = 'lop12_totnghiep';
  } else if (part1 === 12 && part2 === 2 && part3 === 4) {
    examStructureType = 'dinhki_lop10_11';
  }

  return {
    title: examIR.header.examTitle || sourceTitle || "Đề thi kiểm tra",
    sourceType,
    examIR,
    sectionCounts: {
      part1,
      part2,
      part3,
      part4,
      total: part1 + part2 + part3 + part4
    },
    examStructureType,
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
      templateBuffer,
      preserveAnswers: config.preserveAnswers
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

/**
 * Fisher-Yates array shuffle with PRNG
 */
function shuffleArray<T>(array: T[], prng: () => number): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(prng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function createPrng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface MixExamDataOptions {
  shuffleQuestions?: boolean;
  shuffleOptions?: boolean;
  shuffleTF?: boolean;
  seed?: number;
  examCode?: string;
}

/**
 * Mixes an ExamData structure while 100% preserving correct answers:
 * - Part 1: Shuffles question order & option order (A, B, C, D) and recalculates correctIndex
 * - Part 2: Shuffles question order & statements, keeping isTrue state
 * - Part 3: Shuffles question order, keeping answer and explanation
 * - Part 4: Preserves essay questions in pedagogical order
 */
export function mixExamDataPreservingAnswers(
  source: ExamData,
  options?: MixExamDataOptions
): ExamData {
  const shuffleQuestions = options?.shuffleQuestions ?? true;
  const shuffleOptions = options?.shuffleOptions ?? true;
  const shuffleTF = options?.shuffleTF ?? true;
  const seed = options?.seed ?? Math.floor(Math.random() * 1000000);
  const prng = createPrng(seed);

  // 1. Part 1 (MCQ)
  let mixedPart1 = (source.part1 || []).map(q => {
    const cleanStem = q.question.replace(/^Câu\s+\d+[\.:\)]\s*/i, '');
    const cleanOpts = (q.options || []).map(opt => opt.replace(/^[A-D][\.\)]\s*/i, '').trim());

    let finalOpts = cleanOpts;
    let newCorrectIndex = q.correctIndex;

    if (shuffleOptions && cleanOpts.length > 1) {
      const tracked = cleanOpts.map((text, idx) => ({
        text,
        isCorrect: idx === q.correctIndex
      }));
      const shuffledTracked = shuffleArray(tracked, prng);
      finalOpts = shuffledTracked.map(item => item.text);
      newCorrectIndex = shuffledTracked.findIndex(item => item.isCorrect);
      if (newCorrectIndex === -1) newCorrectIndex = 0;
    }

    return {
      question: cleanStem,
      options: finalOpts,
      correctIndex: newCorrectIndex
    };
  });

  if (shuffleQuestions && mixedPart1.length > 1) {
    mixedPart1 = shuffleArray(mixedPart1, prng);
  }

  // 2. Part 2 (True/False)
  let mixedPart2 = (source.part2 || []).map(sc => {
    const cleanContext = sc.context.replace(/^Câu\s+\d+[\.:\)]\s*/i, '');
    let statements = (sc.statements || []).map(st => ({
      text: st.text.replace(/^[a-d][\.\)]\s*/i, '').trim(),
      isTrue: Boolean(st.isTrue)
    }));

    if (shuffleTF && statements.length > 1) {
      statements = shuffleArray(statements, prng);
    }

    return {
      context: cleanContext,
      statements
    };
  });

  if (shuffleQuestions && mixedPart2.length > 1) {
    mixedPart2 = shuffleArray(mixedPart2, prng);
  }

  // 3. Part 3 (Short Answer)
  let mixedPart3 = (source.part3 || []).map(q => ({
    question: q.question.replace(/^Câu\s+\d+[\.:\)]\s*/i, ''),
    answer: q.answer,
    explanation: q.explanation
  }));

  if (shuffleQuestions && mixedPart3.length > 1) {
    mixedPart3 = shuffleArray(mixedPart3, prng);
  }

  // 4. Part 4 (Essay / Tự luận)
  const mixedPart4 = source.part4 ? source.part4.map(q => ({
    question: q.question.replace(/^Câu\s+\d+(\s*\([^\)]*\))?[\.:\)]\s*/i, ''),
    points: q.points,
    solution: q.solution
  })) : undefined;

  // Clean original title
  const baseTitle = source.title.replace(/\s*\(Đề trộn.*?\)/gi, '').trim();
  const codeSuffix = options?.examCode ? ` - Mã đề ${options.examCode}` : '';

  return {
    ...source,
    id: `mixed_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    title: `${baseTitle} (ĐỀ TRỘN - GIỮ NGUYÊN ĐÁP ÁN${codeSuffix})`,
    part1: mixedPart1,
    part2: mixedPart2,
    part3: mixedPart3,
    part4: mixedPart4,
    createdAt: Date.now()
  };
}
