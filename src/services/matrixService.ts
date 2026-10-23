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
      // Chỉ lấy các mục chi tiết nội dung mà người dùng thực sự chọn
      // Nếu bài học không có mục nào được chọn (người dùng đã xóa hoặc bỏ chọn hết) thì bỏ qua bài này, KHÔNG đưa vào ma trận
      if (!l.subItems || l.subItems.length === 0) return;
      l.subItems.forEach(s => {
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

  // Lọc danh sách các chương thực sự có mục nội dung được chọn để kiểm tra
  const activeChapterIndices = chapterSubItems
    .map((items, idx) => items.length > 0 ? idx : -1)
    .filter(idx => idx !== -1);
  const numActiveChapters = activeChapterIndices.length;

  if (numActiveChapters === 0) {
    return {
      grade,
      examType,
      chapters: sortedChapters,
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

  // 2. Kiểm tra và bổ sung Phần II (2 bối cảnh với lớp 10,11 định kì; 4 bối cảnh với lớp 12)
  const existingP2Counts = chapterSubItems.map(items => items.filter(it => it.isP2Host).length);
  const totalExistingP2 = existingP2Counts.reduce((a, b) => a + b, 0);

  if (totalExistingP2 < targetP2Hosts) {
    const p2TargetPerActiveChap = distribute(targetP2Hosts, numActiveChapters);
    let needed = targetP2Hosts - totalExistingP2;

    for (let aIdx = 0; aIdx < numActiveChapters && needed > 0; aIdx++) {
      const cIdx = activeChapterIndices[aIdx];
      const items = chapterSubItems[cIdx];
      const target = p2TargetPerActiveChap[aIdx];
      let currentInChapter = items.filter(it => it.isP2Host).length;

      // Ưu tiên chọn từ các bài học khác nhau trong chương để không dồn vào bài đầu
      const lessonIds = Array.from(new Set(items.map(it => it.lessonId)));
      for (const lId of lessonIds) {
        if (currentInChapter >= target || needed <= 0) break;
        const candidate = items.find(it => it.lessonId === lId && !it.isP2Host);
        if (candidate) {
          candidate.isP2Host = true;
          currentInChapter++;
          needed--;
        }
      }

      for (let it of items) {
        if (!it.isP2Host && currentInChapter < target && needed > 0) {
          it.isP2Host = true;
          currentInChapter++;
          needed--;
        }
      }
    }

    // Nếu vẫn chưa đủ (ví dụ chương thiếu mục), gán vào bất kỳ mục nào còn lại trong các chương đang hoạt động
    if (needed > 0) {
      for (let aIdx = 0; aIdx < numActiveChapters && needed > 0; aIdx++) {
        const cIdx = activeChapterIndices[aIdx];
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
    for (let aIdx = numActiveChapters - 1; aIdx >= 0 && excess > 0; aIdx--) {
      const cIdx = activeChapterIndices[aIdx];
      for (let it of chapterSubItems[cIdx]) {
        if (it.isP2Host && excess > 0) {
          it.isP2Host = false;
          excess--;
        }
      }
    }
  }

  // 3. Phân bổ số câu đều nhau giữa các chương đang có nội dung được chọn
  const targetTotalPerChapter = new Array(numChapters).fill(0);
  const targetTotalPerActiveChap = distribute(targetTotalCommands, numActiveChapters);
  activeChapterIndices.forEach((cIdx, aIdx) => {
    targetTotalPerChapter[cIdx] = targetTotalPerActiveChap[aIdx];
  });

  const actualP2CountPerChapter = chapterSubItems.map(items => items.filter(it => it.isP2Host).length);

  // Phần III: 4 câu (lớp 10, 11 định kì) hoặc 6 câu (lớp 12)
  const p3CountPerChapter = new Array(numChapters).fill(0);
  const p3CountPerActiveChap = distribute(targetP3, numActiveChapters);
  activeChapterIndices.forEach((cIdx, aIdx) => {
    p3CountPerChapter[cIdx] = p3CountPerActiveChap[aIdx];
  });

  // Phần IV (Tự luận): 3 câu (lớp 10, 11 định kì) hoặc 0 câu (lớp 12)
  const p4CountPerChapter = new Array(numChapters).fill(0);
  const p4CountPerActiveChap = distribute(targetP4, numActiveChapters);
  activeChapterIndices.forEach((cIdx, aIdx) => {
    p4CountPerChapter[cIdx] = p4CountPerActiveChap[aIdx];
  });

  const activeP4Counts = activeChapterIndices.map(cIdx => p4CountPerChapter[cIdx]);
  const activeP4Cog = distributeCognitiveMulti(activeP4Counts, 1, 1, 1);
  const p4CognitivePerChapter: { know: number; understand: number; apply: number }[] = new Array(numChapters).fill(null).map(() => ({ know: 0, understand: 0, apply: 0 }));
  activeChapterIndices.forEach((cIdx, aIdx) => {
    p4CognitivePerChapter[cIdx] = activeP4Cog[aIdx];
  });

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
    for (let i = 0; i < numActiveChapters && diff > 0; i++) {
      const cIdx = activeChapterIndices[i];
      p1CountPerChapter[cIdx]++;
      diff--;
    }
  } else if (currentP1Sum > targetP1) {
    let diff = currentP1Sum - targetP1;
    for (let i = numActiveChapters - 1; i >= 0 && diff > 0; i--) {
      const cIdx = activeChapterIndices[i];
      if (p1CountPerChapter[cIdx] > 0) {
        p1CountPerChapter[cIdx]--;
        diff--;
      }
    }
  }

  // 4. Phân bổ mức độ nhận thức Part 1:
  // Lớp 10,11 định kì: 12 câu (8 Biết, 4 Hiểu, 0 Vận dụng)
  // Lớp 12: 18 câu (12 Biết, 4 Hiểu, 2 Vận dụng)
  const activeP1Counts = activeChapterIndices.map(cIdx => p1CountPerChapter[cIdx]);
  const activeP1Cog = isPeriodic1011
    ? distributeCognitiveMulti(activeP1Counts, 8, 4, 0)
    : distributeCognitiveMulti(activeP1Counts, 12, 4, 2);
  const p1CognitivePerChapter: { know: number; understand: number; apply: number }[] = new Array(numChapters).fill(null).map(() => ({ know: 0, understand: 0, apply: 0 }));
  activeChapterIndices.forEach((cIdx, aIdx) => {
    p1CognitivePerChapter[cIdx] = activeP1Cog[aIdx];
  });

  // 5. Sinh từng dòng ma trận (MatrixRow) theo từng chương
  const rows: MatrixRow[] = [];

  sortedChapters.forEach((chapter, cIdx) => {
    const items = chapterSubItems[cIdx];
    if (items.length === 0) return;

    const p1Cog = p1CognitivePerChapter[cIdx] || { know: 0, understand: 0, apply: 0 };
    const p3Count = p3CountPerChapter[cIdx] || 0;
    const p4Cog = p4CognitivePerChapter[cIdx] || { know: 0, understand: 0, apply: 0 };

    const N = items.length;

    // Thu thập tất cả các question tokens cần phân bổ trong chương này
    interface QuestionToken {
      part: 'part1' | 'part3' | 'part4';
      level: 'know' | 'understand' | 'apply';
    }

    const tokens: QuestionToken[] = [];

    // Part 1
    for (let i = 0; i < p1Cog.know; i++) tokens.push({ part: 'part1', level: 'know' });
    for (let i = 0; i < p1Cog.understand; i++) tokens.push({ part: 'part1', level: 'understand' });
    for (let i = 0; i < p1Cog.apply; i++) tokens.push({ part: 'part1', level: 'apply' });

    // Part 3 (Luôn là Vận dụng)
    for (let i = 0; i < p3Count; i++) tokens.push({ part: 'part3', level: 'apply' });

    // Part 4 (Tự luận - nếu có)
    if (isPeriodic1011 && p4Cog) {
      for (let i = 0; i < (p4Cog.know || 0); i++) tokens.push({ part: 'part4', level: 'know' });
      for (let i = 0; i < (p4Cog.understand || 0); i++) tokens.push({ part: 'part4', level: 'understand' });
      for (let i = 0; i < (p4Cog.apply || 0); i++) tokens.push({ part: 'part4', level: 'apply' });
    }

    // Sắp xếp tokens theo mức độ nhận thức: Biết -> Hiểu -> Vận dụng
    // Giúp các mục đầu (thường là lý thuyết/khái niệm) nhận câu Biết, các mục sau nhận câu Hiểu/Vận dụng
    const levelOrder: Record<string, number> = { know: 1, understand: 2, apply: 3 };
    const partOrder: Record<string, number> = { part1: 1, part4: 2, part3: 3 };
    tokens.sort((a, b) => {
      if (levelOrder[a.level] !== levelOrder[b.level]) {
        return levelOrder[a.level] - levelOrder[b.level];
      }
      return (partOrder[a.part] || 9) - (partOrder[b.part] || 9);
    });

    const nonP2Indices = items.map((it, idx) => !it.isP2Host ? idx : -1).filter(idx => idx !== -1);

    // Xác định số lượng token mỗi mục nhận được (targetTokens)
    // Quy tắc: 
    // - Tất cả các mục chi tiết nội dung trong chương đều phải có câu hỏi.
    // - Chỉ khi số mục chi tiết nội dung > số câu hỏi trong chương thì khi đó mới có mục không có câu hỏi.
    // - Không dồn nhiều câu vào các mục đầu tiên khiến các mục bên dưới bị bỏ trống.
    const targetTokens = new Array(N).fill(0);

    if (nonP2Indices.length === 0) {
      // Trường hợp toàn bộ các mục đều là P2 host
      const dist = distribute(tokens.length, N);
      for (let i = 0; i < N; i++) {
        targetTokens[i] = dist[i];
      }
    } else if (tokens.length >= nonP2Indices.length) {
      // Số token >= số mục non-P2: MỌI mục non-P2 đều được nhận ít nhất 1 câu hỏi
      nonP2Indices.forEach(idx => {
        targetTokens[idx] = 1;
      });
      let remainingT = tokens.length - nonP2Indices.length;

      // Phân bổ đều các câu còn lại cho các mục non-P2 trước
      if (remainingT > 0) {
        const extraForNonP2 = Math.min(remainingT, nonP2Indices.length);
        const distExtra = distribute(extraForNonP2, nonP2Indices.length);
        nonP2Indices.forEach((idx, i) => {
          targetTokens[idx] += distExtra[i];
        });
        remainingT -= extraForNonP2;
      }

      // Nếu vẫn còn câu dư nữa, phân bổ đều cho tất cả N mục trong chương
      if (remainingT > 0) {
        const distAll = distribute(remainingT, N);
        for (let i = 0; i < N; i++) {
          targetTokens[i] += distAll[i];
        }
      }
    } else {
      // Số token < số mục non-P2 (chỉ xảy ra khi Mục chi tiết nội dung > số câu hỏi)
      // Trải đều các câu cho các mục non-P2 khác nhau để không có mục nào bị 2 câu trong khi mục khác 0 câu
      const M = nonP2Indices.length;
      const T = tokens.length;
      for (let k = 0; k < T; k++) {
        const chosenInNonP2 = Math.floor((k * M) / T);
        const realIdx = nonP2Indices[chosenInNonP2];
        targetTokens[realIdx] = 1;
      }
    }

    // Phân bổ các tokens theo targetTokens vào từng dòng
    let tokenIdx = 0;
    const assignedTokensPerItem: QuestionToken[][] = Array.from({ length: N }, () => []);

    for (let i = 0; i < N; i++) {
      const count = targetTokens[i];
      for (let c = 0; c < count; c++) {
        if (tokenIdx < tokens.length) {
          assignedTokensPerItem[i].push(tokens[tokenIdx++]);
        }
      }
    }

    items.forEach((item, itemIdx) => {
      let rowP1 = { know: 0, understand: 0, apply: 0 };
      let rowP2 = { know: 0, understand: 0, apply: 0 };
      let rowP3 = { know: 0, understand: 0, apply: 0 };
      let rowP4: CognitiveLevel | undefined = isPeriodic1011 ? { know: 0, understand: 0, apply: 0 } : undefined;

      if (item.isP2Host) {
        // Mỗi bối cảnh P.II nhận đúng cấu trúc chuẩn
        rowP2 = { ...p2PerQuestion };
      }

      const itemTokens = assignedTokensPerItem[itemIdx] || [];
      itemTokens.forEach(token => {
        if (token.part === 'part1') {
          rowP1[token.level]++;
        } else if (token.part === 'part3') {
          rowP3[token.level]++;
        } else if (token.part === 'part4' && rowP4) {
          rowP4[token.level]++;
        }
      });

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
