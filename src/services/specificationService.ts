import { MatrixData, Grade, isPeriodicExamGrade10or11 } from '../types/matrix';
import { SpecificationData, SpecificationRow } from '../types/specification';
import { findLearningOutcome, LearningOutcomeDetail } from '../constants/learningOutcomes';

/**
 * Chuyển đổi MatrixData sang SpecificationData chuẩn theo Phụ lục 2 Công văn 7991/BGDĐT-GDTrH
 */
export function buildSpecificationFromMatrix(matrix: MatrixData): SpecificationData {
  const gradeNum = typeof matrix.grade === 'number' ? matrix.grade : (parseInt(String(matrix.grade), 10) || 12);
  const hasEssay = Boolean(
    isPeriodicExamGrade10or11(matrix.grade, matrix.examType) ||
    matrix.totals.hasEssay ||
    matrix.totals.part4 ||
    matrix.totals.grandTotal === 27
  );
  const standardCommands = hasEssay ? 27 : 40;

  // 1. Nhóm các hàng của ma trận theo Bài học (Chủ đề / Đơn vị kiến thức)
  interface LessonAccumulator {
    chapterName: string;
    lessonName: string;
    part1: { know: number; understand: number; apply: number };
    part2: { know: number; understand: number; apply: number };
    part3: { know: number; understand: number; apply: number };
    part4: { know: number; understand: number; apply: number };
  }

  const lessonMap = new Map<string, LessonAccumulator>();
  const chapterLessonOrder: { chapterName: string; lessonKey: string }[] = [];

  matrix.rows.forEach(row => {
    const key = `${row.content}__${row.lessonName}`;
    if (!lessonMap.has(key)) {
      lessonMap.set(key, {
        chapterName: row.content,
        lessonName: row.lessonName,
        part1: { know: 0, understand: 0, apply: 0 },
        part2: { know: 0, understand: 0, apply: 0 },
        part3: { know: 0, understand: 0, apply: 0 },
        part4: { know: 0, understand: 0, apply: 0 }
      });
      chapterLessonOrder.push({ chapterName: row.content, lessonKey: key });
    }

    const acc = lessonMap.get(key)!;
    acc.part1.know += row.part1.know;
    acc.part1.understand += row.part1.understand;
    acc.part1.apply += row.part1.apply;

    acc.part2.know += row.part2.know;
    acc.part2.understand += row.part2.understand;
    acc.part2.apply += row.part2.apply;

    acc.part3.know += row.part3.know;
    acc.part3.understand += row.part3.understand;
    acc.part3.apply += row.part3.apply;

    if (row.part4) {
      acc.part4.know += row.part4.know;
      acc.part4.understand += row.part4.understand;
      acc.part4.apply += row.part4.apply;
    }
  });

  // Đếm số hàng theo từng chương để thiết lập rowSpan
  const chapterRowCounts = new Map<string, number>();
  chapterLessonOrder.forEach(item => {
    chapterRowCounts.set(item.chapterName, (chapterRowCounts.get(item.chapterName) || 0) + 1);
  });

  // 2. Tạo các SpecificationRow
  const seenChapters = new Set<string>();
  const rows: SpecificationRow[] = chapterLessonOrder.map((item, idx) => {
    const acc = lessonMap.get(item.lessonKey)!;
    const isFirstInChapter = !seenChapters.has(item.chapterName);
    seenChapters.add(item.chapterName);

    // Tìm Yêu cầu cần đạt chuẩn
    let outcomes = findLearningOutcome(gradeNum, acc.lessonName, acc.chapterName);
    if (!outcomes) {
      // Fallback nếu bài học tùy chỉnh hoặc chưa có trong CSDL chuẩn
      outcomes = {
        recognition: [
          `Nêu và trình bày được các khái niệm, quy tắc cơ bản liên quan đến ${acc.lessonName}.`
        ],
        understanding: [
          `Giải thích được các hiện tượng, bản chất phản ứng và tính chất liên quan đến ${acc.lessonName}.`
        ],
        application: [
          `Vận dụng các kiến thức về ${acc.lessonName} vào giải quyết bài toán và tình huống thực tiễn.`
        ]
      };
    }

    const rowTotal =
      acc.part1.know + acc.part1.understand + acc.part1.apply +
      acc.part2.know + acc.part2.understand + acc.part2.apply +
      acc.part3.know + acc.part3.understand + acc.part3.apply +
      (hasEssay ? (acc.part4.know + acc.part4.understand + acc.part4.apply) : 0);

    return {
      index: idx + 1,
      chapterName: acc.chapterName,
      lessonName: acc.lessonName,
      outcomes,
      part1: acc.part1,
      part2: acc.part2,
      part3: acc.part3,
      part4: hasEssay ? acc.part4 : undefined,
      totalCommands: rowTotal,
      isFirstInChapter,
      chapterRowCount: chapterRowCounts.get(item.chapterName) || 1
    };
  });

  // 3. Tính điểm và tỉ lệ chuẩn
  const totals = { ...matrix.totals };
  const totalCommands = totals.grandTotal || standardCommands;

  let totalPoints = {
    part1: hasEssay ? 3.0 : 4.5,
    part2: hasEssay ? 2.0 : 4.0,
    part3: hasEssay ? 2.0 : 1.5,
    part4: hasEssay ? 3.0 : 0,
    grandTotal: 10.0,
    know: hasEssay ? 3.7 : 4.0,
    understand: hasEssay ? 3.3 : 3.0,
    apply: 3.0
  };

  let percentages = {
    part1: hasEssay ? 30 : 45,
    part2: hasEssay ? 20 : 40,
    part3: hasEssay ? 20 : 15,
    part4: hasEssay ? 30 : 0,
    know: hasEssay ? 37 : 40,
    understand: hasEssay ? 33 : 30,
    apply: 30
  };

  const title = `BẢN ĐẶC TẢ ĐỀ KIỂM TRA ĐỊNH KỲ MÔN HÓA HỌC - KHỐI ${matrix.grade} (${matrix.examType.toUpperCase()})`;

  return {
    grade: matrix.grade,
    examType: matrix.examType,
    title,
    hasEssay,
    standardCommands,
    rows,
    totals: {
      part1: totals.part1,
      part2: totals.part2,
      part3: totals.part3,
      part4: totals.part4,
      totalCommands,
      ratio: totals.ratio,
      totalPoints,
      percentages
    }
  };
}
