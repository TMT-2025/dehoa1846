import { MatrixData, isPeriodicExamGrade10or11 } from '../types/matrix';
import { ExamMatrixRow } from '../types/exam';

export interface BridgeResult {
  grade: '10' | '11' | '12';
  topics: string[];
  examMatrix: ExamMatrixRow[];
  extraDetailsPrompt: string;
  summaryText: string;
  hasEssay?: boolean;
  sourceMatrixName?: string;
  suggestedExamTitle?: string;
  sourceMatrixData?: MatrixData;
  questionBlueprint?: string;
}

/**
 * Tạo Bản phân bổ chi tiết 100% từng câu hỏi từ ma trận đã thiết kế
 * Giúp mô hình AI tạo đề bám sát tuyệt đối theo từng câu, từng chương, từng bài, từng nội dung và mức độ nhận thức
 */
export function generateDetailedQuestionBlueprint(matrixData: MatrixData): string {
  const isPeriodic1011 = isPeriodicExamGrade10or11(matrixData.grade, matrixData.examType) ||
    Boolean(
      matrixData.totals.hasEssay || 
      matrixData.totals.part4 || 
      matrixData.totals.grandTotal === 27 ||
      matrixData.rows.some(r => r.part4 && (r.part4.know + r.part4.understand + r.part4.apply > 0))
    );

  const targetP1 = isPeriodic1011 ? 12 : 18;
  const targetP2 = isPeriodic1011 ? 2 : 4;
  const targetP3 = isPeriodic1011 ? 4 : 6;
  const targetP4 = isPeriodic1011 ? 3 : 0;

  // 1. Thu thập danh sách câu hỏi Phần I
  const p1Items: { chapter: string; lesson: string; detail: string; level: string }[] = [];
  matrixData.rows.forEach(r => {
    for (let i = 0; i < (r.part1.know || 0); i++) {
      p1Items.push({ chapter: r.content, lesson: r.lessonName, detail: r.detailName, level: 'Nhận biết' });
    }
    for (let i = 0; i < (r.part1.understand || 0); i++) {
      p1Items.push({ chapter: r.content, lesson: r.lessonName, detail: r.detailName, level: 'Thông hiểu' });
    }
    for (let i = 0; i < (r.part1.apply || 0); i++) {
      p1Items.push({ chapter: r.content, lesson: r.lessonName, detail: r.detailName, level: 'Vận dụng' });
    }
  });

  // Điều chỉnh cho đúng chuẩn số câu Phần I
  const finalP1 = p1Items.slice(0, targetP1);
  if (finalP1.length < targetP1 && matrixData.rows.length > 0) {
    let rowIdx = 0;
    while (finalP1.length < targetP1) {
      const r = matrixData.rows[rowIdx % matrixData.rows.length];
      finalP1.push({ chapter: r.content, lesson: r.lessonName, detail: r.detailName, level: 'Thông hiểu' });
      rowIdx++;
    }
  }

  // 2. Thu thập danh sách bối cảnh Phần II
  const p2Rows = matrixData.rows.filter(r => (r.part2.know + r.part2.understand + r.part2.apply) > 0);
  const finalP2: { chapter: string; lesson: string; detail: string; levelDesc: string }[] = [];
  
  if (p2Rows.length > 0) {
    p2Rows.slice(0, targetP2).forEach(r => {
      finalP2.push({
        chapter: r.content,
        lesson: r.lessonName,
        detail: r.detailName,
        levelDesc: 'Ý a: Nhận biết, Ý b: Thông hiểu, Ý c: Vận dụng, Ý d: Vận dụng cao / Đánh giá'
      });
    });
  }
  if (finalP2.length < targetP2 && matrixData.rows.length > 0) {
    let rowIdx = 0;
    while (finalP2.length < targetP2) {
      const r = matrixData.rows[rowIdx % matrixData.rows.length];
      if (!finalP2.some(item => item.lesson === r.lessonName)) {
        finalP2.push({
          chapter: r.content,
          lesson: r.lessonName,
          detail: r.detailName,
          levelDesc: 'Ý a: Nhận biết, Ý b: Thông hiểu, Ý c: Vận dụng, Ý d: Vận dụng cao / Đánh giá'
        });
      }
      rowIdx++;
      if (rowIdx >= matrixData.rows.length * 2) break;
    }
  }

  // 3. Thu thập danh sách câu hỏi Phần III
  const p3Rows = matrixData.rows.filter(r => ((r.part3.apply || 0) + (r.part3.understand || 0) + (r.part3.know || 0)) > 0);
  const finalP3: { chapter: string; lesson: string; detail: string }[] = [];
  p3Rows.forEach(r => {
    const count = (r.part3.apply || 0) + (r.part3.understand || 0) + (r.part3.know || 0);
    for (let i = 0; i < count; i++) {
      if (finalP3.length < targetP3) {
        finalP3.push({ chapter: r.content, lesson: r.lessonName, detail: r.detailName });
      }
    }
  });
  if (finalP3.length < targetP3 && matrixData.rows.length > 0) {
    let rowIdx = 0;
    while (finalP3.length < targetP3) {
      const r = matrixData.rows[rowIdx % matrixData.rows.length];
      finalP3.push({ chapter: r.content, lesson: r.lessonName, detail: r.detailName });
      rowIdx++;
    }
  }

  // 4. Thu thập danh sách câu hỏi Phần IV (Tự luận nếu có)
  const finalP4: { chapter: string; lesson: string; detail: string; level: string; points: string }[] = [];
  if (isPeriodic1011) {
    const p4Rows = matrixData.rows.filter(r => r.part4 && (r.part4.know + r.part4.understand + r.part4.apply > 0));
    const levels = ['Thông hiểu / Vận dụng thấp', 'Vận dụng', 'Vận dụng cao'];
    for (let i = 0; i < 3; i++) {
      const r = p4Rows[i] || matrixData.rows[i % matrixData.rows.length];
      finalP4.push({
        chapter: r.content,
        lesson: r.lessonName,
        detail: r.detailName,
        level: levels[i],
        points: '1.0 điểm'
      });
    }
  }

  // Ghép nối thành Bản phân bổ chi tiết
  const lines: string[] = [];
  lines.push(`\n================================================================================`);
  lines.push(`BẢN PHÂN BỔ TỪNG CÂU HỎI THEO MA TRẬN ĐÃ THIẾT KẾ (BẮT BUỘC TUÂN THỦ ĐÚNG 100%):`);
  lines.push(`* LƯU Ý TỐI THƯỢNG: Bạn BẮT BUỘC phải tạo từng câu hỏi (Câu 1, Câu 2, ...) chính xác theo đúng chương, đúng bài, đúng nội dung trọng tâm và đúng mức độ nhận thức đã được chỉ định dưới đây. TUYỆT ĐỐI KHÔNG tự ý thay đổi số lượng, không hoán đổi câu hỏi sang chương khác!`);
  lines.push(`--------------------------------------------------------------------------------`);
  lines.push(`PHẦN I. CÂU TRẮC NGHIỆM NHIỀU LỰA CHỌN (Gồm đúng ${targetP1} câu - Mỗi câu 0.25 điểm):`);
  finalP1.forEach((item, idx) => {
    lines.push(`- Câu ${idx + 1}: [${item.chapter}] - Bài: "${item.lesson}" - Nội dung: "${item.detail}" - Mức độ: ${item.level.toUpperCase()}`);
  });

  lines.push(``);
  lines.push(`PHẦN II. CÂU TRẮC NGHIỆM ĐÚNG SAI (Gồm đúng ${targetP2} câu / bối cảnh thực tiễn - Mỗi câu 1.0 điểm):`);
  finalP2.forEach((item, idx) => {
    lines.push(`- Câu ${idx + 1}: Bối cảnh thực tiễn/thực nghiệm tại [${item.chapter}] - Bài: "${item.lesson}" - Nội dung: "${item.detail}". Bắt buộc 4 nhận định a, b, c, d bám sát 100% dữ liệu bối cảnh (${item.levelDesc})`);
  });

  lines.push(``);
  lines.push(`PHẦN III. CÂU TRẮC NGHIỆM TRẢ LỜI NGẮN (Gồm đúng ${targetP3} câu - Mỗi câu ${isPeriodic1011 ? '0.5' : '0.25'} điểm):`);
  finalP3.forEach((item, idx) => {
    lines.push(`- Câu ${idx + 1}: [${item.chapter}] - Bài: "${item.lesson}" - Nội dung: "${item.detail}". Bài toán tính toán có số liệu thực tế, yêu cầu chỉ dẫn làm tròn rõ ràng, đáp án là 1 con số duy nhất.`);
  });

  if (isPeriodic1011 && finalP4.length > 0) {
    lines.push(``);
    lines.push(`PHẦN IV. CÂU HỎI TỰ LUẬN (Gồm đúng 3 câu - 3.0 điểm kèm barem điểm chi tiết):`);
    finalP4.forEach((item, idx) => {
      lines.push(`- Câu ${idx + 1} (${item.points}): [${item.chapter}] - Bài: "${item.lesson}" - Nội dung: "${item.detail}" - Mức độ: ${item.level}. Đổi mới câu hỏi, không lặp lại câu hỏi quen thuộc.`);
    });
  }
  lines.push(`================================================================================\n`);

  return lines.join('\n');
}

