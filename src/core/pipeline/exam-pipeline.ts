import { ExamIR } from "../ir/types.js";
import { QuestionMixingOptions } from "../mixer/question-mixer.js";
import { parseDocx } from "../parser/docx-parser.js";
import { loadTemplateBuffer, TemplateProfile } from "../renderer/template-loader.js";
import { executeGate1Validation } from "./pipeline-validator.js";
import { executeBatchGeneration, BatchItemResult } from "./batch-generator.js";
import {
  generateBatchAnswerKey,
  verifyAnswerKeyConsistency,
  BatchAnswerKeyExport
} from "./answer-key-generator.js";
import {
  buildExamManifest,
  calculateStageBenchmark,
  ExamManifest,
  PipelineBenchmarkReport
} from "./manifest-generator.js";
import { executeExport, ExportResult } from "./export-manager.js";

export interface ExamPipelineInput {
  sourceDocx: string | Uint8Array | ArrayBuffer;
  templateDocx?: string | Uint8Array | ArrayBuffer;
  examCodeStart?: number | string;
  variantCount?: number;
  seed?: number;
  mixingConfiguration?: Partial<QuestionMixingOptions>;
  outputDir?: string;
  createZip?: boolean;
  skipDiskWrite?: boolean;
  profile?: TemplateProfile;
}

export interface ExamPipelineResult {
  sourceExam: ExamIR;
  manifest: ExamManifest;
  answerKey: BatchAnswerKeyExport;
  batchItems: BatchItemResult[];
  exportResult: ExportResult;
  benchmarks: PipelineBenchmarkReport;
}

function toUint8Array(data: any): Uint8Array {
  if (data instanceof Uint8Array) return data;
  if (data instanceof ArrayBuffer) return new Uint8Array(data);
  if (typeof Buffer !== "undefined" && Buffer.isBuffer(data)) return new Uint8Array(data);
  return new Uint8Array(data);
}

/**
 * End-to-End Exam Mixer Pipeline Orchestrator (Browser & Server universal)
 */
export async function runExamPipeline(input: ExamPipelineInput): Promise<ExamPipelineResult> {
  const tTotalStart = performance.now();

  const examCodeStart = input.examCodeStart ?? 101;
  const variantCount = input.variantCount ?? 1;
  const seed = input.seed ?? 20260924;
  const outputDir = input.outputDir ?? "output";
  const createZip = input.createZip ?? true;
  const skipDiskWrite = input.skipDiskWrite ?? true;

  const mixingConfig: QuestionMixingOptions = {
    shuffleQuestions: input.mixingConfiguration?.shuffleQuestions ?? true,
    shuffleOptions: input.mixingConfiguration?.shuffleOptions ?? true,
    shuffleTrueFalseSubItems: input.mixingConfiguration?.shuffleTrueFalseSubItems ?? false
  };

  // 1. Source DOCX buffer
  const sourceFileName = "source.docx";
  const sourceBuffer = toUint8Array(input.sourceDocx);

  // 2. Template DOCX buffer
  let templateBuffer: Uint8Array;
  if (input.templateDocx) {
    templateBuffer = toUint8Array(input.templateDocx);
  } else {
    templateBuffer = loadTemplateBuffer();
  }

  // 3. Stage 1: Parse DOCX to ExamIR
  const tParseStart = performance.now();
  const sourceExam = await parseDocx(sourceBuffer, { fileName: sourceFileName });
  const parseMs = performance.now() - tParseStart;

  // 4. Quality Gate 1: Validation
  executeGate1Validation(sourceExam);

  // 5. Stages 2-4: Batch Generation (Mixing, Rendering, Validation Gates 2 & 3)
  const batchResult = await executeBatchGeneration(sourceExam, {
    examCodeStart,
    variantCount,
    seed,
    mixingConfig,
    templateBuffer,
    profile: input.profile
  });

  // 6. Stage 5: Export packaging
  const tKeyStart = performance.now();
  const answerKey = generateBatchAnswerKey(batchResult.items);
  verifyAnswerKeyConsistency(batchResult.items, answerKey);
  const keyMs = performance.now() - tKeyStart;

  const stageBench = calculateStageBenchmark(batchResult, parseMs, keyMs);

  const manifestDraft: ExamManifest = {
    manifestVersion: "1.0.0",
    generatedAt: new Date().toISOString(),
    configuration: {
      seed,
      variantCount,
      examCodeStart: String(examCodeStart),
      shuffleQuestions: mixingConfig.shuffleQuestions,
      shuffleOptions: mixingConfig.shuffleOptions,
      shuffleTrueFalseSubItems: mixingConfig.shuffleTrueFalseSubItems,
      sourceFileName,
      templateFileName: "DeSauTron.docx"
    },
    sourceExamStats: {
      totalSections: sourceExam.sections.length,
      totalQuestions: sourceExam.sections.reduce((acc, s) => acc + s.questions.length, 0),
      hasMath: sourceExam.metadata.sourceDocxProperties.defaultFont.includes("Cambria Math"),
      hasChemistry: true
    },
    stageBenchmarks: stageBench,
    variants: [],
    deliverableFiles: []
  };

  const exportResult = await executeExport(
    batchResult.items,
    answerKey,
    manifestDraft,
    { outputDir, createZip, skipDiskWrite }
  );

  const totalTimeMs = performance.now() - tTotalStart;
  const manifest = buildExamManifest(
    manifestDraft.configuration,
    sourceExam,
    batchResult.items,
    stageBench,
    exportResult
  );

  const benchmarks: PipelineBenchmarkReport = {
    totalDurationMs: totalTimeMs,
    avgDurationPerVariantMs: totalTimeMs / variantCount,
    stageBenchmarks: stageBench
  };

  return {
    sourceExam,
    manifest,
    answerKey,
    batchItems: batchResult.items,
    exportResult,
    benchmarks
  };
}
