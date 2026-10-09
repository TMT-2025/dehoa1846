import { QuestionOption } from "../ir/types.js";
import { OptionLayoutMode } from "./layout-engine.js";
import { TemplateProfile } from "./template-loader.js";
import { renderRunToXml, renderTabsToXml } from "./content-renderer.js";

function renderOptionPrefix(label: string): string {
  return `<w:r><w:rPr><w:rStyle w:val="YoungMixChar"/><w:b/></w:rPr><w:tab/><w:t xml:space="preserve">${label}. </w:t></w:r>`;
}

function renderOptionBodyRuns(opt: QuestionOption): string {
  // Concat all runs from all paragraphs of option content, sanitizing answer underline
  const runs = opt.content.paragraphs.flatMap(p => p.runs);
  return runs.map(r => renderRunToXml(r, { sanitizeUnderline: true })).join("");
}

export function renderOptions(
  options: readonly QuestionOption[],
  layoutMode: OptionLayoutMode,
  profile: TemplateProfile
): string {
  if (options.length !== 4) {
    throw new Error(`Expected exactly 4 options to render, found ${options.length}`);
  }

  const [optA, optB, optC, optD] = options;

  if (layoutMode === "4_COLUMNS") {
    // 1 single paragraph with 4 tab stops
    const tabStops = profile.tabs.fourColumns.map(pos => ({
      positionDxa: pos,
      alignment: "left" as const
    }));

    const tabsXml = renderTabsToXml(tabStops);

    const aXml = renderOptionPrefix("A") + renderOptionBodyRuns(optA);
    const bXml = renderOptionPrefix("B") + renderOptionBodyRuns(optB);
    const cXml = renderOptionPrefix("C") + renderOptionBodyRuns(optC);
    const dXml = renderOptionPrefix("D") + renderOptionBodyRuns(optD);

    return `<w:p><w:pPr>${tabsXml}</w:pPr>${aXml}${bXml}${cXml}${dXml}</w:p>`;
  } else if (layoutMode === "2_COLUMNS") {
    // 2 paragraphs with 2 tab stops each
    const tabStops = profile.tabs.twoColumns.map(pos => ({
      positionDxa: pos,
      alignment: "left" as const
    }));
    const tabsXml = renderTabsToXml(tabStops);

    const line1A = renderOptionPrefix("A") + renderOptionBodyRuns(optA);
    const line1B = renderOptionPrefix("B") + renderOptionBodyRuns(optB);
    const para1 = `<w:p><w:pPr>${tabsXml}</w:pPr>${line1A}${line1B}</w:p>`;

    const line2C = renderOptionPrefix("C") + renderOptionBodyRuns(optC);
    const line2D = renderOptionPrefix("D") + renderOptionBodyRuns(optD);
    const para2 = `<w:p><w:pPr>${tabsXml}</w:pPr>${line2C}${line2D}</w:p>`;

    return `${para1}\n${para2}`;
  } else {
    // 1_COLUMN: 4 separate paragraphs with 1 tab stop each
    const tabStops = profile.tabs.oneColumn.map(pos => ({
      positionDxa: pos,
      alignment: "left" as const
    }));
    const tabsXml = renderTabsToXml(tabStops);

    const labels = ["A", "B", "C", "D"];
    const paras = options.map((opt, idx) => {
      const prefix = renderOptionPrefix(labels[idx]);
      const body = renderOptionBodyRuns(opt);
      return `<w:p><w:pPr>${tabsXml}</w:pPr>${prefix}${body}</w:p>`;
    });

    return paras.join("\n");
  }
}
