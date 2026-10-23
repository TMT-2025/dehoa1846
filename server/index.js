import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const getRandomEssayThemes = (grade) => {
  const g10Themes = [
    "Xử lý nước ngầm nhiễm sắt bằng sục khí oxy và giàn mưa; phân tích phản ứng oxi hóa - khử và hiện tượng kết tủa Fe(OH)3",
    "Túi sưởi ấm tức thời (phản ứng bột Fe tỏa nhiệt) hoặc túi chườm lạnh (hòa tan muối ammonium); tính toán biến thiên enthalpy và nhiệt lượng",
    "Khử trùng nước sinh hoạt bằng chlorine hoặc chloramine; giải thích tính sát trùng, tẩy màu và tính nồng độ chất phản ứng",
    "Ảnh hưởng của nhiệt độ và diện tích tiếp xúc trong bảo quản thực phẩm hoặc phản ứng sinh khí của viên sủi C; tính tốc độ trung bình phản ứng",
    "Ứng dụng đồng vị trong y học (I-131, Tc-99m) kết hợp giải thích quy luật biến đổi độ âm điện, năng lượng ion hóa của các nguyên tố trong bảng tuần hoàn",
    "Cơ chế tạo liên kết hydrogen trong nước và ethanol; giải thích nhiệt độ sôi bất thường và tính tan, so sánh với các hydride cùng nhóm",
    "Ăn mòn kim loại và phương pháp mạ kẽm (galvanized steel) bảo vệ cọc thép ven biển; cân bằng phản ứng oxi hóa - khử theo phương pháp thăng bằng electron",
    "Đốt cháy nhiên liệu sạch (khí hydrogen, khí methane sinh học biogas); tính biến thiên enthalpy chuẩn dựa vào năng lượng liên kết Eb và so sánh hiệu quả nhiệt lượng"
  ];

  const g11Themes = [
    "Xác định độ chua (hàm lượng acetic acid) của mẫu giấm ăn thương phẩm bằng chuẩn độ dung dịch NaOH với chỉ thị phenolphthalein; tính nồng độ và đánh giá tiêu chuẩn",
    "Thuốc kháng acid dạ dày (antacid chứa Al(OH)3 hoặc NaHCO3); viết phương trình ion rút gọn, tính thể tích dịch vị acid được trung hòa và tính pH",
    "Hiện tượng phú dưỡng (eutrophication) ở hồ nước do dư thừa ion nitrate (NO3-) và phosphate (PO4 3-); phân tích nguyên nhân, chu trình nitrogen và giải pháp xử lý",
    "Tối ưu hóa phản ứng tổng hợp ammonia (Haber-Bosch) hoặc sulfur trioxide (tiếp xúc); vận dụng nguyên lí Le Chatelier giải thích nhiệt độ, áp suất và tính hằng số cân bằng Kc",
    "Mưa acid và sự ăn mòn các công trình bằng đá vôi (CaCO3); tính toán nồng độ H+ và pH của nước mưa, đề xuất biện pháp xử lý khí thải SO2 bằng sữa vôi",
    "Chiết xuất tinh dầu thiên nhiên (tinh dầu sả, vỏ bưởi) bằng phương pháp chưng cất lôi cuốn hơi nước; nguyên tắc tách biệt và tinh chế hợp chất hữu cơ",
    "Sản xuất phân bón đạm urê và phân bón hỗn hợp NPK; tính toán độ dinh dưỡng (%N, %P2O5, %K2O) và lượng phân bón cần cấp cho cây trồng",
    "Phân tích chất lượng nhiên liệu khí hóa lỏng LPG (hỗn hợp propane và butane); tính nhiệt lượng tỏa ra khi đun nấu và lượng khí CO2 phát thải"
  ];

  const themes = (grade === '10' || String(grade).includes('10')) ? g10Themes : g11Themes;
  const shuffled = [...themes].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 2).join('; ');
};

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const matricesFilePath = path.join(dataDir, 'matrices.json');
const examsFilePath = path.join(dataDir, 'exams.json');

const readJsonFile = (filePath, defaultVal = []) => {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
  }
  return defaultVal;
};

const writeJsonFile = (filePath, data) => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err);
  }
};

