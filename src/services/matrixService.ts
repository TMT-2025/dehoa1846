import { Grade, Chapter, MatrixData, MatrixRow, CognitiveLevel, ExamType } from '../types/matrix';
import { sortChaptersByCurriculum, sortLessonsByNumber } from '../constants/curriculum';

// Helper: Phân bố đều một số nguyên 'total' vào 'bins' ngăn/nhóm
export const distribute = (total: number, bins: number): number[] => {
  if (bins <= 0) return [];
  const base = Math.floor(total / bins);
  const remainder = total % bins;
  return Array.from({ length: bins }, (_, i) => base + (i < remainder ? 1 : 0));
};

// Helper: Phân bố 12 Biết, 4 Hiểu, 2 Vận dụng vào các chương theo chỉ tiêu Part 1
function distributeP1Cognitive(p1Counts: number[]): { know: number; understand: number; apply: number }[] {
  const n = p1Counts.length;
  if (n === 0) return [];

  const cap = [...p1Counts];
  const know = new Array(n).fill(0);
  const understand = new Array(n).fill(0);
  const apply = new Array(n).fill(0);

  // 1. Phân bổ 12 câu Biết (Know)
  let remainingKnow = 12;
  const idealKnow = p1Counts.map(c => (c * 12) / 18);
  for (let i = 0; i < n; i++) {
    const k = Math.min(cap[i], Math.floor(idealKnow[i]));
    know[i] = k;
    remainingKnow -= k;
  }

  // Chia phần dư của Know theo fractional remainder
  const knowRemainders = idealKnow
    .map((ideal, i) => ({ idx: i, rem: ideal - Math.floor(ideal), canAdd: cap[i] > know[i] }))
    .sort((a, b) => b.rem - a.rem);

  for (const item of knowRemainders) {
    if (remainingKnow <= 0) break;
    if (item.canAdd && know[item.idx] < cap[item.idx]) {
      know[item.idx]++;
      remainingKnow--;
    }
  }

  // Nếu vẫn còn sót Know do ràng buộc dung lượng, gán vào bất kỳ chương nào còn chỗ
  for (let i = 0; i < n && remainingKnow > 0; i++) {
    while (know[i] < cap[i] && remainingKnow > 0) {
      know[i]++;
      remainingKnow--;
    }
  }

  // Cập nhật dung lượng còn lại sau Know
  for (let i = 0; i < n; i++) {
    cap[i] -= know[i];
  }

  // 2. Phân bổ 4 câu Hiểu (Understand)
  let remainingUnderstand = 4;
  const idealUnderstand = p1Counts.map(c => (c * 4) / 18);
  for (let i = 0; i < n; i++) {
    const u = Math.min(cap[i], Math.floor(idealUnderstand[i]));
    understand[i] = u;
    remainingUnderstand -= u;
  }

  const understandRemainders = idealUnderstand
    .map((ideal, i) => ({ idx: i, rem: ideal - Math.floor(ideal), canAdd: cap[i] > understand[i] }))
    .sort((a, b) => b.rem - a.rem);

  for (const item of understandRemainders) {
    if (remainingUnderstand <= 0) break;
    if (item.canAdd && understand[item.idx] < cap[item.idx]) {
      understand[item.idx]++;
      remainingUnderstand--;
    }
  }

  for (let i = 0; i < n && remainingUnderstand > 0; i++) {
    while (understand[i] < cap[i] && remainingUnderstand > 0) {
      understand[i]++;
      remainingUnderstand--;
    }
  }

  for (let i = 0; i < n; i++) {
    cap[i] -= understand[i];
  }

  // 3. Phân bổ 2 câu Vận dụng (Apply) vào dung lượng còn lại chính xác
  for (let i = 0; i < n; i++) {
    apply[i] = cap[i];
  }

  return p1Counts.map((_, i) => ({
    know: know[i],
    understand: understand[i],
    apply: apply[i]
  }));
}

