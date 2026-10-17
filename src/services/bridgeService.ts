import { MatrixData, isPeriodicExamGrade10or11 } from '../types/matrix';
import { ExamMatrixRow } from '../types/exam';

export interface BridgeResult {
  grade: '10' | '11' | '12';
  topics: string[];
  examMatrix: ExamMatrixRow[];
  extraDetailsPrompt: string;
  summaryText: string;
  hasEssay?: boolean;
}

export const convertMatrixToExamInput = (matrixData: MatrixData): BridgeResult => {
  const gradeStr = (matrixData.grade === 'Tự do' ? '12' : String(matrixData.grade)) as '10' | '11' | '12';
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

    extraDetailsPrompt = `Đề thi kiểm tra định kì Hóa học ${gradeStr} THEO FILE 'DINH DANG DE LOP 10-LOP11.docx' - Tổng 21 câu hỏi, 27 lệnh hỏi (10 điểm: Trắc nghiệm 7.0 điểm [12 câu P1 + 2 câu P2 + 4 câu P3] và Tự luận 3.0 điểm [3 câu P4]).${p2ContextInfo}${p3TopicInfo}${p4TopicInfo}${intlSourceInfo}${matrixData.extraRequirements ? `\nYêu cầu giáo viên: ${matrixData.extraRequirements}` : ''}`;
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

    extraDetailsPrompt = `Đề thi phải bám sát tuyệt đối ma trận ${matrixData.examType} (Tổng 40 lệnh hỏi, tỉ lệ 4:3:3 chuẩn GDPT 2018).${p2ContextInfo}${p3TopicInfo}${intlSourceInfo}${g12StyleInfo}${matrixData.extraRequirements ? `\nYêu cầu giáo viên: ${matrixData.extraRequirements}` : ''}`;
    summaryText = `Ma trận ${matrixData.examType} - Khối ${matrixData.grade} (${topicNames.length} chương, 40 lệnh hỏi)`;
  }

  return {
    grade: gradeStr,
    topics: topicNames.length > 0 ? topicNames : ['Chương trình Hóa học GDPT 2018'],
    examMatrix,
    extraDetailsPrompt,
    summaryText,
    hasEssay
  };
};
