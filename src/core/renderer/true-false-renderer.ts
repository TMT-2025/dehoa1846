import { TrueFalseSubItem } from "../ir/types.js";
import { TemplateProfile } from "./template-loader.js";
import { renderRunToXml, renderTabsToXml } from "./content-renderer.js";

function renderSubItemPrefix(label: string, isCorrect?: boolean): string {
  // CRITICAL: <w:tab/> must be inside its own run WITH <w:u w:val="none"/>
  // so Word NEVER underlines the tab space before the statement!
  const tabRun = `<w:r><w:rPr><w:rStyle w:val="YoungMixChar"/><w:u w:val="none"/></w:rPr><w:tab/></w:r>`;
  if (isCorrect) {
    return `${tabRun}<w:r><w:rPr><w:rStyle w:val="YoungMixChar"/><w:b/><w:i/><w:u w:val="single"/></w:rPr><w:t xml:space="preserve">${label}) </w:t></w:r>`;
  }
  return `${tabRun}<w:r><w:rPr><w:rStyle w:val="YoungMixChar"/><w:u w:val="none"/><w:b/></w:rPr><w:t xml:space="preserve">${label}) </w:t></w:r>`;
}

export function renderTrueFalseSubItems(
  subItems: readonly TrueFalseSubItem[],
  profile: TemplateProfile,
  preserveAnswers?: boolean
): string {
  const tabStops = profile.tabs.trueFalse.map(pos => ({
    positionDxa: pos,
    alignment: "left" as const
  }));
  const tabsXml = renderTabsToXml(tabStops);

  const labels = ["a", "b", "c", "d"];

  return subItems.map((item, idx) => {
    const label = labels[idx];
    const isCorrect = preserveAnswers && item.isCorrect;
    const prefix = renderSubItemPrefix(label, isCorrect);
    const runs = item.content.paragraphs.flatMap(p => p.runs);
    const cloned = runs.map(r => ({ ...r }));
    if (isCorrect) {
      for (let i = cloned.length - 1; i >= 0; i--) {
        if (!cloned[i].isTab && !cloned[i].isLineBreak && cloned[i].text) {
          cloned[i].text = cloned[i].text.trimEnd();
          break;
        }
      }
    }
    const bodyXml = cloned.map(r => {
      if (isCorrect) {
        return renderRunToXml({ ...r, italic: true, underline: true }, { sanitizeUnderline: false });
      }
      return renderRunToXml(r, { sanitizeUnderline: true });
    }).join("");

    return `<w:p><w:pPr>${tabsXml}</w:pPr>${prefix}${bodyXml}</w:p>`;
  }).join("\n");
}
