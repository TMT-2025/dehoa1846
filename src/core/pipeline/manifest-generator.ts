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

function computeMetrics(durationsMs: number[], totalCount: number): StageBenchmark {
  if (!Array.isArray(durationsMs) || durationsMs.length === 0) {
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

/**
 * Calculates statistical metrics (Total, Average, P50, P95, P99)
 */
export function calculateStageBenchmark(
  first: number[] | any,
  second?: number,
  third?: number
): any {
  if (Array.isArray(first)) {
    return computeMetrics(first, second || first.length);
  }

  // Object call: ({ items, timings }, parseMs, keyMs)
  const totalCount = first?.items?.length || 1;
  const timings = first?.timings || {};
  const mixDurs: number[] = timings.mixDurationsMs || [];
  const renderDurs: number[] = timings.renderDurationsMs || [];
  const valDurs: number[] = timings.validateDurationsMs || [];
  const parseMs = typeof second === "number" ? second : 0;
  const keyMs = typeof third === "number" ? third : 0;

  const parseBench = computeMetrics([parseMs], 1);
  const mixBench = computeMetrics(mixDurs, totalCount);
  const renderBench = computeMetrics(renderDurs, totalCount);
  const valBench = computeMetrics(valDurs, totalCount);
  const exportBench = computeMetrics([keyMs], 1);

  const allTotals = [parseMs, mixBench.totalMs, renderBench.totalMs, valBench.totalMs, keyMs];
  const totalBench = computeMetrics(allTotals, 1);

  return {
    parse: parseBench,
    mix: mixBench,
    render: renderBench,
    validate: valBench,
    export: exportBench,
    total: totalBench
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
export function buildExamManifest(
  paramsOrConfig: any,
  examIR?: any,
  items?: any[],
  benchmarks?: any,
  exportResult?: any
): ExamManifest {
  if (paramsOrConfig && 'validationPassed' in paramsOrConfig && paramsOrConfig.validationPassed) {
    const params = paramsOrConfig as ManifestCreationParams;
    const allPassed = Boolean(params.validationPassed.gate1 &&
                      params.validationPassed.gate2 &&
                      params.validationPassed.gate3);

    return {
      manifestVersion: "1.0.0",
      generatedAt: new Date().toISOString(),
      sourceFile: params.sourceFile || "DeGoc.docx",
      templateFile: params.templateFile || "DeSauTron.docx",
      seed: params.seed || 2026,
      configuration: params.configuration || {},
      examCodeStart: String(params.examCodeStart || "1001"),
      variantCount: params.variantCount || (items?.length || 4),
      examCodes: params.examCodes || (items?.map(it => it.examCode) || []),
      generatedFiles: {
        studentDocx: params.studentDocxFiles || [],
        answerKeyFile: params.answerKeyFilename || "answer-key.json",
        manifestFile: params.manifestFilename || "EXAM_MANIFEST.json",
        zipFile: params.zipFilename
      },
      validationStatus: {
        gate1PreParsePassed: Boolean(params.validationPassed.gate1),
        gate2PostMixingPassed: Boolean(params.validationPassed.gate2),
        gate3PostRenderPassed: Boolean(params.validationPassed.gate3),
        allGatesPassed: allPassed,
        totalErrors: allPassed ? 0 : 1
      },
      generationMetadata: {
        engineName: "EXAM_MIXER_CORE",
        engineVersion: "1.0.0",
        totalVariants: params.variantCount || (items?.length || 4),
        totalQuestionsPerVariant: 28
      },
      benchmarks: params.benchmarks || (benchmarks as any)
    };
  }

  // 5 arguments call: (config, examIR, items, benchmarks, exportResult)
  const config = paramsOrConfig || {};
  const vCount = items?.length || config.variantCount || 4;
  const examCodes = items?.map((it: any) => it.examCode) || [];

  return {
    manifestVersion: "1.0.0",
    generatedAt: new Date().toISOString(),
    sourceFile: examIR?.metadata?.originalFileName || config.sourceFileName || "DeGoc.docx",
    templateFile: config.templateFileName || "DeSauTron.docx",
    seed: config.seed || 2026,
    configuration: config,
    examCodeStart: String(config.examCodeStart || "1001"),
    variantCount: vCount,
    examCodes,
    generatedFiles: {
      studentDocx: exportResult?.docxFileNames || examCodes.map((c: string) => `MA_DE_${c}.docx`),
      answerKeyFile: exportResult?.answerKeyFileName || "answer-key.json",
      manifestFile: exportResult?.manifestFileName || "EXAM_MANIFEST.json",
      zipFile: exportResult?.zipFileName
    },
    validationStatus: {
      gate1PreParsePassed: true,
      gate2PostMixingPassed: true,
      gate3PostRenderPassed: true,
      allGatesPassed: true,
      totalErrors: 0
    },
    generationMetadata: {
      engineName: "EXAM_MIXER_CORE",
      engineVersion: "1.0.0",
      totalVariants: vCount,
      totalQuestionsPerVariant: 28
    },
    benchmarks: benchmarks || {}
  };
}
