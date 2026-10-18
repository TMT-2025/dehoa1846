import { Grade, Chapter, MatrixData, MatrixRow, CognitiveLevel, ExamType, isPeriodicExamGrade10or11 } from '../types/matrix';
import { sortChaptersByCurriculum, sortLessonsByNumber } from '../constants/curriculum';

// Helper: Phân bố đều một số nguyên 'total' vào 'bins' ngăn/nhóm
export const distribute = (total: number, bins: number): number[] => {
  if (bins <= 0) return [];
  const base = Math.floor(total / bins);
  const remainder = total % bins;
  return Array.from({ length: bins }, (_, i) => base + (i < remainder ? 1 : 0));
};

// Helper: Phân bố mức độ nhận thức (Know, Understand, Apply) vào các ngăn dựa trên chỉ tiêu số câu
function distributeCognitiveMulti(
  counts: number[], 
  targetKnow: number, 
  targetUnderstand: number, 
  targetApply: number
): { know: number; understand: number; apply: number }[] {
  const n = counts.length;
  if (n === 0) return [];

  const totalTarget = targetKnow + targetUnderstand + targetApply;
  const cap = [...counts];
  const know = new Array(n).fill(0);
  const understand = new Array(n).fill(0);
  const apply = new Array(n).fill(0);

  // 1. Phân bổ Biết (Know)
  let remainingKnow = targetKnow;
  const idealKnow = counts.map(c => totalTarget > 0 ? (c * targetKnow) / totalTarget : 0);
  for (let i = 0; i < n; i++) {
    const k = Math.min(cap[i], Math.floor(idealKnow[i]));
    know[i] = k;
    remainingKnow -= k;
  }

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

  for (let i = 0; i < n && remainingKnow > 0; i++) {
    while (know[i] < cap[i] && remainingKnow > 0) {
      know[i]++;
      remainingKnow--;
    }
  }

  for (let i = 0; i < n; i++) {
    cap[i] -= know[i];
  }

  // 2. Phân bổ Hiểu (Understand)
  let remainingUnderstand = targetUnderstand;
  const idealUnderstand = counts.map(c => totalTarget > 0 ? (c * targetUnderstand) / totalTarget : 0);
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

  // 3. Phân bổ Vận dụng (Apply)
  let remainingApply = targetApply;
  for (let i = 0; i < n && remainingApply > 0; i++) {
    const a = Math.min(cap[i], remainingApply);
    apply[i] = a;
    remainingApply -= a;
  }

  return counts.map((_, i) => ({
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
  // Kiểm tra định dạng: Lớp 10, 11 kiểm tra định kì (giữa và cuối học kì) theo DINH DANG DE LOP 10-LOP11.docx
  const isPeriodic1011 = isPeriodicExamGrade10or11(grade, examType);

  // Cấu hình chỉ tiêu số câu và số lệnh hỏi
  // Định kì Lớp 10, 11 (21 câu - 27 lệnh - 10 điểm - Chuẩn 40% Biết, 30% Hiểu, 30% Vận dụng):
  // - P1: 12 câu trắc nghiệm 4 lựa chọn (12 lệnh = 3.0đ: 8 Biết, 4 Hiểu)
  // - P2: 2 câu Đúng/Sai (8 lệnh = 2.0đ: 4 Biết, 4 Hiểu) [Mỗi câu: 2 Biết, 2 Hiểu]
  // - P3: 4 câu trả lời ngắn (4 lệnh = 2.0đ: 4 Vận dụng)
  // - P4: 3 câu Tự luận (3 lệnh = 3.0đ: 1 Biết, 1 Hiểu, 1 Vận dụng)
  // -> Tổng điểm: Biết 4.0đ (40%), Hiểu 3.0đ (30%), Vận dụng 3.0đ (30%)
  // Đề chuẩn 40 lệnh (Lớp 12 tốt nghiệp THPT hoặc kiểm tra thường xuyên - Chuẩn 40% Biết, 30% Hiểu, 30% Vận dụng):
  // - P1: 18 câu (18 lệnh = 4.5đ: 12 Biết, 4 Hiểu, 2 Vận dụng)
  // - P2: 4 câu (16 lệnh = 4.0đ: 4 Biết, 8 Hiểu, 4 Vận dụng) [Mỗi câu: 1 Biết, 2 Hiểu, 1 Vận dụng]
  // - P3: 6 câu (6 lệnh = 1.5đ: 6 Vận dụng)
  // -> Tổng điểm: Biết 4.0đ (40%), Hiểu 3.0đ (30%), Vận dụng 3.0đ (30%)
  const targetP1 = isPeriodic1011 ? 12 : 18;
  const targetP2Hosts = isPeriodic1011 ? 2 : 4;
  const targetP3 = isPeriodic1011 ? 4 : 6;
  const targetP4 = isPeriodic1011 ? 3 : 0;
  const targetTotalCommands = isPeriodic1011 ? 27 : 40;

  // Cấu trúc cho mỗi câu Phần II:
  // Lớp 10, 11 định kì: 2 Biết, 2 Hiểu, 0 Vận dụng (Tổng 4 lệnh)
  // Lớp 12: 1 Biết, 2 Hiểu, 1 Vận dụng (Tổng 4 lệnh)
  const p2PerQuestion: CognitiveLevel = isPeriodic1011 
    ? { know: 2, understand: 2, apply: 0 } 
    : { know: 1, understand: 2, apply: 1 };

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
      totals: isPeriodic1011 ? {
        part1: { know: 8, understand: 4, apply: 0 },
        part2: { know: 4, understand: 4, apply: 0 },
        part3: { know: 0, understand: 0, apply: 4 },
        part4: { know: 1, understand: 1, apply: 1 },
        grandTotal: 27,
        ratio: { know: 13, understand: 9, apply: 5 },
        hasEssay: true
      } : {
        part1: { know: 12, understand: 4, apply: 2 },
        part2: { know: 4, understand: 8, apply: 4 },
        part3: { know: 0, understand: 0, apply: 6 },
        grandTotal: 40,
        ratio: { know: 16, understand: 12, apply: 12 },
        hasEssay: false
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

  // 2. Kiểm tra và bổ sung Phần II (2 bối cảnh với lớp 10,11 định kì; 4 bối cảnh với lớp 12)
  const existingP2Counts = chapterSubItems.map(items => items.filter(it => it.isP2Host).length);
  const totalExistingP2 = existingP2Counts.reduce((a, b) => a + b, 0);

  if (totalExistingP2 < targetP2Hosts) {
    const p2TargetPerChapter = distribute(targetP2Hosts, numChapters);
    let needed = targetP2Hosts - totalExistingP2;

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
  } else if (totalExistingP2 > targetP2Hosts) {
    // Nếu chọn dư số bối cảnh mục tiêu, bỏ bớt
    let excess = totalExistingP2 - targetP2Hosts;
    for (let cIdx = numChapters - 1; cIdx >= 0 && excess > 0; cIdx--) {
      for (let it of chapterSubItems[cIdx]) {
        if (it.isP2Host && excess > 0) {
          it.isP2Host = false;
          excess--;
        }
      }
    }
  }

  // 3. Phân bổ số câu đều nhau giữa các chương
  const targetTotalPerChapter = distribute(targetTotalCommands, numChapters);
  const actualP2CountPerChapter = chapterSubItems.map(items => items.filter(it => it.isP2Host).length);

  // Phần III: 4 câu (lớp 10, 11 định kì) hoặc 6 câu (lớp 12)
  const p3CountPerChapter = distribute(targetP3, numChapters);

  // Phần IV (Tự luận): 3 câu (lớp 10, 11 định kì) hoặc 0 câu (lớp 12)
  const p4CountPerChapter = distribute(targetP4, numChapters);
  // Phân bổ nhận thức Phần IV (1 Biết, 1 Hiểu, 1 Vận dụng) vào các chương
  const p4CognitivePerChapter = distributeCognitiveMulti(p4CountPerChapter, 1, 1, 1);

  // Phần I: Số câu = Chỉ tiêu chương - (Số câu P2 * 4) - Số câu P3 - Số câu P4
  let p1CountPerChapter = targetTotalPerChapter.map((target, cIdx) => {
    const p2Commands = actualP2CountPerChapter[cIdx] * 4;
    const p3Commands = p3CountPerChapter[cIdx];
    const p4Commands = p4CountPerChapter[cIdx];
    return Math.max(0, target - p2Commands - p3Commands - p4Commands);
  });

  // Đảm bảo tổng số câu Phần I luôn bằng targetP1 (12 hoặc 18)
  let currentP1Sum = p1CountPerChapter.reduce((a, b) => a + b, 0);
  if (currentP1Sum < targetP1) {
    let diff = targetP1 - currentP1Sum;
    for (let i = 0; i < numChapters && diff > 0; i++) {
      p1CountPerChapter[i]++;
      diff--;
    }
  } else if (currentP1Sum > targetP1) {
    let diff = currentP1Sum - targetP1;
    for (let i = numChapters - 1; i >= 0 && diff > 0; i--) {
      if (p1CountPerChapter[i] > 0) {
        p1CountPerChapter[i]--;
        diff--;
      }
    }
  }

  // 4. Phân bổ mức độ nhận thức Part 1:
  // Lớp 10,11 định kì: 12 câu (8 Biết, 4 Hiểu, 0 Vận dụng)
  // Lớp 12: 18 câu (12 Biết, 4 Hiểu, 2 Vận dụng)
  const p1CognitivePerChapter = isPeriodic1011
    ? distributeCognitiveMulti(p1CountPerChapter, 8, 4, 0)
    : distributeCognitiveMulti(p1CountPerChapter, 12, 4, 2);

  // 5. Sinh từng dòng ma trận (MatrixRow) theo từng chương
  const rows: MatrixRow[] = [];

  sortedChapters.forEach((chapter, cIdx) => {
    const items = chapterSubItems[cIdx];
    if (items.length === 0) return;

    const p1Cog = p1CognitivePerChapter[cIdx] || { know: 0, understand: 0, apply: 0 };
    const p3Count = p3CountPerChapter[cIdx] || 0;
    const p4Cog = p4CognitivePerChapter[cIdx] || { know: 0, understand: 0, apply: 0 };

    const nonP2Items = items.filter(it => !it.isP2Host);

    // Phân bổ chỉ tiêu của chương vào các mục không phải P2
    const targetReceivers = nonP2Items.length > 0 ? nonP2Items : items;
    const receiverCount = targetReceivers.length;

    const p1kDist = distribute(p1Cog.know, receiverCount);
    const p1uDist = distribute(p1Cog.understand, receiverCount);
    const p1vDist = distribute(p1Cog.apply, receiverCount);
    const p3vDist = distribute(p3Count, receiverCount);
    const p4kDist = distribute(p4Cog.know, receiverCount);
    const p4uDist = distribute(p4Cog.understand, receiverCount);
    const p4vDist = distribute(p4Cog.apply, receiverCount);

    let receiverIdx = 0;

    items.forEach(item => {
      let rowP1 = { know: 0, understand: 0, apply: 0 };
      let rowP2 = { know: 0, understand: 0, apply: 0 };
      let rowP3 = { know: 0, understand: 0, apply: 0 };
      let rowP4: CognitiveLevel | undefined = isPeriodic1011 ? { know: 0, understand: 0, apply: 0 } : undefined;

      if (item.isP2Host) {
        // Mỗi bối cảnh P.II nhận đúng cấu trúc chuẩn
        rowP2 = { ...p2PerQuestion };
      }

      // Nhận chỉ tiêu Part 1, Part 3 và Part 4 nếu thuộc nhóm nhận chỉ tiêu
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
        if (isPeriodic1011) {
          rowP4 = {
            know: p4kDist[idx] || 0,
            understand: p4uDist[idx] || 0,
            apply: p4vDist[idx] || 0
          };
        }
        receiverIdx++;
      }

      const lessonRows = items.filter(s => s.lessonId === item.lessonId);
      const itemIdxInLesson = lessonRows.indexOf(item);

      const totalCommands = (rowP1.know + rowP1.understand + rowP1.apply) +
                            (rowP2.know + rowP2.understand + rowP2.apply) +
                            (rowP3.apply) +
                            ((rowP4?.know || 0) + (rowP4?.understand || 0) + (rowP4?.apply || 0));

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
        part4: rowP4,
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

  const sumP4 = isPeriodic1011 ? rows.reduce((acc, r) => ({
    know: acc.know + (r.part4?.know || 0),
    understand: acc.understand + (r.part4?.understand || 0),
    apply: acc.apply + (r.part4?.apply || 0)
  }), { know: 0, understand: 0, apply: 0 }) : undefined;

  const grandTotal = (sumP1.know + sumP1.understand + sumP1.apply) +
                     (sumP2.know + sumP2.understand + sumP2.apply) +
                     (sumP3.apply) +
                     ((sumP4?.know || 0) + (sumP4?.understand || 0) + (sumP4?.apply || 0));

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
      part4: sumP4,
      grandTotal,
      ratio: {
        know: sumP1.know + sumP2.know + (sumP4?.know || 0),
        understand: sumP1.understand + sumP2.understand + (sumP4?.understand || 0),
        apply: sumP1.apply + sumP2.apply + sumP3.apply + (sumP4?.apply || 0)
      },
      hasEssay: isPeriodic1011
    }
  };
};
