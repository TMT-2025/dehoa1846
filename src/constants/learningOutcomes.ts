/**
 * YÊU CẦU CẦN ĐẠT MÔN HÓA HỌC CẤP TRUNG HỌC PHỔ THÔNG (CT GDPT 2018)
 * Trích xuất chuẩn xác từ các tài liệu chuẩn của Bộ Giáo dục và Đào tạo:
 * - YEU CAU CAN DAT HOA 10.pdf
 * - YEU CAU CAN DAT HOA 11.pdf
 * - YEU CAU CAN DAT HOA 12.pdf
 * Phân cấp thành 3 mức độ nhận thức: Nhận biết (recognition), Thông hiểu (understanding), Vận dụng (application)
 */

export interface LearningOutcomeDetail {
  recognition: string[];
  understanding: string[];
  application: string[];
}

export interface TopicOutcome {
  topicKey: string;
  topicName: string;
  chapterName: string;
  grade: 10 | 11 | 12;
  outcomes: LearningOutcomeDetail;
}

export const LEARNING_OUTCOMES: Record<number, Record<string, LearningOutcomeDetail>> = {
  // ==========================================
  // HÓA HỌC LỚP 10
  // ==========================================
  10: {
    // Chương 1: Cấu tạo nguyên tử
    "Bài 1: Thành phần của nguyên tử": {
      recognition: [
        "Trình bày được thành phần của nguyên tử (hạt nhân và lớp vỏ; hạt nhân gồm proton (p), neutron (n); vỏ gồm electron (e)).",
        "Nêu được điện tích, khối lượng của mỗi loại hạt p, n, e.",
        "Nêu được số đơn vị điện tích hạt nhân (Z) và số khối (A = Z + N)."
      ],
      understanding: [
        "So sánh được khối lượng của electron với proton và neutron.",
        "So sánh được kích thước của hạt nhân với kích thước nguyên tử.",
        "Giải thích được vì sao khối lượng nguyên tử hầu như tập trung ở hạt nhân."
      ],
      application: [
        "Xác định được số hạt p, n, e trong nguyên tử hoặc ion.",
        "Giải quyết bài toán cơ bản về thành phần hạt nguyên tử và mối liên hệ giữa các hạt."
      ]
    },
    "Bài 2: Nguyên tố hoá học": {
      recognition: [
        "Trình bày được khái niệm về nguyên tố hoá học, số hiệu nguyên tử (Z) và kí hiệu nguyên tử (A_Z X).",
        "Phát biểu được khái niệm đồng vị, nguyên tử khối."
      ],
      understanding: [
        "Phân biệt được các nguyên tử là đồng vị của nhau dựa vào số p và số n (hoặc số khối A).",
        "Hiểu được ý nghĩa của các chỉ số trong kí hiệu nguyên tử A_Z X."
      ],
      application: [
        "Tính được nguyên tử khối trung bình (theo amu) dựa vào phần trăm số nguyên tử hoặc khối lượng nguyên tử của các đồng vị theo phổ khối lượng (MS) được cung cấp.",
        "Tính thành phần phần trăm khối lượng của một đồng vị trong một hợp chất hóa học."
      ]
    },
    "Bài 3: Cấu trúc lớp vỏ electron nguyên tử": {
      recognition: [
        "Nêu được khái niệm orbital nguyên tử (AO), mô tả được hình dạng của AO s (hình cầu), AO p (hình số 8 nổi).",
        "Nêu được số lượng electron tối đa trong 1 AO, trong phân lớp s, p, d, f và trong lớp thứ n (2n²).",
        "Viết được cấu hình electron nguyên tử theo lớp, phân lớp electron và theo ô orbital khi biết Z của 20 nguyên tố đầu tiên."
      ],
      understanding: [
        "Trình bày và so sánh được mô hình Rutherford – Bohr với mô hình hiện đại mô tả sự chuyển động của electron trong nguyên tử.",
        "Dựa vào đặc điểm cấu hình electron lớp ngoài cùng (1, 2, 3 e: kim loại; 5, 6, 7 e: phi kim; 8 e: khí hiếm) để dự đoán tính chất hoá học cơ bản của nguyên tố."
      ],
      application: [
        "Viết cấu hình electron của ion (cation, anion) tạo thành từ nguyên tử tương ứng.",
        "Xác định số electron độc thân của nguyên tử ở trạng thái cơ bản dựa vào biểu diễn ô orbital."
      ]
    },

    // Chương 2: Bảng tuần hoàn các nguyên tố hóa học
    "Bài 5: Cấu tạo của bảng tuần hoàn các nguyên tố hoá học": {
      recognition: [
        "Mô tả được cấu tạo của bảng tuần hoàn: ô nguyên tố, chu kì, nhóm.",
        "Nêu được nguyên tắc sắp xếp các nguyên tố trong bảng tuần hoàn (theo chiều tăng dần của điện tích hạt nhân; cùng số lớp e cùng chu kì; cùng số e hoá trị cùng nhóm).",
        "Phân loại được nguyên tố dựa theo cấu hình electron (nguyên tố s, p, d, f) và tính chất (kim loại, phi kim, khí hiếm)."
      ],
      understanding: [
        "Xác định được vị trí nguyên tố trong bảng tuần hoàn (ô, chu kì, nhóm A/B) từ cấu hình electron nguyên tử và ngược lại.",
        "Giải thích mối quan hệ giữa số thứ tự chu kì với số lớp electron, số thứ tự nhóm A với số electron hoá trị."
      ],
      application: [
        "Suy luận tính chất hoá học đặc trưng của nguyên tố dựa trên vị trí của nó trong bảng tuần hoàn."
      ]
    },
    "Bài 6: Xu hướng biến đổi một số tính chất của nguyên tử các nguyên tố trong một chu kì và trong một nhóm": {
      recognition: [
        "Nêu được khái niệm độ âm điện của nguyên tử.",
        "Nhận biết được xu hướng biến đổi bán kính nguyên tử, độ âm điện, tính kim loại, tính phi kim trong một chu kì và trong một nhóm A."
      ],
      understanding: [
        "Giải thích được xu hướng biến đổi bán kính nguyên tử trong chu kì (giảm dần) và trong nhóm A (tăng dần).",
        "Giải thích được xu hướng biến đổi độ âm điện, tính kim loại và tính phi kim dựa trên cấu hình e và lực hút tĩnh điện của hạt nhân."
      ],
      application: [
        "So sánh và sắp xếp thứ tự bán kính nguyên tử, độ âm điện, tính kim loại/phi kim của các nguyên tố lân cận trong bảng tuần hoàn."
      ]
    },
    "Bài 7: Xu hướng biến đổi thành phần và một số tính chất của hợp chất trong một chu kì": {
      recognition: [
        "Nêu được công thức oxide cao nhất và hydroxide tương ứng của các nguyên tố nhóm A chu kì 3.",
        "Nhận xét được xu hướng biến đổi thành phần và tính chất acid/base của các oxide và hydroxide theo chu kì."
      ],
      understanding: [
        "Giải thích được quy luật biến đổi tính acid - base của oxide cao nhất và hydroxide (tính base giảm dần, tính acid tăng dần trong một chu kì).",
        "Viết được phương trình hoá học minh hoạ tính acid, base hoặc lưỡng tính của các oxide và hydroxide chu kì 3."
      ],
      application: [
        "So sánh tính acid/base của các hydroxide, oxide của các nguyên tố trong cùng chu kì hoặc cùng nhóm A."
      ]
    },
    "Bài 8: Định luật tuần hoàn. Ý nghĩa của bảng tuần hoàn các nguyên tố hoá học": {
      recognition: [
        "Phát biểu được định luật tuần hoàn các nguyên tố hoá học."
      ],
      understanding: [
        "Trình bày được ý nghĩa của bảng tuần hoàn: Mối liên hệ giữa vị trí nguyên tố với cấu tạo nguyên tử và tính chất hoá học cơ bản."
      ],
      application: [
        "Từ vị trí của nguyên tố trong bảng tuần hoàn, suy ra cấu tạo nguyên tử, tính chất đơn chất, công thức oxide/hydroxide cao nhất và so sánh với các nguyên tố lân cận."
      ]
    },

    // Chương 3: Liên kết hóa học
    "Bài 9: Quy tắc octet": {
      recognition: [
        "Nêu được nội dung quy tắc octet (xu hướng đạt cấu hình 8 electron lớp ngoài cùng giống khí hiếm bền vững, hoặc 2 e với He)."
      ],
      understanding: [
        "Giải thích được xu hướng nhường, nhận hoặc góp chung electron của các nguyên tử nguyên tố nhóm A khi hình thành liên kết hoá học."
      ],
      application: [
        "Vận dụng quy tắc octet để giải thích sự hình thành liên kết trong các phân tử đơn giản (F2, O2, N2, HCl, H2O, NH3, CH4...)."
      ]
    },
    "Bài 10: Liên kết ion": {
      recognition: [
        "Trình bày được khái niệm liên kết ion và sự hình thành liên kết ion (lực hút tĩnh điện giữa các ion mang điện tích trái dấu).",
        "Nêu được cấu tạo tinh thể NaCl."
      ],
      understanding: [
        "Giải thích được vì sao các hợp chất ion thường ở trạng thái rắn trong điều kiện thường, có nhiệt độ nóng chảy và nhiệt độ sôi cao, dẫn điện khi nóng chảy hoặc hoà tan trong nước."
      ],
      application: [
        "Viết sơ đồ hình thành ion và liên kết ion từ các nguyên tử kim loại điển hình và phi kim điển hình."
      ]
    },
    "Bài 11: Liên kết cộng hoá trị": {
      recognition: [
        "Trình bày được khái niệm liên kết cộng hoá trị (liên kết đơn, đôi, ba).",
        "Nêu được khái niệm liên kết cho nhận (phối trí) và năng lượng liên kết.",
        "Viết được công thức Lewis của một số chất đơn giản."
      ],
      understanding: [
        "Phân biệt được các loại liên kết (cộng hoá trị không phân cực, cộng hoá trị phân cực, liên kết ion) dựa theo hiệu độ âm điện (Δχ).",
        "Giải thích được sự hình thành liên kết σ (xen phủ trục) và liên kết π (xen phủ bên) qua sự xen phủ orbital nguyên tử."
      ],
      application: [
        "Dự đoán độ phân cực của liên kết và phân tử dựa trên cấu tạo và hiệu độ âm điện."
      ]
    },
    "Bài 12: Liên kết hydrogen và tương tác van der Waals": {
      recognition: [
        "Nêu được khái niệm liên kết hydrogen và tương tác van der Waals.",
        "Nêu được điều kiện hình thành liên kết hydrogen (nguyên tử H liên kết với nguyên tố có độ âm điện lớn như F, O, N và có cặp e chưa liên kết)."
      ],
      understanding: [
        "Vận dụng để giải thích được sự xuất hiện liên kết hydrogen và ảnh hưởng của nó đến tính chất vật lí của H2O, alcohol.",
        "Giải thích được ảnh hưởng của tương tác van der Waals tới nhiệt độ nóng chảy, nhiệt độ sôi của các chất (dãy halogen, khí hiếm, hydrocarbon)."
      ],
      application: [
        "So sánh nhiệt độ sôi, tính tan trong nước của các chất dựa trên liên kết hydrogen và tương tác van der Waals."
      ]
    },

    // Chương 4: Phản ứng oxi hóa - khử
    "Bài 13: Phản ứng oxi hoá – khử": {
      recognition: [
        "Nêu được quy tắc và xác định được số oxi hoá của nguyên tử các nguyên tố trong đơn chất và hợp chất.",
        "Nêu được khái niệm chất khử, chất oxi hoá, quá trình oxi hoá (sự oxi hoá), quá trình khử (sự khử) và phản ứng oxi hoá – khử."
      ],
      understanding: [
        "Mô tả và giải thích được ý nghĩa của một số phản ứng oxi hoá – khử quan trọng gắn liền với cuộc sống (sự cháy, sự hô hấp, rỉ sét kim loại, pin điện).",
        "Phân biệt được phản ứng oxi hoá - khử và phản ứng không phải oxi hoá - khử."
      ],
      application: [
        "Cân bằng được phản ứng oxi hoá – khử bằng phương pháp thăng bằng electron (phản ứng có môi trường, phản ứng tự oxi hoá - khử, phản ứng nội oxi hoá - khử)."
      ]
    },

    // Chương 5: Năng lượng hóa học
    "Bài 17: Biến thiên enthalpy trong các phản ứng hoá học": {
      recognition: [
        "Trình bày được khái niệm phản ứng toả nhiệt, phản ứng thu nhiệt.",
        "Nêu được điều kiện chuẩn (1 bar, 298 K) và khái niệm enthalpy tạo thành chuẩn (ΔfH°₂₉₈), biến thiên enthalpy chuẩn của phản ứng (ΔrH°₂₉₈).",
        "Nêu được ý nghĩa của dấu và giá trị ΔrH°₂₉₈ (ΔrH°₂₉₈ < 0: toả nhiệt; ΔrH°₂₉₈ > 0: thu nhiệt)."
      ],
      understanding: [
        "Giải thích được tính thuận lợi về mặt năng lượng của phản ứng toả nhiệt so với phản ứng thu nhiệt.",
        "Hiểu và áp dụng quy ước: enthalpy tạo thành chuẩn của đơn chất bền nhất bằng 0."
      ],
      application: [
        "Tính được biến thiên enthalpy chuẩn ΔrH°₂₉₈ của phản ứng dựa vào nhiệt tạo thành chuẩn: ΔrH°₂₉₈ = Σ ΔfH°₂₉₈ (sản phẩm) - Σ ΔfH°₂₉₈ (chất đầu).",
        "Tính được biến thiên enthalpy chuẩn ΔrH°₂₉₈ của phản ứng dựa vào năng lượng liên kết: ΔrH°₂₉₈ = Σ Eb (chất đầu) - Σ Eb (sản phẩm) (cho phản ứng thể khí).",
        "Tính nhiệt lượng toả ra hoặc hấp thụ khi đốt cháy một lượng nhiên liệu trong đời sống thực tế."
      ]
    },

    // Chương 6: Tốc độ phản ứng hóa học
    "Bài 19: Tốc độ phản ứng": {
      recognition: [
        "Trình bày được khái niệm tốc độ phản ứng hoá học và công thức tính tốc độ trung bình của phản ứng.",
        "Viết được biểu thức tốc độ phản ứng theo định luật tác dụng khối lượng: v = k.C_A^a.C_B^b (cho phản ứng đơn giản), nêu được ý nghĩa hằng số tốc độ k.",
        "Nêu được các yếu tố ảnh hưởng tới tốc độ phản ứng: nồng độ, áp suất, nhiệt độ, diện tích tiếp xúc, chất xúc tác."
      ],
      understanding: [
        "Giải thích được cơ chế ảnh hưởng của từng yếu tố tới tốc độ phản ứng dựa trên thuyết va chạm hoạt động.",
        "Nêu được ý nghĩa của hệ số nhiệt độ Van 't Hoff (γ)."
      ],
      application: [
        "Tính tốc độ trung bình của phản ứng dựa vào độ biến thiên nồng độ theo thời gian.",
        "Tính tốc độ phản ứng khi thay đổi nhiệt độ bằng công thức Van 't Hoff: v_T2 / v_T1 = γ^((T2 - T1) / 10).",
        "Vận dụng kiến thức tốc độ phản ứng để giải thích và đề xuất các biện pháp điều khiển tốc độ phản ứng trong đời sống và sản xuất."
      ]
    },

    // Chương 7: Nguyên tố nhóm VIIA (Halogen)
    "Bài 21: Nhóm halogen": {
      recognition: [
        "Phát biểu được trạng thái tự nhiên, cấu hình electron hoá trị ns²np⁵ và tính chất vật lí cơ bản của các đơn chất halogen.",
        "Nêu được xu hướng biến đổi tính chất vật lí (màu sắc, trạng thái, nhiệt độ sôi) và tính oxi hoá giảm dần từ F2 đến I2."
      ],
      understanding: [
        "Giải thích được sự biến đổi nhiệt độ nóng chảy, nhiệt độ sôi của các đơn chất halogen dựa vào tương tác van der Waals.",
        "Giải thích được xu hướng phản ứng của các halogen với hydrogen và với nước; viết được PTHH chứng minh xu hướng giảm dần tính oxi hoá."
      ],
      application: [
        "Viết được PTHH tự oxi hoá – khử của chlorine với NaOH ở nhiệt độ thường (nước Javel) và khi đun nóng (muối chlorate).",
        "Giải quyết bài toán kim loại hoặc muối halide tác dụng với đơn chất halogen."
      ]
    },
    "Bài 22: Hydrogen halide - Muối halide": {
      recognition: [
        "Trình bày được xu hướng biến đổi nhiệt độ sôi của các hydrogen halide (HF bất thường, sau đó tăng dần từ HCl đến HI).",
        "Trình bày được xu hướng biến đổi tính acid của dãy hydrohalic acid (HF < HCl < HBr < HI).",
        "Nêu được hiện tượng thí nghiệm phân biệt các ion F⁻, Cl⁻, Br⁻, I⁻ bằng dung dịch AgNO3."
      ],
      understanding: [
        "Giải thích được sự bất thường về nhiệt độ sôi của HF so với các HX khác dựa trên liên kết hydrogen liên phân tử.",
        "Giải thích được tính khử tăng dần của các ion halide (Cl⁻ < Br⁻ < I⁻) thông qua phản ứng với dung dịch sulfuric acid đặc (H2SO4 đặc)."
      ],
      application: [
        "Nhận biết các dung dịch muối halide bằng thuốc thử AgNO3.",
        "Giải bài toán liên quan đến phản ứng trao đổi của muối halide hoặc phản ứng oxi hoá - khử của ion halide với H2SO4 đặc."
      ]
    }
  },

  // ==========================================
  // HÓA HỌC LỚP 11
  // ==========================================
  11: {
    // Chương 1: Cân bằng hóa học
    "Bài 1: Khái niệm về cân bằng hoá học": {
      recognition: [
        "Trình bày được khái niệm phản ứng thuận nghịch và trạng thái cân bằng của một phản ứng thuận nghịch.",
        "Viết được biểu thức hằng số cân bằng (Kc) của phản ứng thuận nghịch."
      ],
      understanding: [
        "Hiểu được bản chất của cân bằng động (vt = vn ≠ 0) và ý nghĩa của hằng số cân bằng Kc.",
        "Vận dụng nguyên lí Le Chatelier để giải thích và dự đoán chiều chuyển dịch cân bằng khi thay đổi nhiệt độ, nồng độ, áp suất."
      ],
      application: [
        "Tính hằng số cân bằng Kc hoặc nồng độ các chất ở trạng thái cân bằng.",
        "Vận dụng kiến thức cân bằng hoá học để giải thích và tối ưu hoá điều kiện sản xuất trong công nghiệp (quá trình Haber tổng hợp NH3, sản xuất SO3)."
      ]
    },
    "Bài 2: Cân bằng trong dung dịch nước": {
      recognition: [
        "Nêu được khái niệm sự điện li, chất điện li mạnh, chất điện li yếu, chất không điện li.",
        "Trình bày được thuyết Brønsted – Lowry về acid (chất cho H⁺) và base (chất nhận H⁺).",
        "Nêu được khái niệm và ý nghĩa của pH trong thực tiễn; viết biểu thức tính pH = -lg[H⁺]."
      ],
      understanding: [
        "Phân biệt được môi trường acid (pH < 7), base (pH > 7) và trung tính (pH = 7) bằng giấy chỉ thị màu, quỳ tím, phenolphthalein.",
        "Trình bày được nguyên tắc chuẩn độ acid - base mạnh.",
        "Giải thích được ý nghĩa thực tiễn cân bằng thuỷ phân trong dung dịch nước của các ion Al³⁺, Fe³⁺ và CO3²⁻."
      ],
      application: [
        "Tính pH của dung dịch acid mạnh, base mạnh và dung dịch sau phản ứng trung hoà.",
        "Xử lý số liệu thí nghiệm chuẩn độ acid - base để xác định nồng độ dung dịch chưa biết."
      ]
    },

    // Chương 2: Nitrogen và Sulfur
    "Bài 4: Nitrogen": {
      recognition: [
        "Phát biểu được trạng thái tự nhiên của nguyên tố nitrogen.",
        "Nêu được các tính chất vật lí và ứng dụng chính của nitrogen khí và lỏng."
      ],
      understanding: [
        "Giải thích được tính trơ của đơn chất nitrogen ở nhiệt độ thường dựa vào liên kết ba N≡N bền vững và giá trị năng lượng liên kết lớn.",
        "Trình bày được hoạt động hoá học của nitrogen ở nhiệt độ cao với hydrogen và oxygen; liên hệ quá trình tạo nitrate trong đất từ nước mưa giông."
      ],
      application: [
        "Giải thích các ứng dụng thực tiễn của nitrogen (bảo quản thực phẩm, luyện kim, phẫu thuật lạnh...)."
      ]
    },
    "Bài 5: Một số hợp chất với oxygen của nitrogen": {
      recognition: [
        "Nêu được công thức cấu tạo của HNO3, tính acid mạnh và tính oxi hoá mạnh của nitric acid.",
        "Nêu được các nguồn phát thải các oxide của nitrogen (NOx) trong không khí."
      ],
      understanding: [
        "Phân tích được nguyên nhân gây ra hiện tượng mưa acid và tác hại của mưa acid đối với môi trường.",
        "Giải thích được nguyên nhân và hệ quả của hiện tượng phú dưỡng hoá (eutrophication) trong các thuỷ vực."
      ],
      application: [
        "Viết phương trình phản ứng oxi hoá - khử của HNO3 loãng và đặc với kim loại, phi kim; tính toán lượng chất phản ứng hoặc thể tích khí sinh ra."
      ]
    },
    "Bài 6: Một số hợp chất của nitrogen với hydrogen": {
      recognition: [
        "Mô tả được công thức Lewis và dạng hình học chóp tam giác của phân tử ammonia.",
        "Trình bày được tính chất cơ bản của muối ammonium (dễ tan, phân li hoàn toàn, tác dụng với kiềm giải phóng NH3, dễ bị nhiệt phân)."
      ],
      understanding: [
        "Dựa vào cấu tạo phân tử NH3 (đôi electron tự do trên nguyên tử N) để giải thích tính base yếu và tính khử.",
        "Giải thích các giai đoạn và điều kiện tối ưu (nhiệt độ, áp suất, xúc tác Fe) trong quá trình Haber tổng hợp ammonia."
      ],
      application: [
        "Nhận biết được ion ammonium (NH4⁺) trong dung dịch bằng dung dịch kiềm (quỳ tím ẩm hoá xanh).",
        "Tính toán hiệu suất tổng hợp NH3 hoặc tính khối lượng phân bón amophos, phân đạm."
      ]
    },
    "Bài 7: Sulfur và sulfur dioxide": {
      recognition: [
        "Nêu được các trạng thái tự nhiên của sulfur; tính chất vật lí cơ bản của lưu huỳnh đơn chất.",
        "Nêu được tính chất vật lí và tính chất hoá học cơ bản của sulfur dioxide (SO2)."
      ],
      understanding: [
        "Giải thích tính oxi hoá (tác dụng với kim loại) và tính khử (tác dụng với O2) của sulfur đơn chất.",
        "Trình bày tính oxi hoá (tác dụng với H2S) và tính khử (tác dụng với KMnO4, nước bromine, O2) của SO2; tác hại của SO2 đối với sức khoẻ và môi trường."
      ],
      application: [
        "Đề xuất biện pháp xử lý khí thải SO2 trong công nghiệp và đời sống."
      ]
    },
    "Bài 8: Sulfuric acid và muối sulfate": {
      recognition: [
        "Trình bày được tính chất vật lí, cách bảo quản và nguyên tắc xử lý sơ bộ khi bị bỏng acid sulfuric.",
        "Nêu được tính chất hoá học cơ bản của H2SO4 loãng (tính acid mạnh) và H2SO4 đặc (tính oxi hoá rất mạnh và tính háo nước).",
        "Nêu được ứng dụng của các muối sulfate quan trọng: BaSO4, CaSO4, MgSO4, (NH4)2SO4."
      ],
      understanding: [
        "Giải thích được tính oxi hoá mạnh của H2SO4 đặc khi tác dụng với Cu, C, S và tính háo nước khi tác dụng với đường sucrose (C12H22O11).",
        "Vận dụng kiến thức cân bằng và tốc độ phản ứng để giải thích các giai đoạn sản xuất H2SO4 theo phương pháp tiếp xúc."
      ],
      application: [
        "Nhận biết ion sulfate (SO4²⁻) trong dung dịch bằng ion Ba²⁺ (tạo kết tủa trắng không tan trong acid).",
        "Giải bài toán kim loại tác dụng với H2SO4 đặc, nóng hoặc hỗn hợp muối sulfate."
      ]
    },

    // Chương 3: Đại cương hóa học hữu cơ
    "Bài 9: Hợp chất hữu cơ và hoá học hữu cơ": {
      recognition: [
        "Nêu được khái niệm hợp chất hữu cơ và hoá học hữu cơ; đặc điểm chung về cấu tạo và tính chất của hợp chất hữu cơ.",
        "Phân loại được hợp chất hữu cơ thành hydrocarbon và dẫn xuất của hydrocarbon.",
        "Nêu được khái niệm nhóm chức và một số loại nhóm chức cơ bản."
      ],
      understanding: [
        "Sử dụng bảng tín hiệu phổ hồng ngoại (IR) để xác định sự có mặt của một số nhóm chức cơ bản (-OH, -COOH, -CHO, -COO-, C=O, C=C)."
      ],
      application: [
        "Biện luận cấu tạo của hợp chất hữu cơ đơn giản dựa vào phổ IR kết hợp công thức phân tử."
      ]
    },
    "Bài 10: Phương pháp tách biệt và tinh chế hợp chất hữu cơ": {
      recognition: [
        "Trình bày được nguyên tắc của các phương pháp: chưng cất, chiết, kết tinh và sơ lược về sắc kí cột."
      ],
      understanding: [
        "Giải thích được nguyên tắc lựa chọn phương pháp tinh chế phù hợp dựa vào nhiệt độ sôi, độ tan hoặc độ phân cực của các chất."
      ],
      application: [
        "Vận dụng các phương pháp chưng cất (chưng cất lôi cuốn hơi nước), chiết, kết tinh để tách tinh dầu thảo mộc hoặc tinh chế đường, muối trong thực tiễn."
      ]
    },
    "Bài 11: Công thức phân tử hợp chất hữu cơ": {
      recognition: [
        "Nêu được khái niệm công thức phân tử và công thức đơn giản nhất.",
        "Nêu được ứng dụng của phổ khối lượng (MS) trong việc xác định phân tử khối."
      ],
      understanding: [
        "Sử dụng kết quả peak ion phân tử [M⁺] trên phổ khối lượng (MS) để xác định phân tử khối của hợp chất hữu cơ."
      ],
      application: [
        "Lập công thức phân tử của hợp chất hữu cơ từ dữ liệu phân tích nguyên tố (%C, %H, %O, %N) và phân tử khối (MS)."
      ]
    },
    "Bài 12: Cấu tạo hoá học hợp chất hữu cơ": {
      recognition: [
        "Trình bày được các luận điểm chính của thuyết cấu tạo hoá học.",
        "Nêu được khái niệm đồng phân và đồng đẳng."
      ],
      understanding: [
        "Giải thích được hiện tượng đồng phân cấu tạo trong hoá học hữu cơ.",
        "Viết được công thức cấu tạo đầy đủ và thu gọn của các hợp chất hữu cơ đơn giản."
      ],
      application: [
        "Viết các đồng phân cấu tạo (đồng phân mạch carbon, đồng phân vị trí nhóm chức, đồng phân nhóm chức) thỏa mãn điều kiện cho trước."
      ]
    },

    // Chương 4: Hydrocarbon
    "Bài 13: Alkane": {
      recognition: [
        "Nêu được khái niệm alkane, công thức chung CnH2n+2 (n ≥ 1), nguồn gốc alkane trong tự nhiên.",
        "Gọi được tên thay thế cho các alkane mạch không nhánh (C1 - C10) và mạch nhánh đơn giản.",
        "Nêu được tính chất vật lí và các phản ứng đặc trưng: phản ứng thế halogen, phản ứng cháy, phản ứng cracking và reforming."
      ],
      understanding: [
        "Giải thích được quy tắc thế halogen vào nguyên tử carbon bậc cao hơn (sản phẩm chính).",
        "Hiểu được tác hại của khí thải phương tiện giao thông và các biện pháp bảo vệ môi trường không khí."
      ],
      application: [
        "Viết phương trình phản ứng thế halogen của alkane và tính toán thành phần thể tích hoặc khối lượng khí đốt gas LPG."
      ]
    },
    "Bài 14: Alkene - Alkyne": {
      recognition: [
        "Nêu được khái niệm alkene (CnH2n) và alkyne (CnH2n-2), đặc điểm liên kết đôi C=C và liên kết ba C≡C.",
        "Gọi được tên thay thế của một số alkene, alkyne đơn giản.",
        "Nêu được khái niệm đồng phân hình học cis - trans."
      ],
      understanding: [
        "Trình bày tính chất hoá học đặc trưng: phản ứng cộng (H2, X2, HX, H2O), quy tắc Markovnikov; phản ứng trùng hợp của alkene; phản ứng tráng bạc của alk-1-yne với AgNO3/NH3; phản ứng làm mất màu dung dịch KMnO4."
      ],
      application: [
        "Viết PTHH tổng hợp polymer từ alkene; phân biệt alkene, alkyne và alkane bằng thuốc thử bromine hoặc KMnO4; phân biệt alk-1-yne bằng AgNO3/NH3."
      ]
    },
    "Bài 15: Arene": {
      recognition: [
        "Nêu được khái niệm arene (hydrocarbon thơm), công thức phân tử và cấu tạo của benzene, toluene, styrene, naphthalene.",
        "Gọi được tên một số arene đơn giản."
      ],
      understanding: [
        "Trình bày tính chất hoá học đặc trưng của nhân thơm (dễ thế, khó cộng): phản ứng nitro hoá, halogen hoá toluene (quy tắc định hướng ortho, para); phản ứng cộng Cl2, H2; phản ứng oxi hoá mạch nhánh alkyl bằng KMnO4 khi đun nóng."
      ],
      application: [
        "Vận dụng quy tắc thế trên vòng benzene để viết sản phẩm chính; giải thích ứng dụng và lưu ý an toàn độc hại của benzene."
      ]
    },

    // Chương 5: Dẫn xuất halogen - Alcohol - Phenol
    "Bài 16: Dẫn xuất halogen": {
      recognition: [
        "Nêu được khái niệm dẫn xuất halogen, công thức tổng quát, danh pháp thay thế.",
        "Nêu tính chất vật lí và ứng dụng chính của dẫn xuất halogen."
      ],
      understanding: [
        "Trình bày tính chất hoá học: phản ứng thế nhóm -OH (thuỷ phân trong môi trường kiềm) và phản ứng tách hydrogen halide (quy tắc Zaisev tạo alkene ưu tiên).",
        "Nêu tác hại của hợp chất chlorofluorocarbon (CFC) phá huỷ tầng ozone."
      ],
      application: [
        "Xác định sản phẩm chính của phản ứng thế và phản ứng tách theo quy tắc Zaisev."
      ]
    },
    "Bài 17: Alcohol": {
      recognition: [
        "Nêu được khái niệm alcohol, công thức chung alcohol no đơn chức mạch hở CnH2n+1OH (n ≥ 1), bậc của alcohol.",
        "Gọi được tên thay thế các alcohol C1 - C5; nêu tính chất vật lí và ảnh hưởng của liên kết hydrogen."
      ],
      understanding: [
        "Trình bày tính chất hoá học: thế H của nhóm -OH (với Na), phản ứng riêng của polyalcohol có nhiều nhóm -OH kề nhau (hoà tan Cu(OH)2 tạo phức xanh lam), phản ứng tách nước tạo ether hoặc alkene, phản ứng oxi hoá không hoàn toàn bằng CuO (alcohol bậc I thành aldehyde, bậc II thành ketone).",
        "Hiểu được tác hại của việc lạm dụng rượu bia đối với sức khoẻ con người."
      ],
      application: [
        "Phân biệt alcohol đơn chức và polyalcohol bằng Cu(OH)2; phân biệt alcohol bậc I, II, III; tính toán độ cồn và lượng cồn trong máu."
      ]
    },
    "Bài 18: Phenol": {
      recognition: [
        "Nêu được khái niệm phenol, công thức cấu tạo của phenol (C6H5OH), tính chất vật lí (chất rắn, ít tan trong nước lạnh, tan nhiều trong nước nóng)."
      ],
      understanding: [
        "Giải thích ảnh hưởng qua lại giữa nhóm -OH và vòng benzene: tính acid yếu của phenol (tác dụng với NaOH nhưng không làm đổi màu quỳ tím, yếu hơn H2CO3); phản ứng thế ở vòng benzene dễ hơn benzene (tác dụng với nước bromine tạo kết tủa trắng 2,4,6-tribromophenol và HNO3 đặc tạo acid picric)."
      ],
      application: [
        "Nhận biết phenol bằng nước bromine; viết PTHH điều chế phenol và giải bài toán hỗn hợp chứa phenol."
      ]
    },

    // Chương 6: Hợp chất carbonyl và carboxylic acid
    "Bài 19: Hợp chất carbonyl": {
      recognition: [
        "Nêu được khái niệm hợp chất carbonyl (aldehyde và ketone), đặc điểm nhóm C=O.",
        "Gọi được tên thay thế của các aldehyde và ketone đơn giản (C1 - C5)."
      ],
      understanding: [
        "Trình bày tính chất hoá học: phản ứng khử thành alcohol; phản ứng oxi hoá aldehyde bởi thuốc thử Tollens (tráng bạc) và Cu(OH)2/OH⁻ (tạo kết tủa đỏ gạch Cu2O); phản ứng tạo iodoform (CHI3 kết tủa vàng) của hợp chất chứa nhóm CH3CO-."
      ],
      application: [
        "Nhận biết aldehyde bằng thuốc thử Tollens hoặc Cu(OH)2; nhận biết acetone hoặc methyl ketone bằng phản ứng iodoform."
      ]
    },
    "Bài 20: Carboxylic acid": {
      recognition: [
        "Nêu được khái niệm carboxylic acid, công thức chung acid no đơn chức mạch hở CnH2n+1COOH (n ≥ 0).",
        "Gọi được tên thay thế và tên thông thường của một số carboxylic acid thường gặp."
      ],
      understanding: [
        "Giải thích tính acid của carboxylic acid (làm quỳ tím hoá đỏ, tác dụng với kim loại trước H, oxide base, base, muối của acid yếu hơn như CaCO3, NaHCO3).",
        "Trình bày phản ứng ester hoá giữa carboxylic acid và alcohol (xúc tác H2SO4 đặc, phản ứng thuận nghịch)."
      ],
      application: [
        "Tính toán nồng độ acid trong giấm ăn bằng phương pháp chuẩn độ; tính hiệu suất phản ứng ester hoá."
      ]
    }
  },

  // ==========================================
  // HÓA HỌC LỚP 12
  // ==========================================
  12: {
    // Chương 1: Ester - Lipid
    "Bài 1: Ester - Lipid": {
      recognition: [
        "Nêu được khái niệm ester, lipid, chất béo, acid béo (palmitic acid, stearic acid, oleic acid, linoleic acid, omega-3, omega-6).",
        "Viết được CTCT và gọi tên các ester đơn giản (C ≤ 5).",
        "Trình bày tính chất vật lí của ester (mùi thơm hoa quả, nhẹ hơn nước, ít tan trong nước)."
      ],
      understanding: [
        "Trình bày tính chất hoá học của ester: phản ứng thuỷ phân trong môi trường acid (thuận nghịch) và môi trường kiềm (phản ứng xà phòng hoá, một chiều).",
        "Trình bày phản ứng hydrogen hoá chất béo lỏng thành chất béo rắn (bơ nhân tạo) và phản ứng oxi hoá chất béo bởi oxygen không khí gây ôi thiu chất béo."
      ],
      application: [
        "Tính toán bài toán xà phòng hoá chất béo (bảo toàn khối lượng, tính khối lượng xà phòng hoặc glycerol thu được).",
        "Đề xuất biện pháp bảo quản dầu mỡ thực phẩm tránh bị ôi thiu."
      ]
    },
    "Bài 2: Xà phòng và chất giặt rửa": {
      recognition: [
        "Nêu được khái niệm xà phòng, chất giặt rửa tự nhiên và chất giặt rửa tổng hợp.",
        "Mô tả cấu tạo phân tử chất giặt rửa gồm đầu ưa nước và đuôi kị nước."
      ],
      understanding: [
        "Giải thích cơ chế giặt rửa của xà phòng đối với vết bẩn dầu mỡ.",
        "So sánh ưu nhược điểm của xà phòng và chất giặt rửa tổng hợp (xà phòng tạo kết tủa trong nước cứng, chất giặt rửa tổng hợp dùng được trong nước cứng nhưng khó phân huỷ sinh học hơn)."
      ],
      application: [
        "Sử dụng hợp lý, an toàn xà phòng và chất giặt rửa tổng hợp trong đời sống hàng ngày."
      ]
    },

    // Chương 2: Carbohydrate
    "Bài 3: Glucose và fructose": {
      recognition: [
        "Nêu được khái niệm carbohydrate, phân loại (monosaccharide, disaccharide, polysaccharide).",
        "Nêu trạng thái tự nhiên, tính chất vật lí của glucose và fructose."
      ],
      understanding: [
        "Trình bày tính chất hoá học của glucose: tính chất polyalcohol (hoà tan Cu(OH)2 tạo dung dịch xanh lam), tính chất aldehyde (tráng bạc với thuốc thử Tollens, phản ứng với nước bromine, Cu(OH)2/OH⁻), phản ứng lên men rượu.",
        "Giải thích sự chuyển hoá giữa glucose và fructose trong môi trường kiềm."
      ],
      application: [
        "Phân biệt glucose và fructose bằng nước bromine; tính lượng glucose dùng để tráng ruột phích hoặc tráng gương."
      ]
    },
    "Bài 4: Saccharose và maltose": {
      recognition: [
        "Nêu được công thức phân tử C12H22O11, trạng thái tự nhiên và tính chất vật lí của saccharose và maltose."
      ],
      understanding: [
        "Trình bày phản ứng thuỷ phân của saccharose tạo glucose và fructose; phản ứng với Cu(OH)2 tạo dung dịch màu xanh lam.",
        "Giải thích vì sao saccharose không có phản ứng tráng bạc nhưng sản phẩm thuỷ phân của nó lại có phản ứng tráng bạc."
      ],
      application: [
        "Tính toán hiệu suất thuỷ phân saccharose và lượng bạc thu được sau khi thuỷ phân."
      ]
    },
    "Bài 5: Tinh bột và cellulose": {
      recognition: [
        "Nêu được công thức chung (C6H10O5)n, trạng thái tự nhiên của tinh bột và cellulose.",
        "Nêu được cấu tạo mạch của tinh bột (amylose không phân nhánh, amylopectin phân nhánh) và cellulose (mạch thẳng không phân nhánh)."
      ],
      understanding: [
        "Trình bày phản ứng thuỷ phân của tinh bột và cellulose; phản ứng tạo màu xanh tím đặc trưng giữa hồ tinh bột với iodine; phản ứng của cellulose với HNO3 đặc tạo cellulose trinitrate.",
        "Trình bày sự chuyển hoá tinh bột trong cơ thể và sự tạo thành tinh bột qua quang hợp ở cây xanh."
      ],
      application: [
        "Nhận biết hồ tinh bột bằng dung dịch iodine; tính toán lượng mùn cưa/gỗ điều chế cellulose trinitrate hoặc ethanol sinh học."
      ]
    },

    // Chương 3: Hợp chất chứa nitrogen
    "Bài 6: Amine": {
      recognition: [
        "Nêu được khái niệm amine, bậc của amine (bậc I, II, III theo số nguyên tử H bị thay thế).",
        "Viết CTCT và gọi tên thay thế, tên gốc - chức của các amine C ≤ 5 và aniline."
      ],
      understanding: [
        "Giải thích tính base của amine (so sánh tính base: alkylamine > NH3 > aniline); phản ứng tạo phức của methylamine/ethylamine với Cu(OH)2; phản ứng thế ở nhân thơm của aniline với nước bromine tạo kết tủa trắng 2,4,6-tribromoaniline."
      ],
      application: [
        "Phân biệt aniline với các dung dịch khác bằng nước bromine; tính khối lượng amine hoặc kết tủa trong bài toán tác dụng với acid hoặc halogen."
      ]
    },
    "Bài 7: Amino acid và peptide": {
      recognition: [
        "Nêu được khái niệm amino acid, gọi tên một số amino acid thông dụng (glycine, alanine, valine, glutamic acid, lysine).",
        "Nêu được khái niệm peptide, liên kết peptide (-CO-NH-)."
      ],
      understanding: [
        "Trình bày tính chất lưỡng tính của amino acid (tác dụng với cả acid mạnh và base mạnh); phản ứng trùng ngưng tạo polypeptide.",
        "Giải thích tính chất hoá học đặc trưng của peptide: phản ứng thuỷ phân (hoàn toàn hoặc không hoàn toàn) và phản ứng màu biuret (từ tripeptide trở lên tác dụng với Cu(OH)2/OH⁻ tạo hợp chất màu tím đặc trưng)."
      ],
      application: [
        "Biện luận cấu tạo của peptide từ sản phẩm thuỷ phân; tính toán bài toán thuỷ phân peptide trong môi trường acid hoặc kiềm."
      ]
    },
    "Bài 8: Protein và enzyme": {
      recognition: [
        "Nêu được khái niệm protein đơn giản và protein phức tạp; vai trò của protein đối với sự sống.",
        "Nêu khái niệm và vai trò xúc tác sinh học của enzyme."
      ],
      understanding: [
        "Trình bày phản ứng màu biuret của protein; sự đông tụ của protein bởi nhiệt độ, acid, kiềm hoặc muối kim loại nặng.",
        "Giải thích hiện tượng riêu cua nổi lên khi nấu canh cua hoặc sự kết tủa lòng trắng trứng khi đun nóng."
      ],
      application: [
        "Nhận biết protein bằng phản ứng màu biuret hoặc đông tụ; ứng dụng enzyme trong công nghệ sinh học và chế biến thực phẩm."
      ]
    },

    // Chương 4: Polymer
    "Bài 9: Đại cương về polymer": {
      recognition: [
        "Nêu được khái niệm polymer, monomer, mắt xích, hệ số polymer hoá (độ polymer hoá).",
        "Viết CTCT và gọi tên các polymer thường gặp: PE, PP, PS, PVC, cao su buna, cao su isoprene, teflon, nylon-6,6, capron."
      ],
      understanding: [
        "Phân biệt phản ứng trùng hợp (monomer có liên kết bội hoặc vòng kém bền) và trùng ngưng (monomer có ít nhất hai nhóm chức phản ứng).",
        "Trình bày phản ứng giữ nguyên mạch, cắt mạch và tăng mạch (lưu hoá cao su)."
      ],
      application: [
        "Xác định công thức monomer từ công thức polymer và ngược lại; tính hệ số polymer hoá."
      ]
    },
    "Bài 10: Vật liệu polymer": {
      recognition: [
        "Nêu được khái niệm chất dẻo, vật liệu composite, tơ (tơ tự nhiên, tơ hoá học), cao su, keo dán."
      ],
      understanding: [
        "Phân biệt tơ nhân tạo (bán tổng hợp: visco, cellulose acetate) và tơ tổng hợp (nylon-6,6, capron, nitron/olon).",
        "Trình bày tác hại của rác thải nhựa (ô nhiễm trắng) và các biện pháp giảm thiểu rác thải nhựa."
      ],
      application: [
        "Phân loại các loại vật liệu polymer trong đời sống và đề xuất biện pháp tái chế, bảo vệ môi trường."
      ]
    },

    // Chương 5: Pin điện và điện phân
    "Bài 12: Thế điện cực và nguồn điện hoá học": {
      recognition: [
        "Mô tả cặp oxi hoá – khử của kim loại dạng M^(n+)/M.",
        "Nêu được ý nghĩa của thế điện cực chuẩn E°: giá trị E° càng lớn thì dạng oxi hoá càng mạnh, dạng khử càng yếu.",
        "Mô tả cấu tạo và nguyên tắc hoạt động của pin Galvani."
      ],
      understanding: [
        "Sử dụng bảng giá trị E° để so sánh tính khử, tính oxi hoá; dự đoán chiều phản ứng giữa hai cặp oxi hoá – khử.",
        "Tính sức điện động chuẩn của pin: E°pin = E°(+) - E°(-) (cực dương cathode trừ cực âm anode)."
      ],
      application: [
        "Lắp ráp pin điện hoá đơn giản trong thực nghiệm và giải thích cơ chế phóng điện của pin, acquy, pin nhiên liệu."
      ]
    },
    "Bài 13: Điện phân": {
      recognition: [
        "Trình bày được nguyên tắc điện phân dung dịch và điện phân nóng chảy; thứ tự phóng điện ở các điện cực (anode: cực dương - xảy ra quá trình oxi hoá; cathode: cực âm - xảy ra quá trình khử)."
      ],
      understanding: [
        "Viết bán phản ứng ở từng điện cực và phương trình điện phân tổng quát (điện phân nóng chảy NaCl, Al2O3; điện phân dung dịch CuSO4, NaCl có màng ngăn).",
        "Nêu ứng dụng của điện phân trong mạ điện, tinh luyện đồng và sản xuất nhôm."
      ],
      application: [
        "Tính toán khối lượng chất thoát ra ở điện cực hoặc thời gian điện phân theo định luật Faraday: m = (A.I.t) / (n.F)."
      ]
    },

    // Chương 6: Đại cương về kim loại
    "Bài 14: Tính chất của kim loại": {
      recognition: [
        "Nêu được đặc điểm cấu tạo nguyên tử kim loại (ít electron lớp ngoài cùng) và liên kết kim loại.",
        "Nêu các tính chất vật lí chung của kim loại: tính dẻo, dẫn điện, dẫn nhiệt, ánh kim."
      ],
      understanding: [
        "Giải thích tính chất vật lí chung của kim loại dựa trên sự có mặt của các electron tự do trong tinh thể kim loại.",
        "Sử dụng dãy thế điện cực chuẩn để giải thích phản ứng của kim loại với dung dịch HCl, H2SO4 loãng và dung dịch muối."
      ],
      application: [
        "Giải bài toán kim loại tác dụng với acid, phi kim hoặc bài toán kim loại đẩy kim loại yếu hơn ra khỏi dung dịch muối."
      ]
    },
    "Bài 15: Tách kim loại và tái chế kim loại": {
      recognition: [
        "Nêu được trạng thái tự nhiên của kim loại và tên một số quặng kim loại phổ biến (hematite, bauxite, pirit...).",
        "Nêu nguyên tắc của 3 phương pháp tách kim loại: nhiệt luyện, thuỷ luyện, điện phân."
      ],
      understanding: [
        "Giải thích vì sao kim loại hoạt động mạnh (Na, Mg, Al) phải tách bằng điện phân nóng chảy; kim loại trung bình (Zn, Fe) dùng nhiệt luyện; kim loại yếu (Cu, Ag) dùng thuỷ luyện hoặc nhiệt luyện."
      ],
      application: [
        "Nêu ý nghĩa và quy trình tái chế sắt, nhôm, đồng để tiết kiệm tài nguyên và bảo vệ môi trường."
      ]
    },
    "Bài 16: Hợp kim - Sự ăn mòn kim loại": {
      recognition: [
        "Nêu được khái niệm hợp kim (gang, thép, duralumin...).",
        "Nêu khái niệm ăn mòn kim loại; phân loại ăn mòn hoá học và ăn mòn điện hoá."
      ],
      understanding: [
        "Phân tích các điều kiện để xảy ra ăn mòn điện hoá (3 điều kiện: 2 điện cực khác nhau, tiếp xúc trực tiếp hoặc gián tiếp qua dây dẫn, cùng tiếp xúc với dung dịch chất điện li).",
        "Giải thích các phương pháp chống ăn mòn kim loại: phương pháp bảo vệ bề mặt (sơn, mạ, bôi dầu mỡ) và phương pháp điện hoá (gắn kim loại hi sinh như Zn vào vỏ tàu biển bằng thép)."
      ],
      application: [
        "Nhận diện các hiện tượng ăn mòn kim loại trong thực tế đời sống và đề xuất biện pháp bảo vệ thích hợp."
      ]
    },

    // Chương 7: Nguyên tố nhóm IA và IIA
    "Bài 17: Nguyên tố nhóm IA": {
      recognition: [
        "Nêu cấu hình electron hoá trị ns¹, trạng thái tự nhiên và tính chất vật lí của kim loại kiềm (mềm, nhẹ, nhiệt độ nóng chảy thấp).",
        "Nêu màu ngọn lửa đặc trưng khi đốt muối kim loại kiềm (Li: đỏ tía, Na: vàng tươi, K: tím)."
      ],
      understanding: [
        "Giải thích tính khử rất mạnh của kim loại kiềm (E° rất âm); phản ứng mãnh liệt với nước tạo dung dịch kiềm và giải phóng H2.",
        "Trình bày ứng dụng của NaCl, NaHCO3, Na2CO3 và phương pháp Solvay sản xuất soda."
      ],
      application: [
        "Giải thích cách bảo quản kim loại kiềm (ngâm trong dầu hoả) và giải bài toán kim loại kiềm tác dụng với nước."
      ]
    },
    "Bài 18: Nguyên tố nhóm IIA": {
      recognition: [
        "Nêu cấu hình electron hoá trị ns², tính chất vật lí và màu ngọn lửa của muối kim loại kiềm thổ (Ca: đỏ da cam, Sr: đỏ son, Ba: lục vàng).",
        "Nêu được khái niệm nước cứng, phân loại nước cứng (tạm thời, vĩnh cửu, toàn phần)."
      ],
      understanding: [
        "Giải thích tính khử mạnh của kim loại nhóm IIA; quy luật biến đổi độ tan của hydroxide và độ bền nhiệt của muối carbonate, nitrate nhóm IIA theo chiều tăng bán kính nguyên tử.",
        "Phân tích tác hại của nước cứng (đóng cặn nồi hơi, tốn xà phòng, làm tắc ống dẫn) và cơ sở các phương pháp làm mềm nước cứng (phương pháp kết tủa dùng Na2CO3/Na3PO4, phương pháp trao đổi ion)."
      ],
      application: [
        "Đề xuất phương pháp nhận biết các ion Ca²⁺, Ba²⁺, SO4²⁻, CO3²⁻ trong dung dịch; bài toán làm mềm nước cứng."
      ]
    },

    // Chương 8: Kim loại chuyển tiếp dãy thứ nhất và Phức chất
    "Bài 19: Đại cương về kim loại chuyển tiếp dãy thứ nhất": {
      recognition: [
        "Nêu đặc điểm cấu hình electron của kim loại chuyển tiếp dãy thứ nhất (Sc đến Cu, dạng [Ar] 3d^(1-10) 4s^(1-2)).",
        "Nêu được xu hướng có nhiều số oxi hoá và đặc tính có màu của các ion kim loại chuyển tiếp (Fe²⁺, Fe³⁺, Cu²⁺, Cr³⁺, MnO4⁻...)."
      ],
      understanding: [
        "So sánh các số liệu nhiệt độ nóng chảy, khối lượng riêng, độ cứng của kim loại chuyển tiếp so với kim loại phân nhóm chính s.",
        "Trình bày phản ứng chuẩn độ xác định hàm lượng ion Fe²⁺ bằng dung dịch chuẩn KMnO4 trong môi trường acid: 5Fe²⁺ + MnO4⁻ + 8H⁺ → 5Fe³⁺ + Mn²⁺ + 4H2O."
      ],
      application: [
        "Tính toán nồng độ hoặc hàm lượng Fe²⁺ trong quặng hoặc mẫu nước từ dữ liệu chuẩn độ dung dịch thuốc tím."
      ]
    },
    "Bài 20: Sơ lược về phức chất": {
      recognition: [
        "Nêu được các khái niệm: nguyên tử trung tâm (cation hoặc nguyên tử kim loại), phối tử (ligand: phân tử hoặc anion có cặp e tự do), liên kết phối trí (cho - nhận), số phối trí.",
        "Nêu một số dạng hình học của phức chất (tứ diện, vuông phẳng, bát diện)."
      ],
      understanding: [
        "Trình bày các dấu hiệu tạo phức chất trong dung dịch (đổi màu dung dịch, hoà tan kết tủa, tạo kết tủa mới).",
        "Mô tả phản ứng thay thế phối tử của phức chất aqua bởi các phối tử đơn giản (NH3, OH⁻, Cl⁻, ví dụ: [Cu(H2O)4]²⁺ + 4NH3 ⇌ [Cu(NH3)4]²⁺ + 4H2O màu xanh lam thẫm)."
      ],
      application: [
        "Viết công thức phối trí và tên của phức chất đơn giản; nêu vai trò của các phức chất sinh học như chlorophyll (Mg), heme B (Fe), vitamin B12 (Co)."
      ]
    }
  }
};

