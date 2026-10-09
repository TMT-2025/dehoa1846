import { TrueFalseSubItem } from "../ir/types.js";
import { TemplateProfile } from "./template-loader.js";
import { renderRunToXml, renderTabsToXml } from "./content-renderer.js";

function renderSubItemPrefix(label: string): string {
  return `<w:r><w:rPr><w:rStyle w:val="YoungMixChar"/><w:b/></w:rPr><w:tab/><w:t xml:space="preserve">${label}) </w:t></w:r>`;
}

export function renderTrueFalseSubItems(
  subItems: readonly TrueFalseSubItem[],
  profile: TemplateProfile
): string {
  const tabStops = profile.tabs.trueFalse.map(pos => ({
    positionDxa: pos,
    alignment: "left" as const
  }));
  const tabsXml = renderTabsToXml(tabStops);

  const labels = ["a", "b", "c", "d"];

  return subItems.map((item, idx) => {
    const label = labels[idx];
    const prefix = renderSubItemPrefix(label);
    const runs = item.content.paragraphs.flatMap(p => p.runs);
    const bodyXml = runs.map(r => renderRunToXml(r, { sanitizeUnderline: true })).join("");

    return `<w:p><w:pPr>${tabsXml}</w:pPr>${prefix}${bodyXml}</w:p>`;
  }).join("\n");
}
