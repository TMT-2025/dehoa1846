
import { Chapter } from './types';

export const CURRICULUM: Record<number, Chapter[]> = {
  10: [
    { id: '10_c1', name: 'Chương 1: Cấu tạo nguyên tử', lessons: [{ id: '10_c1_l1', name: 'Thành phần của nguyên tử' }, { id: '10_c1_l2', name: 'Nguyên tố hoá học' }, { id: '10_c1_l3', name: 'Cấu trúc lớp vỏ electron của nguyên tử' }] },
    { id: '10_c2', name: 'Chương 2: Bảng tuần hoàn & định luật tuần hoàn', lessons: [{ id: '10_c2_l1', name: 'Cấu tạo bảng tuần hoàn' }, { id: '10_c2_l2', name: 'Xu hướng biến đổi tính chất' }, { id: '10_c2_l3', name: 'Định luật tuần hoàn' }] },
    { id: '10_c3', name: 'Chương 3: Liên kết hóa học', lessons: [{ id: '10_c3_l1', name: 'Quy tắc octet' }, { id: '10_c3_l2', name: 'Liên kết ion' }, { id: '10_c3_l3', name: 'Liên kết cộng hoá trị' }, { id: '10_c3_l4', name: 'Liên kết hydrogen & Van der Waals' }] },
    { id: '10_c4', name: 'Chương 4: Phản ứng oxi hóa – khử', lessons: [{ id: '10_c4_l1', name: 'Số oxi hóa' }, { id: '10_c4_l2', name: 'Lập phương trình OXH-Khử' }, { id: '10_c4_l3', name: 'Ý nghĩa phản ứng OXH-Khử' }] },
    { id: '10_c5', name: 'Chương 5: Năng lượng hóa học', lessons: [{ id: '10_c5_l1', name: 'Enthalpy tạo thành' }, { id: '10_c5_l2', name: 'Tính biến thiên enthalpy' }] },
    { id: '10_c6', name: 'Chương 6: Tốc độ phản ứng', lessons: [{ id: '10_c6_l1', name: 'Phương trình tốc độ' }, { id: '10_c6_l2', name: 'Các yếu tố ảnh hưởng tốc độ' }] },
    { id: '10_c7', name: 'Chương 7: Nguyên tố nhóm halogen', lessons: [{ id: '10_c7_l1', name: 'Tính chất đơn chất nhóm VIIA' }, { id: '10_c7_l2', name: 'Hydrogen halide & ion halide' }] }
  ],
  11: [
    { id: '11_c1', name: 'Chương 1: Cân bằng hóa học', lessons: [{ id: '11_c1_l1', name: 'Khái niệm về cân bằng hóa học' }, { id: '11_c1_l2', name: 'Cân bằng trong dung dịch nước' }] },
    { id: '11_c2', name: 'Chương 2: Nitrogen - sulfur', lessons: [{ id: '11_c2_l1', name: 'Nitrogen & Ammonia' }, { id: '11_c2_l2', name: 'Hợp chất nitrogen với oxygen' }, { id: '11_c2_l3', name: 'Sulfur & Sulfur dioxide' }, { id: '11_c2_l4', name: 'Sulfuric acid & muối sulfate' }] },
    { id: '11_c3', name: 'Chương 3: Đại cương Hóa học hữu cơ', lessons: [{ id: '11_c3_l1', name: 'Hợp chất hữu cơ & Cấu tạo' }, { id: '11_c3_l2', name: 'Phương pháp tách biệt' }, { id: '11_c3_l3', name: 'Công thức phân tử' }] },
    { id: '11_c4', name: 'Chương 4: Hydrocarbon', lessons: [{ id: '11_c4_l1', name: 'Alkane' }, { id: '11_c4_l2', name: 'Alkene & Alkyne' }, { id: '11_c4_l3', name: 'Arene' }] },
    { id: '11_c5', name: 'Chương 5: Dẫn xuất Halogen – Alcohol – Phenol', lessons: [{ id: '11_c5_l1', name: 'Dẫn xuất Halogen' }, { id: '11_c5_l2', name: 'Alcohol' }, { id: '11_c5_l3', name: 'Phenol' }] },
    { id: '11_c6', name: 'Chương 6: Hợp chất Carbonyl – Carboxylic Acid', lessons: [{ id: '11_c6_l1', name: 'Aldehyde – Ketone' }, { id: '11_c6_l2', name: 'Carboxylic Acid' }] }
  ],
  12: [
    { id: '12_c1', name: 'Chương 1: Ester – Lipid', lessons: [{ id: '12_c1_l1', name: 'Ester - Lipid' }, { id: '12_c1_l2', name: 'Xà phòng & chất giặt rửa' }] },
    { id: '12_c2', name: 'Chương 2: Carbohydrate', lessons: [{ id: '12_c2_l1', name: 'Glucose & Fructose' }, { id: '12_c2_l2', name: 'Saccharose, Tinh bột & Cellulose' }] },
    { id: '12_c3', name: 'Chương 3: Hợp chất chứa nitơ', lessons: [{ id: '12_c3_l1', name: 'Amine' }, { id: '12_c3_l2', name: 'Amino acid, peptide, protein' }] },
    { id: '12_c4', name: 'Chương 4: Polymer', lessons: [{ id: '12_c4_l1', name: 'Đại cương polymer' }, { id: '12_c4_l2', name: 'Vật liệu polymer' }] },
    { id: '12_c5', name: 'Chương 5: Pin điện & điện phân', lessons: [{ id: '12_c5_l1', name: 'Thế điện cực chuẩn' }, { id: '12_c5_l2', name: 'Điện phân' }] },
    { id: '12_c6', name: 'Chương 6: Đại cương kim loại', lessons: [{ id: '12_c6_l1', name: 'Cấu tạo & Tính chất vật lí' }, { id: '12_c6_l2', name: 'Tính chất hoá học' }, { id: '12_c6_l3', name: 'Ăn mòn & Hợp kim' }] },
    { id: '12_c7', name: 'Chương 7: Nguyên tố nhóm IA & IIA', lessons: [{ id: '12_c7_l1', name: 'Nguyên tố nhóm IA' }, { id: '12_c7_l2', name: 'Nguyên tố nhóm IIA' }, { id: '12_c7_l3', name: 'Nước cứng' }] },
    { id: '12_c8', name: 'Chương 8: Kim loại chuyển tiếp & Phức chất', lessons: [{ id: '12_c8_l1', name: 'Kim loại chuyển tiếp dãy 1' }, { id: '12_c8_l2', name: 'Sơ lược phức chất' }] }
  ]
};
