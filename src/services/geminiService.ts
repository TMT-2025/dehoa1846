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

    QUY CHUẨN PHONG CÁCH ĐỀ THI TỐT NGHIỆP THPT (BỘ GD&ĐT 2025 - 2026) - ĐẶC BIỆT ÁP DỤNG CHO LỚP 12 (KIỂM TRA THƯỜNG XUYÊN VÀ ĐỊNH KÌ):
    Ghi nhớ và tuân thủ tuyệt đối hình thức, độ dài phần dẫn, bối cảnh thực tiễn và phương thức tạo câu hỏi từ Đề thi tốt nghiệp THPT 2025 và 2026 môn Hóa học của Bộ GD&ĐT:
    
    1. PHẦN I (18 câu Trắc nghiệm 4 lựa chọn):
       - Độ dài phần dẫn: Ngắn gọn, súc tích từ 10 đến 35 từ.
       - Các hình thức câu hỏi đặc trưng của Bộ GD&ĐT:
         + Câu hỏi điền khuyết: "... (1) ... là hợp chất/quá trình... Cụm từ thích hợp điền vào (1) là:".
         + Câu hỏi đánh giá thảo luận / đề xuất thực tiễn: Nêu tình huống thực tế (giảm độ cứng nước sinh hoạt, bảo vệ chống ăn mòn cọc kè biển, xử lý khí thải, pha chế dung dịch) kèm danh sách đề xuất đánh số (1), (2), (3), (4) -> Lệnh hỏi: "Các đề xuất đúng là:" hoặc "Đề xuất nào sau đây hợp lý?".
         + Câu hỏi đọc dữ liệu phổ / sơ đồ thí nghiệm / pin: Đọc tín hiệu peak phổ hồng ngoại IR (nhóm C=O ~1700 cm⁻¹, O-H ~3300 cm⁻¹), peak ion phân tử m/z trên phổ MS, sơ đồ pin Galvanic (xác định cực anode, cathode, chiều electron, ion trong cầu muối), hoặc nhận diện dụng cụ thí nghiệm (bình cầu, sinh hàn, phễu chiết).
         + Bốn phương án A, B, C, D ngắn gọn, ngữ pháp và cấu trúc đồng nhất. 'options' chỉ chứa nội dung câu trả lời, không kèm chữ A. B. C. D ở đầu.
    
    2. PHẦN II (4 câu Trắc nghiệm Đúng/Sai - 4 bối cảnh lớn):
       - Độ dài bối cảnh (context): 100 đến 250 từ. Bối cảnh phải giàu hàm lượng chuyên môn, gắn với thí nghiệm thực hành, đời sống hoặc sản xuất công nghiệp.
       - 4 bối cảnh chủ đạo của Bộ GD&ĐT (đặc biệt Lớp 12):
         + Bối cảnh 1 (Thí nghiệm thực hành & kiểm chứng giả thuyết): Trình bày quy trình thí nghiệm gồm các bước rõ ràng (Bước 1: ..., Bước 2: ..., Bước 3: ...; ví dụ: thủy phân ester, xà phòng hóa chất béo, chuẩn độ oxi hóa - khử FeSO4 bằng dung dịch KMnO4, điều chế tơ polymer).
         + Bối cảnh 2 (Hóa học hữu cơ sinh học & Dược phẩm): Cấu trúc phân tử kháng sinh, amino acid, peptide, protein, carbohydrate (glucose, saccharose, cellulose), lipid (omega-3, chất béo), kết hợp công thức hoặc phổ IR.
         + Bối cảnh 3 (Quá trình sản xuất công nghiệp & Môi trường): Quy trình sản xuất công nghiệp (Solvay, clo - kiềm màng ngăn, luyện gang thép lò thổi oxy, xử lý khí thải SO2/NOx).
         + Bối cảnh 4 (Điện hóa học & Phức chất): Pin điện hóa (galvanic, lithium-ion, pin nhiên liệu), ăn mòn điện hóa giàn khoan biển, hoặc phức chất kim loại chuyển tiếp (cấu trúc hình học, phối tử, ứng dụng y học cisplatin).
       - Phương thức tạo 4 lệnh hỏi a, b, c, d phát triển theo 4 cấp độ tư duy nhận thức:
         + a) Nhận biết: Kiểm tra định nghĩa, nhóm chức, phân loại, tên gọi hoặc vai trò cơ bản của hóa chất ban đầu.
         + b) Thông hiểu: Bản chất phản ứng, giải thích hiện tượng ở từng bước thí nghiệm (ví dụ: vai trò của dung dịch NaCl bão hòa để làm nổi xà phòng, vai trò môi trường H2SO4).
         + c) Vận dụng: Tính toán định lượng gắn liền với số liệu trong bối cảnh (khối lượng, thể tích khí, hiệu suất, nồng độ mol, hằng số cân bằng).
         + d) Vận dụng cao / Đánh giá: Đánh giá tính đúng/sai của giả thuyết học sinh đưa ra, dự đoán hiện tượng khi thay đổi hóa chất/điều kiện, suy luận cấu trúc lập thể hoặc tối ưu hóa phản ứng.
       - 'statements' gồm đúng 4 nhận định bằng TIẾNG VIỆT, không kèm a) b) c) d) ở đầu.
    
    3. PHẦN III (6 câu Trắc nghiệm Trả lời ngắn):
       - Độ dài câu hỏi: 50 đến 180 từ per question.
       - Phương thức tạo câu hỏi chuẩn Bộ GD&ĐT:
         + Câu đếm cấu trúc / tính chất: Đếm số đồng phân cấu tạo thỏa mãn điều kiện hoặc số chất trong dãy tham gia phản ứng.
         + Bài toán Nhiệt hóa học & Năng lượng: Tính nhiệt lượng Q tỏa ra khi đốt nhiên liệu (khí gas LPG, than đá, cồn), tính biến thiên enthalpy chuẩn ΔrH°298 hoặc nhiệt tạo thành ΔfH°298.
         + Bài toán Điện hóa & Pin điện: Tính sức điện động chuẩn của pin E°cell = E°(+) - E°(-), hoặc bài toán điện phân theo định luật Faraday.
         + Bài toán Sản xuất công nghiệp & Đời sống: Tính lượng nguyên liệu thực tế (quặng bauxite, đá vôi, quặng sắt, phân bón, xi măng, oleum), thành phần phần trăm kim loại trong hợp kim/thép, thể tích dung dịch chuẩn độ.
       - Quy cách câu lệnh và làm tròn BẮT BUỘC:
         + Cuối câu hỏi LUÔN PHẢI CÓ câu chỉ dẫn làm tròn rõ ràng chuẩn Bộ GD&ĐT: "(Làm tròn kết quả đến hàng phần mười)" HOẶC "(Làm tròn kết quả đến hàng phần trăm)" HOẶC "(Làm tròn kết quả đến hàng đơn vị)" kèm "(không làm tròn các phép tính trung gian, chỉ làm tròn kết quả cuối cùng)" nếu có nhiều bước tính.
         + ĐÁP ÁN (answer): BẮT BUỘC là 1 CON SỐ DUY NHẤT (nguyên hoặc thập phân, ví dụ: "12", "3.5", "0.24", "4"). TUYỆT ĐỐI KHÔNG chứa đơn vị đo (như gam, mol, lít, %...) hay chữ cái trong trường 'answer'.
         + GIẢI THÍCH (explanation): Cung cấp các bước biến đổi và tính toán then chốt ngắn gọn, rõ ràng (2-3 bước).
    
    YÊU CẦU MA TRẬN: ${matrixContext}
    
    QUY TẮC ĐỊNH DẠNG:
    - Công thức hóa học viết dạng văn bản (H2SO4, Fe2+, Cu(OH)2, [Ag(NH3)2]+).
    - Đảm bảo tính khoa học, chuẩn xác tuyệt đối theo CT GDPT 2018.
  `;

  contents.push({
    text: `Soạn đề kiểm tra Hóa học khối ${grade} - Các chương: ${topicStr}. Yêu cầu bổ sung: ${details || 'Chuẩn cấu trúc 40 lệnh hỏi'}. Đảm bảo tỉ lệ 4:3:3, phân bổ đều kiến thức giữa các chương. ĐẶC BIỆT với Lớp 12 (cả kiểm tra thường xuyên và định kì), đề thi phải bám sát tuyệt đối phong cách đề thi Tốt nghiệp THPT 2025 - 2026 của Bộ GD&ĐT về độ dài phần dẫn, bối cảnh thực nghiệm 4 bước kiểm chứng giả thuyết, câu hỏi điền khuyết và thảo luận đề xuất, 4 cấp độ tư duy a-b-c-d ở Phần II, hướng dẫn làm tròn và đáp án là một con số duy nhất ở Phần III; đồng thời tích hợp từ 0-3 câu Phần I, 0-1 câu Phần II, 0-2 câu Phần III từ nguồn quốc tế (AP Chemistry, Cambridge, RSC Education, NIST, PubChem) khi có nội dung phù hợp và dịch toàn bộ sang Tiếng Việt chuẩn mực.`
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
