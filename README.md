# 🧪 ChemSuite Pro - Hệ Thống Tạo Ma Trận & Ra Đề Thi Hóa Học GDPT 2018 (Fullstack)

Hệ thống Web App Fullstack tích hợp **02 ứng dụng** được xuất từ **Google AI Studio**:
1. **Ứng dụng Tạo Ma Trận Đề** (từ `chemistry-matrix-generator`)
2. **Ứng dụng Tạo Đề Kiểm Tra AI** (từ `tao-de-cac-chuong-18-4-6`)

---

## ✨ Điểm nổi bật & Cầu nối liên kết thông minh

- **Cầu nối tự động giữa Ma Trận và Đề Thi:**
  - Giáo viên thiết lập phạm vi (Lớp 10, 11, 12 hoặc Tự do), chọn chương, phân bổ bài học và chọn 4 bối cảnh Đúng/Sai cho Phần II ở **Tab Tạo Ma Trận**.
  - Nhấn nút **"🚀 Sinh Đề Thi Từ Ma Trận Này"**: Toàn bộ ma trận chi tiết (tỉ lệ 4:3:3, 40 lệnh hỏi, các bối cảnh đã chọn) sẽ tự động được chuyển sang **Tab Tạo Đề Kiểm Tra**.
  - AI Gemini sẽ tiếp nhận cấu trúc ma trận và sinh đề thi bám sát 100% yêu cầu khảo thí!
- **Đầy đủ các định dạng xuất dữ liệu chuẩn:**
  - Xuất bảng Ma trận: **Excel (.xlsx)**, **Ảnh (.png)**, **PDF**, In trực tiếp.
  - Xuất Đề thi: **Word (.docx)** đề học sinh, **Word (.docx)** đề kèm đáp án và hướng dẫn giải, In trực tiếp.
  - Tự động định dạng công thức hóa học: chỉ số dưới nguyên tử ($H_2SO_4$, $Fe_2O_3$), chỉ số trên điện tích ion ($Fe^{2+}$, $SO_4^{2-}$), cấu hình electron ($1s^2 2s^2 2p^6$).
- **Kho lưu trữ:** Tự động lưu các mẫu ma trận và đề thi đã tạo vào cơ sở dữ liệu để xem lại hoặc chỉnh sửa bất kỳ lúc nào.
- **Bảo mật & Linh hoạt API Key:** Hỗ trợ nhập Google Gemini API Key trực tiếp trên giao diện hoặc lưu trong file `.env`.

---

## 🚀 Hướng dẫn khởi chạy

### Cách 1: Khởi chạy môi trường phát triển (Fullstack)
Chạy lệnh duy nhất để khởi động cả Backend (Port 5000) và Frontend (Port 3000):
```bash
npm run dev
```
Sau đó mở trình duyệt tại: **http://localhost:3000**

---

### Cách 2: Khởi chạy Production Server
Dự án đã được build sẵn vào thư mục `dist`. Bạn chỉ cần chạy:
```bash
npm start
```
Sau đó mở trình duyệt tại: **http://localhost:5000**

---

## 🔑 Cấu hình Google Gemini API Key

Bạn có thể cấu hình API Key theo một trong hai cách:
1. **Trên giao diện Web:** Nhấp vào nút **"Cấu hình Gemini Key"** ở góc trên bên phải màn hình và dán API Key của bạn.
2. **Qua file `.env`:** Mở file `.env` tại thư mục gốc và điền:
   ```env
   GEMINI_API_KEY=AIzaSy...
   PORT=5000
   ```

*(Nếu chưa có API Key, bạn có thể tạo miễn phí tại [Google AI Studio](https://aistudio.google.com/app/apikey))*