export const generateMatrix = (
  grade: Grade, 
  chapters: Chapter[], 
  examType: ExamType, 
  extraReq?: string
): MatrixData => {
  // Cấu trúc cố định cho mỗi câu Phần II: 1 Biết, 2 Hiểu, 1 Vận dụng (Tổng 4 lệnh)
  const p2PerQuestion: CognitiveLevel = { know: 1, understand: 2, apply: 1 };

  // Sắp xếp các chương và các bài học trong từng chương theo đúng thứ tự chuẩn SGK
  const sortedChapters = sortChaptersByCurriculum(chapters, grade);
  const numChapters = sortedChapters.length;

  if (numChapters === 0) {
    return {
      grade,
      examType,
      chapters: [],
      extraRequirements: extraReq,
      rows: [],
      totals: {
        part1: { know: 12, understand: 4, apply: 2 },
        part2: { know: 4, understand: 8, apply: 4 },
        part3: { know: 0, understand: 0, apply: 6 },
        grandTotal: 40,
        ratio: { know: 16, understand: 12, apply: 12 }
      }
    };
  }

  // 1. Thu thập tất cả các đề mục của từng chương
  type SubItemInfo = {
    chapterId: string;
    chapterName: string;
    chapterIndex: number;
    lessonId: string;
    lessonName: string;
    detailName: string;
    isP2Host: boolean;
  };

  const chapterSubItems: SubItemInfo[][] = [];

  sortedChapters.forEach((c, cIdx) => {
    const subsInChapter: SubItemInfo[] = [];
    const sortedLessons = sortLessonsByNumber(c.lessons);
    sortedLessons.forEach(l => {
      const subs = l.subItems && l.subItems.length > 0 ? l.subItems : ['(Nội dung chung)'];
      subs.forEach(s => {
        const isP2Host = l.part2Hosts?.includes(s) || false;
        subsInChapter.push({
          chapterId: c.id,
          chapterName: c.name,
          chapterIndex: cIdx,
          lessonId: l.id,
          lessonName: l.name,
          detailName: s,
          isP2Host
        });
      });
    });
    chapterSubItems.push(subsInChapter);
  });

  // 2. Kiểm tra và bổ sung Phần II (4 bối cảnh) phân bố đều theo các chương nếu chưa đủ 4
  const existingP2Counts = chapterSubItems.map(items => items.filter(it => it.isP2Host).length);
  const totalExistingP2 = existingP2Counts.reduce((a, b) => a + b, 0);

  if (totalExistingP2 < 4) {
    // Chỉ tiêu bối cảnh P.II phân bố đều theo số chương
    const p2TargetPerChapter = distribute(4, numChapters);
    let needed = 4 - totalExistingP2;

    for (let cIdx = 0; cIdx < numChapters && needed > 0; cIdx++) {
      const items = chapterSubItems[cIdx];
      const target = p2TargetPerChapter[cIdx];
      let currentInChapter = items.filter(it => it.isP2Host).length;

      for (let it of items) {
        if (!it.isP2Host && currentInChapter < target && needed > 0) {
          it.isP2Host = true;
          currentInChapter++;
          needed--;
        }
      }
    }

    // Nếu vẫn chưa đủ (ví dụ chương thiếu mục), gán vào bất kỳ mục nào còn lại
    if (needed > 0) {
      for (let cIdx = 0; cIdx < numChapters && needed > 0; cIdx++) {
        for (let it of chapterSubItems[cIdx]) {
          if (!it.isP2Host && needed > 0) {
            it.isP2Host = true;
            needed--;
          }
        }
      }
    }
  }

  // 3. Phân bổ số câu đều nhau giữa các chương (Mặc định cho đề kiểm tra định kì có nhiều chương)
  // Tổng chỉ tiêu cả đề: 40 lệnh (10 điểm). Mỗi chương nhận mục tiêu: distribute(40, numChapters)
  const targetTotalPerChapter = distribute(40, numChapters);
  const actualP2CountPerChapter = chapterSubItems.map(items => items.filter(it => it.isP2Host).length);

  // Phần III: 6 câu trả lời ngắn (6 lệnh Vận dụng), phân bố đều cho các chương
  const p3CountPerChapter = distribute(6, numChapters);

  // Phần I: 18 câu trắc nghiệm (18 lệnh). Mỗi chương = Chỉ tiêu chương - (Số câu P2 * 4) - Số câu P3
  let p1CountPerChapter = targetTotalPerChapter.map((target, cIdx) => {
    const p2Commands = actualP2CountPerChapter[cIdx] * 4;
    const p3Commands = p3CountPerChapter[cIdx];
    return Math.max(0, target - p2Commands - p3Commands);
  });

  // Đảm bảo tổng số câu Phần I luôn bằng 18
  let currentP1Sum = p1CountPerChapter.reduce((a, b) => a + b, 0);
  if (currentP1Sum < 18) {
    let diff = 18 - currentP1Sum;
    for (let i = 0; i < numChapters && diff > 0; i++) {
      p1CountPerChapter[i]++;
      diff--;
    }
  } else if (currentP1Sum > 18) {
    let diff = currentP1Sum - 18;
    for (let i = numChapters - 1; i >= 0 && diff > 0; i--) {
      if (p1CountPerChapter[i] > 0) {
        p1CountPerChapter[i]--;
        diff--;
      }
    }
  }

  // 4. Phân bổ mức độ nhận thức Part 1 (12 Biết, 4 Hiểu, 2 Vận dụng) vào từng chương
  const p1CognitivePerChapter = distributeP1Cognitive(p1CountPerChapter);

  // 5. Sinh từng dòng ma trận (MatrixRow) theo từng chương
  const rows: MatrixRow[] = [];

  sortedChapters.forEach((chapter, cIdx) => {
    const items = chapterSubItems[cIdx];
    if (items.length === 0) return;

    const p1Cog = p1CognitivePerChapter[cIdx] || { know: 0, understand: 0, apply: 0 };
    const p3Count = p3CountPerChapter[cIdx] || 0;

    const p2Items = items.filter(it => it.isP2Host);
    const nonP2Items = items.filter(it => !it.isP2Host);

    // Phân bổ chỉ tiêu của chương vào các mục không phải P2
    // Nếu tất cả mục trong chương đều là P2, phân bổ vào tất cả mục để bảo toàn số câu
    const targetReceivers = nonP2Items.length > 0 ? nonP2Items : items;
    const receiverCount = targetReceivers.length;

    const p1kDist = distribute(p1Cog.know, receiverCount);
    const p1uDist = distribute(p1Cog.understand, receiverCount);
    const p1vDist = distribute(p1Cog.apply, receiverCount);
    const p3vDist = distribute(p3Count, receiverCount);

    let receiverIdx = 0;

    items.forEach(item => {
      let rowP1 = { know: 0, understand: 0, apply: 0 };
      let rowP2 = { know: 0, understand: 0, apply: 0 };
      let rowP3 = { know: 0, understand: 0, apply: 0 };

      if (item.isP2Host) {
        // Mỗi bối cảnh P.II nhận đúng cấu trúc 1 Biết - 2 Hiểu - 1 Vận dụng
        rowP2 = { ...p2PerQuestion };
      }

      // Nhận chỉ tiêu Part 1 và Part 3 nếu thuộc nhóm nhận chỉ tiêu
      if (nonP2Items.length === 0 || !item.isP2Host) {
        const idx = receiverIdx;
        rowP1 = {
          know: p1kDist[idx] || 0,
          understand: p1uDist[idx] || 0,
          apply: p1vDist[idx] || 0
        };
        rowP3 = {
          know: 0,
          understand: 0,
          apply: p3vDist[idx] || 0
        };
        receiverIdx++;
      }

      const lessonRows = items.filter(s => s.lessonId === item.lessonId);
      const itemIdxInLesson = lessonRows.indexOf(item);

      const totalCommands = (rowP1.know + rowP1.understand + rowP1.apply) +
                            (rowP2.know + rowP2.understand + rowP2.apply) +
                            (rowP3.apply);

      rows.push({
        content: item.chapterName,
        lessonName: item.lessonName,
        detailName: item.detailName,
        isFirstInLesson: itemIdxInLesson === 0,
        isLastInLesson: itemIdxInLesson === lessonRows.length - 1,
        lessonRowCount: lessonRows.length,
        part1: rowP1,
        part2: rowP2,
        part3: rowP3,
        total: totalCommands
      });
    });
  });

  // 6. Tính tổng kiểm tra
  const sumP1 = rows.reduce((acc, r) => ({
    know: acc.know + r.part1.know,
    understand: acc.understand + r.part1.understand,
    apply: acc.apply + r.part1.apply
  }), { know: 0, understand: 0, apply: 0 });

  const sumP2 = rows.reduce((acc, r) => ({
    know: acc.know + r.part2.know,
    understand: acc.understand + r.part2.understand,
    apply: acc.apply + r.part2.apply
  }), { know: 0, understand: 0, apply: 0 });

  const sumP3 = rows.reduce((acc, r) => ({
    know: acc.know + r.part3.know,
    understand: acc.understand + r.part3.understand,
    apply: acc.apply + r.part3.apply
  }), { know: 0, understand: 0, apply: 0 });

  const grandTotal = (sumP1.know + sumP1.understand + sumP1.apply) +
                     (sumP2.know + sumP2.understand + sumP2.apply) +
                     (sumP3.apply);

  return {
    grade,
    examType,
    chapters: sortedChapters,
    extraRequirements: extraReq,
    rows,
    totals: {
      part1: sumP1,
      part2: sumP2,
      part3: sumP3,
      grandTotal,
      ratio: {
        know: sumP1.know + sumP2.know,
        understand: sumP1.understand + sumP2.understand,
        apply: sumP1.apply + sumP2.apply + sumP3.apply
      }
    }
  };
};
