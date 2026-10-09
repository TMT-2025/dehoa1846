import JSZip from "jszip";
import { BatchAnswerKeyExport, QuestionAnswerDetail } from "./answer-key-generator.js";

/**
 * Converts a 1-based column index to Excel column letters (1 -> A, 27 -> AA)
 */
function getColumnLetter(colIndex: number): string {
  let temp = colIndex;
  let letter = "";
  while (temp > 0) {
    const mod = (temp - 1) % 26;
    letter = String.fromCharCode(65 + mod) + letter;
    temp = Math.floor((temp - mod) / 26);
  }
  return letter;
}

/**
 * Escapes XML text for Excel inline string
 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Formats the answer representation for a given question and exam code
 */
function formatAnswerText(ansVal: any): string {
  if (typeof ansVal === "object" && ansVal !== null) {
    // True/False: format as "Đ - S - Đ - S"
    return ["a", "b", "c", "d"]
      .map(k => ((ansVal as Record<string, boolean>)[k] ? "Đ" : "S"))
      .join(" - ");
  }
  if (ansVal !== undefined && ansVal !== null) {
    return String(ansVal);
  }
  return "";
}

/**
 * Generates an Excel (.xlsx) workbook containing ONLY the Horizontal Answer Key Matrix
 * with dynamically calculated column widths fitting cell contents.
 */