/**
 * Helper tìm kiếm Yêu cầu cần đạt chuẩn xác theo tên bài hoặc tên chương
 */
export function findLearningOutcome(
  grade: number,
  lessonName: string,
  chapterName?: string
): LearningOutcomeDetail | null {
  const gradeOutcomes = LEARNING_OUTCOMES[grade];
  if (!gradeOutcomes) return null;

  // 1. Tìm chính xác theo tên bài
  if (gradeOutcomes[lessonName]) {
    return gradeOutcomes[lessonName];
  }

  // 2. Tìm gần đúng (chứa từ khóa chính)
  const normLesson = lessonName.toLowerCase().trim();
  for (const [key, val] of Object.entries(gradeOutcomes)) {
    const normKey = key.toLowerCase();
    // Bỏ qua tiền tố "Bài X: " để so khớp
    const cleanKey = normKey.replace(/^bài\s+\d+:\s*/i, '').trim();
    const cleanLesson = normLesson.replace(/^bài\s+\d+:\s*/i, '').trim();

    if (normLesson.includes(cleanKey) || cleanKey.includes(cleanLesson) || cleanLesson.includes(cleanKey.slice(0, 8))) {
      return val;
    }
  }

  // 3. Fallback: Nếu không tìm thấy theo bài, tìm theo chương
  if (chapterName) {
    const normChap = chapterName.toLowerCase();
    for (const [key, val] of Object.entries(gradeOutcomes)) {
      const cleanKey = key.toLowerCase();
      if (normChap.includes(cleanKey) || cleanKey.includes(normChap.slice(0, 8))) {
        return val;
      }
    }
  }

  return null;
}
