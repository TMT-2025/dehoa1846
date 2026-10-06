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
    const { grade, topics, details, existingMatrix, matrixImageBase64, modelName } = req.body;
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
