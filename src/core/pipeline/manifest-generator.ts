export interface StageBenchmark {
  totalMs: number;
  avgMsPerDoc: number;
  p50Ms: number;
  p95Ms: number;
  p99Ms: number;
}

export interface PipelineBenchmarkReport {
  parse: StageBenchmark;
  mix: StageBenchmark;
  render: StageBenchmark;
  validate: StageBenchmark;
  export: StageBenchmark;
  total: StageBenchmark;
}

export interface ExamManifest {
  manifestVersion: "1.0.0";
  generatedAt: string;
  sourceFile: string;
  templateFile: string;
  seed: number;
  configuration: {
    shuffleQuestions: boolean;
    shuffleOptions: boolean;
    shuffleTrueFalseSubItems: boolean;
  };
  examCodeStart: string;
  variantCount: number;
  examCodes: string[];
  generatedFiles: {
    studentDocx: string[];
    answerKeyFile: string;
    manifestFile: string;
    zipFile?: string;
  };
  validationStatus: {
    gate1PreParsePassed: boolean;
    gate2PostMixingPassed: boolean;
    gate3PostRenderPassed: boolean;
    allGatesPassed: boolean;
    totalErrors: number;
  };
  generationMetadata: {
    engineName: "EXAM_MIXER_CORE";
    engineVersion: "1.0.0";
    totalVariants: number;
    totalQuestionsPerVariant: number;
  };
  benchmarks: PipelineBenchmarkReport;
}

/**
 * Calculates statistical metrics (Total, Average, P50, P95, P99) from an array of sample durations in ms
 */
export function calculateStageBenchmark(durationsMs: number[], totalCount: number): StageBenchmark {
  if (durationsMs.length === 0) {
    return { totalMs: 0, avgMsPerDoc: 0, p50Ms: 0, p95Ms: 0, p99Ms: 0 };
  }

  const totalMs = durationsMs.reduce((acc, v) => acc + v, 0);
  const avgMsPerDoc = totalCount > 0 ? Number((totalMs / totalCount).toFixed(2)) : 0;

  const sorted = [...durationsMs].sort((a, b) => a - b);
  const getPercentile = (p: number): number => {
    const idx = Math.min(sorted.length - 1, Math.floor(sorted.length * p));
    return Number(sorted[idx].toFixed(2));
  };

  return {
    totalMs: Number(totalMs.toFixed(2)),
    avgMsPerDoc,
    p50Ms: getPercentile(0.50),
    p95Ms: getPercentile(0.95),
    p99Ms: getPercentile(0.99)
  };
}

export interface ManifestCreationParams {
  sourceFile: string;
  templateFile: string;
  seed: number;
  configuration: {
    shuffleQuestions: boolean;
    shuffleOptions: boolean;
    shuffleTrueFalseSubItems: boolean;
  };
  examCodeStart: string;
  variantCount: number;
  examCodes: string[];
  studentDocxFiles: string[];
  answerKeyFilename?: string;
  manifestFilename?: string;
  zipFilename?: string;
  validationPassed: {
    gate1: boolean;
    gate2: boolean;
    gate3: boolean;
  };
  benchmarks: PipelineBenchmarkReport;
}

/**
 * Builds the official EXAM_MANIFEST.json content
 */
export function buildExamManifest(params: ManifestCreationParams): ExamManifest {
  const allPassed = params.validationPassed.gate1 &&
                    params.validationPassed.gate2 &&
                    params.validationPassed.gate3;

  return {
    manifestVersion: "1.0.0",
    generatedAt: new Date().toISOString(),
    sourceFile: params.sourceFile,
    templateFile: params.templateFile,
    seed: params.seed,
    configuration: params.configuration,
    examCodeStart: params.examCodeStart,
    variantCount: params.variantCount,
    examCodes: params.examCodes,
    generatedFiles: {
      studentDocx: params.studentDocxFiles,
      answerKeyFile: params.answerKeyFilename || "answer-key.json",
      manifestFile: params.manifestFilename || "EXAM_MANIFEST.json",
      zipFile: params.zipFilename
    },
    validationStatus: {
      gate1PreParsePassed: params.validationPassed.gate1,
      gate2PostMixingPassed: params.validationPassed.gate2,
      gate3PostRenderPassed: params.validationPassed.gate3,
      allGatesPassed: allPassed,
      totalErrors: allPassed ? 0 : 1
    },
    generationMetadata: {
      engineName: "EXAM_MIXER_CORE",
      engineVersion: "1.0.0",
      totalVariants: params.variantCount,
      totalQuestionsPerVariant: 28
    },
    benchmarks: params.benchmarks
  };
}
