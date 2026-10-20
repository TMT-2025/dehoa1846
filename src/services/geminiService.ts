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
  modelName: string = 'gemini-3.8-flash'
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
  const selectedModel = modelName || 'gemini-3.8-flash';
  
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

    QUY CHUẨN ĐẶC BIỆT KHI SOẠN ĐỀ KIỂM TRA ĐỊNH KÌ KHỐI 10 VÀ KHỐI 11 (THEO FILE 'DINH DANG DE LOP 10-LOP11.docx'):
    Khi tạo đề kiểm tra định kì (giữa kỳ / cuối kỳ) cho Lớp 10 hoặc Lớp 11 hoặc khi yêu cầu có Tự luận:
    Đề thi gồm 2 phần Trắc nghiệm (7.0 điểm) và Tự luận (3.0 điểm), tổng cộng 4 phần, 21 câu hỏi, 27 lệnh hỏi, 10 điểm:
    1. PHẦN I (12 câu Trắc nghiệm 4 lựa chọn - 3.0 điểm):
       - Gồm đúng 12 câu (Câu 1 đến Câu 12), mỗi câu 0.25 điểm.
       - Tập trung kiểm tra mức độ Nhận biết (8 câu) và Thông hiểu (4 câu).
    2. PHẦN II (2 câu Trắc nghiệm Đúng/Sai - 2.0 điểm):
       - Gồm đúng 2 câu (Câu 1 đến Câu 2) với 2 bối cảnh thực tiễn.
       - Mỗi câu gồm 4 ý a, b, c, d (tổng 8 ý/lệnh hỏi), mỗi ý 0.25 điểm. Cấu trúc 4 ý phát triển: 1 Biết, 2 Hiểu, 1 Vận dụng.
       - YÊU CẦU BẮT BUỘC VỀ BỐI CẢNH VÀ CÁC PHÁT BIỂU ĐÚNG/SAI:
         + Bối cảnh KHÔNG PHẢI dùng để trang trí mà là DỮ LIỆU QUAN TRỌNG để đánh giá đúng, sai.
         + Các phát biểu Đúng/Sai BẮT BUỘC phải bám sát nội dung và dữ liệu của bối cảnh, TUYỆT ĐỐI KHÔNG đưa các phương án xa rời bối cảnh hay hỏi lý thuyết chung chung không gắn với tình huống đã nêu.
    3. PHẦN III (4 câu Trắc nghiệm Trả lời ngắn - 2.0 điểm):
       - Gồm đúng 4 câu (Câu 1 đến Câu 4), mỗi câu 0.5 điểm.
       - Bài toán tính toán có ý nghĩa thực tế, yêu cầu làm tròn rõ ràng, đáp án (answer) là 1 con số duy nhất.
    4. PHẦN IV (3 câu Tự luận - 3.0 điểm):
       - Gồm đúng 3 câu (Câu 1 đến Câu 3) ở mảng 'part4', mỗi câu 1.0 điểm (points: 1.0):
         + Câu 1 (1.0 điểm): Mức độ Thông hiểu / Vận dụng thấp (viết phương trình hóa học, giải thích hiện tượng, cấu tạo nguyên tử, liên kết hóa học hoặc cân bằng hóa học).
         + Câu 2 (1.0 điểm): Mức độ Vận dụng (bài toán thực tế hoặc tính nồng độ, pH, hiệu suất, biến thiên enthalpy...).
         + Câu 3 (1.0 điểm): Mức độ Vận dụng cao (bài toán thực nghiệm sâu sắc, xử lý số liệu hoặc liên hệ thực tiễn đời sống / sản xuất).
         + Mỗi câu tự luận bắt buộc phải có hướng dẫn giải chi tiết (solution) kèm thang điểm/biểu điểm cụ thể cho từng bước để giáo viên chấm điểm.

    (LƯU Ý: Với KHỐI 12 hoặc khi đề yêu cầu 40 lệnh 100% trắc nghiệm theo chuẩn tốt nghiệp THPT của Bộ GD&ĐT: Phần I gồm 18 câu, Phần II gồm 4 câu, Phần III gồm 6 câu, Phần IV để mảng rỗng []).

    QUY CHUẨN PHONG CÁCH ĐỀ THI TỐT NGHIỆP THPT (BỘ GD&ĐT 2025 - 2026) - ĐẶC BIỆT ÁP DỤNG CHO LỚP 12 (KIỂM TRA THƯỜNG XUYÊN VÀ ĐỊNH KÌ):
    Ghi nhớ và tuân thủ tuyệt đối hình thức, độ dài phần dẫn, bối cảnh thực tiễn và phương thức tạo câu hỏi từ Đề thi tốt nghiệp THPT 2025 và 2026 môn Hóa học của Bộ GD&ĐT:
    
    1. PHẦN I (18 câu Trắc nghiệm 4 lựa chọn cho Lớp 12):
       - Độ dài phần dẫn: Ngắn gọn, súc tích từ 10 đến 35 từ.
       - Các hình thức câu hỏi đặc trưng của Bộ GD&ĐT:
         + Câu hỏi điền khuyết: "... (1) ... là hợp chất/quá trình... Cụm từ thích hợp điền vào (1) là:".
         + Câu hỏi đánh giá thảo luận / đề xuất thực tiễn: Nêu tình huống thực tế (giảm độ cứng nước sinh hoạt, bảo vệ chống ăn mòn cọc kè biển, xử lý khí thải, pha chế dung dịch) kèm danh sách đề xuất đánh số (1), (2), (3), (4) -> Lệnh hỏi: "Các đề xuất đúng là:" hoặc "Đề xuất nào sau đây hợp lý?".
         + Câu hỏi đọc dữ liệu phổ / sơ đồ thí nghiệm / pin: Đọc tín hiệu peak phổ hồng ngoại IR (nhóm C=O ~1700 cm⁻¹, O-H ~3300 cm⁻¹), peak ion phân tử m/z trên phổ MS, sơ đồ pin Galvanic (xác định cực anode, cathode, chiều electron, ion trong cầu muối), hoặc nhận diện dụng cụ thí nghiệm (bình cầu, sinh hàn, phễu chiết).
         + Bốn phương án A, B, C, D ngắn gọn, ngữ pháp và cấu trúc đồng nhất. 'options' chỉ chứa nội dung câu trả lời, không kèm chữ A. B. C. D ở đầu.
    
    2. PHẦN II (Trắc nghiệm Đúng/Sai - 4 bối cảnh cho Lớp 12; 2 bối cảnh cho định kì Lớp 10/11):
       - Độ dài bối cảnh (context): 100 đến 250 từ. Bối cảnh phải giàu hàm lượng chuyên môn, gắn với thí nghiệm thực hành, đời sống hoặc sản xuất công nghiệp.
       - QUY TẮC CỐT LÕI VỀ BỐI CẢNH VÀ CÁC PHÁT BIỂU ĐÚNG/SAI (BẮT BUỘC TUÂN THỦ):
         + BỐI CẢNH KHÔNG PHẢI DÙNG ĐỂ TRANG TRÍ MÀ LÀ DỮ LIỆU QUAN TRỌNG, CỐT LÕI ĐỂ ĐÁNH GIÁ ĐÚNG, SAI.
         + CÁC PHÁT BIỂU ĐÚNG/SAI BẮT BUỘC PHẢI BÁM SÁT NỘI DUNG VÀ DỮ LIỆU CỦA BỐI CẢNH, TUYỆT ĐỐI KHÔNG ĐƯA CÁC PHƯƠNG ÁN XA RỜI BỐI CẢNH hoặc hỏi lý thuyết rời rạc bên ngoài không liên quan đến bối cảnh đã xây dựng.
         + Mọi nhận định a, b, c, d phải dựa trên việc phân tích các đối tượng, hóa chất, số liệu, tiến trình thí nghiệm, hiện tượng hoặc đồ thị có trong bối cảnh.
       - Phương thức tạo 4 lệnh hỏi a, b, c, d phát triển theo 4 cấp độ tư duy nhận thức (tất cả đều khai thác trực tiếp từ bối cảnh):
         + a) Nhận biết: Kiểm tra định nghĩa, nhóm chức, phân loại, tên gọi hoặc vai trò cơ bản của hóa chất được đề cập trong bối cảnh.
         + b) Thông hiểu: Bản chất phản ứng, giải thích hiện tượng ở từng bước thí nghiệm/quá trình nêu trong bối cảnh.
         + c) Vận dụng: Tính toán định lượng trực tiếp gắn liền với số liệu, nồng độ, thể tích, khối lượng trong bối cảnh.
         + d) Vận dụng cao / Đánh giá: Đánh giá tính đúng/sai của giả thuyết, dự đoán hiện tượng khi thay đổi điều kiện/hóa chất của bối cảnh, suy luận cấu trúc lập thể hoặc tối ưu hóa phản ứng trong bối cảnh.
       - 'statements' gồm đúng 4 nhận định bằng TIẾNG VIỆT, không kèm a) b) c) d) ở đầu.
    
    3. PHẦN III (Trắc nghiệm Trả lời ngắn - 6 câu cho Lớp 12; 4 câu cho định kì Lớp 10/11):
       - Độ dài câu hỏi: 50 đến 180 từ per question.
       - Phương thức tạo câu hỏi chuẩn:
         + Câu đếm cấu trúc / tính chất hoặc bài toán tính toán thực tế.
       - Quy cách câu lệnh và làm tròn BẮT BUỘC:
         + Cuối câu hỏi LUÔN PHẢI CÓ câu chỉ dẫn làm tròn rõ ràng chuẩn Bộ GD&ĐT: "(Làm tròn kết quả đến hàng phần mười)" HOẶC "(Làm tròn kết quả đến hàng phần trăm)" HOẶC "(Làm tròn kết quả đến hàng đơn vị)".
         + ĐÁP ÁN (answer): BẮT BUỘC là 1 CON SỐ DUY NHẤT (nguyên hoặc thập phân, ví dụ: "12", "3.5", "0.24", "4"). TUYỆT ĐỐI KHÔNG chứa đơn vị đo (như gam, mol, lít, %...) hay chữ cái trong trường 'answer'.
         + GIẢI THÍCH (explanation): Cung cấp các bước biến đổi và tính toán then chốt ngắn gọn, rõ ràng (2-3 bước).
    
    YÊU CẦU MA TRẬN: ${matrixContext}
    
    QUY TẮC ĐỊNH DẠNG:
    - Công thức hóa học viết dạng văn bản (H2SO4, Fe2+, Cu(OH)2, [Ag(NH3)2]+).
    - Đảm bảo tính khoa học, chuẩn xác tuyệt đối theo CT GDPT 2018.
  `;

  contents.push({
    text: `Soạn đề kiểm tra Hóa học khối ${grade} - Các chương: ${topicStr}. Yêu cầu: ${details || 'Chuẩn GDPT 2018'}. Đảm bảo tỉ lệ 4:3:3, phân bổ đều kiến thức giữa các chương. ĐẶC BIỆT LƯU Ý Ở PHẦN II (ĐÚNG/SAI): Bối cảnh không phải dùng để trang trí mà là dữ liệu quan trọng để đánh giá đúng, sai; Các phát biểu Đúng/Sai bắt buộc phải bám sát nội dung và dữ liệu bối cảnh, tuyệt đối không đưa các phương án xa rời bối cảnh. Nếu là kiểm tra định kì Lớp 10 hoặc 11 (hoặc có yêu cầu tự luận), đề thi BẮT BUỘC có 4 phần (21 câu, 27 lệnh hỏi, 10 điểm: 12 câu Phần I, 2 câu Phần II, 4 câu Phần III, 3 câu Phần IV tự luận kèm biểu điểm solution). Nếu là Lớp 12, đề thi tuân thủ 40 lệnh trắc nghiệm (18 câu Phần I, 4 câu Phần II, 6 câu Phần III).`
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
          part4: {
            type: Type.ARRAY,
            description: "Phần IV: Câu hỏi tự luận (bắt buộc gồm 3 câu cho kiểm tra định kì Lớp 10, Lớp 11)",
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                points: { type: Type.NUMBER },
                solution: { type: Type.STRING }
              },
              required: ["question", "points", "solution"]
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
