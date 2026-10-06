
import { Grade, Chapter, MatrixData, MatrixRow, CognitiveLevel, ExamType } from '../types';

export const generateMatrix = (grade: Grade, chapters: Chapter[], examType: ExamType, extraReq?: string): MatrixData => {
  const grandTotal = 40;

  // 1. Part II Fixed Internal Structure: 1 Know, 2 Understand, 1 Apply per question
  // Total for 4 questions (16 commands): 4 Know, 8 Understand, 4 Apply
  const p2PerQuestion: CognitiveLevel = { know: 1, understand: 2, apply: 1 };

  // 2. Identify all items and Part II hosts
  const allSubItems: { 
    chapterId: string;
    chapterName: string;
    lessonId: string; 
    lessonName: string; 
    detailName: string; 
    isP2Host: boolean;
  }[] = [];

  chapters.forEach(c => {
    c.lessons.forEach(l => {
      const subs = l.subItems && l.subItems.length > 0 ? l.subItems : ['(Nội dung chung)'];
      subs.forEach(s => {
        const isP2Host = l.part2Hosts?.includes(s) || false;
        allSubItems.push({ 
          chapterId: c.id, 
          chapterName: c.name, 
          lessonId: l.id, 
          lessonName: l.name, 
          detailName: s, 
          isP2Host 
        });
      });
    });
  });

  // 3. Define Total Quotas needed to reach standard 40-30-30 (16-12-12)
  // Already used by Part II (4 hosts): 4 Know, 8 Understand, 4 Apply
  // REMAINING to distribute in Part I & Part III:
  // Know: 16 - 4 = 12 (All in Part I)
  // Understand: 12 - 8 = 4 (All in Part I)
  // Apply: 12 - 4 = 8 (2 in Part I, 6 in Part III)
  
  const nonP2Items = allSubItems.filter(item => !item.isP2Host);
  const nonP2Count = nonP2Items.length;

  const distribute = (total: number, bins: number): number[] => {
    if (bins === 0) return [];
    const base = Math.floor(total / bins);
    const remainder = total % bins;
    return Array.from({ length: bins }, (_, i) => base + (i < remainder ? 1 : 0));
  };

  // 100/N Distribution for Part I (18 commands) and Part III (6 commands)
  const p1k_dist = distribute(12, nonP2Count);
  const p1u_dist = distribute(4, nonP2Count);
  const p1v_dist = distribute(2, nonP2Count);
  const p3v_dist = distribute(6, nonP2Count);

  let nonP2Idx = 0;
  const rows: MatrixRow[] = allSubItems.map((item) => {
    let rowP1 = { know: 0, understand: 0, apply: 0 };
    let rowP2 = { know: 0, understand: 0, apply: 0 };
    let rowP3 = { know: 0, understand: 0, apply: 0 };
    
    if (item.isP2Host) {
      // STRICT RULE: Each P2 host item gets exactly 1-2-1 structure
      rowP2 = { ...p2PerQuestion };
    } else {
      // 100/N distribution for non-P2 items
      rowP1 = { know: p1k_dist[nonP2Idx], understand: p1u_dist[nonP2Idx], apply: p1v_dist[nonP2Idx] };
      rowP3 = { know: 0, understand: 0, apply: p3v_dist[nonP2Idx] };
      nonP2Idx++;
    }

    const lessonRows = allSubItems.filter(s => s.lessonId === item.lessonId);
    const itemIdxInLesson = lessonRows.indexOf(item);

    return {
      content: item.chapterName,
      lessonName: item.lessonName,
      detailName: item.detailName,
      isFirstInLesson: itemIdxInLesson === 0,
      isLastInLesson: itemIdxInLesson === lessonRows.length - 1,
      lessonRowCount: lessonRows.length,
      part1: rowP1,
      part2: rowP2,
      part3: rowP3,
      total: (rowP1.know + rowP1.understand + rowP1.apply) + (rowP2.know + rowP2.understand + rowP2.apply) + rowP3.apply
    };
  });

  return {
    grade,
    examType,
    chapters,
    extraRequirements: extraReq,
    rows,
    totals: {
      part1: { know: 12, understand: 4, apply: 2 },
      part2: { know: 4, understand: 8, apply: 4 },
      part3: { know: 0, understand: 0, apply: 6 },
      grandTotal: 40,
      ratio: { know: 16, understand: 12, apply: 12 }
    }
  };
};
