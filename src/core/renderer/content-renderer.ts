import { FormattedRun, RichParagraph, RichContent, TabStopDefinition } from "../ir/types.js";

export function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function renderRunToXml(run: FormattedRun, options: { sanitizeUnderline?: boolean } = {}): string {
  if (run.isTab) {
    return "<w:r><w:tab/></w:r>";
  }
  if (run.isLineBreak) {
    return "<w:r><w:br/></w:r>";
  }

  const rPrParts: string[] = [];

  if (run.bold) {
    rPrParts.push("<w:b/>");
  }
  if (run.italic) {
    rPrParts.push("<w:i/>");
  }
  if (!options.sanitizeUnderline && run.underline && run.underline !== "none") {
    rPrParts.push(`<w:u w:val="${run.underline}"/>`);
  }
  if (run.vertAlign === "subscript" || run.vertAlign === "superscript") {
    rPrParts.push(`<w:vertAlign w:val="${run.vertAlign}"/>`);
  }
  if (run.colorHex) {
    rPrParts.push(`<w:color w:val="${run.colorHex}"/>`);
  }
  if (run.fontName) {
    rPrParts.push(`<w:rFonts w:ascii="${escapeXml(run.fontName)}" w:hAnsi="${escapeXml(run.fontName)}"/>`);
  }
  if (run.fontSizeHalfPoints) {
    rPrParts.push(`<w:sz w:val="${run.fontSizeHalfPoints}"/>`);
  }

  const rPrXml = rPrParts.length > 0 ? `<w:rPr>${rPrParts.join("")}</w:rPr>` : "";
  const escapedText = escapeXml(run.text);

  return `<w:r>${rPrXml}<w:t xml:space="preserve">${escapedText}</w:t></w:r>`;
}

export function renderTabsToXml(tabStops?: TabStopDefinition[]): string {
  if (!tabStops || tabStops.length === 0) return "";
  const tabsXml = tabStops
    .map(tab => `<w:tab w:val="${tab.alignment}" w:pos="${tab.positionDxa}"/>`)
    .join("");
  return `<w:tabs>${tabsXml}</w:tabs>`;
}

export function renderParagraphToXml(
  paragraph: RichParagraph,
  options: {
    sanitizeUnderline?: boolean;
    extraTabs?: TabStopDefinition[];
    spacingBeforeDxa?: number;
    spacingAfterDxa?: number;
    alignment?: "left" | "center" | "right" | "justify";
  } = {}
): string {
  const pPrParts: string[] = [];

  const align = options.alignment || paragraph.alignment;
  if (align) {
    const jcVal = align === "justify" ? "both" : align;
    pPrParts.push(`<w:jc w:val="${jcVal}"/>`);
  }

  const before = options.spacingBeforeDxa ?? paragraph.spacingBeforeDxa;
  const after = options.spacingAfterDxa ?? paragraph.spacingAfterDxa;
  if (before !== undefined || after !== undefined) {
    const beforeAttr = before !== undefined ? ` w:before="${before}"` : "";
    const afterAttr = after !== undefined ? ` w:after="${after}"` : "";
    pPrParts.push(`<w:spacing${beforeAttr}${afterAttr}/>`);
  }

  const tabList = options.extraTabs || paragraph.tabStops;
  if (tabList && tabList.length > 0) {
    pPrParts.push(renderTabsToXml(tabList));
  }

  const pPrXml = pPrParts.length > 0 ? `<w:pPr>${pPrParts.join("")}</w:pPr>` : "";
  const runsXml = paragraph.runs.map(r => renderRunToXml(r, options)).join("");

  return `<w:p>${pPrXml}${runsXml}</w:p>`;
}

export function renderRichContentToXml(
  content: RichContent,
  options: { sanitizeUnderline?: boolean } = {}
): string {
  return content.paragraphs.map(p => renderParagraphToXml(p, options)).join("\n");
}
