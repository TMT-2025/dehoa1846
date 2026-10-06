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
    text: `Soạn đề kiểm tra Hóa học khối ${grade} - Các chương: ${topicStr}. Yêu cầu bổ sung: ${details || 'Chuẩn cấu trúc 40 lệnh hỏi'}. Đảm bảo tỉ lệ 4:3:3, phân bổ đều kiến thức giữa các chương và dịch toàn bộ nội dung sang Tiếng Việt chuẩn mực.`
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
