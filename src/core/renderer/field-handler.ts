/**
 * Word OpenXML dynamic field generator (PAGE, NUMPAGES)
 */

export function renderPageNumberField(): string {
  return [
    '<w:r><w:fldChar w:fldCharType="begin"/></w:r>',
    '<w:r><w:instrText xml:space="preserve">Page</w:instrText></w:r>',
    '<w:r><w:fldChar w:fldCharType="separate"/></w:r>',
    '<w:r><w:t>1</w:t></w:r>',
    '<w:r><w:fldChar w:fldCharType="end"/></w:r>'
  ].join("");
}

export function renderNumPagesField(): string {
  return [
    '<w:r><w:fldChar w:fldCharType="begin"/></w:r>',
    '<w:r><w:instrText xml:space="preserve">NUMPAGES</w:instrText></w:r>',
    '<w:r><w:fldChar w:fldCharType="separate"/></w:r>',
    '<w:r><w:t>2</w:t></w:r>',
    '<w:r><w:fldChar w:fldCharType="end"/></w:r>'
  ].join("");
}

export function renderPageOfPagesFooter(examCode: string, rightTabPos: number = 10489): string {
  return [
    '<w:p>',
    '  <w:pPr>',
    '    <w:pBdr><w:top w:val="single" w:sz="6" w:space="1" w:color="auto"/></w:pBdr>',
    `    <w:tabs><w:tab w:val="right" w:pos="${rightTabPos}"/></w:tabs>`,
    '  </w:pPr>',
    `  <w:r><w:t>Mã đề ${examCode}</w:t></w:r>`,
    '  <w:r><w:tab/><w:t xml:space="preserve">Trang </w:t></w:r>',
    renderPageNumberField(),
    '  <w:r><w:t>/</w:t></w:r>',
    renderNumPagesField(),
    '</w:p>'
  ].join("\n");
}
