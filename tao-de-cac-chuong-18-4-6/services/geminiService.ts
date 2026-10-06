
import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import { ExamData, MatrixRow } from "../types";

export const generateExam = async (
  grade: string, 
  topics: string[], 
  details: string, 
  existingMatrix?: MatrixRow[],
  matrixImageBase64?: string
): Promise<ExamData> => {
  const apiKey =
  import.meta.env.VITE_API_KEY || process.env.API_KEY;

const ai = new GoogleGenAI({
  apiKey,
});
  const modelName = 'gemini-3-flash-preview';
  
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
  } else if (existingMatrix) {
    matrixContext = `Sử dụng ma trận có sẵn sau đây để đảm bảo cấu trúc đề đồng nhất: ${JSON.stringify(existingMatrix)}`;
  } else {
    matrixContext = `Tạo ma trận mới chuẩn 40% Nhận biết, 30% Thông hiểu, 30% Vận dụng & Vận dụng cao. Phân bổ đều các mức độ này cho từng chương: ${topicStr}.`;
  }

  const systemInstruction = `
    Bạn là chuyên gia soạn đề Hóa học THPT chuẩn GDPT 2018 tại Việt Nam.
    Nhiệm vụ: Tạo đề và ma trận cho KHỐI ${grade} - Các chương: "${topicStr}".
    
    YÊU CẦU PHÂN BỔ KIẾN THỨC:
    - Đảm bảo kiến thức được phân bổ ĐỀU cho mỗi chương đã chọn trong toàn bộ đề thi (Phần I, II, III).
    - Ma trận (matrix) phải có các dòng tương ứng với từng chương đã chọn.
    
    YÊU CẦU NGÔN NGỮ:
    - TOÀN BỘ nội dung đề thi (tiêu đề, câu hỏi, bối cảnh, các nhận định, hướng dẫn) PHẢI ĐƯỢC VIẾT BẰNG TIẾNG VIỆT chuẩn xác, tự nhiên.
    - Duy nhất danh pháp các chất hóa học sử dụng tiếng Anh theo chuẩn IUPAC (ví dụ: "Iron", "Sulfuric acid", "Sodium chloride") theo đúng tinh thần chương trình 2018.
    
    YÊU CẦU MA TRẬN: ${matrixContext}
    
    CẤU TRÚC ĐỀ VÀ NỘI DUNG CHI TIẾT:
    - PHẦN I: 18 câu MCQ. 'options' chỉ chứa nội dung, không kèm A.B.C.D hay dấu chấm ở đầu.
    - PHẦN II: 4 bối cảnh Đúng/Sai (mỗi bối cảnh 4 ý). 
        + YÊU CẦU: Mỗi câu (context) PHẢI là một bối cảnh thực tiễn hoặc thực nghiệm hóa học sinh động bằng TIẾNG VIỆT, ĐỘ DÀI TRONG KHOẢNG TỪ 60 ĐẾN 80 TỪ.
        + 'statements' chỉ chứa nội dung bằng TIẾNG VIỆT, không kèm a) b) c) d) hay dấu chấm ở đầu.
    - PHẦN III: 6 câu trả lời ngắn. 
        + YÊU CẦU: PHẢI là các bài tập tính toán có ý nghĩa (gắn với thực tế, sản xuất hoặc thí nghiệm), ĐỘ DÀI ÍT NHẤT 40 TỪ mỗi câu, viết bằng TIẾNG VIỆT.
        + ĐÁP ÁN (answer): PHẢI LUÔN LÀ MỘT CON SỐ cụ thể. Không bao gồm đơn vị tính trong trường 'answer'.
        + GIẢI THÍCH (explanation): Cung cấp lời giải ngắn gọn, súc tích cho từng câu (khoảng 2-3 bước tính toán chính).
    
    QUY TẮC ĐỊNH DẠNG:
    - Công thức hóa học viết text (H2SO4, Fe2+).
    - Đảm bảo tính khoa học và chính xác tuyệt đối.
  `;

  contents.push({
    text: `Soạn đề ôn tập Hóa ${grade} - Các chương: ${topicStr}. Yêu cầu thêm: ${details}. Đảm bảo tỉ lệ 4:3:3, phân bổ đều kiến thức giữa các chương và dịch toàn bộ nội dung sang Tiếng Việt.`
  });

  try {
    const timeout = 60000; // 60 seconds timeout
    const fetchPromise = ai.models.generateContent({
      model: modelName,
      contents: { parts: contents },
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        ...(modelName && modelName.includes('gemini-3') ? { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } } : {}),
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

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("TIMEOUT")), timeout)
    );

    const response: any = await Promise.race([fetchPromise, timeoutPromise]);
    
    const text = response.text;
    if (!text) throw new Error("AI không phản hồi dữ liệu.");
    return JSON.parse(text) as ExamData;

  } catch (error: any) {
    if (error.message === "TIMEOUT") {
      throw new Error("Thời gian yêu cầu quá lâu. Đang chuẩn bị thử lại...");
    }
    throw error;
  }
};