// Health Check
app.get('/api/health', (req, res) => {
  const envKey = process.env.GEMINI_API_KEY || process.env.API_KEY || '';
  res.json({
    status: 'ok',
    hasGeminiKey: Boolean(envKey && envKey.trim().length > 0),
    timestamp: Date.now()
  });
});

// API endpoint to generate exam via Gemini
app.post('/api/generate-exam', async (req, res) => {
  try {
    const { grade, topics, details, existingMatrix, matrixImageBase64, modelName, sourceMatrixData } = req.body;
    const reqApiKey = req.headers['x-gemini-api-key'] || req.body.apiKey;
    const apiKey = reqApiKey || process.env.GEMINI_API_KEY || process.env.API_KEY;

    if (!apiKey) {
      return res.status(400).json({
        success: false,
        error: 'Chưa có Google Gemini API Key. Vui lòng cung cấp API Key qua tiêu đề hoặc file .env!'
      });
    }

    if (!topics || !Array.isArray(topics) || topics.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Vui lòng chọn ít nhất một chương học!'
      });
    }

    const ai = new GoogleGenAI({ apiKey });
    const selectedModel = modelName || 'gemini-2.5-flash';
    const topicStr = topics.join(', ');
    
    let matrixContext = '';
    const contents = [];

    if (matrixImageBase64) {
      matrixContext = 'Trích xuất ma trận từ hình ảnh đính kèm và sử dụng nó để soạn đề. Đảm bảo số lượng câu hỏi ở mỗi mức độ (Biết, Hiểu, Vận dụng, Vận dụng cao) khớp hoàn toàn với ảnh.';
      contents.push({
        inlineData: {
          mimeType: 'image/png',
          data: matrixImageBase64
        }
      });
    } else if (existingMatrix && Array.isArray(existingMatrix) && existingMatrix.length > 0) {
      matrixContext = `BẮT BUỘC sử dụng ma trận phân bổ sau đây để đảm bảo cấu trúc đề thi chính xác 100%: ${JSON.stringify(existingMatrix)}`;
    } else {
      matrixContext = `Tạo ma trận mới chuẩn 40% Nhận biết, 30% Thông hiểu, 30% Vận dụng & Vận dụng cao. Phân bổ đều các mức độ này cho từng chương: ${topicStr}.`;
    }

    const systemInstruction = `
      Bạn là chuyên gia khảo thí và soạn đề Hóa học THPT theo chương trình GDPT 2018 tại Việt Nam.
      Nhiệm vụ: Tạo đề và ma trận cho KHỐI ${grade} - Các chương: "${topicStr}".
      
      YÊU CẦU PHÂN BỔ KIẾN THỨC & BẢO ĐẢM KHỚP MA TRẬN 100%:
      - Đảm bảo kiến thức được phân bổ chuẩn xác 100% cho mỗi chương đã chọn trong toàn bộ đề thi (Phần I, II, III, IV).
      - Khi có "BẢN PHÂN BỔ TỪNG CÂU HỎI THEO MA TRẬN ĐÃ THIẾT KẾ", bạn BẮT BUỘC PHẢI tạo từng câu hỏi (Câu 1, Câu 2, ...) chính xác theo đúng chương, đúng bài, đúng nội dung trọng tâm và đúng mức độ nhận thức đã chỉ định. TUYỆT ĐỐI KHÔNG tự ý thay đổi số lượng, không hoán đổi câu hỏi sang chương khác.
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
         - Gồm đúng 4 câu (Câu 1 đến Câu 4), mỗi câu 0.5 điểm ở mức độ Vận dụng.
         - Bài toán tính toán có ý nghĩa thực tế, yêu cầu làm tròn rõ ràng, đáp án (answer) là 1 con số duy nhất.
      4. PHẦN IV (3 câu Tự luận - 3.0 điểm cho Lớp 10 & 11) - NGUYÊN TẮC BẮT BUỘC VỀ ĐA DẠNG HÓA VÀ CHỐNG TRÙNG LẶP NỘI DUNG:
         - QUY TẮC CỐT LÕI: Tuy cùng chủ đề kiến thức nhưng MỖI LẦN TẠO ĐỀ BẮT BUỘC PHẢI TẠO NỘI DUNG VÀ CÂU HỎI HOÀN TOÀN KHÁC NHAU. TUYỆT ĐỐI KHÔNG lặp lại các câu hỏi cũ, câu hỏi mẫu hoặc tình huống giống nhau giữa các lần tạo đề.
         - Chiến lược đổi mới toàn diện:
           + Đổi mới hệ chất và phản ứng: Khai thác linh hoạt nhiều chất, hợp chất, khoáng vật, hóa chất đời sống, dược phẩm, vật liệu thực tế khác nhau trong bài học; không chỉ dùng một vài phản ứng mẫu kinh điển lặp đi lặp lại.
           + Đổi mới ngữ cảnh thực tế: Luân phiên các lĩnh vực: đời sống sinh hoạt, y tế - sức khỏe, nông nghiệp xanh, bảo vệ môi trường, công nghệ hóa chất, phân tích thực nghiệm phòng thí nghiệm.
           + Đổi mới số liệu: Thay đổi ngẫu nhiên các giá trị đo (khối lượng, thể tích, nồng độ, nhiệt độ, hiệu suất, % tạp chất) để bài toán có số liệu thực và không trùng lặp.
           + Đổi mới dạng câu hỏi theo 3 mức độ:
             * Câu 1 (1.0 điểm - Thông hiểu/Vận dụng thấp): Luân phiên giữa: giải thích bản chất hiện tượng thực tế / phân tích thao tác và mục đích hóa chất trong quy trình thí nghiệm / lập luận cơ chế liên kết, cấu tạo, cân bằng / viết PTHH dạng ion rút gọn hoặc bản chất oxi hóa - khử.
             * Câu 2 (1.0 điểm - Vận dụng): Bài toán định lượng đời sống/thực nghiệm với số liệu cụ thể (chuẩn độ dung dịch mẫu thực tế, tính pH dung dịch sau phản ứng, tính nhiệt lượng nhiên liệu tỏa ra hoặc biến thiên enthalpy chuẩn, tính hiệu suất phản ứng hoặc hằng số cân bằng Kc...).
             * Câu 3 (1.0 điểm - Vận dụng cao): Tình huống giải quyết vấn đề thực tiễn sâu sắc: xử lý dữ liệu đo đạc thực nghiệm; bài toán xử lý chất thải/ô nhiễm đạt tiêu chuẩn môi trường; đánh giá và phản biện sai sót trong một thí nghiệm kèm đề xuất cải tiến; hoặc xác định hàm lượng hoạt chất / độ tinh khiết mẫu thương phẩm.
           + Mỗi câu tự luận BẮT BUỘC có hướng dẫn giải chi tiết (solution) chia rõ barem điểm từng bước (ví dụ: 0.25đ / 0.5đ / 0.25đ) để giáo viên dễ chấm.

      (LƯU Ý: Với KHỐI 12 hoặc khi đề yêu cầu 40 lệnh 100% trắc nghiệm theo chuẩn tốt nghiệp THPT của Bộ GD&ĐT: Phần I gồm 18 câu, Phần II gồm 4 câu, Phần III gồm 6 câu, Phần IV để mảng rỗng []).

      QUY CHUẨN PHONG CÁCH ĐỀ THI TỐT NGHIỆP THPT (BỘ GD&ĐT 2025 - 2026) - ĐẶC BIỆT ÁP DỤNG CHO LỚP 12 (KIỂM TRA THƯỜNG XUYÊN VÀ ĐỊNH KÌ):
      Ghi nhớ và tuân thủ tuyệt đối hình thức, độ dài phần dẫn, bối cảnh thực tiễn và phương thức tạo câu hỏi từ Đề thi tốt nghiệp THPT 2025 và 2026 môn Hóa học của Bộ GD&ĐT:
      
      1. PHẦN I (18 câu Trắc nghiệm 4 lựa chọn):
         - Độ dài phần dẫn: Ngắn gọn, súc tích từ 10 đến 35 từ.
         - Các hình thức câu hỏi đặc trưng của Bộ GD&ĐT:
           + Câu hỏi điền khuyết: "... (1) ... là hợp chất/quá trình... Cụm từ thích hợp điền vào (1) là:".
           + Câu hỏi đánh giá thảo luận / đề xuất thực tiễn: Nêu tình huống thực tế (giảm độ cứng nước sinh hoạt, bảo vệ chống ăn mòn cọc kè biển, xử lý khí thải, pha chế dung dịch) kèm danh sách đề xuất đánh số (1), (2), (3), (4) -> Lệnh hỏi: "Các đề xuất đúng là:" hoặc "Đề xuất nào sau đây hợp lý?".
           + Câu hỏi đọc dữ liệu phổ / sơ đồ thí nghiệm / pin: Đọc tín hiệu peak phổ hồng ngoại IR (nhóm C=O ~1700 cm⁻¹, O-H ~3300 cm⁻¹), peak ion phân tử m/z trên phổ MS, sơ đồ pin Galvanic (xác định cực anode, cathode, chiều electron, ion trong cầu muối), hoặc nhận diện dụng cụ thí nghiệm (bình cầu, sinh hàn, phễu chiết).
           + Bốn phương án A, B, C, D ngắn gọn, ngữ pháp và cấu trúc đồng nhất. 'options' chỉ chứa nội dung câu trả lời, không kèm chữ A. B. C. D ở đầu.
      
      2. PHẦN II (4 câu Trắc nghiệm Đúng/Sai - 4 bối cảnh lớn cho Lớp 12; 2 bối cảnh cho định kì Lớp 10/11):
         - Độ dài bối cảnh (context): 100 đến 250 từ. Bối cảnh phải giàu hàm lượng chuyên môn, gắn với thí nghiệm thực hành, đời sống hoặc sản xuất công nghiệp.
         - QUY TẮC CỐT LÕI VỀ BỐI CẢNH VÀ CÁC PHÁT BIỂU ĐÚNG/SAI (BẮT BUỘC TUÂN THỦ):
           + BỐI CẢNH KHÔNG PHẢI DÙNG ĐỂ TRANG TRÍ MÀ LÀ DỮ LIỆU QUAN TRỌNG, CỐT LÕI ĐỂ ĐÁNH GIÁ ĐÚNG, SAI.
           + CÁC PHÁT BIỂU ĐÚNG/SAI BẮT BUỘC PHẢI BÁM SÁT NỘI DUNG VÀ DỮ LIỆU CỦA BỐI CẢNH, TUYỆT ĐỐI KHÔNG ĐƯA CÁC PHƯƠNG ÁN XA RỜI BỐI CẢNH hoặc hỏi lý thuyết rời rạc bên ngoài không liên quan đến bối cảnh đã xây dựng.
           + Mọi nhận định a, b, c, d phải dựa trên việc phân tích các đối tượng, hóa chất, số liệu, tiến trình thí nghiệm, hiện tượng hoặc đồ thị có trong bối cảnh.
         - Phương thức tạo 4 lệnh hỏi a, b, c, d phát triển theo 4 cấp độ tư duy nhận thức:
           + a) Nhận biết: Kiểm tra định nghĩa, nhóm chức, phân loại, tên gọi hoặc vai trò cơ bản của hóa chất được đề cập trong bối cảnh.
           + b) Thông hiểu: Bản chất phản ứng, giải thích hiện tượng ở từng bước thí nghiệm/quá trình nêu trong bối cảnh.
           + c) Vận dụng: Tính toán định lượng trực tiếp gắn liền với số liệu, nồng độ, thể tích, khối lượng trong bối cảnh.
           + d) Vận dụng cao / Đánh giá: Đánh giá tính đúng/sai của giả thuyết học sinh đưa ra, dự đoán hiện tượng khi thay đổi hóa chất/điều kiện, suy luận cấu trúc lập thể hoặc tối ưu hóa phản ứng trong bối cảnh.
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

    const randomSeed = Math.random().toString(36).substring(2, 8).toUpperCase();
    const dynamicThemes = getRandomEssayThemes(grade);

    contents.push({
      text: `Soạn đề kiểm tra Hóa học khối ${grade} - Các chương: ${topicStr}. Yêu cầu: ${details || 'Chuẩn GDPT 2018'}. Mã phiên tạo đề độc bản: #${randomSeed}. Đảm bảo tỉ lệ 4:3:3, phân bổ đều kiến thức giữa các chương.
ĐẶC BIỆT LƯU Ý Ở PHẦN II (ĐÚNG/SAI): Bối cảnh không phải dùng để trang trí mà là dữ liệu quan trọng để đánh giá đúng, sai; Các phát biểu Đúng/Sai bắt buộc phải bám sát nội dung và dữ liệu bối cảnh, tuyệt đối không đưa các phương án xa rời bối cảnh.
ĐẶC BIỆT LƯU Ý Ở PHẦN IV (TỰ LUẬN KHỐI 10 & 11): TUYỆT ĐỐI KHÔNG lặp lại các câu hỏi tự luận cũ hay khuôn mẫu quen thuộc dù cùng chủ đề. Bắt buộc tạo bộ 3 câu tự luận hoàn toàn mới, đổi mới ngữ cảnh thực tiễn, đổi mới chất và số liệu tính toán. Gợi ý hướng bối cảnh tham khảo cho phiên này: [${dynamicThemes}].
Nếu là kiểm tra định kì Lớp 10 hoặc 11 (hoặc có yêu cầu tự luận), đề thi BẮT BUỘC có 4 phần (21 câu, 27 lệnh hỏi, 10 điểm: 12 câu Phần I, 2 câu Phần II, 4 câu Phần III, 3 câu Phần IV tự luận kèm biểu điểm solution). Nếu là Lớp 12, đề thi tuân thủ 40 lệnh trắc nghiệm (18 câu Phần I, 4 câu Phần II, 6 câu Phần III).`
    });

    const response = await ai.models.generateContent({
      model: selectedModel,
      contents: { parts: contents },
      config: {
        systemInstruction,
        temperature: 0.85,
        responseMimeType: 'application/json',
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
                required: ['question', 'options', 'correctIndex']
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
                      required: ['text', 'isTrue']
                    }
                  }
                },
                required: ['context', 'statements']
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
                required: ['question', 'answer', 'explanation']
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
                required: ['question', 'points', 'solution']
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
                required: ['topic', 'recognition', 'understanding', 'application', 'highApplication']
              }
            }
          },
          required: ['title', 'grade', 'part1', 'part2', 'part3', 'matrix']
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error('AI không phản hồi dữ liệu.');
    }

    const examData = JSON.parse(text);
    if (existingMatrix && Array.isArray(existingMatrix) && existingMatrix.length > 0) {
      examData.matrix = existingMatrix;
      examData.matrixVerified = true;
    }
    if (sourceMatrixData) {
      examData.sourceMatrixData = sourceMatrixData;
    }
    return res.json({ success: true, data: examData });

  } catch (error) {
    console.error('Lỗi khi gọi Gemini API:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Lỗi server khi tạo đề thi.'
    });
  }
});

// Matrices CRUD
app.get('/api/matrices', (req, res) => {
  const list = readJsonFile(matricesFilePath);
  res.json({ success: true, data: list });
});

app.post('/api/matrices', (req, res) => {
  const config = req.body;
  if (!config || !config.id) {
    return res.status(400).json({ success: false, error: 'Dữ liệu không hợp lệ' });
  }
  const list = readJsonFile(matricesFilePath);
  const updated = [config, ...list.filter(item => item.id !== config.id)];
  writeJsonFile(matricesFilePath, updated);
  res.json({ success: true, data: config });
});

app.delete('/api/matrices/:id', (req, res) => {
  const { id } = req.params;
  const list = readJsonFile(matricesFilePath);
  const updated = list.filter(item => item.id !== id);
  writeJsonFile(matricesFilePath, updated);
  res.json({ success: true });
});

// Exams CRUD
app.get('/api/exams', (req, res) => {
  const list = readJsonFile(examsFilePath);
  res.json({ success: true, data: list });
});

app.post('/api/exams', (req, res) => {
  const exam = req.body;
  if (!exam) {
    return res.status(400).json({ success: false, error: 'Dữ liệu không hợp lệ' });
  }
  const examWithMeta = {
    ...exam,
    id: exam.id || `exam_${Date.now()}`,
    createdAt: exam.createdAt || Date.now()
  };
  const list = readJsonFile(examsFilePath);
  const updated = [examWithMeta, ...list.filter(item => item.id !== examWithMeta.id)];
  writeJsonFile(examsFilePath, updated);
  res.json({ success: true, data: examWithMeta });
});

app.delete('/api/exams/:id', (req, res) => {
  const { id } = req.params;
  const list = readJsonFile(examsFilePath);
  const updated = list.filter(item => item.id !== id);
  writeJsonFile(examsFilePath, updated);
  res.json({ success: true });
});

// Serve frontend build if exists
const distPath = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Backend server running at http://localhost:${PORT}`);
});