/**
 * Chuyển đổi tên ma trận đang có thành tiêu đề đề kiểm tra sau khi tạo / trộn
 * Ví dụ: "Ma trận khối 10 giữa học kì 1" -> "Đề kiểm tra khối 10 giữa học kì 1"
 */
export function formatExamTitleFromMatrixName(
  matrixName?: string,
  grade?: string | number,
  examType?: string
): string {
  if (!matrixName || !matrixName.trim()) {
    const gradePart = grade ? `khối ${grade}` : 'môn Hóa học';
    const typePart = examType ? ` ${examType}` : '';
    return `Đề kiểm tra ${gradePart}${typePart}`.replace(/\s+/g, ' ').trim();
  }

  let title = matrixName.trim();

  // Bỏ các tag nhãn phụ nếu có
  title = title.replace(/\s*\(Đề trộn.*?\)/gi, '').trim();

  // Nếu tên bắt đầu bằng "Ma trận đề kiểm tra" hoặc "Ma trận đề thi"
  if (/^ma\s*trận\s+(đề\s+kiểm\s+tra|đề\s+thi)\s+/i.test(title)) {
    return title.replace(/^ma\s*trận\s+/i, '');
  }

  // Nếu tên bắt đầu bằng "Ma trận" (Ví dụ: "Ma trận khối 10 giữa học kì 1" -> "Đề kiểm tra khối 10 giữa học kì 1")
  if (/^ma\s*trận\s+/i.test(title)) {
    return title.replace(/^ma\s*trận\s+/i, 'Đề kiểm tra ');
  }

  // Nếu tên dính liền "Ma trận..."
  if (/^ma\s*trận/i.test(title)) {
    return title.replace(/^ma\s*trận/i, 'Đề kiểm tra ');
  }

  // Nếu tên đã bắt đầu bằng "Đề kiểm tra" hoặc "Đề thi"
  if (/^(đề\s+kiểm\s+tra|đề\s+thi)/i.test(title)) {
    return title;
  }

  // Mặc định thêm tiền tố "Đề kiểm tra"
  return `Đề kiểm tra ${title}`;
}

