import { TemplateProfile } from "./template-loader.js";
import { escapeXml } from "./content-renderer.js";

export function renderExamTitle(title: string): string {
  return [
    '<w:p>',
    '  <w:pPr>',
    '    <w:jc w:val="center"/>',
    '    <w:rPr><w:b/></w:rPr>',
    '  </w:pPr>',
    `  <w:r><w:rPr><w:b/></w:rPr><w:t>${escapeXml(title)}</w:t></w:r>`,
    '</w:p>'
  ].join("\n");
}

export function renderStudentHeaderTable(examCode: string, profile: TemplateProfile): string {
  const { colWidthsDxa, borderBottomSize, nameFieldPrompt, idFieldPrompt } = profile.headerTable;

  return [
    '<w:tbl>',
    '  <w:tblPr>',
    '    <w:tblStyle w:val="YoungMixTable"/>',
    '    <w:tblW w:w="0" w:type="auto"/>',
    '    <w:tblInd w:w="0" w:type="dxa"/>',
    '    <w:tblLook w:val="04A0" w:firstRow="1" w:lastRow="0" w:firstColumn="1" w:lastColumn="0" w:noHBand="0" w:noVBand="1"/>',
    '  </w:tblPr>',
    '  <w:tblGrid>',
    `    <w:gridCol w:w="${colWidthsDxa[0]}"/>`,
    `    <w:gridCol w:w="${colWidthsDxa[1]}"/>`,
    `    <w:gridCol w:w="${colWidthsDxa[2]}"/>`,
    '  </w:tblGrid>',
    '  <w:tr>',
    '    <!-- Cell 1: Ho va ten -->',
    '    <w:tc>',
    '      <w:tcPr>',
    `        <w:tcW w:w="${colWidthsDxa[0]}" w:type="dxa"/>`,
    `        <w:tcBorders><w:bottom w:val="single" w:sz="${borderBottomSize}" w:space="0" w:color="000000"/></w:tcBorders>`,
    '        <w:vAlign w:val="center"/>',
    '      </w:tcPr>',
    '      <w:p>',
    `        <w:r><w:t>${escapeXml(nameFieldPrompt)}</w:t></w:r>`,
    '      </w:p>',
    '    </w:tc>',
    '    <!-- Cell 2: So bao danh -->',
    '    <w:tc>',
    '      <w:tcPr>',
    `        <w:tcW w:w="${colWidthsDxa[1]}" w:type="dxa"/>`,
    `        <w:tcBorders><w:bottom w:val="single" w:sz="${borderBottomSize}" w:space="0" w:color="000000"/></w:tcBorders>`,
    '        <w:vAlign w:val="center"/>',
    '      </w:tcPr>',
    '      <w:p>',
    `        <w:r><w:t>${escapeXml(idFieldPrompt)}</w:t></w:r>`,
    '      </w:p>',
    '    </w:tc>',
    '    <!-- Cell 3: Ma de -->',
    '    <w:tc>',
    '      <w:tcPr>',
    `        <w:tcW w:w="${colWidthsDxa[2]}" w:type="dxa"/>`,
    `        <w:tcBorders><w:bottom w:val="single" w:sz="${borderBottomSize}" w:space="0" w:color="000000"/></w:tcBorders>`,
    '        <w:vAlign w:val="center"/>',
    '      </w:tcPr>',
    '      <w:p>',
    '        <w:pPr><w:jc w:val="center"/></w:pPr>',
    `        <w:r><w:rPr><w:b/></w:rPr><w:t>Mã đề ${escapeXml(examCode)}</w:t></w:r>`,
    '      </w:p>',
    '    </w:tc>',
    '  </w:tr>',
    '</w:tbl>'
  ].join("\n");
}