export async function generateAnswerKeyExcel(batchKey: BatchAnswerKeyExport): Promise<Uint8Array> {
  const zip = new JSZip();

  // 1. [Content_Types].xml
  zip.file(
    "[Content_Types].xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`
  );

  // 2. _rels/.rels
  zip.file(
    "_rels/.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`
  );

  // 3. xl/_rels/workbook.xml.rels
  zip.file(
    "xl/_rels/workbook.xml.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`
  );

  // 4. xl/workbook.xml
  zip.file(
    "xl/workbook.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="MA_TRAN_DAP_AN" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>`
  );

  // 5. xl/styles.xml
  zip.file(
    "xl/styles.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="4">
    <!-- 0: Normal 11pt Arial -->
    <font><sz val="11"/><name val="Arial"/><family val="2"/></font>
    <!-- 1: Bold 11pt Arial Navy -->
    <font><b/><sz val="11"/><color rgb="FF1E3A8A"/><name val="Arial"/><family val="2"/></font>
    <!-- 2: Title Bold 14pt Arial Navy -->
    <font><b/><sz val="14"/><color rgb="FF1E3A8A"/><name val="Arial"/><family val="2"/></font>
    <!-- 3: Subtitle 10pt Arial Gray -->
    <font><sz val="10"/><color rgb="FF475569"/><name val="Arial"/><family val="2"/></font>
  </fonts>
  <fills count="6">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <!-- 2: Soft Blue (Phần I & Table Header) -->
    <fill><patternFill patternType="solid"><fgColor rgb="FFE0E7FF"/><bgColor indexed="64"/></patternFill></fill>
    <!-- 3: Soft Purple (Phần II) -->
    <fill><patternFill patternType="solid"><fgColor rgb="FFEDE9FE"/><bgColor indexed="64"/></patternFill></fill>
    <!-- 4: Soft Teal (Phần III) -->
    <fill><patternFill patternType="solid"><fgColor rgb="FFCCFBF1"/><bgColor indexed="64"/></patternFill></fill>
    <!-- 5: Soft Slate (Mã đề column) -->
    <fill><patternFill patternType="solid"><fgColor rgb="FFF1F5F9"/><bgColor indexed="64"/></patternFill></fill>
  </fills>
  <borders count="2">
    <border><left/><right/><top/><bottom/><diagonal/></border>
    <border>
      <left style="thin"><color rgb="FFCBD5E1"/></left>
      <right style="thin"><color rgb="FFCBD5E1"/></right>
      <top style="thin"><color rgb="FFCBD5E1"/></top>
      <bottom style="thin"><color rgb="FFCBD5E1"/></bottom>
      <diagonal/>
    </border>
  </borders>
  <cellStyleXfs count="1">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
  </cellStyleXfs>
  <cellXfs count="9">
    <!-- 0: Normal -->
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0"/>
    <!-- 1: Generic Header (Bold, Filled Blue, Border, Center) -->
    <xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1">
      <alignment horizontal="center" vertical="center" wrapText="1"/>
    </xf>
    <!-- 2: Centered cell -->
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1">
      <alignment horizontal="center" vertical="center"/>
    </xf>
    <!-- 3: Sheet Title (Large Bold) -->
    <xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1">
      <alignment horizontal="left" vertical="center"/>
    </xf>
    <!-- 4: Subtitle (10pt Gray) -->
    <xf numFmtId="0" fontId="3" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1">
      <alignment horizontal="left" vertical="center"/>
    </xf>
    <!-- 5: Phần I Header (Soft Blue) -->
    <xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1">
      <alignment horizontal="center" vertical="center" wrapText="1"/>
    </xf>
    <!-- 6: Phần II Header (Soft Purple) -->
    <xf numFmtId="0" fontId="1" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1">
      <alignment horizontal="center" vertical="center" wrapText="1"/>
    </xf>
    <!-- 7: Phần III Header (Soft Teal) -->
    <xf numFmtId="0" fontId="1" fillId="4" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1">
      <alignment horizontal="center" vertical="center" wrapText="1"/>
    </xf>
    <!-- 8: Mã đề cell (Bold, Soft Slate, Center) -->
    <xf numFmtId="0" fontId="1" fillId="5" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1">
      <alignment horizontal="center" vertical="center"/>
    </xf>
  </cellXfs>
</styleSheet>`
  );

  // 6. xl/worksheets/sheet1.xml
  const examCodes = batchKey.examCodes;
  const firstVariant = batchKey.variants[examCodes[0]];
  const questionDetails = firstVariant ? firstVariant.detailedAnswers : [];

  // Identify section groups for the 2-tier header
  interface SectionGroup {
    sectionIndex: number;
    name: string;
    styleId: number;
    startCol: number;
    endCol: number;
  }

  const sectionsMap = new Map<number, SectionGroup>();
  questionDetails.forEach((q, idx) => {
    const colIndex = 2 + idx; // Col 1 is Mã đề, Col 2 is B, etc.
    const secIdx = q.sectionIndex;
    if (!sectionsMap.has(secIdx)) {
      const name =
        secIdx === 1
          ? "PHẦN I: TRẮC NGHIỆM (4 LỰA CHỌN)"
          : secIdx === 2
          ? "PHẦN II: ĐÚNG / SAI (a - b - c - d)"
          : "PHẦN III: TRẢ LỜI NGẮN";
      const styleId = secIdx === 1 ? 5 : secIdx === 2 ? 6 : 7;
      sectionsMap.set(secIdx, {
        sectionIndex: secIdx,
        name,
        styleId,
        startCol: colIndex,
        endCol: colIndex
      });
    } else {
      sectionsMap.get(secIdx)!.endCol = colIndex;
    }
  });

  // Calculate dynamic column widths tailored to content
  // Col 1 (A: Mã đề)
  let maxCol1Len = "Mã đề".length;
  for (const code of examCodes) {
    const label = `Mã ${code}`;
    if (label.length > maxCol1Len) maxCol1Len = label.length;
  }
  const col1Width = Math.max(12, maxCol1Len + 4);

  // Question columns (Col 2..N)
  const questionColWidths: number[] = [];
  questionDetails.forEach((q, idx) => {
    const headerLen = `Câu ${q.questionNumber}`.length;
    let maxContentLen = headerLen;

    for (const code of examCodes) {
      const varKey = batchKey.variants[code];
      const ansVal = varKey?.answers[q.questionKey];
      const ansText = formatAnswerText(ansVal);
      if (ansText.length > maxContentLen) {
        maxContentLen = ansText.length;
      }
    }

    // Give comfortable breathing room (+3.2 padding)
    const colWidth = Math.max(8.5, maxContentLen + 3.2);
    questionColWidths[idx] = colWidth;
  });

  // Generate <cols> tag with individual widths
  const colTags: string[] = [
    `<col min="1" max="1" width="${col1Width.toFixed(1)}" customWidth="1"/>`
  ];
  questionColWidths.forEach((w, idx) => {
    const colNum = 2 + idx;
    colTags.push(`<col min="${colNum}" max="${colNum}" width="${w.toFixed(1)}" customWidth="1"/>`);
  });

  let rowIdx = 1;
  const sheetRows: string[] = [];
  const mergeCells: string[] = [];

  // Row 1: Title
  sheetRows.push(
    `<row r="${rowIdx}" ht="28"><c r="A${rowIdx}" t="inlineStr" s="3"><is><t>MA TRẬN ĐÁP ÁN CÁC MÃ ĐỀ (THEO HÀNG NGANG)</t></is></c></row>`
  );
  rowIdx++;

  // Row 2: Subtitle
  const createdDate = new Date().toLocaleDateString("vi-VN");
  sheetRows.push(
    `<row r="${rowIdx}" ht="20"><c r="A${rowIdx}" t="inlineStr" s="4"><is><t>Ngày tạo: ${createdDate} | Tổng số mã đề: ${examCodes.length} (${examCodes.join(", ")}) | Phần II quy ước thứ tự 4 ý: a - b - c - d</t></is></c></row>`
  );
  rowIdx++;

  // Row 3: Blank separator
  sheetRows.push(`<row r="${rowIdx}" ht="12"/>`);
  rowIdx++;

  // Row 4: Section Headers
  const row4Cells: string[] = [
    `<c r="A${rowIdx}" t="inlineStr" s="1"><is><t>Mã đề</t></is></c>`
  ];
  mergeCells.push(`A${rowIdx}:A${rowIdx + 1}`); // Merge A4:A5

  sectionsMap.forEach(sec => {
    const startLetter = getColumnLetter(sec.startCol);
    const endLetter = getColumnLetter(sec.endCol);

    for (let c = sec.startCol; c <= sec.endCol; c++) {
      const letCode = getColumnLetter(c);
      const text = c === sec.startCol ? escapeXml(sec.name) : "";
      row4Cells.push(`<c r="${letCode}${rowIdx}" t="inlineStr" s="${sec.styleId}"><is><t>${text}</t></is></c>`);
    }

    if (sec.startCol < sec.endCol) {
      mergeCells.push(`${startLetter}${rowIdx}:${endLetter}${rowIdx}`);
    }
  });

  sheetRows.push(`<row r="${rowIdx}" ht="24">${row4Cells.join("")}</row>`);
  rowIdx++;

  // Row 5: Question Numbers
  const row5Cells: string[] = [
    `<c r="A${rowIdx}" t="inlineStr" s="1"><is><t/></is></c>`
  ];

  questionDetails.forEach((q, idx) => {
    const colLetter = getColumnLetter(2 + idx);
    const sec = sectionsMap.get(q.sectionIndex);
    const styleId = sec ? sec.styleId : 1;
    row5Cells.push(
      `<c r="${colLetter}${rowIdx}" t="inlineStr" s="${styleId}"><is><t>Câu ${q.questionNumber}</t></is></c>`
    );
  });

  sheetRows.push(`<row r="${rowIdx}" ht="24">${row5Cells.join("")}</row>`);
  rowIdx++;

  // Rows 6+: One row per exam code
  for (const code of examCodes) {
    const varKey = batchKey.variants[code];
    const dataCells: string[] = [
      `<c r="A${rowIdx}" t="inlineStr" s="8"><is><t>Mã ${escapeXml(code)}</t></is></c>`
    ];

    questionDetails.forEach((q, idx) => {
      const colLetter = getColumnLetter(2 + idx);
      const ansVal = varKey?.answers[q.questionKey];
      const ansText = formatAnswerText(ansVal);

      dataCells.push(
        `<c r="${colLetter}${rowIdx}" t="inlineStr" s="2"><is><t>${escapeXml(ansText)}</t></is></c>`
      );
    });

    sheetRows.push(`<row r="${rowIdx}" ht="22">${dataCells.join("")}</row>`);
    rowIdx++;
  }

  // Merge cells XML
  const mergeCellsXml =
    mergeCells.length > 0
      ? `\n  <mergeCells count="${mergeCells.length}">\n    ${mergeCells.map(m => `<mergeCell ref="${m}"/>`).join("\n    ")}\n  </mergeCells>`
      : "";

  const sheetXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <cols>
    ${colTags.join("\n    ")}
  </cols>
  <sheetData>
    ${sheetRows.join("\n    ")}
  </sheetData>${mergeCellsXml}
</worksheet>`;

  zip.file("xl/worksheets/sheet1.xml", sheetXml);

  return zip.generateAsync({
    type: "uint8array",
    compression: "DEFLATE",
    compressionOptions: { level: 6 }
  });
}