export const convertMatrixToExamInput = (matrixData: MatrixData, matrixName?: string): BridgeResult => {
  const gradeStr = (matrixData.grade === 'Tự do' ? '12' : String(matrixData.grade)) as '10' | '11' | '12';
  const rawMatrixName = matrixName || matrixData.name || matrixData.title || `Ma trận khối ${matrixData.grade} ${matrixData.examType}`;
  const suggestedExamTitle = formatExamTitleFromMatrixName(rawMatrixName, matrixData.grade, matrixData.examType);
  const hasEssay = Boolean(
    matrixData.totals.hasEssay ||
    matrixData.totals.part4 ||
    matrixData.rows.some(r => r.part4 && (r.part4.know + r.part4.understand + r.part4.apply > 0)) ||
    matrixData.totals.grandTotal === 27 ||
    isPeriodicExamGrade10or11(matrixData.grade, matrixData.examType)
  );

  // Extract unique chapter names
  const topicNames = Array.from(new Set(matrixData.rows.map(r => r.content)));
  
  // Group rows by chapter topic to create ExamMatrixRow[]
  const matrixByTopic: Record<string, { recognition: number; understanding: number; application: number; highApplication: number }> = {};
  
  // Find Part II contexts
  const part2Contexts: string[] = [];
  // Find Part III calculation items
  const part3Topics: string[] = [];
  // Find Part IV essay items
  const part4Topics: string[] = [];

  matrixData.rows.forEach(r => {
    if (!matrixByTopic[r.content]) {
      matrixByTopic[r.content] = { recognition: 0, understanding: 0, application: 0, highApplication: 0 };
    }
    
    // Recognition = P1 Know + P2 Know + P4 Know
    const rec = (r.part1.know || 0) + (r.part2.know || 0) + (r.part4?.know || 0);
    // Understanding = P1 Understand + P2 Understand + P4 Understand
    const und = (r.part1.understand || 0) + (r.part2.understand || 0) + (r.part4?.understand || 0);
    // Application = P1 Apply + P2 Apply + P4 Apply
    const app = (r.part1.apply || 0) + (r.part2.apply || 0) + (r.part4?.apply || 0);
    // High Application = Part 3 items
    const highApp = (r.part3.apply || 0);

    matrixByTopic[r.content].recognition += rec;
    matrixByTopic[r.content].understanding += und;
    matrixByTopic[r.content].application += app;
    matrixByTopic[r.content].highApplication += highApp;

    if ((r.part2.know + r.part2.understand + r.part2.apply) > 0) {
      part2Contexts.push(`${r.lessonName} - ${r.detailName}`);
    }

    if (r.part3.apply > 0) {
      part3Topics.push(`${r.lessonName}: ${r.detailName}`);
    }

    if (r.part4 && (r.part4.know + r.part4.understand + r.part4.apply) > 0) {
      part4Topics.push(`${r.lessonName}: ${r.detailName}`);
    }
  });

  const examMatrix: ExamMatrixRow[] = Object.entries(matrixByTopic).map(([topic, counts]) => ({
    topic,
    recognition: counts.recognition,
    understanding: counts.understanding,
    application: counts.application,
    highApplication: counts.highApplication
  }));

  const intlSourceInfo = `\n- Nâng cấp chất lượng đề từ nguồn quốc tế (AP Chemistry, Cambridge, RSC Education, NIST, PubChem): Phần I có từ 0 đến 03 câu; Phần II có từ 0 đến 01 câu; Phần III có từ 0 đến 02 câu khi có nội dung thực nghiệm/đồ thị/tính toán phù hợp. Dịch toàn bộ sang Tiếng Việt chuẩn. Nếu không có nguồn quốc tế phù hợp thì tạo như cũ.`;
  const p2ContextRule = `\n- Quy định cốt lõi Phần II (Đúng/Sai): Bối cảnh không phải dùng để trang trí mà là dữ liệu quan trọng để đánh giá đúng, sai. Các phát biểu Đúng/Sai bắt buộc phải bám sát nội dung và dữ liệu bối cảnh, tuyệt đối không đưa các phương án xa rời bối cảnh.`;
  const p4DiversityDirective = `\n- Quy định bắt buộc Phần IV (Tự luận): Tuy cùng chủ đề kiến thức nhưng mỗi lần tạo đề PHẢI đổi mới hoàn toàn nội dung và câu hỏi, không lặp lại câu hỏi cũ hoặc khuôn mẫu; đổi mới bối cảnh thực tiễn, hệ chất, phản ứng và số liệu bài toán.`;

  let extraDetailsPrompt = '';
  let summaryText = '';

  if (hasEssay) {
    const p2ContextInfo = part2Contexts.length > 0 
      ? `\n- Bắt buộc đúng 2 bối cảnh thực tiễn ở Phần II (Đúng/Sai) phải lấy theo: ${part2Contexts.slice(0, 2).join('; ')}.`
      : '';
    const p3TopicInfo = part3Topics.length > 0 
      ? `\n- Các câu trả lời ngắn ở Phần III (4 câu) tập trung vào các nội dung: ${part3Topics.slice(0, 4).join('; ')}.`
      : '';
    const p4TopicInfo = part4Topics.length > 0
      ? `\n- Phần IV gồm 3 câu Tự luận (3.0 điểm: Câu 1 Thông hiểu/Vận dụng thấp 1.0đ, Câu 2 Vận dụng 1.0đ, Câu 3 Vận dụng cao 1.0đ) tập trung vào các nội dung: ${part4Topics.slice(0, 3).join('; ')}. Bắt buộc kèm hướng dẫn chấm và biểu điểm chi tiết (solution).`
      : `\n- Phần IV gồm 3 câu Tự luận (3.0 điểm: 1.0đ/câu) phân bố đều kiến thức các chương đã chọn, bắt buộc kèm hướng dẫn chấm và biểu điểm chi tiết (solution).`;

    extraDetailsPrompt = `Đề thi kiểm tra định kì Hóa học ${gradeStr} THEO FILE 'DINH DANG DE LOP 10-LOP11.docx' - Tổng 21 câu hỏi, 27 lệnh hỏi (10 điểm: Trắc nghiệm 7.0 điểm [12 câu P1 + 2 câu P2 + 4 câu P3] và Tự luận 3.0 điểm [3 câu P4]).${p2ContextInfo}${p2ContextRule}${p3TopicInfo}${p4TopicInfo}${p4DiversityDirective}${intlSourceInfo}${matrixData.extraRequirements ? `\nYêu cầu giáo viên: ${matrixData.extraRequirements}` : ''}`;
    summaryText = `Ma trận ${matrixData.examType} - Khối ${matrixData.grade} (${topicNames.length} chương, 21 câu - 27 lệnh hỏi có Tự luận)`;
  } else {
    const p2ContextInfo = part2Contexts.length > 0 
      ? `\n- Bắt buộc 4 bối cảnh thực tiễn ở Phần II (Đúng/Sai) phải lấy theo 4 nội dung sau: ${part2Contexts.join('; ')}.`
      : '';
    const p3TopicInfo = part3Topics.length > 0 
      ? `\n- Các bài tập tính toán thực tế ở Phần III (Trả lời ngắn) tập trung vào các nội dung: ${part3Topics.slice(0, 6).join('; ')}.`
      : '';
    const g12StyleInfo = gradeStr === '12'
      ? `\n- Phong cách chuẩn Đề thi Tốt nghiệp THPT 2025 - 2026 của Bộ GD&ĐT (cho cả kiểm tra thường xuyên và định kì): Phần I ngắn gọn 10-35 từ có câu điền khuyết và đánh giá đề xuất; Phần II 4 bối cảnh sâu sắc 100-250 từ phân hóa 4 bậc tư duy a-Nhận biết, b-Thông hiểu, c-Vận dụng, d-Vận dụng cao/đánh giá giả thuyết; Phần III bài toán thực tiễn có hướng dẫn làm tròn rõ ràng, đáp án là số duy nhất.`
      : '';

    extraDetailsPrompt = `Đề thi phải bám sát tuyệt đối ma trận ${matrixData.examType} (Tổng 40 lệnh hỏi, tỉ lệ 4:3:3 chuẩn GDPT 2018).${p2ContextInfo}${p2ContextRule}${p3TopicInfo}${intlSourceInfo}${g12StyleInfo}${matrixData.extraRequirements ? `\nYêu cầu giáo viên: ${matrixData.extraRequirements}` : ''}`;
    summaryText = `Ma trận ${matrixData.examType} - Khối ${matrixData.grade} (${topicNames.length} chương, 40 lệnh hỏi)`;
  }

  // Tạo Bản phân bổ chi tiết 100% từng câu hỏi theo ma trận và tích hợp vào prompt
  const questionBlueprint = generateDetailedQuestionBlueprint(matrixData);
  extraDetailsPrompt = `${extraDetailsPrompt}\n\n${questionBlueprint}`;

  return {
    grade: gradeStr,
    topics: topicNames.length > 0 ? topicNames : ['Chương trình Hóa học GDPT 2018'],
    examMatrix,
    extraDetailsPrompt,
    summaryText,
    hasEssay,
    sourceMatrixName: rawMatrixName,
    suggestedExamTitle,
    sourceMatrixData: matrixData,
    questionBlueprint
  };
};
