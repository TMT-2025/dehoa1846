import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import { ExamData, ExamMatrixRow } from "../types/exam";

export const getStoredApiKey = (): string => {
  return localStorage.getItem('gemini_api_key') || 
         (import.meta as any).env?.VITE_GEMINI_API_KEY || 
         (window as any).process?.env?.GEMINI_API_KEY || 
         '';
};

export const setStoredApiKey = (key: string): void => {
  if (key) {
    localStorage.setItem('gemini_api_key', key.trim());
  } else {
    localStorage.removeItem('gemini_api_key');
  }
};

export const generateExam = async (
  grade: string, 
  topics: string[], 
  details: string, 
  existingMatrix?: ExamMatrixRow[],
  matrixImageBase64?: string,
  modelName: string = 'gemini-2.5-flash'
): Promise<ExamData> => {
  const customApiKey = getStoredApiKey();

  // Try calling backend API first
  try {
    const res = await fetch('/api/generate-exam', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(customApiKey ? { 'x-gemini-api-key': customApiKey } : {})
      },
      body: JSON.stringify({
        grade,
        topics,
        details,
        existingMatrix,
        matrixImageBase64,
        modelName,
        apiKey: customApiKey || undefined
      })
    });

    if (res.ok) {
      const result = await res.json();
      if (result.success && result.data) {
        return result.data as ExamData;
      }
    }
  } catch (backendErr) {
    console.warn("Backend server not reached or error, trying direct client-side generation...", backendErr);
  }

  // Fallback to client-side direct call
  const apiKey = customApiKey || (import.meta as any).env?.VITE_API_KEY || (process as any)?.env?.API_KEY;
  if (!apiKey) {
    throw new Error("Chưa cấu hình Google Gemini API Key! Vui lòng nhập API Key ở góc trên màn hình hoặc trong file .env.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const selectedModel = modelName || 'gemini-2.5-flash';
  
  const topicStr = topics.join(', ');
  let matrixContext = "";
  let contents: any[] = [];

  if (matrixImageBase64) {
    matrixContext = "Trích xuất ma trận từ hình ảnh đính kèm và sử dụng nó để soạn đề. Đảm bảo số lượng câu hỏi ở mỗi mức độ (Biết, Hiểu, Vận dụng, Vận dụng cao) khớp hoàn toàn với ảnh.";
    contents.push({
      inlineData: {
        mimeType: "image/png",
        data: matrixImageBase64
      }
    });
  } else if (existingMatrix && existingMatrix.length > 0) {
    matrixContext = `BẮT BUỘC sử dụng ma trận phân bổ sau đây để đảm bảo cấu trúc đề thi chính xác 100%: ${JSON.stringify(existingMatrix)}`;
  } else {
    matrixContext = `Tạo ma trận mới chuẩn 40% Nhận biết, 30% Thông hiểu, 30% Vận dụng & Vận dụng cao. Phân bổ đều các mức độ này cho từng chương: ${topicStr}.`;
  }

  const systemInstruction = `
    Bạn là chuyên gia khảo thí và soạn đề Hóa học THPT theo chương trình GDPT 2018 tại Việt Nam.
    Nhiệm vụ: Tạo đề và ma trận cho KHỐI ${grade} - Các chương: "${topicStr}".
    
    YÊU CẦU PHÂN BỔ KIẾN THỨC:
    - Đảm bảo kiến thức được phân bổ chuẩn xác cho mỗi chương đã chọn trong toàn bộ đề thi (Phần I, II, III).
    - Ma trận (matrix) phải có các dòng tương ứng với từng chương đã chọn.
    
    YÊU CẦU NGÔN NGỮ:
    - TOÀN BỘ nội dung đề thi (tiêu đề, câu hỏi, bối cảnh, các nhận định, hướng dẫn) PHẢI ĐƯỢC VIẾT BẰNG TIẾNG VIỆT chuẩn xác, sư phạm, tự nhiên.
    - Duy nhất danh pháp các chất hóa học sử dụng tiếng Anh theo chuẩn IUPAC (ví dụ: "Iron", "Sulfuric acid", "Sodium chloride") theo đúng tinh thần chương trình 2018.
    
    QUY TẮC NÂNG CAO CHẤT LƯỢNG ĐỀ TỪ NGUỒN QUỐC TẾ (FILE 'YEU CAU TAO PHAN II va III'):
    Dựa trên bộ tài liệu khảo thí và học liệu quốc tế chuẩn mực: AP Chemistry (College Board), Cambridge International AS & A Level Chemistry (Paper 3 & 5), Royal Society of Chemistry (RSC Education), Save My Exams, Chemguide UK, NIST Chemistry WebBook/Kinetics, PubChem.
    Khi phạm vi bài học có nội dung liên quan (đặc biệt LỚP 12: Este - Lipid, Carbohydrate, Amino acid - Protein, Pin điện hóa - Điện phân, Kim loại chuyển tiếp - Phức chất; Lớp 11: Cân bằng, Chuẩn độ, Phổ IR/MS; Lớp 10: Tốc độ phản ứng, Năng lượng hóa học, Bảng tuần hoàn):
    1. PHẦN I (MCQ): Có TỪ 0 ĐẾN TỐI ĐA 03 CÂU HỎI khai thác từ nguồn quốc tế (phân tích bảng số liệu tính chất vật lý, so sánh nhiệt độ sôi, phân tích đồ thị động học, đọc peak phổ IR/MS, tính thế điện cực chuẩn E°...). Cuối câu hỏi có thể chú thích ngắn gọn: "[Tham khảo: AP Chemistry / Cambridge / RSC]".
    2. PHẦN II (Đúng/Sai): Có TỪ 0 ĐẾN TỐI ĐA 01 CÂU HỎI khai thác từ nguồn quốc tế (ngữ cảnh thực nghiệm sâu sắc, tiến trình thí nghiệm hoặc bảng dữ liệu đo đạc thực tế từ AP Chemistry FRQ / Cambridge Paper 3/5 / RSC; 4 nhận định a, b, c, d phát triển theo 4 cấp độ tư duy: a-Nhận biết, b-Thông hiểu, c-Vận dụng, d-Vận dụng cao). Cuối bối cảnh có chú thích nguồn ngắn gọn: "[Bối cảnh thực nghiệm: AP Chemistry FRQ / Cambridge A-Level]".
    3. PHẦN III (Trả lời ngắn): Có TỪ 0 ĐẾN TỐI ĐA 02 CÂU HỎI khai thác từ nguồn quốc tế (bài toán xử lý số liệu thực nghiệm: tính tốc độ phản ứng k, hiệu suất este hóa, sức điện động E°cell, điện phân Faraday, nhiệt phản ứng ΔrH, hằng số cân bằng Kc, phân tử khối m/z). Đáp án là 1 con số cụ thể. Cuối câu hỏi có chú thích ngắn gọn: "[Bài toán thực nghiệm: Cambridge / AP Chemistry]".
    4. NGUYÊN TẮC: Nếu không có nguồn quốc tế phù hợp với bài học cụ thể thì tạo đề chuẩn mực theo CT GDPT 2018 như cũ.
    5. TOÀN BỘ CÂU HỎI VÀ NGỮ CẢNH TỪ NGUỒN QUỐC TẾ BẮT BUỘC ĐƯỢC DỊCH VÀ DIỄN ĐẠT HOÀN TOÀN SANG TIẾNG VIỆT CHUẨN MỰC SƯ PHẠM (chỉ giữ nguyên tên chất theo danh pháp quốc tế IUPAC theo CT GDPT 2018). Các câu hỏi khác ở Phần I, II, III thực hiện bình thường như cũ.
    
    YÊU CẦU MA TRẬN: ${matrixContext}
    
    CẤU TRÚC ĐỀ VÀ NỘI DUNG CHI TIẾT (CHUẨN 40 LỆNH HỎI):
    - PHẦN I: 18 câu trắc nghiệm nhiều phương án lựa chọn (MCQ). 'options' chỉ chứa nội dung câu trả lời, không kèm chữ A. B. C. D ở đầu.
    - PHẦN II: 4 câu trắc nghiệm đúng sai (mỗi câu gồm bối cảnh thực tiễn và 4 ý nhận định).
        + Mỗi câu (context) PHẢI là một bối cảnh thực tiễn hoặc thí nghiệm hóa học sinh động bằng TIẾNG VIỆT, độ dài khoảng 60 - 80 từ.
        + 'statements' gồm đúng 4 nhận định bằng TIẾNG VIỆT, không kèm a) b) c) d) ở đầu.
    - PHẦN III: 6 câu trắc nghiệm trả lời ngắn (SA).
        + Bắt buộc là các bài tập tính toán có ý nghĩa (thực tiễn, sản xuất hoặc thí nghiệm), độ dài ít nhất 40 từ mỗi câu, viết bằng TIẾNG VIỆT.
        + ĐÁP ÁN (answer): PHẢI LUÔN LÀ MỘT CON SỐ cụ thể (hoặc số thập phân làm tròn). Không đưa đơn vị vào trường 'answer'.
        + GIẢI THÍCH (explanation): Cung cấp hướng dẫn giải ngắn gọn, rõ ràng (2-3 bước tính toán chính).
    
    QUY TẮC ĐỊNH DẠNG:
    - Công thức hóa học viết dạng văn bản (H2SO4, Fe2+, Cu(OH)2, [Ag(NH3)2]+).
    - Đảm bảo tính khoa học, chuẩn xác tuyệt đối theo CT GDPT 2018.
  `;

  contents.push({
    text: `Soạn đề kiểm tra Hóa học khối ${grade} - Các chương: ${topicStr}. Yêu cầu bổ sung: ${details || 'Chuẩn cấu trúc 40 lệnh hỏi'}. Đảm bảo tỉ lệ 4:3:3, phân bổ đều kiến thức giữa các chương, nâng cao chất lượng đề bằng cách tích hợp từ 0-3 câu Phần I, 0-1 câu Phần II, 0-2 câu Phần III từ nguồn quốc tế (AP Chemistry, Cambridge, RSC Education, NIST, PubChem) khi nội dung phù hợp, và dịch toàn bộ nội dung sang Tiếng Việt chuẩn mực.`
  });

  const response = await ai.models.generateContent({
    model: selectedModel,
    contents: { parts: contents },
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      ...(selectedModel && selectedModel.includes('gemini-3') ? { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } } : {}),
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          grade: { type: Type.STRING },
          part1: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                correctIndex: { type: Type.INTEGER }
              },
              required: ["question", "options", "correctIndex"]
            }
          },
          part2: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                context: { type: Type.STRING },
                statements: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      text: { type: Type.STRING },
                      isTrue: { type: Type.BOOLEAN }
                    },
                    required: ["text", "isTrue"]
                  }
                }
              },
              required: ["context", "statements"]
            }
          },
          part3: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                answer: { type: Type.STRING },
                explanation: { type: Type.STRING }
              },
              required: ["question", "answer", "explanation"]
            }
          },
          matrix: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                topic: { type: Type.STRING },
                recognition: { type: Type.INTEGER },
                understanding: { type: Type.INTEGER },
                application: { type: Type.INTEGER },
                highApplication: { type: Type.INTEGER }
              },
              required: ["topic", "recognition", "understanding", "application", "highApplication"]
            }
          }
        },
        required: ["title", "grade", "part1", "part2", "part3", "matrix"]
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("AI không phản hồi dữ liệu.");
  return JSON.parse(text) as ExamData;
};
